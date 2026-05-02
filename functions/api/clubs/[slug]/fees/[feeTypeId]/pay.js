export async function onRequestPost({ params, request, env }) {
  const h = request.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: sessions } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  if (!sessions[0]) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const { feeTypeId } = params
  const { user_id, amount_paid, status, method, note } = await request.json()
  const targetUserId = user_id || sessions[0].id

  await env.DB.prepare(
    `INSERT INTO ch_fee_records (fee_type_id, user_id, club_id, amount_due, amount_paid, status, paid_at, method, note, created_by)
     SELECT ?, ?, ?, amount, ?, ?, CASE WHEN ? = 'paid' THEN datetime('now') ELSE null END, ?, ?, ?
     FROM ch_fee_types WHERE id = ?
     ON CONFLICT(fee_type_id, user_id) DO UPDATE SET
       amount_paid = excluded.amount_paid,
       status = excluded.status,
       paid_at = excluded.paid_at,
       method = excluded.method,
       note = COALESCE(excluded.note, ch_fee_records.note)`
  ).bind(
    feeTypeId, targetUserId, clubs[0].id,
    amount_paid, status || 'paid', status || 'paid',
    method || null, note || null, sessions[0].id,
    feeTypeId
  ).run()

  return Response.json({ ok: true })
}
