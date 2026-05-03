export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json()
    if (!token) return new Response(JSON.stringify({ error: 'Token required' }), { status: 400 })

    const { results } = await env.DB.prepare(
      'SELECT * FROM ch_magic_links WHERE token = ? AND used_at IS NULL AND expires_at > datetime("now")'
    ).bind(token).all()

    if (!results.length) return new Response(JSON.stringify({ error: 'Link expired or already used' }), { status: 401 })

    const link = results[0]
    await env.DB.prepare('UPDATE ch_magic_links SET used_at = datetime("now") WHERE id = ?').bind(link.id).run()

    // Upsert user — track whether this is a brand-new account
    const { meta: insertMeta } = await env.DB.prepare('INSERT OR IGNORE INTO ch_users (email) VALUES (?)').bind(link.email).run()
    const isNewUser = insertMeta?.rows_written > 0
    const { results: users } = await env.DB.prepare('SELECT * FROM ch_users WHERE email = ?').bind(link.email).all()
    const user = users[0]

    // Auto-create membership if invited to a club and not already a member
    let clubName = 'Clubhouse'
    let clubSlugForEmail = link.club_slug
    if (link.club_slug) {
      const { results: clubs } = await env.DB.prepare('SELECT id, name FROM clubs WHERE slug = ?').bind(link.club_slug).all()
      if (clubs.length) {
        const clubId = clubs[0].id
        clubName = clubs[0].name
        const role = link.notes || 'player'
        const { results: existing } = await env.DB.prepare(
          'SELECT id FROM ch_memberships WHERE user_id = ? AND club_id = ?'
        ).bind(user.id, clubId).all()
        if (!existing.length) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO ch_memberships (user_id, club_id, role, status) VALUES (?,?,?,?)'
          ).bind(user.id, clubId, role, 'active').run()
        }
      }
    }

    // Create 365-day session
    const sessionToken = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'')
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    await env.DB.prepare('INSERT INTO ch_sessions (user_id, token, expires_at) VALUES (?,?,?)').bind(user.id, sessionToken, expires).run()

    const { results: memberships } = await env.DB.prepare(
      `SELECT m.*, c.slug as club_slug, c.name as club_name FROM ch_memberships m
       JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
    ).bind(user.id).all()

    // Send welcome email to new users (fire-and-forget — don't fail the login if email fails)
    if (isNewUser && env.RESEND_API_KEY) {
      const baseUrl = env.APP_URL || 'https://clubhouse-e5e.pages.dev'
      const dashboardUrl = clubSlugForEmail
        ? `${baseUrl}/${clubSlugForEmail}/dashboard`
        : `${baseUrl}`
      const profileUrl = clubSlugForEmail
        ? `${baseUrl}/${clubSlugForEmail}/profile`
        : `${baseUrl}`

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${clubName} <noreply@luckdragon.io>`,
          to: [link.email],
          subject: `Welcome to ${clubName} on Clubhouse!`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#003087;margin-bottom:4px">Welcome to ${clubName}! 🎉</h2>
            <p style="color:#555;margin-top:0">Your Clubhouse account has been created. Here's what you can do:</p>
            <ul style="color:#555;padding-left:20px;line-height:1.8">
              <li>View fixtures and results</li>
              <li>Check the team roster and player profiles</li>
              <li>Mark your availability for upcoming games</li>
              <li>Chat with your team</li>
              <li>Stay across club news and events</li>
            </ul>
            <a href="${dashboardUrl}" style="display:inline-block;background:#003087;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;font-size:16px">Go to your dashboard →</a>
            <p style="color:#555;font-size:14px">
              First time? <a href="${profileUrl}" style="color:#003087">Set up your profile</a> — add your name, jumper number, and positions so your teammates can find you.
            </p>
            <p style="color:#999;font-size:13px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
              You're receiving this because your email was registered with ${clubName}.<br>
              <a href="https://clubhouse-e5e.pages.dev/privacy" style="color:#999">Privacy Policy</a> &nbsp;·&nbsp;
              <a href="https://clubhouse-e5e.pages.dev/terms" style="color:#999">Terms of Service</a>
            </p>
          </div>`,
        }),
      }).catch(err => console.error('Welcome email failed:', err))
    }

    return Response.json({ session_token: sessionToken, user: { ...user, memberships } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
