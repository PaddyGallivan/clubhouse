const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

/**
 * PlayHQ public GraphQL API
 * Clubs can get API keys from PlayHQ at: https://help.playhq.com/en/articles/api-access
 * Without a key we attempt unauthenticated requests (works for public competitions)
 */
const PLAYHQ_GQL = 'https://api.playhq.com/graphql'

const FIXTURES_QUERY = `
query SeasonFixtures($seasonId: ID!) {
  season(id: $seasonId) {
    id
    name
    competition { name }
    rounds {
      id
      name
      number
      games {
        id
        date
        status
        venueName
        venueAddress
        homeTeam { id name clubId }
        awayTeam { id name clubId }
        homeScore
        awayScore
      }
    }
  }
}
`

async function fetchFromPlayHQ(seasonId, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  const resp = await fetch(PLAYHQ_GQL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: FIXTURES_QUERY, variables: { seasonId } }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`PlayHQ API returned ${resp.status}: ${text.slice(0, 200)}`)
  }

  const data = await resp.json()
  if (data.errors?.length) {
    throw new Error(`PlayHQ GraphQL error: ${data.errors[0].message}`)
  }
  return data.data?.season
}

function mapStatus(phqStatus) {
  if (!phqStatus) return 'upcoming'
  const s = phqStatus.toLowerCase()
  if (s === 'completed' || s === 'final') return 'played'
  if (s === 'in_progress' || s === 'live') return 'live'
  if (s === 'cancelled' || s === 'abandoned') return 'cancelled'
  return 'upcoming'
}

function mapGamesToFixtures(season, clubId) {
  const fixtures = []
  for (const round of (season.rounds || [])) {
    for (const game of (round.games || [])) {
      // Only include games that involve our club's teams
      const isHome = game.homeTeam?.clubId === clubId || !clubId
      const isAway = game.awayTeam?.clubId === clubId || !clubId
      if (clubId && !isHome && !isAway) continue

      const status = mapStatus(game.status)
      fixtures.push({
        playhq_id: game.id,
        round: round.number?.toString() || round.name || '',
        round_name: round.name || `Round ${round.number}`,
        opponent: isHome ? game.awayTeam?.name : game.homeTeam?.name,
        is_home: isHome ? 1 : 0,
        date: game.date || null,
        venue: game.venueName || null,
        venue_address: game.venueAddress || null,
        status,
        score_us: isHome ? game.homeScore : game.awayScore,
        score_them: isHome ? game.awayScore : game.homeScore,
        competition: season.competition?.name || season.name || '',
      })
    }
  }
  return fixtures
}

async function upsertFixtures(env, dbClubId, fixtures) {
  let inserted = 0, updated = 0, skipped = 0
  for (const f of fixtures) {
    try {
      // Check if fixture with this playhq_id already exists
      const existing = await env.DB.prepare(
        'SELECT id, status FROM ch_fixtures WHERE club_id = ? AND playhq_id = ?'
      ).bind(dbClubId, f.playhq_id).all()

      if (existing.results.length) {
        // Update if score/status changed
        const ex = existing.results[0]
        const needsUpdate = ex.status !== f.status
        if (needsUpdate || f.score_us != null) {
          await env.DB.prepare(`
            UPDATE ch_fixtures SET
              status = ?, score_us = ?, score_them = ?,
              venue = COALESCE(?, venue), date = COALESCE(?, date)
            WHERE id = ?
          `).bind(f.status, f.score_us ?? null, f.score_them ?? null, f.venue, f.date, ex.id).run()
          updated++
        } else {
          skipped++
        }
      } else {
        // Insert new fixture
        await env.DB.prepare(`
          INSERT INTO ch_fixtures
            (club_id, playhq_id, round, round_name, opponent, is_home, date, venue, venue_address, status, score_us, score_them, competition)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          dbClubId, f.playhq_id, f.round, f.round_name, f.opponent,
          f.is_home, f.date, f.venue, f.venue_address, f.status,
          f.score_us ?? null, f.score_them ?? null, f.competition
        ).run()
        inserted++
      }
    } catch (err) {
      console.error('Fixture upsert error:', err.message, f)
      skipped++
    }
  }
  return { inserted, updated, skipped }
}

// GET: return current PlayHQ config for this club
export async function onRequestGet({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results } = await env.DB.prepare(
    'SELECT id, playhq_org_id, playhq_season_id, playhq_last_sync FROM clubs WHERE slug = ?'
  ).bind(slug).all()
  if (!results.length) return Response.json({ error: 'Not found' }, { status: 404 })

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, results[0].id).all()
  if (!mem.length || !['admin', 'committee'].includes(mem[0].role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json({
    playhq_org_id: results[0].playhq_org_id || null,
    playhq_season_id: results[0].playhq_season_id || null,
    playhq_last_sync: results[0].playhq_last_sync || null,
  })
}

// PATCH: save PlayHQ config
export async function onRequestPatch({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!results.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = results[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length || !['admin', 'committee'].includes(mem[0].role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { playhq_org_id, playhq_season_id } = await request.json()
  await env.DB.prepare(
    'UPDATE clubs SET playhq_org_id = ?, playhq_season_id = ? WHERE id = ?'
  ).bind(playhq_org_id?.trim() || null, playhq_season_id?.trim() || null, clubId).run()

  return Response.json({ ok: true })
}

// POST: trigger sync
export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results } = await env.DB.prepare(
    'SELECT id, playhq_org_id, playhq_season_id FROM clubs WHERE slug = ?'
  ).bind(slug).all()
  if (!results.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const club = results[0]

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, club.id).all()
  if (!mem.length || !['admin', 'committee'].includes(mem[0].role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!club.playhq_season_id) {
    return Response.json({ error: 'No PlayHQ Season ID configured. Go to Settings → PlayHQ Sync to set it up.' }, { status: 400 })
  }

  // Get optional API key from request body
  const body = await request.json().catch(() => ({}))
  const apiKey = body.api_key || null

  let season
  try {
    season = await fetchFromPlayHQ(club.playhq_season_id, apiKey)
    if (!season) throw new Error('Season not found in PlayHQ. Check your Season ID.')
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }

  // Map games to fixtures — pass org_id as club filter so we only get relevant games
  const fixtures = mapGamesToFixtures(season, club.playhq_org_id)
  if (!fixtures.length) {
    return Response.json({
      ok: true, inserted: 0, updated: 0, skipped: 0,
      message: 'No matching fixtures found. Check your PlayHQ Org ID matches your club in the season.',
    })
  }

  // Check/add playhq_id column if needed (idempotent)
  try {
    await env.DB.prepare('ALTER TABLE ch_fixtures ADD COLUMN playhq_id TEXT').run()
  } catch (_) { /* already exists */ }
  try {
    await env.DB.prepare('ALTER TABLE ch_fixtures ADD COLUMN competition TEXT').run()
  } catch (_) { /* already exists */ }
  try {
    await env.DB.prepare('ALTER TABLE ch_fixtures ADD COLUMN round_name TEXT').run()
  } catch (_) { /* already exists */ }
  try {
    await env.DB.prepare('ALTER TABLE ch_fixtures ADD COLUMN venue_address TEXT').run()
  } catch (_) { /* already exists */ }

  const { inserted, updated, skipped } = await upsertFixtures(env, club.id, fixtures)

  // Record sync time
  await env.DB.prepare("UPDATE clubs SET playhq_last_sync = datetime('now') WHERE id = ?").bind(club.id).run()

  return Response.json({
    ok: true,
    season: season.name,
    total: fixtures.length,
    inserted,
    updated,
    skipped,
    last_sync: new Date().toISOString(),
  })
}