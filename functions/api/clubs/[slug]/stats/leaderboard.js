// GET /api/clubs/[slug]/stats/leaderboard?stat=goals&limit=10
export async function onRequestGet({ params, request, env }) {
  const { slug } = params
  const url = new URL(request.url)
  const stat = url.searchParams.get('stat') || 'goals'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id
  const { results } = await env.DB.prepare(`
    SELECT s.user_id, u.name, u.avatar_url, m.jumper_number,
           SUM(s.stat_value) as total, AVG(s.stat_value) as average,
           COUNT(DISTINCT s.fixture_id) as games, MAX(s.stat_value) as best_game
    FROM ch_stats s
    JOIN ch_users u ON s.user_id = u.id
    LEFT JOIN ch_memberships m ON m.user_id = s.user_id AND m.club_id = s.club_id AND m.status = 'active'
    WHERE s.club_id = ? AND s.stat_key = ?
    GROUP BY s.user_id ORDER BY total DESC LIMIT ?
  `).bind(clubId, stat, limit).all()
  return Response.json({ stat, leaderboard: results })
}