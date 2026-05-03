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

  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id

  // Verify user is a member of this club
  const { results: membership } = await env.DB.prepare(
    'SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = ?'
  ).bind(user.id, clubId, 'active').all()
  if (!membership.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const myRole = membership[0].role
  if (!['admin','committee'].includes(myRole)) return Response.json({ error: 'Forbidden — committee only' }, { status: 403 })

  // Fee types
  const { results: feeTypes } = await env.DB.prepare(
    'SELECT * FROM ch_fee_types WHERE club_id = ? ORDER BY created_at ASC'
  ).bind(clubId).all()

  // Summary: per player per fee type
  const { results: records } = await env.DB.prepare(
    `SELECT fr.*, u.name as player_name, ft.name as fee_name
     FROM ch_fee_records fr
     JOIN ch_users u ON fr.user_id = u.id
     JOIN ch_fee_types ft ON fr.fee_type_id = ft.id
     WHERE fr.club_id = ?
     ORDER BY u.name ASC`
  ).bind(clubId).all()

  // Stats
  const totalOwing = records.filter(r => r.status !== 'paid' && r.status !== 'waived')
    .reduce((s, r) => s + (r.amount_due - r.amount_paid), 0)
  const totalCollected = records.reduce((s, r) => s + r.amount_paid, 0)

  return Response.json({ feeTypes, records, totalOwing, totalCollected })
}

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { name, amount, season, due_date, description } = await request.json()
  if (!name || !amount) return new Response(JSON.stringify({ error: 'Name and amount required' }), { status: 400 })
  const res = await env.DB.prepare(
    'INSERT INTO ch_fee_types (club_id, name, amount, season, due_date, description) VALUES (?,?,?,?,?,?)'
  ).bind(clubs[0].id, name, amount, season || null, due_date || null, description || null).run()
  const { results } = await env.DB.prepare('SELECT * FROM ch_fee_types WHERE id = ?').bind(res.meta.last_row_id).all()
  return Response.json({ feeType: results[0] })
}
