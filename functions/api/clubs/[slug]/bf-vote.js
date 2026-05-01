async function getClubId(env, slug) {
  const { results } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  return results[0]?.id || null
}
async function authed(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(auth.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return Response.json({ vote: null })
  const { slug } = params
  const url = new URL(request.url)
  const round = url.searchParams.get('round')
  const clubId = await getClubId(env, slug)
  const { results } = await env.DB.prepare(
    'SELECT * FROM ch_bf_votes WHERE voter_id = ? AND club_id = ? AND round = ?'
  ).bind(user.id, clubId, round).all()
  return Response.json({ vote: results[0] || null })
}

export async function onRequestPost({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { slug } = params
  const { round, v1, v2, v3 } = await request.json()
  const clubId = await getClubId(env, slug)
  await env.DB.prepare(
    'INSERT OR REPLACE INTO ch_bf_votes (club_id, round, voter_id, vote_1, vote_2, vote_3) VALUES (?,?,?,?,?,?)'
  ).bind(clubId, round, user.id, v1 || null, v2 || null, v3 || null).run()
  return Response.json({ ok: true })
}
