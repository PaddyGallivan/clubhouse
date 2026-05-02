export async function onRequestGet({ params, env }) {
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT * FROM ch_sponsors WHERE club_id = ?
     ORDER BY CASE tier WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 ELSE 4 END`
  ).bind(clubs[0].id).all()
  return Response.json({ sponsors: results })
}
