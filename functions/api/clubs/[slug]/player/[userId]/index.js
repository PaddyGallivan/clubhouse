export async function onRequestGet({ params, env }) {
  const { slug, userId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id
  const { results: users } = await env.DB.prepare(
    `SELECT u.*, m.jumper_number, m.positions FROM ch_users u
     JOIN ch_memberships m ON m.user_id = u.id WHERE u.id = ? AND m.club_id = ?`
  ).bind(userId, clubId).all()
  if (!users.length) return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404 })
  const player = users[0]
  const [statsR, goalsR, fitnessR, milestonesR] = await Promise.all([
    env.DB.prepare(`SELECT ps.*, f.round, f.opponent_name FROM ch_player_stats ps JOIN ch_fixtures f ON ps.fixture_id = f.id WHERE ps.user_id = ? AND ps.club_id = ? ORDER BY f.date`).bind(userId, clubId).all(),
    env.DB.prepare(`SELECT * FROM ch_dev_goals WHERE user_id = ? AND club_id = ?`).bind(userId, clubId).all(),
    env.DB.prepare(`SELECT * FROM ch_fitness WHERE user_id = ? AND club_id = ? ORDER BY tested_at DESC`).bind(userId, clubId).all(),
    env.DB.prepare(`SELECT * FROM ch_milestones WHERE user_id = ? AND club_id = ?`).bind(userId, clubId).all(),
  ])
  return Response.json({ player: { ...player, stats: statsR.results, dev_goals: goalsR.results, fitness: fitnessR.results, milestones: milestonesR.results } })
}
