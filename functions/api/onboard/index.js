export async function onRequestPost({ request, env }) {
  try {
    const { name, short_name, slug, sport, primary_colour, secondary_colour,
            ground_name, ground_address, admin_email } = await request.json()
    if (!name || !slug || !admin_email) return Response.json({ error: 'name, slug and admin_email are required' }, { status: 400 })
    const { results: existing } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
    if (existing.length) return Response.json({ error: 'That slug is already taken — try a different one' }, { status: 409 })
    const { results: clubs } = await env.DB.prepare(`
      INSERT INTO clubs (name, short_name, slug, sport, primary_colour, secondary_colour, ground_name, ground_address)
      VALUES (?,?,?,?,?,?,?,?) RETURNING *
    `).bind(name, short_name||name.split(' ').map(w=>w[0]).join('').slice(0,5), slug, sport||'AFL', primary_colour||'#003087', secondary_colour||'#FFD700', ground_name||null, ground_address||null).all()
    const club = clubs[0]
    await env.DB.prepare('INSERT OR IGNORE INTO ch_users (email) VALUES (?)').bind(admin_email).run()
    const { results: users } = await env.DB.prepare('SELECT * FROM ch_users WHERE email = ?').bind(admin_email).all()
    const user = users[0]
    await env.DB.prepare('INSERT OR IGNORE INTO ch_memberships (user_id, club_id, role, status) VALUES (?,?,?,?)').bind(user.id, club.id, 'admin', 'active').run()
    if (env.RESEND_API_KEY) {
      const token = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'')
      const expires = new Date(Date.now() + 7*24*60*60*1000).toISOString()
      await env.DB.prepare('INSERT INTO ch_magic_links (email, token, club_slug, expires_at) VALUES (?,?,?,?)').bind(admin_email, token, slug, expires).run()
      const baseUrl = env.APP_URL || 'https://clubhouse-e5e.pages.dev'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Clubhouse <noreply@luckdragon.io>', to: [admin_email], subject: `Your club "${name}" is live on Clubhouse!`,
          html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><div style="background:${primary_colour||'#003087'};padding:24px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:${secondary_colour||'#FFD700'};margin:0">${short_name||name}</h1></div><div style="background:#f9f9f9;padding:28px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none"><p>Your club is ready! Click below to log in as admin.</p><div style="text-align:center;margin:28px 0"><a href="${baseUrl}/${slug}/verify?token=${token}" style="display:inline-block;background:${primary_colour||'#003087'};color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:bold">Open ${name} →</a></div><p style="color:#999;font-size:12px">Link expires in 7 days.</p></div></div>`,
        }),
      }).catch(()=>{})
    }
    return Response.json({ ok: true, club })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
