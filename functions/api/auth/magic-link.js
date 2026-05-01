export async function onRequestPost({ request, env }) {
  try {
    const { email, club_slug } = await request.json()
    if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 })

    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await env.DB.prepare(
      'INSERT INTO ch_magic_links (email, token, club_slug, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(email, token, club_slug || null, expires).run()

    const baseUrl = env.APP_URL || 'https://clubhouse-e5e.pages.dev'
    const loginUrl = club_slug
      ? `${baseUrl}/${club_slug}/verify?token=${token}`
      : `${baseUrl}/verify?token=${token}`

    const clubRow = club_slug
      ? (await env.DB.prepare('SELECT name FROM clubs WHERE slug = ?').bind(club_slug).all()).results[0]
      : null
    const clubName = clubRow?.name || 'Clubhouse'

    // Call Resend API directly via fetch — no SDK, Pages Functions compatible
    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${clubName} <noreply@luckdragon.io>`,
        to: [email],
        subject: `Your login link for ${clubName}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#003087">Welcome to ${clubName} 🏟️</h2>
          <p>Click below to sign in — no password needed.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#003087;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Sign in to ${clubName}</a>
          <p style="color:#999;font-size:12px">Expires in 15 minutes. Ignore if you didn't request this.</p>
        </div>`,
      }),
    })

    if (!emailResp.ok) {
      const err = await emailResp.json().catch(() => ({}))
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
