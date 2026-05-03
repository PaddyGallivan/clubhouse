// Serve R2 objects publicly via CF Pages Function
// Route: /api/media/[...path] → R2 key = path joined
export async function onRequestGet({ params, env, request }) {
  if (!env.MEDIA) return new Response('Storage not configured', { status: 503 })

  // params.path is an array of path segments
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path
  if (!key) return new Response('Not found', { status: 404 })

  const object = await env.MEDIA.get(key)
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('ETag', object.httpEtag)

  // Handle conditional requests
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch === object.httpEtag) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(object.body, { headers })
}
