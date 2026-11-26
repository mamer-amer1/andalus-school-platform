// Andalus School Platform – Cloudflare Worker (API + protection layer)
// Static files come from ./dist; this Worker answers /api/* and /_blob/*.
// Secrets (Cloudflare → Settings → Variables and Secrets): SUPABASE_SECRET, ADMIN_PASSWORD, STAFF_PASSWORD
// Plain var (wrangler.jsonc): SUPABASE_URL

const RULES = [["", "view", "admin"], ["students", "admin", "admin"], ["requests", "admin", "admin"], ["achievements", "admin", "admin"], ["outbox", "admin", "admin"], ["templates", "admin", "admin"], ["secure", "admin", "admin"], ["registrations", "admin", "admin"], ["registrations/{self}", "interact", "interact"], ["practice", "admin", "admin"], ["practice/{self}", "interact", "interact"], ["qzp", "admin", "admin"], ["qzp/{self}", "interact", "interact"], ["roomplay", "view", "admin"], ["roomplay/{self}", "interact", "interact"], ["wpsec", "admin", "admin"], ["wplog", "admin", "admin"], ["wpt", "interact", "admin"], ["wpt/{self}", "interact", "interact"], ["wpsub", "admin", "admin"], ["wpsubcfg", "admin", "admin"], ["wpswap", "admin", "admin"], ["rwpsec", "admin", "admin"], ["rwplog", "admin", "admin"], ["rwpt", "interact", "admin"], ["rwpt/{self}", "interact", "interact"], ["rwpsub", "admin", "admin"], ["rwpsubcfg", "admin", "admin"], ["rwpswap", "admin", "admin"], ["accts", "admin", "admin"], ["acctreq", "admin", "admin"], ["acctreq/{self}", "interact", "interact"], ["commap", "interact", "interact"], ["plans", "view", "interact"], ["pln", "view", "interact"], ["pcfg", "view", "admin"], ["usage", "admin", "admin"], ["usage/{self}", "interact", "interact"], ["calendar", "view", "interact"], ["exams", "view", "interact"], ["rltt", "view", "interact"], ["rllinks", "view", "interact"], ["rlcfg", "view", "interact"], ["rllog", "interact", "interact"], ["rlatt", "admin", "admin"], ["rlatt/{self}", "interact", "interact"], ["gax", "admin", "admin"], ["gar", "admin", "admin"], ["gastu", "admin", "admin"], ["gaplan", "admin", "admin"], ["gacfg", "admin", "admin"], ["gat", "view", "admin"], ["gap", "view", "admin"], ["gaprog", "admin", "admin"], ["gaprog/{self}", "interact", "interact"], ["gaent", "admin", "admin"], ["gaent/{self}", "interact", "interact"], ["ttarch", "admin", "admin"], ["ttlog", "admin", "admin"]];
const LV = { view: 0, interact: 1, admin: 2 };
/* «شطرنج أندلس» lives under chess/… with the rules it had on Claude ("owner" → platform admin). */
const CHESS_RULES = [["", "view", "admin"], ["private", "admin", "admin"], ["members", "admin", "admin"], ["finance", "admin", "admin"], ["roles", "admin", "admin"], ["backups", "admin", "admin"], ["audit", "interact", "admin"], ["incidents", "interact", "admin"], ["requests", "admin", "admin"], ["survey", "admin", "admin"]];
RULES.push(...CHESS_RULES.map(([p, r, w]) => [p ? "chess/t/" + p : "chess", r, w]));
/* each visitor may send and follow their own registration request / survey answer */
RULES.push(["chess/t/requests/{self}", "view", "view"], ["chess/t/survey/{self}", "view", "view"]);
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
  return { level: LV[role], uid, sup: !!(t && t.r === "sup"), pid: (t && t.id) || "" };
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
async function chessLevel(env, u) {
  if (u.chessLv !== undefined) return u.chessLv;
  u.chessLv = u.level;
  if (u.level < LV.admin && u.pid) { const r = await getDoc(env, "chess/t/roles/" + u.pid).catch(() => null); if (r && r.role) u.chessLv = LV.admin; }
  return u.chessLv;
}
async function forChess(env, path, u) { if (segs(path)[0] !== "chess") return u; const lv = await chessLevel(env, u); return { ...u, level: lv, uid: u.pid || u.uid }; }
function canRead(path, u) {
  const pv = privateUserPath(path, u.uid); if (pv) return pv === "own";
  const r = ruleFor(path, u.uid);
  if (u.sup && SUP_READ.includes(top(path))) return true;
  const sg = segs(path); if (sg[0] === "chess" && sg[2] === "roles" && sg.length === 4 && u.pid && sg[3] === u.pid) return true;
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

  const uc = docIds.concat(cols).some(p => segs(p)[0] === "chess") ? await forChess(env, "chess", u) : u;
  const rd = p => canRead(p, segs(p)[0] === "chess" ? uc : u);
  const uidOf = p => (segs(p)[0] === "chess" ? uc : u).uid;
  const readable = docIds.filter(id => rd(id));
  docIds.filter(id => !readable.includes(id)).forEach(id => res.denied.push(id));
  if (readable.length) {
    const rows = await sbRows(env, "id", readable, "id,data");
    readable.forEach(id => res.docs[id] = null);
    rows.forEach(r => res.docs[r.id] = r.data);
  }

  const fullCols = [], selfCols = [];
  for (const c of cols) {
    if (rd(c)) fullCols.push(c);
    else if (uidOf(c) && rd(c + "/" + uidOf(c))) selfCols.push(c);
    else res.denied.push(c);
  }
  if (fullCols.length) {
    const rows = await sbRows(env, "col", fullCols, "id,col,data");
    fullCols.forEach(c => res.cols[c] = []);
    rows.forEach(r => { if (rd(r.id)) res.cols[r.col].push({ id: r.id, data: r.data }); });
  }
  if (selfCols.length) {
    const ids = selfCols.map(c => c + "/" + uidOf(c));
    const rows = await sbRows(env, "id", ids, "id,col,data");
    selfCols.forEach(c => res.cols[c] = []);
    rows.forEach(r => res.cols[r.col] && res.cols[r.col].push({ id: r.id, data: r.data }));
  }
  /* chess: visitors never see other participants' payment state */
  if (uc.level < LV.admin) {
    const isP = id => String(id).startsWith(CH + "players/");
    const has = Object.keys(res.docs).some(isP) || Object.values(res.cols).some(L => L.some(x => isP(x.id)));
    if (has) {
      const own = new Set((await sbRows(env, "col", [CH + "private"], "id,data")).filter(r => uc.uid && (r.data || {}).by === uc.uid).map(r => r.id.split("/").pop()));
      const red = (id, d) => { if (!d || own.has(String(id).split("/").pop())) return d; const o = { ...d }; delete o.paid; if (o.status === "await" || o.status === "paid") o.status = "new"; return o; };
      Object.keys(res.docs).forEach(id => { if (isP(id)) res.docs[id] = red(id, res.docs[id]); });
      Object.values(res.cols).forEach(L => L.forEach(x => { if (isP(x.id)) x.data = red(x.id, x.data); }));
    }
  }
  return json(res);
}

async function handleWrite(req, env) {
  const u = await who(req, env);
  const b = await req.json().catch(() => null);
  if (!b) return bad("bad body");
  const id = cleanPath(b.id);
  if (!id || segs(id).length % 2 !== 0) return bad("bad id");
  if (/^chess\/t\/roles(\/|$)/.test(id) && u.level < LV.admin) return bad("forbidden", 403);
  if (!canWrite(id, await forChess(env, id, u))) return bad("forbidden", 403);
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
    const token = await makeToken(env, { r: "admin", n: name, id: hash ? "adm_" + hash.slice(0, 20) : "adm_root", exp: Date.now() + 7 * 864e5 });
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
  const pid = "a_" + (await sha256hex("pid|" + intlPhone(b.phone || ""))).slice(0, 24);
  const token = await makeToken(env, { r, n: name, id: pid, exp: Date.now() + 30 * 864e5 });
  return json({ token, role: r, name });
}

async function handlePeople(req, env) {
  const u = await forChess(env, "chess", await who(req, env));
  if (u.level < LV.admin) return bad("forbidden", 403);
  const rows = await sbRows(env, "col", ["accts"], "id,data");
  const out = [];
  for (const r of rows) { const a = r.data || {}; if (a.status !== "active" || !STAFF_ROLES.includes(a.role) || !a.phone) continue;
    out.push({ id: "a_" + (await sha256hex("pid|" + intlPhone(a.phone))).slice(0, 24), name: a.name || "", role: a.role }); }
  return json({ people: out });
}


/* ---------- chess: public self-registration (creates the player directly, with a number) ---------- */
const CH = "chess/t/";
function chessNorm(v) { let d = String(v || "").replace(/[٠-٩]/g, c => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g, ""); if (d.startsWith("00966")) d = d.slice(5); if (d.startsWith("966")) d = d.slice(3); if (d.length === 9 && d[0] === "5") d = "0" + d; return d; }
const chessRid = n => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return [...crypto.getRandomValues(new Uint8Array(n))].map(x => c[x % c.length]).join(""); };
async function handleChessRegister(req, env) {
  const u = await who(req, env);
  const b = await req.json().catch(() => null);
  if (!b) return bad("bad body");
  const S = (await getDoc(env, CH + "settings/main")) || {};
  if (S.regOpen === false) return bad("closed", 403);
  const TYPES = { student: "1", father: "2", mother: "3" };
  const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 80), type = String(b.type || ""), phone = chessNorm(b.phone);
  if (name.length < 3) return bad("name");
  if (!TYPES[type]) return bad("type");
  if (!/^05\d{8}$/.test(phone)) return bad("phone");
  if (!b.terms) return bad("terms");
  if (type === "student" && !b.parent) return bad("parent");
  const players = await sbRows(env, "col", [CH + "players"], "id,data");
  const privs = await sbRows(env, "col", [CH + "private"], "id,data");
  const pmap = new Map(players.map(r => [r.id.split("/").pop(), r.data || {}]));
  const dup = privs.find(r => { const id = r.id.split("/").pop(), p = pmap.get(id), q = r.data || {}; return p && chessNorm(q.phone) === phone && String(p.name).trim() === name && !["cancelled", "rejected"].includes(p.status); });
  if (dup) { const p = pmap.get(dup.id.split("/").pop()); return json({ error: "dup", no: p.no, id: dup.id.split("/").pop(), name: p.name, cat: p.cat, status: p.status }, 409); }
  const uid = u.pid || u.uid || "";
  if (uid && privs.filter(r => (r.data || {}).by === uid && Date.now() - Date.parse((r.data || {}).at || 0) < 864e5).length >= 8) return bad("too_many", 429);
  const members = await sbRows(env, "col", [CH + "members"], "id,data");
  const m = members.find(r => chessNorm((r.data || {}).phone) === phone && String((r.data || {}).name).trim() === name);
  const mk = m ? m.id.split("/").pop() : "m" + chessRid(8);
  const no = players.reduce((x, r) => Math.max(x, +((r.data || {}).no) || 0), 0) + 1;
  const id = "p" + Date.now().toString(36) + chessRid(3), at = new Date().toISOString(), season = String(S.season || "2026"), cat = TYPES[type];
  const pub = { no, name, cat, type, level: "beg", rating: 0, status: "new", paid: false, withdrawn: false, duo: "", mk, att: {}, season, createdAt: at };
  const partner = String(b.partner || "").trim().slice(0, 20);
  let photo = "";
  if (b.photo64) { const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.photo64));
    if (!m || m[2].length > 400000) return bad("photo");
    photo = "ph" + [...crypto.getRandomValues(new Uint8Array(12))].map(x => x.toString(16).padStart(2, "0")).join("");
    await putAsset(env, photo, "image/" + m[1], m[2]); }
  const pv = { phone, grade: String(b.grade || "").slice(0, 40), branch: String(S.school || ""), terms: true, parent: !!b.parent, photo: !!b.photo, wantsDuo: !!partner || !!b.duo, partner, photo, payMethod: "cash", payAmount: 0, linkCode: chessRid(6), notes: "", source: "التسجيل الإلكتروني", by: uid, at, history: [{ at, text: "تسجيل إلكتروني من ولي الأمر/المشارك" }] };
  const rows = [
    { id: CH + "players/" + id, col: CH + "players", data: pub, updated_at: at },
    { id: CH + "private/" + id, col: CH + "private", data: pv, updated_at: at },
    { id: CH + "audit/" + "r" + Date.now().toString(36) + chessRid(4), col: CH + "audit", data: { act: "تسجيل مشارك", target: "AND" + season.slice(-2) + "-" + String(no).padStart(3, "0"), info: name + " — تسجيل إلكتروني", at, uid }, updated_at: at }
  ];
  if (!m) rows.push({ id: CH + "members/" + mk, col: CH + "members", data: { name, phone, first: season }, updated_at: at });
  await upsert(env, rows);
  return json({ ok: true, id, no, name, cat, type, status: "new", season, photo });
}


/* chess: a participant finds their own card again with registration number + phone */
async function handleChessCard(req, env) {
  const b = await req.json().catch(() => null); if (!b) return bad("bad body");
  const no = +String(b.no || "").split("-").pop().replace(/\D/g, ""), phone = chessNorm(b.phone);
  if (!no || !/^05\d{8}$/.test(phone)) return bad("input");
  const players = await sbRows(env, "col", [CH + "players"], "id,data");
  const hit = players.find(r => +((r.data || {}).no) === no); if (!hit) return bad("not_found", 404);
  const id = hit.id.split("/").pop(); const q = (await getDoc(env, CH + "private/" + id)) || {};
  if (chessNorm(q.phone) !== phone) return bad("not_found", 404);
  const p = hit.data || {};
  return json({ ok: true, id, no: p.no, name: p.name, cat: p.cat, type: p.type, status: p.status, paid: !!p.paid, season: p.season, photo: q.photo || "" });
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
  const u0 = await who(req, env); const u = await forChess(env, "chess", u0);
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
        if (p === "/api/people") return await handlePeople(req, env);
        if (p === "/api/chess/register") return await handleChessRegister(req, env);
        if (p === "/api/chess/card") return await handleChessCard(req, env);
        if (p === "/api/upload") return await handleUpload(req, env);
        return bad("not found", 404);
      }
      return env.ASSETS.fetch(req);
    } catch (e) {
      return bad(String(e && e.message || e).slice(0, 300), 500);
    }
  }
};
