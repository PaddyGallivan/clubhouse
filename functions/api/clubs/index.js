export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, slug, name, short_name, sport, primary_colour, secondary_colour, ground_name, ground_address, logo_url
     FROM clubs ORDER BY name ASC`
  ).all()
  return Response.json({ clubs: results })
}
