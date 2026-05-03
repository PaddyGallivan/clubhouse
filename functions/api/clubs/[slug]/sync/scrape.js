const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

// Idempotently ensure columns exist
async function ensureColumns(env) {
  const cols = ['playhq_id', 'competition', 'round_name', 'venue_address', 'score_us', 'score_them']
  for (const col of cols) {
    try { await env.DB.prepare(`ALTER TABLE ch_fixtures ADD COLUMN ${col} TEXT`).run() } catch (_) {}
  }
}

function parseDate(raw) {
  if (!raw) return null
  // Handle formats: "Sat 10 May 2026", "2026-05-10", "10/05/2026"
  try {
    const d = new Date(raw)
    if (!isNaN(d)) return d.toISOString().split('T')[0]
  } catch (_) {}
  return raw
}

// POST: receive scraped PlayHQ data from bookmarklet
export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length || !['admin', 'committee'].includes(mem[0].role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json()
  const { fixtures = [], ladder = [], page_type, competition, season } = payload

  await ensureColumns(env)

  let fixtureStats = { inserted: 0, updated: 0, skipped: 0 }
  let ladderStats = { inserted: 0, updated: 0 }

  // ── Upsert fixtures ──────────────────────────────────────────────────────
  for (const f of fixtures) {
    if (!f.opponent) continue
    const status = f.score_us != null || f.score_them != null ? 'played' : 'upcoming'
    const date = parseDate(f.date)

    // Try to find by playhq_id first, then by round+opponent
    let existing = null
    if (f.playhq_id) {
      const r = await env.DB.prepare('SELECT id FROM ch_fixtures WHERE club_id = ? AND playhq_id = ?').bind(clubId, f.playhq_id).all()
      existing = r.results[0]
    }
    if (!existing && f.round && f.opponent) {
      const r = await env.DB.prepare(
        'SELECT id FROM ch_fixtures WHERE club_id = ? AND round = ? AND opponent = ?'
      ).bind(clubId, String(f.round), f.opponent).all()
      existing = r.results[0]
    }

    if (existing) {
      await env.DB.prepare(`
        UPDATE ch_fixtures SET
          status = ?, score_us = COALESCE(?, score_us), score_them = COALESCE(?, score_them),
          date = COALESCE(?, date), venue = COALESCE(?, venue),
          playhq_id = COALESCE(?, playhq_id), competition = COALESCE(?, competition),
          round_name = COALESCE(?, round_name)
        WHERE id = ?
      `).bind(status, f.score_us ?? null, f.score_them ?? null, date, f.venue ?? null,
              f.playhq_id ?? null, competition ?? null, f.round_name ?? null, existing.id).run()
      fixtureStats.updated++
    } else {
      await env.DB.prepare(`
        INSERT INTO ch_fixtures (club_id, playhq_id, round, round_name, opponent, is_home, date, venue, status, score_us, score_them, competition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(clubId, f.playhq_id ?? null, String(f.round || ''), f.round_name ?? null,
              f.opponent, f.is_home ? 1 : 0, date, f.venue ?? null, status,
              f.score_us ?? null, f.score_them ?? null, competition ?? null).run()
      fixtureStats.inserted++
    }
  }

  // ── Upsert ladder ────────────────────────────────────────────────────────
  for (const row of ladder) {
    if (!row.team_name) continue
    const existing = await env.DB.prepare(
      'SELECT id FROM ch_ladder WHERE club_id = ? AND team_name = ?'
    ).bind(clubId, row.team_name).all()

    if (existing.results.length) {
      await env.DB.prepare(`
        UPDATE ch_ladder SET position = ?, played = ?, won = ?, lost = ?, drawn = ?,
          points = ?, percentage = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(row.position ?? null, row.played ?? null, row.won ?? null,
              row.lost ?? null, row.drawn ?? null, row.points ?? null,
              row.percentage ?? null, existing.results[0].id).run()
      ladderStats.updated++
    } else {
      try {
        await env.DB.prepare(`
          INSERT INTO ch_ladder (club_id, team_name, position, played, won, lost, drawn, points, percentage)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(clubId, row.team_name, row.position ?? null, row.played ?? null,
                row.won ?? null, row.lost ?? null, row.drawn ?? null,
                row.points ?? null, row.percentage ?? null).run()
        ladderStats.inserted++
      } catch (_) {}
    }
  }

  // Record sync time
  await env.DB.prepare("UPDATE clubs SET playhq_last_sync = datetime('now') WHERE id = ?").bind(clubId).run()

  return Response.json({
    ok: true,
    fixtures: fixtureStats,
    ladder: ladderStats,
    last_sync: new Date().toISOString(),
  })
}