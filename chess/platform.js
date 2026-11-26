/* «شطرنج أندلس» inside the Andalus platform: the app's data, people and files go through the platform's own
   protected server (/api), in the chess/… section. Sign-in is the platform's: admins → full control,
   staff with an assigned tournament role → that role, everyone else → public view. */
(function(){
  const LS = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
  let UID = LS.get("andalusUid");
  if(!UID || !/^[a-z0-9]{16,64}$/.test(UID)){ UID = Array.from(crypto.getRandomValues(new Uint8Array(16)), b=>b.toString(16).padStart(2,"0")).join(""); LS.set("andalusUid", UID); }
  const TOKEN = LS.get("andalusTok") || "", ROLE = LS.get("andalusRole") || "";
  const tokBody = (() => { try{ const p = TOKEN.split(".")[0].replace(/-/g,"+").replace(/_/g,"/"); return JSON.parse(decodeURIComponent(escape(atob(p + "===".slice((p.length+3)%4))))); }catch(e){ return null; } })();
  const isAdmin = !!TOKEN && ROLE === "admin" && tokBody && tokBody.exp > Date.now();
  const PID = (tokBody && tokBody.exp > Date.now() && tokBody.id) || "";
  const myName = () => { try{ const s = JSON.parse(LS.get("acct") || sessionStorage.getItem("acct") || "null"); const p = s && (s.profiles||[])[0]; if(p && p.name) return p.name; }catch(e){} return LS.get("andalusName") || ""; };
  const PRE = "chess/t/";
  const full = p => PRE + String(p).replace(/^\/+|\/+$/g, "");
  const strip = p => String(p).startsWith(PRE) ? String(p).slice(PRE.length) : String(p);
  const headers = () => Object.assign({ "Content-Type":"application/json", "X-Uid": UID }, TOKEN ? { "Authorization":"Bearer "+TOKEN } : {});
  const err = (code, msg) => Object.assign(new Error(msg||code), { code });
  async function api(path, body){
    let r; try{ r = await fetch(path, { method:"POST", headers: headers(), body: JSON.stringify(body||{}) }); }catch(e){ throw err("unavailable"); }
    let j = null; try{ j = await r.json(); }catch(e){}
    if(r.status === 403) throw err("invalid_argument", "permission");
    if(!r.ok) throw err(r.status >= 500 ? "unavailable" : "invalid_argument", (j&&j.error)||("HTTP "+r.status));
    return j;
  }
  /* batch reads made at the same moment into one request */
  let pend = null;
  function queue(kind, key){ if(!pend){ pend = { docs:new Map(), cols:new Map() }; setTimeout(flush, 0); }
    const m = pend[kind]; return new Promise((res, rej) => { if(!m.has(key)) m.set(key, []); m.get(key).push({res, rej}); }); }
  async function flush(){ const p = pend; pend = null;
    try{ const out = await api("/api/q", { docs:[...p.docs.keys()], cols:[...p.cols.keys()] }); const den = new Set(out.denied||[]);
      p.docs.forEach((ws,k)=>ws.forEach(w=>den.has(k)?w.rej(err("invalid_argument","permission")):w.res(out.docs[k]===undefined?null:out.docs[k])));
      p.cols.forEach((ws,k)=>ws.forEach(w=>den.has(k)?w.rej(err("invalid_argument","permission")):w.res(out.cols[k]||[]))); }
    catch(e){ p.docs.forEach(ws=>ws.forEach(w=>w.rej(e))); p.cols.forEach(ws=>ws.forEach(w=>w.rej(e))); } }
  /* live updates: one shared timer, only real changes reach the app, paused while hidden */
  const listeners = new Set();
  const notify = () => setTimeout(() => listeners.forEach(fn => { try{ fn(); }catch(e){} }), 0);
  setInterval(() => { if(document.visibilityState === "visible") notify(); }, 8000);
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") notify(); });
  const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
  const META = { fromCache:false, hasPendingWrites:false };
  const docSnap = (path, data) => { const id = String(path).split("/").pop(); return { exists: data != null, id, ref:{ id, path: strip(path) }, metadata: META, data: () => clone(data == null ? undefined : data) }; };
  const qSnap = rows => { const docs = rows.map(x => docSnap(x.id, x.data)); return { docs, size: docs.length, empty: !docs.length, metadata: META, forEach: fn => docs.forEach(fn) }; };
  function live(get, cb, errCb){ let on = true, last, got = false, failed = false;
    const stop = () => { on = false; listeners.delete(run); };
    const run = async () => { if(!on) return; try{ const s = await get(); const sig = JSON.stringify(s.docs ? s.docs.map(d=>[d.id,d.data()]) : [s.exists, s.data()]); got = true; if(sig !== last){ last = sig; if(on) cb(s); } }
      catch(e){ if(!on) return; if(e.code === "invalid_argument"){ stop(); if(errCb) errCb(e); return; } if(!got && !failed){ failed = true; if(errCb) errCb(e); } } };
    run(); listeners.add(run); return stop; }
  const applyPatch = (base, patch) => { const o = clone(base||{}); Object.entries(patch||{}).forEach(([k,v]) => { if(k.includes(".")){ const ks = k.split("."); let c = o; ks.slice(0,-1).forEach(x => { c[x] = c[x] || {}; c = c[x]; }); c[ks[ks.length-1]] = v; } else o[k] = v; }); return o; };
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,10);
  function docRef(path){ const id = full(path);
    const get = async () => docSnap(id, await queue("docs", id));
    const set = async (data, o) => { let v = data; if(o && o.merge){ const cur = await queue("docs", id).catch(() => null); v = Object.assign({}, cur||{}, data); } await api("/api/w", { op:"set", id, data: clone(v) }); notify(); };
    return { id: id.split("/").pop(), path: strip(id), get, set,
      update: async patch => { const cur = await queue("docs", id); if(cur == null) throw err("not_found"); await set(applyPatch(cur, patch)); },
      delete: async () => { await api("/api/w", { op:"delete", id }); notify(); },
      collection: sub => colQuery(strip(id) + "/" + sub),
      onSnapshot: (cb, e) => live(get, cb, e) }; }
  function colQuery(path, F, lim, ord){ F = F || []; const col = full(path);
    const cmp = (a, op, v) => op==="=="?a===v:op==="!="?a!==v:op==="<"?a<v:op==="<="?a<=v:op===">"?a>v:op===">="?a>=v:op==="in"?(v||[]).includes(a):op==="array-contains"?Array.isArray(a)&&a.includes(v):true;
    const get = async () => { let rows = await queue("cols", col); F.forEach(([f,op,v]) => { rows = rows.filter(x => x.data && cmp(x.data[f], op, v)); });
      if(ord){ const [f, d] = ord; rows = rows.slice().sort((a,b) => { const x = a.data&&a.data[f], y = b.data&&b.data[f]; return (x>y?1:x<y?-1:0)*(d==="desc"?-1:1); }); }
      if(lim) rows = rows.slice(0, lim); return qSnap(rows); };
    return { id: col.split("/").pop(), path: strip(col), get,
      doc: id => docRef(strip(col) + "/" + (id || newId())),
      add: async data => { const r = docRef(strip(col) + "/" + newId()); await r.set(data); return r; },
      where: (f, op, v) => colQuery(path, [...F, [f, op, v]], lim, ord),
      orderBy: (f, d) => colQuery(path, F, lim, [f, d]),
      limit: n => colQuery(path, F, n, ord),
      onSnapshot: (cb, e) => live(get, cb, e) }; }
  const db = { doc: docRef, collection: p => colQuery(p) };

  /* people: platform admins = system owner; staff get the tournament role you assign them */
  let roleP = null;
  const hasRole = () => roleP || (roleP = (async () => { if(!PID || isAdmin) return false; try{ const d = await queue("docs", full("roles/" + PID)); return !!(d && d.role); }catch(e){ return false; } })());
  let peopleP = null;
  const people = () => peopleP || (peopleP = api("/api/people", {}).then(j => j.people || []).catch(() => []));
  const user = {
    isOwner: async () => isAdmin,
    canEdit: async () => isAdmin || await hasRole(),
    can: async () => !!PID,
    id: async () => isAdmin ? (PID || "adm_root") : (PID || UID),
    me: async () => ({ id: PID || UID, name: myName() }),
    profiles: async ids => { const L = await people(); const o = {}; (ids||[]).forEach(id => { const p = L.find(x => x.id === id); if(p) o[id] = { name: p.name }; else if(id === PID) o[id] = { name: myName() }; }); return o; },
    search: async q => { const L = await people(); const s = String(q||"").trim(); return L.filter(p => !s || p.name.includes(s)).map(p => ({ id: p.id, name: p.name })); }
  };
  const assets = {
    upload: async file => { const r = await fetch("/api/upload", { method:"POST", headers: Object.assign({ "X-Uid": UID, "Content-Type": file.type || "application/octet-stream" }, TOKEN ? { "Authorization":"Bearer "+TOKEN } : {}), body: file });
      const j = await r.json().catch(() => ({})); if(!r.ok) throw err(r.status === 403 ? "invalid_argument" : "unavailable", j.error); return { id: j.id, url: j.url, name: file.name, type: file.type, size: file.size }; },
    delete: async () => true
  };
  const downloads = { save: async ({ filename, data }) => { const a = document.createElement("a"); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); return { ok:true }; } };

  /* one-time move of the tournament's data from its old place (runs once, for a platform admin, only if empty) */
  const SEED = [["tournament/main", {"bf": "Amiri", "cats": [{"id": "1", "name": "الطلاب"}, {"id": "2", "name": "الرجال"}, {"id": "3", "name": "النساء"}], "date": "", "fs": 16, "hf": "Amiri", "maxRounds": 5, "name": "بطولة شطرنج أندلس", "phone": "", "players": [], "rounds": {"1": [], "2": [], "3": []}, "school": "مدارس الأندلس الأهلية – فرع الزهراء", "seq": 1, "tc": "10 دقائق لكل لاعب", "wa": ""}], ["settings/main", {"hf": "Reem Kufi", "prizes": {"1": 700, "2": 500, "3": 300}}], ["audit/5zsb16ax63zxexa7pqr6", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:30:41.018Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/93iw0y4tcfydcnwts7du", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:25:57.979Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/966ak5848br5zrqfxb1y", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:26:13.334Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/gd0jczq3k1vpmk19ve4p", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:26:41.381Z", "before": null, "info": "", "target": "hf", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/gtixkshqbnasuygn2vim", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:30:51.737Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/i5d8dxjfq0mup0jqzunr", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:30:02.397Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/kwue87lqlam4mjdt3co3", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:26:35.786Z", "before": null, "info": "", "target": "hf", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/pj53uwihcev558kdl8lw", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:30:05.976Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/tpwe0sgxk8mijv7cuhfx", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:25:55.579Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}], ["audit/wqjqibpjcdiplp3uj02d", {"act": "تعديل الإعدادات", "after": null, "at": "2026-11-26T10:30:44.697Z", "before": null, "info": "", "target": "prizes", "uid": "u_Gdzep8MBh6NrQKFznEdpvg"}]];
  if(isAdmin) setTimeout(async () => { try{ const cur = await queue("docs", full("settings/main")); if(cur != null) return;
    await api("/api/import", { docs: SEED.map(([p, d]) => ({ id: full(p), data: d })) }); notify(); }catch(e){} }, 1500);
  window.claude = { use: async n => ({ db, user, assets, downloads }[n] || null) };

  /* a way back to the platform, and to sign in for staff */
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.style.cssText = "position:fixed;bottom:12px;left:12px;z-index:50;display:flex;gap:6px;font:600 13px system-ui,sans-serif;direction:rtl";
    const a = (href, t) => `<a href="${href}" style="background:#fff;color:#17347E;border:1px solid #d5dbe8;border-radius:999px;padding:6px 12px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.08)">${t}</a>`;
    b.innerHTML = a("/", "🏠 المنصة") + (TOKEN ? "" : a("/#login", "دخول المنظّمين"));
    document.body.appendChild(b);
  });
})();
