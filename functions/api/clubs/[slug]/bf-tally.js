export async function onRequestGet({ params, request, env }) {
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id
  const { results } = await env.DB.prepare(`
    SELECT u.id as user_id, u.name,
      SUM(CASE WHEN v.vote_1 = u.id THEN 3 WHEN v.vote_2 = u.id THEN 2 WHEN v.vote_3 = u.id THEN 1 ELSE 0 END) as total_votes
    FROM ch_users u
    JOIN ch_memberships m ON m.user_id = u.id AND m.club_id = ? AND m.role = 'player'
    LEFT JOIN ch_bf_votes v ON v.club_id = ?
    GROUP BY u.id HAVING total_votes > 0 ORDER BY total_votes DESC
  `).bind(clubId, clubId).all()
  return Response.json({ tally: results })
}
