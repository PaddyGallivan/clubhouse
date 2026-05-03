// Send Web Push — setup: npx web-push generate-vapid-keys → VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY CF secrets
const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}
function b64u(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'') }
function unb64u(s) { const b=s.replace(/-/g,'+').replace(/_/g,'/'); return Uint8Array.from(atob(b.padEnd(b.length+(4-b.length%4)%4,'=')),c=>c.charCodeAt(0)) }
async function vapidHeader(endpoint,pubKey,privKey) {
  const pub=unb64u(pubKey)
  const jwk={kty:'EC',crv:'P-256',ext:true,x:b64u(pub.slice(1,33)),y:b64u(pub.slice(33,65)),d:privKey}
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign'])
  const h=b64u(new TextEncoder().encode(JSON.stringify({alg:'ES256',typ:'JWT'})))
  const p=b64u(new TextEncoder().encode(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+86400,sub:'mailto:noreply@clubhouseapp.com.au'})))
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(`${h}.${p}`))
  return `vapid t=${h}.${p}.${b64u(new Uint8Array(sig))},k=${pubKey}`
}
export async function onRequestPost({ params, request, env }) {
  const user=await AUTH(request,env)
  if (!user) return Response.json({error:'Unauthorized'},{status:401})
  const {slug}=params
  const {results:clubs}=await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({error:'Not found'},{status:404})
  const clubId=clubs[0].id
  const {results:mem}=await env.DB.prepare('SELECT role FROM ch_memberships WHERE user_id=? AND club_id=? AND status=?').bind(user.id,clubId,'active').all()
  if (!mem.length||!['admin','committee'].includes(mem[0].role)) return Response.json({error:'Forbidden'},{status:403})
  if (!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY) return Response.json({error:'Push not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as CF secrets.'},{status:503})
  const {results:subs}=await env.DB.prepare('SELECT id,endpoint FROM ch_push_subscriptions WHERE club_id=?').bind(clubId).all()
  if (!subs.length) return Response.json({ok:true,sent:0,message:'No subscribers yet'})
  let sent=0,failed=0;const toDelete=[]
  await Promise.allSettled(subs.map(async sub=>{
    try {
      const auth=await vapidHeader(sub.endpoint,env.VAPID_PUBLIC_KEY,env.VAPID_PRIVATE_KEY)
      const res=await fetch(sub.endpoint,{method:'POST',headers:{'Authorization':auth,'TTL':'86400'}})
      if ([200,201,202].includes(res.status)) sent++
      else if ([404,410].includes(res.status)) {toDelete.push(sub.id);failed++}
      else failed++
    } catch {failed++}
  }))
  if (toDelete.length) await env.DB.prepare(`DELETE FROM ch_push_subscriptions WHERE id IN (${toDelete.map(()=>'?').join(',')})`).bind(...toDelete).run()
  return Response.json({ok:true,sent,failed,cleaned:toDelete.length})
}
