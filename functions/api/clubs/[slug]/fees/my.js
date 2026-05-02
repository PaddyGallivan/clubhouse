export async function onRequestGet({ params, request, env }) {
  const h = request.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: sessions } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  const user = sessions[0]
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const { results } = await env.DB.prepare(
    `SELECT fr.*, ft.name as fee_name, ft.amount as fee_amount, ft.due_date, ft.description
     FROM ch_fee_records fr
     JOIN ch_fee_types ft ON fr.fee_type_id = ft.id
     WHERE fr.user_id = ? AND fr.club_id = ?
     ORDER BY ft.created_at ASC`
  ).bind(user.id, clubs[0].id).all()

  const totalOwing = results.filter(r => r.status !== 'paid' && r.status !== 'waived')
    .reduce((s, r) => s + (r.amount_due - r.amount_paid), 0)
  const allPaid = results.length > 0 && results.every(r => r.status === 'paid' || r.status === 'waived')

  return Response.json({ fees: results, totalOwing, allPaid })
}
