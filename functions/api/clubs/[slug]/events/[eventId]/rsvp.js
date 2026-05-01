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
  const { eventId } = params
  const { status } = await request.json()
  await env.DB.prepare('INSERT OR REPLACE INTO ch_event_rsvp (event_id, user_id, status) VALUES (?,?,?)').bind(eventId, user.id, status).run()
  return Response.json({ ok: true })
}
