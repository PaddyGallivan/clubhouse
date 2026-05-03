const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const h = request.headers.get('Authorization')
  const { fixtureId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id

  const { results } = await env.DB.prepare(
    `SELECT a.*, u.name FROM ch_availability a
     JOIN ch_users u ON a.user_id = u.id
     WHERE a.fixture_id = ? AND a.club_id = ?
     ORDER BY a.status ASC, u.name ASC`
  ).bind(fixtureId, clubId).all()

  const summary = {
    available: results.filter(r => r.status === 'available').length,
    unavailable: results.filter(r => r.status === 'unavailable').length,
    maybe: results.filter(r => r.status === 'maybe').length,
  }

  let myStatus = null
  if (h?.startsWith('Bearer ')) {
    const { results: sess } = await env.DB.prepare(
      `SELECT u.id FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(h.slice(7)).all()
    if (sess[0]) {
      const mine = results.find(r => r.user_id === sess[0].id)
      myStatus = mine?.status || null
    }
  }

  return Response.json({ availability: results, summary, myStatus })
}

export async function onRequestPost({ params, request, env }) {
  const h = request.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: sessions } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  if (!sessions[0]) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const { fixtureId } = params
  const { status, note } = await request.json()
  if (!['available','unavailable','maybe'].includes(status))
    return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 })

  await env.DB.prepare(
    `INSERT INTO ch_availability (fixture_id, user_id, club_id, status, note, updated_at)
     VALUES (?,?,?,?,?,datetime('now'))
     ON CONFLICT(fixture_id, user_id) DO UPDATE SET status=excluded.status, note=excluded.note, updated_at=excluded.updated_at`
  ).bind(fixtureId, sessions[0].id, clubs[0].id, status, note || null).run()

  return Response.json({ ok: true })
}
