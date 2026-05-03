export async function onRequestGet({ env }) {
  if (!env.VAPID_PUBLIC_KEY) {
    return Response.json({ error: 'Push notifications not configured on this server' }, { status: 503 })
  }
  return Response.json({ publicKey: env.VAPID_PUBLIC_KEY })
}
