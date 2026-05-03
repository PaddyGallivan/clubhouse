const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
  const rows = lines.slice(1).map(line => {
    // Handle quoted fields
    const fields = []
    let current = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { fields.push(current.trim()); current = '' }
      else { current += ch }
    }
    fields.push(current.trim())
    return Object.fromEntries(headers.map((h, i) => [h, fields[i] || '']))
  }).filter(r => Object.values(r).some(v => v))
  return { headers, rows }
}

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
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  if (!['admin', 'committee'].includes(mem[0].role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const type = url.searchParams.get('type') // 'fixtures' or 'roster'
  if (!['fixtures', 'roster'].includes(type)) return Response.json({ error: 'type must be fixtures or roster' }, { status: 400 })

  const body = await request.json()
  const { rows, preview } = body

  if (preview) {
    // Just validate + return preview — don't write
    return Response.json({ ok: true, preview: true, count: rows.length })
  }

  let imported = 0, skipped = 0, errors = []

  if (type === 'fixtures') {
    for (const row of rows) {
      try {
        const round = row.round || row.rd || ''
        const opponent = row.opponent || row.opponent_name || row.away_team || row.home_team || ''
        const date = row.date || ''
        const time = row.time || ''
        const venue = row.venue || row.ground || ''
        const isHome = ['home', '1', 'true', 'yes', 'h'].includes((row.home_away || row.is_home || 'home').toLowerCase().trim()) ? 1 : 0
        const scoreUs = row.score_us || row.our_score || row.goals_for || null
        const scoreThem = row.score_them || row.their_score || row.goals_against || null
        const status = (scoreUs !== null && scoreThem !== null) ? 'played' : 'upcoming'

        if (!opponent) { skipped++; continue }

        await env.DB.prepare(
          `INSERT INTO ch_fixtures (club_id, round, opponent_name, date, time, venue, is_home, score_us, score_them, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(clubId, round || null, opponent, date || null, time || null, venue || null, isHome,
          scoreUs !== null ? parseInt(scoreUs) : null,
          scoreThem !== null ? parseInt(scoreThem) : null,
          status
        ).run()
        imported++
      } catch (e) {
        errors.push(`Row ${imported + skipped + 1}: ${e.message}`)
        skipped++
      }
    }
  } else if (type === 'roster') {
    for (const row of rows) {
      try {
        const name = row.name || row.player_name || row.full_name || ''
        const email = (row.email || row.email_address || '').toLowerCase().trim()
        const jumper = row.jumper || row.jumper_number || row.number || ''
        const positions = row.positions || row.position || ''
        const role = ['coach','committee','admin'].includes(row.role?.toLowerCase()) ? row.role.toLowerCase() : 'player'

        if (!email) { skipped++; continue }

        // Upsert user
        await env.DB.prepare('INSERT OR IGNORE INTO ch_users (email, name) VALUES (?, ?)').bind(email, name || null).run()
        if (name) {
          await env.DB.prepare('UPDATE ch_users SET name = ? WHERE email = ? AND name IS NULL').bind(name, email).run()
        }
        const { results: users } = await env.DB.prepare('SELECT id FROM ch_users WHERE email = ?').bind(email).all()
        if (!users.length) { skipped++; continue }
        const userId = users[0].id

        // Upsert membership
        const { results: existing } = await env.DB.prepare(
          'SELECT id FROM ch_memberships WHERE user_id = ? AND club_id = ?'
        ).bind(userId, clubId).all()

        if (existing.length) {
          // Update jumper/positions if provided
          if (jumper || positions) {
            await env.DB.prepare(
              `UPDATE ch_memberships SET
                jumper_number = COALESCE(NULLIF(?, ''), jumper_number),
                positions = COALESCE(NULLIF(?, ''), positions)
               WHERE user_id = ? AND club_id = ?`
            ).bind(jumper || null, positions || null, userId, clubId).run()
          }
        } else {
          await env.DB.prepare(
            'INSERT INTO ch_memberships (user_id, club_id, role, status, jumper_number, positions) VALUES (?,?,?,?,?,?)'
          ).bind(userId, clubId, role, 'active', jumper ? parseInt(jumper) : null, positions || null).run()
        }
        imported++
      } catch (e) {
        errors.push(`Row ${imported + skipped + 1}: ${e.message}`)
        skipped++
      }
    }
  }

  return Response.json({ ok: true, imported, skipped, errors: errors.slice(0, 10) })
}
