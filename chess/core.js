/* شطرنج أندلس — النواة: البيانات، الصلاحيات، الحسابات المشتركة */
window.A = window.A || {};
{
const A = window.A;
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const digits = v => String(v ?? '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c));
const normPhone = v => { let d = digits(v).replace(/\D/g, ''); if (d.startsWith('00966')) d = d.slice(5); if (d.startsWith('966')) d = d.slice(3); if (d.length === 9 && d[0] === '5') d = '0' + d; return d; };
const validPhone = v => /^05\d{8}$/.test(normPhone(v));
const intl = v => { const d = normPhone(v); return /^05\d{8}$/.test(d) ? '966' + d.slice(1) : ''; };
const money = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US') + ' ر.س';
const pad = (n, l = 3) => String(n).padStart(l, '0');
const now = () => new Date().toISOString();
const fmtDT = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', calendar: 'gregory' }); };
const fmtD = s => { if (!s) return ''; const d = new Date(s + 'T00:00'); return isNaN(d) ? s : d.toLocaleDateString('ar-SA-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', calendar: 'gregory' }); };
const rid = (n = 6) => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); a.forEach(x => s += c[x % c.length]); return s; };

const CATS = ['1', '2', '3'];
const TYPES = { student: 'طالب', father: 'ولي أمر (أب)', mother: 'ولية أمر (أم)' };
const TYPE_CAT = { student: '1', father: '2', mother: '3' };
const LEVELS = { beg: 'مبتدئ', mid: 'متوسط', adv: 'متقدم' };
const REG = { new: 'طلب جديد', await: 'بانتظار السداد', paid: 'مدفوع', approved: 'معتمد', rejected: 'مرفوض', cancelled: 'ملغي' };
const REG_CLS = { new: 'warn', await: 'warn', paid: 'ok', approved: 'ok', rejected: 'bad', cancelled: 'bad' };
const PAYM = { cash: 'نقداً', transfer: 'تحويل بنكي', card: 'شبكة/بطاقة', other: 'أخرى' };
const RES = { '1-0': [1, 0, 1], '0-1': [0, 1, 1], '½-½': [.5, .5, 1], '+-': [1, 0, 0], '-+': [0, 1, 0], '--': [0, 0, 0] };
const RES_LBL = { '1-0': '1-0', '0-1': '0-1', '½-½': '½-½', '+-': '+/- غياب', '-+': '-/+ غياب', '--': 'غياب الطرفين' };
const GST = { pending: 'لم تبدأ', live: 'جارية', done: 'انتهت', await: 'بانتظار الاعتماد', help: 'طلب الحكم الرئيسي' };
const TB = { de: 'المواجهة المباشرة', bhc1: 'بوخهولز بدون أقل نتيجة', bh: 'بوخهولز', wins: 'عدد الانتصارات', sb: 'سونبورن-برجر', rating: 'التصنيف' };
const ROLES = {
  sys: { n: 'مدير النظام', s: ['dash', 'players', 'requests', 'attend', 'rounds', 'ref', 'standings', 'finance', 'prizes', 'reports', 'notify', 'gallery', 'roles', 'settings', 'season', 'audit'] },
  director: { n: 'مدير البطولة', s: ['dash', 'players', 'requests', 'attend', 'rounds', 'ref', 'standings', 'prizes', 'reports', 'notify', 'gallery', 'settings', 'season', 'audit'] },
  registrar: { n: 'مسؤول التسجيل', s: ['dash', 'players', 'requests', 'attend', 'notify', 'reports'] },
  finance: { n: 'المسؤول المالي', s: ['dash', 'players', 'finance', 'reports'] },
  chief: { n: 'الحكم الرئيسي', s: ['dash', 'rounds', 'ref', 'standings', 'attend', 'prizes'] },
  assistant: { n: 'الحكم المساعد', s: ['ref'] },
  women: { n: 'مشرفة فئة النساء', s: ['players', 'attend', 'rounds', 'ref', 'standings'], cat: '3' },
  display: { n: 'مسؤول العرض', s: ['screens'] }
};
const SECTIONS = { dash: 'لوحة المؤشرات', players: 'المشاركون', requests: 'طلبات التسجيل', attend: 'الحضور', rounds: 'الجولات', ref: 'التحكيم والنتائج', standings: 'الترتيب', finance: 'المالية', prizes: 'الجوائز والشهادات', reports: 'التقارير', notify: 'الإشعارات', gallery: 'معرض الصور', roles: 'الصلاحيات والحكام', settings: 'الإعدادات', season: 'المواسم والأرشيف', audit: 'سجل التدقيق', screens: 'الشاشات المباشرة' };

const DEF = {
  name: 'بطولة شطرنج الأندلس', season: '2026', org: 'مدارس الأندلس الأهلية', school: 'مدارس الأندلس الأهلية – فرع الزهراء', club: 'نادي شطرنج الأندلس',
  start: '14:00', end: '15:00', tc: 10, inc: 0, maxRounds: 5, fee: 100, prizes: { 1: 300, 2: 200, 3: 100 },
  cats: { 1: 'الطلاب', 2: 'أولياء الأمور – الرجال', 3: 'أولياء الأمور – النساء' }, sys: { 1: 'auto', 2: 'auto', 3: 'auto' },
  days: [{ date: '', title: 'الافتتاح والجولة الأولى', rounds: '1' }, { date: '', title: 'الجولة الثانية', rounds: '2' }, { date: '', title: 'الجولة الثالثة', rounds: '3' }, { date: '', title: 'الجولتان الرابعة والخامسة', rounds: '4,5' }, { date: '', title: 'الحفل الختامي وإعلان النتائج والتتويج', rounds: '' }],
  tb: ['de', 'bhc1', 'bh', 'wins', 'sb'], target: 60, formUrl: '', surveyUrl: '', phone: '', wa: '', place: 'صالة النشاط – مقر المدرسة',
  tvSec: 15, quotes: ['فكّر.. خطّط.. واربح!', 'كل نقلة قرار، وكل قرار درس', 'الاحترام قبل الفوز', 'البطل يبدأ من المحاولة'],
  hf: 'Reem Kufi', bf: 'IBM Plex Sans Arabic', fs: 16, awards: { sport: '', youngest: '', improved: '', duo: '' }, regOpen: true
};

A.u = { $, esc, digits, normPhone, validPhone, intl, money, pad, now, fmtDT, fmtD, rid };
A.K = { CATS, TYPES, TYPE_CAT, LEVELS, REG, REG_CLS, PAYM, RES, RES_LBL, GST, TB, ROLES, SECTIONS, DEF };

/* ---------- state ---------- */
const D = A.D = { settings: null, players: {}, priv: {}, rounds: {}, subs: {}, finance: {}, roles: {}, audit: [], ann: {}, requests: {}, incidents: {}, gallery: {}, archive: {}, survey: {}, backups: [], legacy: null, loaded: false, online: false };
/* interactWrites: Contributors (assistant referees, account sign-ups) may write. Off while the platform is shared publicly. */
A.cfg = { interactWrites: false };
A.st = { db: null, user: null, dl: null, assets: null, level: 'view', me: null, err: '' };

A.S = () => {
  const s = Object.assign({}, DEF, D.settings || {});
  ['prizes', 'cats', 'sys', 'awards'].forEach(k => s[k] = Object.assign({}, DEF[k], (D.settings || {})[k] || {}));
  if (!Array.isArray(s.days) || !s.days.length) s.days = DEF.days;
  if (!Array.isArray(s.tb) || !s.tb.length) s.tb = DEF.tb;
  if (!Array.isArray(s.quotes)) s.quotes = DEF.quotes;
  return s;
};
/* fees & prizes summary — shared by public page, dashboard and finance */
A.money = () => {
  const S = A.S(), P = Object.entries(D.players).filter(([, p]) => !['rejected', 'cancelled'].includes(p.status));
  const fee = +S.fee || 0, staff = A.isAdminLvl && A.isAdminLvl();
  const paidAmt = id => +((D.priv[id] || {}).payAmount) || 0;
  const paidN = P.filter(([, p]) => p.paid).length;
  const expected = P.length * fee;
  const collected = staff ? P.reduce((s, [id]) => s + paidAmt(id), 0) : paidN * fee;
  const remaining = staff ? P.reduce((s, [id]) => s + Math.max(0, fee - paidAmt(id)), 0) : (P.length - paidN) * fee;
  const pr = [1, 2, 3].map(i => +S.prizes[i] || 0), perCat = pr.reduce((s, v) => s + v, 0);
  return { fee, registered: P.length, paidN, unpaidN: P.length - paidN, expected, collected, remaining, prizes: pr, perCat, prizeTotal: perCat * CATS.length, exact: staff };
};
A.regNo = p => p ? 'AND' + String(A.S().season).slice(-2) + '-' + pad(p.no) : '';
A.catName = c => A.S().cats[c] || ('الفئة ' + c);

/* ---------- role ---------- */
A.role = () => {
  const L = A.st.level;
  if (L === 'owner') return 'sys';
  if (L === 'admin') { const r = (D.roles[A.st.me] || {}).role; return ROLES[r] ? r : 'director'; }
  if (L === 'interact') return 'assistant';
  return null;
};
A.can = sec => { const r = A.role(); return !!r && ROLES[r].s.includes(sec); };
A.isAdminLvl = () => A.st.level === 'owner' || A.st.level === 'admin';
A.canApprove = () => A.isAdminLvl() && ['sys', 'director', 'chief', 'women'].includes(A.role());
A.catLock = () => { const r = A.role(); return r && ROLES[r].cat || null; };

/* ---------- writes ---------- */
const toast = A.toast = (t, ms = 2600) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms); };
const errMsg = e => ({ invalid_argument: 'ليست لديك صلاحية لهذه العملية أو البيانات غير صالحة', resource_exhausted: 'عمليات كثيرة في وقت قصير، انتظر قليلاً ثم أعد المحاولة', quota_exceeded: 'امتلأت مساحة قاعدة البيانات', unavailable: 'تعذّر الاتصال بقاعدة البيانات مؤقتاً', revoked: 'سُحبت صلاحية الوصول' }[e && e.code] || 'تعذّر الحفظ: ' + ((e && e.message) || e));
A.errMsg = errMsg;
const busy = {};
async function withRetry(fn) { try { return await fn(); } catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 600 + Math.random() * 800)); return await fn(); } throw e; } }
A.put = async (path, data) => { if (!A.st.db) throw { code: 'unavailable', message: 'لا توجد قاعدة بيانات' }; while (busy[path]) await busy[path]; const p = withRetry(() => A.st.db.doc(path).set(JSON.parse(JSON.stringify(data)))); busy[path] = p.catch(() => { }); try { await p; } finally { delete busy[path]; } };
A.upd = async (path, data) => { if (!A.st.db) throw { code: 'unavailable' }; while (busy[path]) await busy[path]; const p = withRetry(() => A.st.db.doc(path).update(JSON.parse(JSON.stringify(data)))); busy[path] = p.catch(() => { }); try { await p; } finally { delete busy[path]; } };
A.del = async path => { if (!A.st.db) throw { code: 'unavailable' }; await withRetry(() => A.st.db.doc(path).delete()); };
A.log = async (act, target, info, before, after) => {
  if (!A.st.db) return;
  try { await A.st.db.collection('audit').add({ at: now(), uid: A.st.me || '', act, target: String(target || ''), info: String(info || '').slice(0, 400), before: before === undefined ? null : before, after: after === undefined ? null : after }); } catch (e) { }
};
A.safe = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { console.error(e); toast(errMsg(e), 4200); return undefined; } };

/* ---------- backups ---------- */
A.snapshot = () => ({ settings: D.settings, players: D.players, priv: D.priv, rounds: D.rounds, finance: D.finance, ann: D.ann, gallery: D.gallery, archive: D.archive });
A.backup = async reason => {
  if (!A.isAdminLvl()) return;
  const body = { at: now(), reason, by: A.st.me || '', data: A.snapshot() };
  const s = JSON.stringify(body);
  if (s.length > 250000) { toast('النسخة أكبر من حد المستند الواحد — نزّل نسخة يدوية من الإعدادات', 4500); return; }
  await A.put('backups/' + Date.now(), body);
  try { const q = await A.st.db.collection('backups').get(); const ids = q.docs.map(d => d.id).sort(); while (ids.length > 15) { await A.del('backups/' + ids.shift()); } } catch (e) { }
};

/* ---------- tournament maths ---------- */
A.roundId = (c, n) => c + '-' + n;
A.catRounds = c => Object.values(D.rounds).filter(r => r && r.cat === c).sort((a, b) => a.n - b.n);
A.eligible = c => Object.entries(D.players).filter(([id, p]) => p.cat === c && p.status === 'approved' && !p.withdrawn).map(([id]) => id);
A.gameState = (r, g) => { if (g.res) return 'done'; const s = D.subs[A.roundId(r.cat, r.n) + '-' + g.bd]; if (s) return s.help ? 'help' : 'await'; return g.st === 'live' ? 'live' : 'pending'; };

A.table = c => {
  const S = A.S(), m = {};
  Object.entries(D.players).forEach(([id, p]) => { if (p.cat === c && p.status === 'approved') m[id] = { id, p, pts: 0, w: 0, d: 0, l: 0, gp: 0, opp: [], res: [], colors: [], bye: 0, hadBye: false, vs: {} }; });
  const rounds = A.catRounds(c);
  rounds.forEach(r => {
    const inR = new Set();
    (r.games || []).forEach(g => {
      const a = m[g.w], b = m[g.b]; if (!a || !b) return; inR.add(g.w); inR.add(g.b);
      a.opp.push(g.b); b.opp.push(g.w); a.colors.push('w'); b.colors.push('b');
      const R = RES[g.res];
      if (!R) { a.res.push(null); b.res.push(null); return; }
      a.pts += R[0]; b.pts += R[1]; a.res.push(R[0]); b.res.push(R[1]);
      a.vs[g.b] = (a.vs[g.b] || 0) + R[0]; b.vs[g.w] = (b.vs[g.w] || 0) + R[1];
      if (R[2]) { a.gp++; b.gp++; }
      if (R[0] === 1) a.w++; else if (R[0] === .5) a.d++; else if (R[2] || g.res === '-+' || g.res === '--') a.l++;
      if (R[1] === 1) b.w++; else if (R[1] === .5) b.d++; else if (R[2] || g.res === '+-' || g.res === '--') b.l++;
    });
    if (r.bye && m[r.bye]) { m[r.bye].pts += 1; m[r.bye].bye++; m[r.bye].hadBye = true; m[r.bye].colors.push('-'); m[r.bye].res.push(1); inR.add(r.bye); }
  });
  const L = Object.values(m);
  L.forEach(x => {
    const os = x.opp.map(o => m[o] ? m[o].pts : 0);
    x.bh = os.reduce((s, v) => s + v, 0);
    x.bhc1 = os.length > 1 ? x.bh - Math.min(...os) : x.bh;
    x.sb = x.opp.reduce((s, o, i) => s + (m[o] ? m[o].pts * (x.vs[o] !== undefined ? 0 : 0) : 0), 0);
    x.sb = 0; Object.entries(x.vs).forEach(([o, v]) => { if (m[o]) x.sb += m[o].pts * v; });
    x.wins = x.w; x.rating = +x.p.rating || 0;
  });
  const order = S.tb;
  const cmpKey = (a, b, k) => (b[k] || 0) - (a[k] || 0);
  L.sort((a, b) => b.pts - a.pts || 0);
  // direct encounter within equal-points groups
  const groups = {}; L.forEach(x => (groups[x.pts] = groups[x.pts] || []).push(x));
  Object.values(groups).forEach(g => { const ids = new Set(g.map(x => x.id)); g.forEach(x => { x.de = 0; Object.entries(x.vs).forEach(([o, v]) => { if (ids.has(o)) x.de += v; }); }); });
  L.sort((a, b) => { if (b.pts !== a.pts) return b.pts - a.pts; for (const k of order) { const d = cmpKey(a, b, k); if (d) return d; } return (a.p.no || 0) - (b.p.no || 0); });
  L.forEach((x, i) => x.rank = i + 1);
  return L;
};

/* pairing input for the next round */
A.pairInput = c => {
  const T = A.table(c), el = new Set(A.eligible(c));
  return T.filter(x => el.has(x.id)).map(x => ({ id: x.id, score: x.pts, rating: x.rating, seed: x.p.no || 0, opps: x.opp.slice(), colors: x.colors.slice(), hadBye: x.hadBye }));
};
A.systemFor = c => {
  const S = A.S(), s = S.sys[c] || 'auto';
  if (s !== 'auto') return s;
  const first = A.catRounds(c)[0];
  if (first && first.sys) return first.sys;
  const n = A.eligible(c).length, need = n % 2 ? n : n - 1;
  return n >= 2 && need <= S.maxRounds ? 'rr' : 'swiss';
};

/* family challenge: student + linked parent */
A.duos = () => {
  const seen = new Set(), out = [];
  const pts = {}; CATS.forEach(c => A.table(c).forEach(x => pts[x.id] = x.pts));
  Object.entries(D.players).forEach(([id, p]) => {
    if (!p.duo || !D.players[p.duo] || seen.has(id)) return; seen.add(id); seen.add(p.duo);
    const q = D.players[p.duo]; const s = p.type === 'student' ? [id, p.duo] : [p.duo, id];
    out.push({ a: s[0], b: s[1], pts: (pts[id] || 0) + (pts[p.duo] || 0) });
  });
  return out.sort((x, y) => y.pts - x.pts);
};

/* player profile helpers */
A.byNo = no => Object.entries(D.players).find(([id, p]) => +p.no === +no);
A.nextOpp = id => {
  const p = D.players[id]; if (!p) return null;
  const R = A.catRounds(p.cat), r = R[R.length - 1]; if (!r) return null;
  if (r.bye === id) return { bye: true, n: r.n };
  const g = (r.games || []).find(g => (g.w === id || g.b === id) && !g.res);
  return g ? { n: r.n, bd: g.bd, opp: g.w === id ? g.b : g.w, color: g.w === id ? 'w' : 'b' } : null;
};
A.history = id => {
  const p = D.players[id]; if (!p) return [];
  return A.catRounds(p.cat).map(r => {
    if (r.bye === id) return { n: r.n, bye: true, pts: 1 };
    const g = (r.games || []).find(g => g.w === id || g.b === id); if (!g) return null;
    const R = RES[g.res]; const me = g.w === id ? 0 : 1;
    return { n: r.n, bd: g.bd, opp: me ? g.w : g.b, color: me ? 'b' : 'w', res: g.res || null, pts: R ? R[me] : null };
  }).filter(Boolean);
};
A.achievements = mk => {
  const out = []; if (!mk) return out;
  Object.values(D.archive).sort((a, b) => String(b.season).localeCompare(String(a.season))).forEach(a => {
    (a.results || []).forEach(r => { if (r.mk === mk) out.push({ season: a.season, name: a.name, cat: r.catName, rank: r.rank, pts: r.pts, award: r.award || '' }); });
  });
  return out;
};

/* ---------- lazy libraries ---------- */
const libs = {};
A.lib = (key, url, test) => libs[key] || (libs[key] = new Promise((res, rej) => { if (test()) return res(test()); const s = document.createElement('script'); s.src = url; s.onload = () => test() ? res(test()) : rej(new Error('lib')); s.onerror = () => { delete libs[key]; rej(new Error('تعذّر تحميل المكتبة')); }; document.head.appendChild(s); }));
A.XLSX = () => A.lib('xlsx', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', () => window.XLSX);
A.jsPDF = () => A.lib('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => window.jspdf && window.jspdf.jsPDF);
A.QR = () => A.lib('qr', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', () => window.qrcode);
A.qrSvg = async (text, cell = 4) => { const q = await A.QR(); const qr = q(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag({ cellSize: cell, margin: 2 }); };

/* ---------- downloads ---------- */
A.save = async (filename, data) => {
  if (!A.st.dl) { toast('تنزيل الملفات غير متاح في هذا العرض — افتح المنصة في المتصفح', 4500); return false; }
  try { await A.st.dl.save({ filename, data }); return true; }
  catch (e) { const m = { declined: 'تم إلغاء التنزيل', rate_limited: 'انتظر قليلاً ثم أعد المحاولة', host_unavailable: 'هذا التطبيق لا يحفظ الملفات — افتح المنصة في المتصفح أو على الكمبيوتر', rejected_extension: 'صيغة الملف غير مسموحة' }[e && e.code] || 'تعذّر التنزيل'; toast(m, 4000); return false; }
};
let logoData = null;
A.logoData = async () => { if (logoData) return logoData; try { const b = await (await fetch('logo.png')).blob(); logoData = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) { logoData = ''; } return logoData; };
A.img = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
