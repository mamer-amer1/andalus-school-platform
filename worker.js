// Andalus School Platform – Cloudflare Worker (API + protection layer)
// Static files come from ./dist; this Worker answers /api/* and /_blob/*.
// Secrets (Cloudflare → Settings → Variables and Secrets): SUPABASE_SECRET, ADMIN_PASSWORD, STAFF_PASSWORD
// Plain var (wrangler.jsonc): SUPABASE_URL

const RULES = [["", "view", "admin"], ["students", "admin", "admin"], ["requests", "admin", "admin"], ["achievements", "admin", "admin"], ["outbox", "admin", "admin"], ["templates", "admin", "admin"], ["secure", "admin", "admin"], ["registrations", "admin", "admin"], ["registrations/{self}", "interact", "interact"], ["practice", "admin", "admin"], ["practice/{self}", "interact", "interact"], ["qzp", "admin", "admin"], ["qzp/{self}", "interact", "interact"], ["roomplay", "view", "admin"], ["roomplay/{self}", "interact", "interact"], ["wpsec", "admin", "admin"], ["wplog", "admin", "admin"], ["wpt", "interact", "admin"], ["wpt/{self}", "interact", "interact"], ["wpsub", "admin", "admin"], ["wpsubcfg", "admin", "admin"], ["wpswap", "admin", "admin"], ["rwpsec", "admin", "admin"], ["rwplog", "admin", "admin"], ["rwpt", "interact", "admin"], ["rwpt/{self}", "interact", "interact"], ["rwpsub", "admin", "admin"], ["rwpsubcfg", "admin", "admin"], ["rwpswap", "admin", "admin"], ["accts", "admin", "admin"], ["acctreq", "admin", "admin"], ["acctreq/{self}", "interact", "interact"], ["commap", "interact", "interact"], ["plans", "view", "interact"], ["pln", "view", "interact"], ["pcfg", "view", "admin"], ["usage", "admin", "admin"], ["usage/{self}", "interact", "interact"], ["calendar", "view", "interact"], ["exams", "view", "interact"], ["rltt", "view", "interact"], ["rllinks", "view", "interact"], ["rlcfg", "view", "interact"], ["rllog", "interact", "interact"], ["rlatt", "admin", "admin"], ["rlatt/{self}", "interact", "interact"], ["gax", "admin", "admin"], ["gar", "admin", "admin"], ["gastu", "admin", "admin"], ["gaplan", "admin", "admin"], ["gacfg", "admin", "admin"], ["gat", "view", "admin"], ["gap", "view", "admin"], ["gaprog", "admin", "admin"], ["gaprog/{self}", "interact", "interact"], ["gaent", "admin", "admin"], ["gaent/{self}", "interact", "interact"], ["ttarch", "admin", "admin"], ["ttlog", "admin", "admin"]];
const LV = { view: 0, interact: 1, admin: 2 };
const enc = new TextEncoder();

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const bad = (msg, status = 400) => json({ error: msg }, status);

function normDigits(s) {
  return String(s || "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
}
function intlPhone(p) {
  let d = normDigits(p).replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05")) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return d;
}
async function sha256hex(s) {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function b64url(buf) {
  let s = ""; const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
async function hmacKey(env) {
  return crypto.subtle.importKey("raw", enc.encode("andalus-token|" + env.SUPABASE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeToken(env, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(body));
  return body + "." + b64url(sig);
}
async function readToken(env, tok) {
  if (!tok || tok.indexOf(".") < 0) return null;
  const [body, sig] = tok.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(env), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch (e) { return null; }
}
function sameSecret(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------- who is calling ----------
async function who(req, env) {
  const auth = req.headers.get("authorization") || "";
  const t = await readToken(env, auth.startsWith("Bearer ") ? auth.slice(7) : "");
  let uid = req.headers.get("x-uid") || "";
  if (!/^[a-z0-9]{16,64}$/.test(uid)) uid = "";
  const role = t && t.r === "admin" ? "admin" : t && (t.r === "staff" || t.r === "sup") ? "interact" : "view";
  return { level: LV[role], uid, sup: !!(t && t.r === "sup") };
}

// ---------- access rules (same rules the platform used on Claude) ----------
const segs = p => String(p).replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
function cleanPath(p) {
  const s = segs(p);
  if (!s.length || s.some(x => x === "." || x === ".." || x.length > 200)) return null;
  return s.join("/");
}
function ruleFor(path, uid) {
  const s = segs(path); let best = null, bestLen = -1, self = false;
  for (const [pat, read, write] of RULES) {
    const ps = pat ? pat.split("/") : [];
    if (ps.length > s.length) continue;
    let ok = true, usesSelf = false;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i] === "{self}") { if (!uid || s[i] !== uid) { ok = false; break; } usesSelf = true; }
      else if (ps[i] !== s[i]) { ok = false; break; }
    }
    if (ok && ps.length > bestLen) { best = [read, write]; bestLen = ps.length; self = usesSelf; }
  }
  return { read: LV[best[0]], write: LV[best[1]], self };
}
function privateUserPath(path, uid) {
  const s = segs(path);
  if (s[0] === "data" && s[1] === "users") return s.length >= 3 && !!uid && s[2] === uid ? "own" : "deny";
  return null;
}
// Supervisors (unified accounts with a lead role) review weekly plans: they may also update these.
const SUP_WRITE = ["wpweeks", "rwpweeks", "wplog", "rwplog", "wpt", "rwpt"];
const SUP_READ = ["wplog", "rwplog"];
// Own entries that only signed-in staff may create (teacher plans, grade entry, attendance).
const STAFF_SELF = ["wpt", "rwpt", "gaent", "gaprog", "rlatt"];
const top = p => segs(p)[0] || "";
function canRead(path, u) {
  const pv = privateUserPath(path, u.uid); if (pv) return pv === "own";
  const r = ruleFor(path, u.uid);
  if (u.sup && SUP_READ.includes(top(path))) return true;
  return r.self ? true : u.level >= r.read;            // a visitor may always read their own {self} entry
}
function canWrite(path, u) {
  const pv = privateUserPath(path, u.uid); if (pv) return pv === "own";
  const r = ruleFor(path, u.uid);
  if (u.sup && SUP_WRITE.includes(top(path))) return true;
  if (r.self) return STAFF_SELF.includes(top(path)) ? u.level >= LV.interact : true;
  return u.level >= r.write;
}

// ---------- Supabase ----------
function sb(env, path, init = {}) {
  const h = { apikey: env.SUPABASE_SECRET, "content-type": "application/json", ...(init.headers || {}) };
  return fetch(env.SUPABASE_URL.replace(/\/+$/, "") + path, { ...init, headers: h });
}
const quoteIn = arr => "(" + arr.map(v => '"' + String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + ")";
async function sbRows(env, field, values, select) {
  const out = [];
  for (let i = 0; i < values.length; i += 60) {
    const part = values.slice(i, i + 60);
    const r = await sb(env, `/rest/v1/app_docs?select=${select}&${field}=in.${encodeURIComponent(quoteIn(part))}`);
    if (!r.ok) throw new Error("db " + r.status + " " + (await r.text()).slice(0, 200));
    out.push(...(await r.json()));
  }
  return out;
}
async function getDoc(env, id) {
  const rows = await sbRows(env, "id", [id], "id,data");
  return rows[0] ? rows[0].data : null;
}
async function upsert(env, rows) {
  const r = await sb(env, "/rest/v1/app_docs", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows)
  });
  if (!r.ok) throw new Error("db " + r.status + " " + (await r.text()).slice(0, 200));
}

// ---------- handlers ----------
async function handleQuery(req, env) {
  const u = await who(req, env);
  const body = await req.json().catch(() => ({}));
  const docIds = [...new Set((body.docs || []).map(cleanPath).filter(Boolean))].slice(0, 400);
  const cols = [...new Set((body.cols || []).map(cleanPath).filter(Boolean))].slice(0, 200);
  const res = { docs: {}, cols: {}, denied: [] };

  const readable = docIds.filter(id => canRead(id, u));
  docIds.filter(id => !readable.includes(id)).forEach(id => res.denied.push(id));
  if (readable.length) {
    const rows = await sbRows(env, "id", readable, "id,data");
    readable.forEach(id => res.docs[id] = null);
    rows.forEach(r => res.docs[r.id] = r.data);
  }

  const fullCols = [], selfCols = [];
  for (const c of cols) {
    if (canRead(c, u)) fullCols.push(c);
    else if (u.uid && canRead(c + "/" + u.uid, u)) selfCols.push(c);
    else res.denied.push(c);
  }
  if (fullCols.length) {
    const rows = await sbRows(env, "col", fullCols, "id,col,data");
    fullCols.forEach(c => res.cols[c] = []);
    rows.forEach(r => { if (canRead(r.id, u)) res.cols[r.col].push({ id: r.id, data: r.data }); });
  }
  if (selfCols.length) {
    const ids = selfCols.map(c => c + "/" + u.uid);
    const rows = await sbRows(env, "id", ids, "id,col,data");
    selfCols.forEach(c => res.cols[c] = []);
    rows.forEach(r => res.cols[r.col] && res.cols[r.col].push({ id: r.id, data: r.data }));
  }
  return json(res);
}

async function handleWrite(req, env) {
  const u = await who(req, env);
  const b = await req.json().catch(() => null);
  if (!b) return bad("bad body");
  const id = cleanPath(b.id);
  if (!id || segs(id).length % 2 !== 0) return bad("bad id");
  if (!canWrite(id, u)) return bad("forbidden", 403);
  const col = segs(id).slice(0, -1).join("/");
  if (b.op === "delete") {
    const r = await sb(env, `/rest/v1/app_docs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) return bad("db " + r.status, 502);
    return json({ ok: true });
  }
  const data = b.data;
  if (data === undefined || JSON.stringify(data).length > 2_000_000) return bad("too large");
  await upsert(env, [{ id, col, data, updated_at: new Date().toISOString() }]);
  return json({ ok: true });
}

async function handleLogin(req, env) {
  const b = await req.json().catch(() => ({}));
  const pw = normDigits(b.password || "").trim();
  await new Promise(r => setTimeout(r, 400));             // slows down password guessing
  if (env.ADMIN_PASSWORD && sameSecret(pw, env.ADMIN_PASSWORD)) {
    const auth = await getDoc(env, "secure/auth");
    const users = auth && auth.kind === "phone" && Array.isArray(auth.users) ? auth.users : [];
    let hash = null, name = "إدارة المدرسة";
    if (users.length) {
      const ph = intlPhone(b.phone || "");
      if (!/^9665\d{8}$/.test(ph)) return bad("phone", 401);
      hash = await sha256hex("ph:" + ph + "|" + ph);
      const hit = users.find(x => x.hash === hash);
      if (!hit) return bad("phone", 401);
      name = hit.name || name;
    }
    const token = await makeToken(env, { r: "admin", n: name, exp: Date.now() + 7 * 864e5 });
    return json({ token, role: "admin", name, hash });
  }
  if (env.STAFF_PASSWORD && sameSecret(pw, env.STAFF_PASSWORD)) {
    const token = await makeToken(env, { r: "staff", n: "staff", exp: Date.now() + 30 * 864e5 });
    return json({ token, role: "staff", name: "المعلمون" });
  }
  return bad("password", 401);
}

// Teachers sign in with the platform's own accounts (phone + personal code).
// The server checks the same account and, for staff roles, issues a staff pass so their saves are accepted.
const STAFF_ROLES = ["teacher", "supervisor", "principal", "deputy", "admin", "coordinator", "staff"];
const LEAD_ROLES = ["supervisor", "deputy", "principal"];
async function handleAcct(req, env) {
  const b = await req.json().catch(() => ({}));
  await new Promise(r => setTimeout(r, 300));
  const code = normDigits(b.code || "").replace(/\s/g, "");
  if (!code) return bad("code", 401);
  let ok = false, name = "", lead = false;
  {
    const ph = intlPhone(b.phone || "");
    if (!/^9665\d{8}$/.test(ph)) return bad("phone", 401);
    const local = "0" + ph.slice(3);
    const rows = await sbRows(env, "col", ["accts"], "id,data");
    const hit = rows.map(r => r.data || {}).find(a =>
      intlPhone(a.phone) === ph && a.status === "active" && STAFF_ROLES.includes(a.role) &&
      [normDigits(a.code || "").trim()].some(c => c && (c === code || (intlPhone(code) === ph && c === local))));
    if (hit) { ok = true; name = hit.name || ""; lead = LEAD_ROLES.includes(hit.role) || LEAD_ROLES.includes(hit.rk); }
  }
  if (!ok) return bad("not staff", 401);
  const r = lead ? "sup" : "staff";
  const token = await makeToken(env, { r, n: name, exp: Date.now() + 30 * 864e5 });
  return json({ token, role: r, name });
}

async function handleImport(req, env) {
  const u = await who(req, env);
  if (u.level < LV.admin) return bad("forbidden", 403);
  const b = await req.json().catch(() => null);
  if (!b) return bad("bad body");
  let n = 0;
  if (Array.isArray(b.docs) && b.docs.length) {
    const rows = [];
    for (const d of b.docs) {
      const id = cleanPath(d.id); if (!id || segs(id).length % 2) continue;
      rows.push({ id, col: segs(id).slice(0, -1).join("/"), data: d.data, updated_at: new Date().toISOString() });
    }
    for (let i = 0; i < rows.length; i += 100) await upsert(env, rows.slice(i, i + 100));
    n = rows.length;
  }
  if (b.asset && /^[a-zA-Z0-9_-]{6,80}$/.test(b.asset.id || "")) {
    await putAsset(env, b.asset.id, b.asset.type || "application/octet-stream", b.asset.b64 || "");
    n++;
  }
  return json({ ok: true, n });
}

// ---------- files (logos, pictures, attachments) ----------
async function putAsset(env, id, type, b64) {
  const r = await sb(env, "/rest/v1/app_assets", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id, type, b64, size: Math.floor(b64.length * 3 / 4) }])
  });
  if (!r.ok) throw new Error("assets " + r.status + " " + (await r.text()).slice(0, 200));
}
async function handleUpload(req, env) {
  const u = await who(req, env);
  if (u.level < LV.admin) return bad("forbidden", 403);
  const buf = await req.arrayBuffer();
  if (buf.byteLength > 15 * 1024 * 1024) return bad("too_large", 413);
  const type = (req.headers.get("content-type") || "application/octet-stream").slice(0, 100);
  const u8 = new Uint8Array(buf); let s = "";
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  const id = [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join("");
  await putAsset(env, id, type, btoa(s));
  return json({ id, url: "/_blob/" + id });
}
async function handleBlob(req, env, ctx, id) {
  if (!/^[a-zA-Z0-9_-]{6,80}$/.test(id)) return new Response("not found", { status: 404 });
  const cache = caches.default;
  const key = new Request(new URL("/_blob/" + id, req.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const r = await sb(env, `/rest/v1/app_assets?select=type,b64&id=eq.${encodeURIComponent(id)}`);
  const rows = r.ok ? await r.json() : [];
  if (!rows[0]) return new Response("not found", { status: 404 });
  const bytes = Uint8Array.from(atob(rows[0].b64), c => c.charCodeAt(0));
  const res = new Response(bytes, { headers: { "content-type": rows[0].type, "cache-control": "public, max-age=31536000, immutable" } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (p.startsWith("/_blob/")) return await handleBlob(req, env, ctx, p.slice(7));
      if (p.startsWith("/api/")) {
        if (!env.SUPABASE_SECRET || !env.SUPABASE_URL) return bad("server not configured: add SUPABASE_SECRET", 500);
        if (req.method !== "POST") return bad("method", 405);
        if (p === "/api/q") return await handleQuery(req, env);
        if (p === "/api/w") return await handleWrite(req, env);
        if (p === "/api/login") return await handleLogin(req, env);
        if (p === "/api/import") return await handleImport(req, env);
        if (p === "/api/acct") return await handleAcct(req, env);
        if (p === "/api/upload") return await handleUpload(req, env);
        return bad("not found", 404);
      }
      return env.ASSETS.fetch(req);
    } catch (e) {
      return bad(String(e && e.message || e).slice(0, 300), 500);
    }
  }
};
