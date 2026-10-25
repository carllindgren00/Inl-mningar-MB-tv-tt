// MB Inlämning – hämtar alltid senaste versionen när det finns nät,
// och använder den sparade kopian bara när nätet saknas.
const CACHE="mb-inlamning-v31";
const SHELL=["./","index.html","config.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png","logo.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  const own=u.origin===location.origin;
  const lib=u.host==="cdn.jsdelivr.net"||u.host.endsWith("googleapis.com")||u.host.endsWith("gstatic.com");
  if(!own&&!lib)return; // Supabase-anrop går alltid direkt till nätet
  if(own){
    // Nätet först (ingen webbläsarcache), sparad kopia om nätet saknas
    e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
      if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}
      return r;
    }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(h=>h||caches.match("index.html"))));
    return;
  }
  // Bibliotek och typsnitt ändras aldrig: sparad kopia först
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request);
    if(hit)return hit;
    const r=await fetch(e.request); if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone()); return r;
  }));
});
