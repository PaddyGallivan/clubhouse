const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!env.MEDIA) return Response.json({ error: 'Storage not configured' }, { status: 503 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar')
  if (!file || typeof file === 'string') return Response.json({ error: 'No file uploaded' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_SIZE) return Response.json({ error: 'File too large (max 5MB)' }, { status: 413 })

  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type] || 'jpg'
  const key = `clubs/${slug}/avatars/${user.id}.${ext}`

  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: file.type } })

  // URL served via our own media endpoint (no public R2 config needed)
  const host = env.APP_URL || 'https://clubhouse-e5e.pages.dev'
  const avatarUrl = `${host}/api/media/${key}?v=${Date.now()}`

  await env.DB.prepare('UPDATE ch_users SET avatar_url = ? WHERE id = ?').bind(avatarUrl, user.id).run()

  return Response.json({ ok: true, avatar_url: avatarUrl })
}
