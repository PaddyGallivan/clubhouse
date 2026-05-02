const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { slug } = params
  const { email, role } = await request.json()
  if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 })

  const { results: clubs } = await env.DB.prepare('SELECT * FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const club = clubs[0]

  const token = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'')
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Store invite role in notes field (reuse existing schema)
  await env.DB.prepare(
    `INSERT INTO ch_magic_links (email, token, club_slug, expires_at) VALUES (?,?,?,?)`
  ).bind(email, token, slug, expires).run()

  // Store intended role so verify.js can use it
  await env.DB.prepare(
    `UPDATE ch_magic_links SET notes = ? WHERE token = ?`
  ).bind(role || 'player', token).run().catch(() => {})

  const baseUrl = env.APP_URL || 'https://clubhouse-e5e.pages.dev'
  const loginUrl = `${baseUrl}/${slug}/verify?token=${token}`
  const inviterName = user.name || 'Your club admin'

  const emailResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${club.name} <noreply@luckdragon.io>`,
      to: [email],
      subject: `You've been invited to join ${club.name} on Clubhouse`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:${club.primary_colour || '#003087'};padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:${club.secondary_colour || '#FFD700'};margin:0;font-size:28px">${club.short_name || club.name}</h1>
        </div>
        <div style="background:#f9f9f9;padding:28px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
          <p style="margin:0 0 12px">Hi there 👋</p>
          <p style="margin:0 0 20px"><strong>${inviterName}</strong> has invited you to join <strong>${club.name}</strong> on Clubhouse — your club's home for fixtures, roster, team chat, player stats and more.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${loginUrl}" style="display:inline-block;background:${club.primary_colour || '#003087'};color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">
              Join ${club.name} →
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin:0">This invite link expires in 7 days. No password required.</p>
        </div>
      </div>`,
    }),
  })

  if (!emailResp.ok) return new Response(JSON.stringify({ error: 'Failed to send invite' }), { status: 500 })
  return Response.json({ ok: true })
}
