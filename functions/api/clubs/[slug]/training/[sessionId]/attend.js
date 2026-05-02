const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { slug, sessionId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id
  const { status, note } = await request.json()
  const valid = ['present', 'absent', 'injured', 'late']
  if (!valid.includes(status)) return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 })
  await env.DB.prepare(
    `INSERT INTO ch_attendance (session_id, user_id, club_id, status, note)
     VALUES (?,?,?,?,?)
     ON CONFLICT(user_id, session_id) DO UPDATE SET status=excluded.status, note=excluded.note`
  ).bind(sessionId, user.id, clubId, status, note || null).run()
  return Response.json({ ok: true })
}

export async function onRequestGet({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { sessionId } = params
  const { results } = await env.DB.prepare(
    `SELECT a.*, u.name, u.email FROM ch_attendance a
     JOIN ch_users u ON a.user_id = u.id
     WHERE a.session_id = ? ORDER BY u.name ASC`
  ).bind(sessionId).all()
  const summary = { present: 0, absent: 0, injured: 0, late: 0 }
  results.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++ })
  return Response.json({ attendance: results, summary })
}
