const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

// AFL stat keys with display labels and defaults
const AFL_STATS = {
  goals: 'Goals', behinds: 'Behinds', kicks: 'Kicks', handballs: 'Handballs',
  disposals: 'Disposals', marks: 'Marks', tackles: 'Tackles', hitouts: 'Hitouts',
  frees_for: 'Frees For', frees_against: 'Frees Against', votes: 'Coach Votes',
}

// Cricket batting stats
const CRICKET_BAT_STATS = {
  runs: 'Runs', balls: 'Balls', fours: '4s', sixes: '6s',
  not_out: 'Not Out', wicket_type: 'Dismissal',
}

// Cricket bowling stats
const CRICKET_BOWL_STATS = {
  overs: 'Overs', maidens: 'Maidens', wickets: 'Wickets',
  runs_conceded: 'Runs', economy: 'Economy',
}

// GET /api/clubs/[slug]/fixtures/[fixtureId]/stats
// Returns all stats for a fixture, grouped by player
export async function onRequestGet({ params, request, env }) {
  const { slug, fixtureId } = params

  // Verify fixture belongs to club
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: fixture } = await env.DB.prepare(
    'SELECT id, sport FROM ch_fixtures WHERE id = ? AND club_id = ?'
  ).bind(fixtureId, clubId).all()
  if (!fixture.length) return Response.json({ error: 'Not found' }, { status: 404 })

  // Get all stats for this fixture with user info
  const { results: stats } = await env.DB.prepare(`
    SELECT s.user_id, s.stat_key, s.stat_value, s.sport,
           u.name, u.avatar_url,
           m.jumper_number, m.positions
    FROM ch_stats s
    JOIN ch_users u ON s.user_id = u.id
    LEFT JOIN ch_memberships m ON m.user_id = s.user_id AND m.club_id = s.club_id AND m.status = 'active'
    WHERE s.fixture_id = ? AND s.club_id = ?
    ORDER BY u.name, s.stat_key
  `).bind(fixtureId, clubId).all()

  // Group by player
  const players = {}
  for (const row of stats) {
    if (!players[row.user_id]) {
      players[row.user_id] = {
        user_id: row.user_id, name: row.name, avatar_url: row.avatar_url,
        jumper_number: row.jumper_number, positions: row.positions,
        sport: row.sport, stats: {}
      }
    }
    players[row.user_id].stats[row.stat_key] = row.stat_value
  }

  return Response.json({
    fixture_id: fixtureId,
    sport: fixture[0].sport || 'afl',
    players: Object.values(players),
    stat_keys: { afl: AFL_STATS, cricket_bat: CRICKET_BAT_STATS, cricket_bowl: CRICKET_BOWL_STATS },
  })
}

// POST /api/clubs/[slug]/fixtures/[fixtureId]/stats
// Body: { sport, players: [ { user_id, stats: { goals: 2, behinds: 1, ... } } ] }
export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, fixtureId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  // Must be admin/committee/coach
  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length || !['admin', 'committee', 'coach'].includes(mem[0].role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify fixture
  const { results: fixture } = await env.DB.prepare(
    'SELECT id FROM ch_fixtures WHERE id = ? AND club_id = ?'
  ).bind(fixtureId, clubId).all()
  if (!fixture.length) return Response.json({ error: 'Fixture not found' }, { status: 404 })

  const { sport = 'afl', players = [] } = await request.json()

  let saved = 0
  for (const player of players) {
    const { user_id, stats = {} } = player
    if (!user_id || !Object.keys(stats).length) continue

    for (const [key, value] of Object.entries(stats)) {
      if (value === null || value === undefined || value === '') continue
      await env.DB.prepare(`
        INSERT INTO ch_stats (club_id, fixture_id, user_id, sport, stat_key, stat_value, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(fixture_id, user_id, stat_key)
        DO UPDATE SET stat_value = excluded.stat_value, updated_at = datetime('now')
      `).bind(clubId, fixtureId, user_id, sport, key, Number(value)).run()
      saved++
    }
  }

  // Also update fixture sport if provided
  if (sport) {
    try {
      await env.DB.prepare('ALTER TABLE ch_fixtures ADD COLUMN sport TEXT').run()
    } catch (_) {}
    await env.DB.prepare('UPDATE ch_fixtures SET sport = ? WHERE id = ?').bind(sport, fixtureId).run()
  }

  return Response.json({ ok: true, saved })
}