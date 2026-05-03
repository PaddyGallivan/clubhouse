const DEFAULT_FEATURES = {
  ladder: true,
  teams: true,
  training: true,
  events: true,
  bf_voting: true,
  matchday: true,
  chat: true,
  push: true,
  fees: true,
  news: true,
  sponsors: true,
  stats: true,
}

const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ params, env }) {
  const { slug } = params
  const { results } = await env.DB.prepare('SELECT features FROM clubs WHERE slug = ?').bind(slug).all()
  if (!results.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const saved = results[0].features ? JSON.parse(results[0].features) : {}
  return Response.json({ features: { ...DEFAULT_FEATURES, ...saved } })
}

export async function onRequestPatch({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  if (!['admin', 'committee'].includes(mem[0].role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const updates = await request.json()
  // Merge with defaults — only allow known keys
  const allowed = Object.keys(DEFAULT_FEATURES)
  const current = await env.DB.prepare('SELECT features FROM clubs WHERE slug = ?').bind(slug).all()
  const existing = current.results[0]?.features ? JSON.parse(current.results[0].features) : {}
  const merged = { ...DEFAULT_FEATURES, ...existing }
  for (const key of allowed) {
    if (key in updates) merged[key] = !!updates[key]
  }

  await env.DB.prepare('UPDATE clubs SET features = ? WHERE slug = ?').bind(JSON.stringify(merged), slug).run()
  return Response.json({ features: merged })
}
