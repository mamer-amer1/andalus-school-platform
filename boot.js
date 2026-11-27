/* التشغيل: الاتصال بالبيانات، التوجيه بين الواجهات الثلاث */
{
const A = window.A, D = A.D, K = A.K, { esc } = A.u;
A.HF = ['Reem Kufi', 'Cairo', 'Tajawal', 'Almarai', 'Rubik', 'Alexandria', 'Noto Kufi Arabic', 'El Messiri', 'Lalezar', 'Marhey', 'Amiri', 'Changa'];
A.BF = ['IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Almarai', 'Rubik', 'Readex Pro', 'Noto Sans Arabic', 'Noto Kufi Arabic', 'Alexandria', 'Changa', 'Amiri'];
function fonts() {
  const S = A.S(), r = document.documentElement.style, hf = A.HF.includes(S.hf) ? S.hf : A.HF[0], bf = A.BF.includes(S.bf) ? S.bf : A.BF[0], fs = Math.max(13, Math.min(22, +S.fs || 16));
  r.setProperty('--hf', `'${hf}'`); r.setProperty('--bf', `'${bf}'`); r.setProperty('--bs', fs + 'px');
  const q = [...new Set([hf, bf])].map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400;500;700').join('&'); let l = document.getElementById('gf');
  if (!l) { l = document.createElement('link'); l.id = 'gf'; l.rel = 'stylesheet'; document.head.appendChild(l); } const u = 'https://fonts.googleapis.com/css2?' + q + '&display=swap'; if (l.href !== u) l.href = u;
}
/* modal */
let lastFocus = null;
A.modal = html => { lastFocus = document.activeElement; const m = document.getElementById('modal'); document.getElementById('mBody').innerHTML = html; m.classList.add('on'); const f = m.querySelector('input,select,textarea,button'); if (f) f.focus(); };
A.closeModal = () => { document.getElementById('modal').classList.remove('on'); document.getElementById('mBody').innerHTML = ''; if (pending) { pending = false; A.render(); } if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { } };
document.addEventListener('click', e => {
  const t = e.target;
  if (t.id === 'modal' || t.closest('[data-close]')) { e.preventDefault(); A.closeModal(); }
  const cc = t.closest('[data-copy-conf]'); if (cc) navigator.clipboard.writeText(A.confirmText(cc.dataset.copyConf)).then(() => A.toast('تم النسخ'), () => A.toast('تعذّر النسخ'));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('modal').classList.contains('on')) A.closeModal(); });

/* render & route */
let pending = false, mode = '';
const busyEditing = () => { const a = document.activeElement; return document.getElementById('modal').classList.contains('on') || (a && a.matches && a.matches('input:not([type=checkbox]):not([type=range]),textarea,select') && a.id !== 'scan' && a.id !== 'pq'); };
A.render = (force) => {
  const h = location.hash.slice(1) || 'home';
  const m = h.startsWith('tv') ? 'tv' : (h === 'admin' || h.startsWith('a-')) ? 'admin' : 'pub';
  if (!force && mode === m && busyEditing()) { pending = true; return; }
  pending = false;
  if (m !== mode) { if (mode === 'tv') A.tvStop(); if (m === 'tv') A.tvStart(); mode = m; window.scrollTo(0, 0); }
  fonts();
  try { if (m === 'tv') A.renderTV(); else if (m === 'admin') A.renderAdmin(h); else A.renderPublic(h); }
  catch (e) { console.error(e); document.getElementById('root').innerHTML = `<main><div class="warnbox">حدث خطأ في العرض: ${esc(e.message)}</div><a class="btn" href="#home">الرئيسية</a></main>`; }
};
document.addEventListener('focusout', () => setTimeout(() => { if (pending && !busyEditing()) A.render(); }, 50));
addEventListener('hashchange', () => A.render(true));
setInterval(() => { if (mode === 'pub' && (location.hash === '' || location.hash === '#home') && !busyEditing()) A.render(); }, 60000);

/* data */
let rt = null;
const schedule = () => { clearTimeout(rt); rt = setTimeout(() => A.render(), 60); };
function sub(path, isDoc, apply) {
  const db = A.st.db; const ref = isDoc ? db.doc(path) : db.collection(path);
  ref.onSnapshot(s => { if (!s.metadata || !s.metadata.fromCache) { D.online = true; clearTimeout(A.st.loadT); if (A.st.err && /الاتصال/.test(A.st.err)) A.st.err = ''; } apply(s); schedule(); }, e => { if (e && e.code === 'revoked') A.st.err = 'انتهت صلاحية الوصول لهذه الصفحة.'; schedule(); });
}
const toMap = s => { const o = {}; s.docs.forEach(d => o[d.id] = d.data()); return o; };
async function loadNames() {
  if (!A.st.user || !A.isAdminLvl()) return;
  const ids = [...new Set([...D.audit.map(a => a.uid), ...Object.keys(D.roles), ...Object.values(D.subs).map(s => s.by), ...Object.values(D.incidents).map(i => i.by)].filter(Boolean))].filter(id => !A.names[id]);
  if (!ids.length) return;
  try { const ps = await A.st.user.profiles(ids); Object.entries(ps || {}).forEach(([id, p]) => { if (p && p.name) A.names[id] = p.name; }); schedule(); } catch (e) { }
}
async function boot() {
  A.render();
  if (!window.claude || !claude.use) { A.st.err = 'قاعدة البيانات غير متاحة في هذا العرض — افتح المنصة من رابطها على claude.ai.'; A.render(); return; }
  A.st.loadT = setTimeout(() => { if (!D.online) { A.st.err = 'تعذّر الاتصال بقاعدة البيانات حتى الآن — قد تكون البيانات غير محدّثة.'; A.render(); } }, 10000);
  const [db, user, dl, assets] = await Promise.all(['db', 'user', 'downloads', 'assets'].map(n => claude.use(n).catch(() => null)));
  A.st.db = db; A.st.user = user; A.st.dl = dl; A.st.assets = assets;
  if (!db) { clearTimeout(A.st.loadT); A.st.err = 'سجّل الدخول إلى claude.ai لرؤية النتائج المباشرة.'; A.render(); return; }
  if (user) {
    try {
      const [own, ed, w] = await Promise.all([user.isOwner(), user.canEdit(), user.can('data.write')]);
      A.st.level = own ? 'owner' : ed ? 'admin' : w ? 'interact' : 'view';
      A.st.me = await user.id();
      try { const me = await user.me(); if (me && me.name) A.names[A.st.me] = me.name; } catch (e) { }
    } catch (e) { A.st.level = 'view'; }
  }
  sub('settings/main', true, s => { D.settings = s.exists ? s.data() : null; });
  sub('players', false, s => { D.players = toMap(s); D.loaded = true; });
  sub('rounds', false, s => { D.rounds = toMap(s); });
  sub('subs', false, s => { D.subs = toMap(s); loadNames(); });
  sub('ann', false, s => { D.ann = toMap(s); });
  sub('gallery', false, s => { D.gallery = toMap(s); });
  sub('archive', false, s => { D.archive = toMap(s); });
  if (A.st.level === 'interact') { sub('incidents', false, s => { D.incidents = toMap(s); }); if (A.st.me) { sub('requests/' + A.st.me, true, s => { D.requests = s.exists ? { [A.st.me]: s.data() } : {}; }); sub('survey/' + A.st.me, true, s => { D.survey = s.exists ? { [A.st.me]: s.data() } : {}; }); } }
  if (A.isAdminLvl()) {
    sub('private', false, s => { D.priv = toMap(s); });
    sub('members', false, s => { D.members = toMap(s); });
    sub('finance', false, s => { D.finance = toMap(s); });
    sub('roles', false, s => { D.roles = toMap(s); loadNames(); });
    sub('requests', false, s => { D.requests = toMap(s); });
    sub('incidents', false, s => { D.incidents = toMap(s); loadNames(); });
    sub('survey', false, s => { D.survey = toMap(s); });
    const q = db.collection('audit').orderBy('at', 'desc').limit(300);
    q.onSnapshot(s => { D.audit = s.docs.map(d => d.data()); loadNames(); schedule(); }, () => { });
    try { const lg = await db.doc('tournament/main').get(); if (lg.exists) D.legacy = lg.data(); } catch (e) { }
  }
  A.render(true);
}
boot();
}
