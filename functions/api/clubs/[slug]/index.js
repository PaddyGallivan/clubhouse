export async function onRequestGet({ params, env }) {
  try {
    const { slug } = params
    const { results } = await env.DB.prepare(
      'SELECT * FROM clubs WHERE slug = ?'
    ).bind(slug).all()
    if (!results.length) return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 })
    return Response.json({ club: results[0] })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
