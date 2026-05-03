// Clubhouse Service Worker v2 — offline shell + push notifications
const CACHE = 'clubhouse-v2'
const SHELL = ['/', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/')) return
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') { const clone=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)) }
        return res
      }).catch(() => caches.match('/'))
    })
  )
})
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let title='Club Update', body="Tap to see what's new from your club.", url='/'
    try {
      const cache = await caches.open('ch-meta')
      const r = await cache.match('/push-slug')
      if (r) {
        const slug = await r.text()
        url = '/' + slug
        const res = await fetch('/api/clubs/' + slug + '/announcements')
        if (res.ok) {
          const data = await res.json()
          const ann = data.announcements?.[0]
          if (ann) { title=ann.title||title; body=(ann.body||body).slice(0,120) }
        }
      }
    } catch (_) {}
    await self.registration.showNotification(title, { body, icon:'/favicon.svg', badge:'/favicon.svg', vibrate:[200,100,200], data:{url}, actions:[{action:'open',title:'Open'}] })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      const existing = list.find(c => c.url.includes(url))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
