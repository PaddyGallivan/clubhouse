export async function onRequestPost({ request, env }) {
  try {
    const { email, club_slug } = await request.json()
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 })

    // Rate limit: max 3 magic links per email per 10 minutes
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { results: recent } = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM ch_magic_links WHERE email = ? AND created_at > ?`
    ).bind(email, windowStart).all()
    if (recent[0]?.cnt >= 3) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes before trying again." }), { status: 429 })
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await env.DB.prepare(
      "INSERT INTO ch_magic_links (email, token, club_slug, expires_at) VALUES (?, ?, ?, ?)"
    ).bind(email, token, club_slug || null, expires).run()

    const baseUrl = env.APP_URL || "https://clubhouse-e5e.pages.dev"
    const loginUrl = club_slug
      ? `${baseUrl}/${club_slug}/verify?token=${token}`
      : `${baseUrl}/verify?token=${token}`

    const clubRow = club_slug
      ? (await env.DB.prepare("SELECT name FROM clubs WHERE slug = ?").bind(club_slug).all()).results[0]
      : null
    const clubName = clubRow?.name || "Clubhouse"

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${clubName} <noreply@luckdragon.io>`,
        to: [email],
        subject: `Your login link for ${clubName}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#003087;margin-bottom:4px">${clubName}</h2>
          <p style="color:#555;margin-top:0">Your sign-in link is ready.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#003087;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;font-size:16px">Sign in to ${clubName} →</a>
          <p style="color:#999;font-size:13px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
            This link expires in 15 minutes and can only be used once.<br>
            If you did not request this, you can safely ignore this email.<br><br>
            <a href="https://clubhouse-e5e.pages.dev/privacy" style="color:#999">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="https://clubhouse-e5e.pages.dev/terms" style="color:#999">Terms of Service</a>
          </p>
        </div>`,
      }),
    })

    if (!emailResp.ok) {
      const err = await emailResp.json().catch(() => ({}))
      console.error("Resend error:", err)
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}

