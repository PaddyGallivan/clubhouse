async function authed(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(auth.slice(7)).all()
  return results[0] || null
}
export async function onRequestPost({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { fixtureId } = params
  const { score_us, score_them } = await request.json()
  // Verify user is a member of this club
  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId, 'active').all()
  if (!mem.length) return Response.json({ error: "Forbidden" }, { status: 403 })
  const myRole = mem[0].role
  if (!["admin","committee","coach"].includes(myRole)) return Response.json({ error: "Forbidden" }, { status: 403 })
  await env.DB.prepare(
    `UPDATE ch_fixtures SET score_us = ?, score_them = ?, status = 'played' WHERE id = ?`
  ).bind(score_us, score_them, fixtureId).run()
  return Response.json({ ok: true })
}
