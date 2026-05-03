export async function onRequestGet({ params, request, env }) {
  const { slug, userId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id
  const { results: totals } = await env.DB.prepare(`
    SELECT stat_key, sport,
           SUM(stat_value) as total, AVG(stat_value) as average,
           COUNT(DISTINCT fixture_id) as games, MAX(stat_value) as best
    FROM ch_stats
    WHERE user_id = ? AND club_id = ?
    GROUP BY stat_key, sport ORDER BY sport, stat_key
  `).bind(userId, clubId).all()
  const { results: games } = await env.DB.prepare(`
    SELECT f.id as fixture_id, f.opponent, f.date, f.round, f.is_home,
           f.score_us, f.score_them, f.status, s.stat_key, s.stat_value, s.sport
    FROM ch_stats s
    JOIN ch_fixtures f ON f.id = s.fixture_id
    WHERE s.user_id = ? AND s.club_id = ?
    ORDER BY f.date DESC LIMIT 100
  `).bind(userId, clubId).all()
  const gameMap = {}
  for (const row of games) {
    if (!gameMap[row.fixture_id]) {
      gameMap[row.fixture_id] = {
        fixture_id: row.fixture_id, opponent: row.opponent, date: row.date,
        round: row.round, is_home: row.is_home, score_us: row.score_us,
        score_them: row.score_them, status: row.status, sport: row.sport, stats: {}
      }
    }
    gameMap[row.fixture_id].stats[row.stat_key] = row.stat_value
  }
  return Response.json({
    user_id: userId, totals,
    games: Object.values(gameMap).slice(0, 10),
    games_played: Object.keys(gameMap).length,
  })
}