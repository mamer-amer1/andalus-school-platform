/* واجهة الجمهور والمشاركين */
{
const A = window.A, { esc, fmtD, fmtDT, money, validPhone, normPhone, intl } = A.u, K = A.K, D = A.D;
const PUB = [['home', 'الرئيسية'], ['register', 'التسجيل'], ['mine', 'بطاقتي'], ['matches', 'المباريات'], ['results', 'النتائج'], ['standings', 'الترتيب'], ['player', 'صفحة اللاعب'], ['prizes', 'الفئات والجوائز'], ['news', 'الإعلانات'], ['gallery', 'الصور'], ['clock', 'ساعة الشطرنج'], ['help', 'المساعدة']];
A.pubRoutes = ['home', 'prizes', 'matches', 'results', 'standings', 'player', 'news', 'gallery', 'register', 'track', 'survey', 'mine', 'help', 'clock'];
let cat = '1', rsel = {};
A.pubCat = () => cat;

function header(h) {
  const S = A.S(), approved = Object.values(D.players).filter(p => p.status === 'approved').length;
  const staff = A.st.level !== 'view' && A.st.level !== 'none';
  return `<div class="stripe" aria-hidden="true"></div><header class="band"><div class="photo" aria-hidden="true"></div>
  <div class="hd"><div class="emb" role="img" aria-label="شعار مدارس الأندلس الأهلية"><img class="ring" src="ring.png" alt=""><img src="y1984.png" alt=""></div>
  <div class="ht"><span class="logo"><img src="logo.png" alt="شعار مدارس الأندلس الأهلية"></span>
  <div class="sub">${esc(S.club)} • ${esc(S.school)}</div><h1>${esc(S.name)} ${esc(S.season)}</h1>
  <div class="sub">${esc(S.days.filter(d => d.date).length ? fmtD(S.days[0].date) + ' – ' + fmtD(S.days[S.days.length - 1].date) : 'المواعيد تُعلن قريباً')} • ${esc(S.start)}–${esc(S.end)} مساءً</div>
  <div class="stat"><div>رسوم الاشتراك<b>${esc(Number(S.fee || 0).toLocaleString('en-US'))} ريال</b></div><div>زمن اللعب<b>${esc(S.tc)} دقيقة لكل لاعب</b></div><div>التسجيل<b>${S.regOpen ? 'مفتوح' : 'مغلق'}</b></div></div></div></div>
  <nav class="tabs" aria-label="واجهة الجمهور">${PUB.map(([k, n]) => `<a href="#${k}" class="${h === k || (k === 'player' && h.startsWith('p-')) ? 'on' : ''}">${n}</a>`).join('')}${staff ? '<a href="#admin">لوحة الإدارة</a>' : ''}<a href="#tv">الشاشة المباشرة</a></nav></header>`;
}
function footer() {
  const S = A.S(), wa = intl(S.wa);
  return `<div class="ft"><div class="row"><img src="emblem.png" alt=""><div><b style="color:var(--ink)">${esc(S.school)}</b><br>${esc(S.club)}${D.online ? ' • النتائج مباشرة' : ' • غير متصل بقاعدة البيانات'}</div></div><div class="row">${S.phone ? `<span>للتواصل: <span dir="ltr">${esc(S.phone)}</span></span>` : ''}${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">واتساب المنسّق</a>` : ''}</div></div>`;
}
const catBar = (cur, extra = '') => `<div class="cats" role="group" aria-label="الفئة">${K.CATS.map(c => `<button data-pcat="${c}" class="${c === cur ? 'on' : ''}">${esc(A.catName(c))}</button>`).join('')}${extra}</div>`;
A.catBar = catBar;

function countdown() {
  const S = A.S(), d0 = S.days.find(d => d.date); if (!d0) return '';
  const t = new Date(d0.date + 'T' + (S.start || '14:00') + ':00');
  const ms = t - Date.now(); if (isNaN(ms) || ms <= 0) return '';
  const dd = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), mm = Math.floor(ms % 36e5 / 6e4);
  return `<div class="card" style="text-align:center"><div class="note">تنطلق البطولة بعد</div><div class="kpis" style="max-width:520px;margin:10px auto 0" id="cd">${[[dd, 'يوم'], [hh, 'ساعة'], [mm, 'دقيقة']].map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('')}</div></div>`;
}
function annList(max = 50) {
  const L = Object.entries(D.ann).filter(([, a]) => a.active !== false).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).slice(0, max);
  return L.length ? L.map(([, a]) => `<div class="ann ${a.level === 'alert' ? 'alert' : ''}"><div>${esc(a.text)}</div><div class="note">${esc(fmtDT(a.at))}</div></div>`).join('') : '<div class="empty">لا توجد إعلانات حالياً.</div>';
}
function schedule() {
  const S = A.S();
  return `<div class="sched">${S.days.map((d, i) => `<div><b>اليوم ${i + 1}</b><span>${esc(d.title)}${d.date ? ` — ${esc(fmtD(d.date))}` : ''}${d.rounds ? ` <span class="pill">الجولة ${esc(d.rounds)}</span>` : ''}</span></div>`).join('')}</div><p class="note">من ${esc(S.start)} إلى ${esc(S.end)} مساءً بعد انتهاء الدوام • ${esc(S.place)}</p>`;
}
function liveSummary() {
  return `<div class="grid">${K.CATS.map(c => { const R = A.catRounds(c), r = R[R.length - 1]; const done = r ? (r.games || []).filter(g => g.res).length : 0; return `<div class="card" style="margin:0"><h3>${esc(A.catName(c))}</h3>${r ? `<div>الجولة ${r.n} من ${A.S().maxRounds} — ${done}/${(r.games || []).length} مباريات منتهية</div>` : '<div class="note">لم تبدأ الجولات بعد</div>'}<div class="row" style="margin-top:10px"><a class="btn" href="#matches" data-pcat-go="${c}">المباريات</a><a class="btn" href="#standings" data-pcat-go="${c}">الترتيب</a></div></div>`; }).join('')}</div>`;
}
A.prizesSection = (staffView) => {
  const S = A.S(), M = A.money(), staff = A.isAdminLvl(), fmt = v => Number(v).toLocaleString('en-US');
  const medals = [['الأول', 'كأس ذهبي', 'gold'], ['الثاني', 'كأس فضي', 'silver'], ['الثالث', 'كأس برونزي', 'bronze']];
  const catCard = c => { const all = Object.values(D.players).filter(p => p.cat === c && !['rejected', 'cancelled'].includes(p.status)); const ap = all.filter(p => p.status === 'approved').length;
    return `<div class="pz"><div class="pzh"><span class="pzn">${c}</span><div><b>${esc(S.cats[c])}</b>${staff ? `<div class="note">${all.length} مسجّلاً • ${ap} معتمداً</div>` : ''}</div></div>
    <table class="pzt"><thead><tr><th>المركز</th><th>الكأس</th><th class="n">الجائزة المالية</th></tr></thead><tbody>${medals.map(([r, cup, cl], i) => `<tr class="${cl}"><td><span class="medal m${i + 1}">${i + 1}</span> ${r}</td><td>${cup}</td><td class="n"><b>${fmt(M.prizes[i])}</b> ريال</td></tr>`).join('')}</tbody></table>
    <div class="pzf">مجموع جوائز الفئة <b>${fmt(M.perCat)} ريال</b></div></div>`; };
  return `<section class="card" id="prizes"><div class="row sp"><h2 style="margin:0">الفئات والجوائز</h2>${staff && !staffView ? '<a class="btn" href="#a-settings">تعديل المبالغ</a>' : ''}</div>
  <div class="pzg">${K.CATS.map(catCard).join('')}</div>
  <h3 style="margin-top:20px">جوائز المشاركة والتشجيع</h3>
  <div class="enc">${[['ميدالية وشهادة مشاركة', 'لكل لاعب'], ['أفضل روح رياضية', 'الأكثر التزاماً واحتراماً للمنافس'], ['أصغر مشارك', 'تشجيعاً للمواهب الصغيرة'], ['أفضل لاعب متطور', 'الأكثر تقدماً خلال البطولة'], ['تحدي الأسرة', 'مجموع نقاط الطالب وولي أمره']].map(([t, d]) => `<div><b>${t}</b><span>${d}</span></div>`).join('')}</div>
  <h3 style="margin-top:20px">رسوم الاشتراك</h3>
  <div class="feebox"><b>${esc(fmt(M.fee))} ريال</b><span>لكل مشارك، تُسدَّد بعد التسجيل وتأكيد الطلب من إدارة البطولة.</span></div>
  ${staff ? `<div class="kpis" style="margin-top:12px">${[['إجمالي المسجلين', M.registered], ['سددوا الرسوم', M.paidN], ['لم يسددوا', M.unpaidN]].map(([l, v]) => `<div class="kpi"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
  ${staff ? `<h3>الملخص المالي</h3><div class="kpis fin">${[['الرسوم المتوقعة', M.expected, 'المسجلون × الرسوم'], ['المحصّل فعلياً', M.collected, 'من الدفعات المسجلة'], ['المتبقي للتحصيل', M.remaining, M.unpaidN + ' لم يسددوا'], ['الجوائز المالية المخصصة', M.prizeTotal, '3 فئات × ' + fmt(M.perCat)]].map(([l, v, s]) => `<div class="kpi"><span>${l}</span><b>${fmt(v)} ريال</b><span>${esc(s)}</span></div>`).join('')}</div>` : ''}
  ${staff ? '<p class="note">أعداد المسجلين والملخص المالي تظهر لفريق الإدارة فقط، ولا يراها أولياء الأمور.</p>' : ''}</section>`;
};
function prizesPage() { return A.prizesSection(); }
function home() {
  const S = A.S(), P = S.prizes;
  return `${countdown()}
  <div class="feeband"><div><b>رسوم الاشتراك: ${esc(Number(S.fee || 0).toLocaleString('en-US'))} ريال</b><span>لكل مشارك • ${esc(S.tc)} دقيقة لكل لاعب في المباراة</span></div>${S.regOpen ? '<a class="btn pri" href="#register">سجّل الآن</a>' : '<span class="pill">التسجيل مغلق حالياً</span>'}</div>
  <div class="row sp" style="margin-bottom:18px"><h2 style="margin:0">أهلاً بكم في ${esc(S.name)} ${esc(S.season)}</h2><div class="row"><a class="btn" href="#mine">بطاقتي</a><a class="btn" href="#help">كيف أسجّل؟</a></div></div>
  ${liveSummary()}
  <div class="grid" style="margin-top:18px"><div class="card"><h2>جدول المنافسات</h2>${schedule()}</div>
</div>
  ${A.prizesSection()}
  <div class="card"><div class="row sp"><h2 style="margin:0">آخر الأخبار</h2><a class="btn" href="#news">كل الإعلانات</a></div><div style="margin-top:12px">${annList(3)}</div></div>`;
}
const pname = id => { const p = D.players[id]; return p ? esc(p.name) : '—'; };
const plink = id => { const p = D.players[id]; return p ? `<a href="#p-${p.no}" style="color:inherit">${esc(p.name)}</a>` : '—'; };
A.plink = plink;
function gamesView(r, readonly = true) {
  const sc = {}; A.table(r.cat).forEach(x => sc[x.id] = x.pts);
  const rows = (r.games || []).map(g => { const st = A.gameState(r, g); return `<div class="g"><div class="bd">${g.bd}</div><div class="pl"><span><span class="dot w"></span>${plink(g.w)}</span><small>${A.regNo(D.players[g.w])} • ${sc[g.w] ?? 0} ن</small></div><div class="rv">${g.res ? esc(g.res.replace('+-', '+/-').replace('-+', '-/+').replace('--', '-/-')) : `<span class="pill ${st === 'live' ? 'live' : ''}">${K.GST[st]}</span>`}</div><div class="pl b"><span>${plink(g.b)}<span class="dot k" style="margin:0 6px 0 0"></span></span><small>${A.regNo(D.players[g.b])} • ${sc[g.b] ?? 0} ن</small></div></div>`; }).join('');
  return `<div class="games">${rows}${r.bye ? `<div class="g"><div class="bd">—</div><div class="pl"><span>${plink(r.bye)}</span><small>استراحة — نقطة كاملة</small></div></div>` : ''}</div>`;
}
A.gamesView = gamesView;
function matches() {
  const R = A.catRounds(cat), r = R[R.length - 1];
  return catBar(cat) + (r ? `<div class="row sp" style="margin-bottom:12px"><h2 style="margin:0">الجولة ${r.n} — ${esc(A.catName(cat))}</h2>${r.startedAt && !r.closed ? `<span class="pill live">بدأت ${esc(fmtDT(r.startedAt))}</span>` : ''}</div>${gamesView(r)}` : '<div class="empty">لم يُعلن توزيع الجولة الأولى لهذه الفئة بعد.</div>');
}
function results() {
  const R = A.catRounds(cat); let i = rsel[cat] ?? R.length - 1; if (i >= R.length) i = R.length - 1; rsel[cat] = i;
  return catBar(cat) + (R.length ? `<div class="row" style="margin-bottom:14px">${R.map((r, k) => `<button data-rsel="${k}" class="${k === i ? 'on' : ''}">الجولة ${r.n}</button>`).join('')}</div>${gamesView(R[i])}` : '<div class="empty">لا توجد نتائج بعد.</div>');
}
function standTable(c, opts = {}) {
  const T = A.table(c), S = A.S(), n = A.catRounds(c).length, k = S.tb[0];
  if (!T.length) return '<div class="empty">لا يوجد لاعبون معتمدون في هذه الفئة.</div>';
  return `<div class="scroll"><table class="stack"><thead><tr><th>المركز</th><th>الرقم</th><th>اللاعب</th><th class="n">المباريات</th><th class="n">فوز</th><th class="n">تعادل</th><th class="n">خسارة</th><th class="n">النقاط</th><th class="n">${esc(K.TB[k])}</th><th class="n">بوخهولز</th><th>الحالة</th></tr></thead><tbody>${T.map(x => `<tr><td>${x.rank <= 3 && n ? `<span class="medal m${x.rank}">${x.rank}</span>` : x.rank}</td><td class="n">${esc(A.regNo(x.p))}</td><td><b>${plink(x.id)}</b></td><td class="n">${x.gp + x.bye}</td><td class="n">${x.w}</td><td class="n">${x.d}</td><td class="n">${x.l}</td><td class="n"><b>${x.pts}</b></td><td class="n">${x[k] ?? 0}</td><td class="n">${x.bh}</td><td>${x.p.withdrawn ? '<span class="pill bad">منسحب</span>' : '<span class="pill ok">نشط</span>'}</td></tr>`).join('')}</tbody></table></div><p class="note">ترتيب كسر التعادل: ${S.tb.map(t => esc(K.TB[t])).join(' ← ')}. يتحدّث تلقائياً بعد اعتماد كل نتيجة.</p>`;
}
A.standTable = standTable;
function standings() { return catBar(cat) + `<h2>الترتيب بعد الجولة ${A.catRounds(cat).length} — ${esc(A.catName(cat))}</h2>` + standTable(cat) + duoBox(); }
function duoBox() { const L = A.duos().slice(0, 5); return L.length ? `<div class="card" style="margin-top:18px"><h2>تحدي الأسرة</h2>${L.map((d, i) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:8px 0"><span>${i + 1}. ${plink(d.a)} + ${plink(d.b)}</span><b>${d.pts} نقطة</b></div>`).join('')}</div>` : ''; }
function playerPage(h) {
  const no = +(h.split('-')[1] || 0);
  const find = `<form class="row card" id="pfind"><label style="flex:1 1 220px">اسم اللاعب أو رقم التسجيل<input id="pno" placeholder="مثال: 12 أو AND26-012 أو اسم اللاعب" value="${no || ''}"></label><button class="pri" style="align-self:end">بحث</button></form>`;
  if (!no) { const q = (A.ui && A.ui.pq) || ''; const hits = q ? Object.values(D.players).filter(p => !['rejected', 'cancelled'].includes(p.status) && p.name.includes(q)).slice(0, 30) : [];
    return `<h2>صفحة اللاعب</h2>${find}${q ? (hits.length ? `<div class="card">${hits.map(p => `<a class="row sp hit" href="#p-${p.no}"><span><b>${esc(p.name)}</b> — ${esc(A.catName(p.cat))}</span><span class="note">${esc(A.regNo(p))}</span></a>`).join('')}</div>` : '<div class="empty">لا يوجد لاعب بهذا الاسم.</div>') : '<p class="note">اكتب اسم اللاعب أو رقمه لعرض نتائجه وترتيبه ومنافسه القادم وسجل مبارياته.</p>'}`; }
  const f = A.byNo(no); if (!f) return `<h2>صفحة اللاعب</h2>${find}<div class="empty">لا يوجد لاعب بهذا الرقم.</div>`;
  const [id, p] = f, T = A.table(p.cat), x = T.find(t => t.id === id), nx = A.nextOpp(id), H = A.history(id), ach = A.achievements(p.mk);
  return `${find}<div class="card"><div class="row sp"><div><div class="note">${esc(A.regNo(p))} • ${esc(A.catName(p.cat))}</div><h2 style="margin:0">${esc(p.name)}</h2></div><div class="row"><span class="pill ${K.REG_CLS[p.status] || ''}">${esc(K.REG[p.status] || '')}</span>${p.withdrawn ? '<span class="pill bad">منسحب</span>' : ''}</div></div>
  ${x ? `<div class="kpis" style="margin-top:14px">${[['الترتيب', x.rank + ' / ' + T.length], ['النقاط', x.pts], ['المباريات', x.gp + x.bye], ['فوز', x.w], ['تعادل', x.d], ['خسارة', x.l]].map(([l, v]) => `<div class="kpi"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>` : '<p class="note">يظهر الترتيب بعد اعتماد التسجيل.</p>'}
  <h3>المباراة القادمة</h3>${nx ? (nx.bye ? `<p>استراحة في الجولة ${nx.n} (نقطة كاملة)</p>` : `<p>الجولة ${nx.n} — الطاولة ${nx.bd} — يلعب ${nx.color === 'w' ? 'بالأبيض' : 'بالأسود'} ضد ${plink(nx.opp)}</p>`) : '<p class="note">لم يُعلن التوزيع بعد.</p>'}
  <h3>سجل المباريات</h3>${H.length ? `<div class="scroll"><table class="stack"><thead><tr><th>الجولة</th><th>الطاولة</th><th>اللون</th><th>المنافس</th><th>النتيجة</th></tr></thead><tbody>${H.map(r => r.bye ? `<tr><td>${r.n}</td><td>—</td><td>—</td><td>استراحة</td><td>1</td></tr>` : `<tr><td>${r.n}</td><td>${r.bd}</td><td>${r.color === 'w' ? 'أبيض' : 'أسود'}</td><td>${plink(r.opp)}</td><td>${r.res ? esc(r.pts) + ' (' + esc(r.res) + ')' : 'لم تنتهِ'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">لا توجد مباريات بعد.</p>'}
  ${p.duo && D.players[p.duo] ? `<p>شريك تحدي الأسرة: ${plink(p.duo)}</p>` : ''}
  <h3>سجل الإنجازات في نادي شطرنج الأندلس</h3>${ach.length ? ach.map(a => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(a.name)} ${esc(a.season)} — ${esc(a.cat)}</span><span>${a.rank <= 3 ? `<span class="medal m${a.rank}">${a.rank}</span>` : 'المركز ' + esc(a.rank)} ${a.award ? `<span class="pill ok">${esc(a.award)}</span>` : ''}</span></div>`).join('') : '<p class="note">تظهر هنا مراكز اللاعب في المواسم المؤرشفة.</p>'}</div>`;
}
function news() { return `<h2>الإعلانات والتنبيهات</h2>${annList()}`; }
function gallery() {
  const L = Object.entries(D.gallery).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)));
  return `<h2>معرض الصور</h2>${L.length ? `<div class="grid">${L.map(([, g]) => `<figure class="card" style="margin:0;padding:8px"><img src="/_blob/${esc(g.asset)}" alt="${esc(g.caption || 'صورة من البطولة')}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px" loading="lazy"><figcaption class="note" style="padding:6px 4px 0">${esc(g.caption || '')}</figcaption></figure>`).join('')}</div>` : '<div class="empty">تُضاف صور البطولة هنا أولاً بأول.</div>'}`;
}
function register() {
  const S = A.S(), fee = Number(S.fee || 0).toLocaleString('en-US');
  if (!S.regOpen) return `<h2>التسجيل</h2><div class="empty">التسجيل مغلق حالياً. تابع الإعلانات لمعرفة موعد فتحه.</div>`;
  return `<h2>التسجيل في ${esc(S.name)} ${esc(S.season)}</h2>
  <div class="feeband"><div><b>رسوم الاشتراك: ${esc(fee)} ريال</b><span>تُسدَّد بعد التسجيل، ويُعتمد اللاعب بعد السداد.</span></div></div>
  <form id="regf" class="card" novalidate><div class="row" style="gap:12px;align-items:center;margin-bottom:6px"><img src="logo.png" alt="شعار مدارس الأندلس الأهلية" style="height:44px"><h2 style="margin:0">نموذج التسجيل</h2></div><div class="grid">
   <label>الاسم الكامل *<input name="name" required autocomplete="name" placeholder="الاسم كما سيظهر في البطاقة"></label>
   <label>المشارك *<select name="type">${Object.entries(K.TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
   <label>رقم الجوال *<input name="phone" inputmode="tel" placeholder="05xxxxxxxx" dir="ltr"></label>
   <label data-only="student">الصف الدراسي<input name="grade" placeholder="مثال: الثاني متوسط"></label></div>
   <details style="margin-top:10px"><summary>تحدي الأسرة (اختياري)</summary><p class="note">إذا سجّل ابنك أو ولي أمرك قبلك، اكتب رقم تسجيله هنا ليُحتسب مجموعكما في «تحدي الأسرة». هذا الرقم يظهر في بطاقة المشارك (مثل AND26-012).</p><label>رقم تسجيل الشريك<input name="partner" dir="ltr" placeholder="AND26-012"></label></details>
   <label class="ck" style="margin-top:12px"><input type="checkbox" name="terms"> أوافق على شروط البطولة ولوائحها *</label>
   <label class="ck" data-only="student"><input type="checkbox" name="parent"> موافقة ولي الأمر على مشاركة الطالب *</label>
   <label class="ck"><input type="checkbox" name="photo"> أوافق على التصوير ونشر الصور (اختياري)</label>
   <div id="regErr" class="warnbox" hidden></div><button class="pri" id="regBtn">تسجيل</button>
   <p class="note">بعد التسجيل مباشرة تظهر لك <b>بطاقة المشارك</b> برقمك ورمز QR. احتفظ بها، فهي تُمسح عند الحضور لتسجيل حضورك.</p></form>`;
}
function track() {
  return `<h2>متابعة حالة الطلب</h2><form id="trk" class="row card"><label style="flex:1 1 220px">رقم المشارك<input id="tno" inputmode="numeric" placeholder="مثال: 12"></label><button class="pri" style="align-self:end">عرض الحالة</button></form><div id="trkOut"></div>`;
}
function survey() {
  const S = A.S(), canW = A.isAdminLvl() || (A.cfg.interactWrites && A.st.level === 'interact');
  const mine = D.survey[A.st.me];
  if (S.surveyUrl && /^https:\/\//.test(S.surveyUrl) && !canW) return `<h2>استبيان الرضا</h2><div class="card"><p>شاركنا رأيك في تنظيم البطولة.</p><a class="btn pri" href="${esc(S.surveyUrl)}" target="_blank" rel="noopener">افتح الاستبيان</a></div>`;
  if (!canW) return '<h2>استبيان الرضا</h2><div class="empty">الاستبيان يُعلن بعد الحفل الختامي.</div>';
  return `<h2>استبيان الرضا</h2><form id="srv" class="card"><div class="grid">${[['org', 'التنظيم'], ['time', 'المواعيد'], ['ref', 'التحكيم'], ['place', 'المكان والضيافة']].map(([k, l]) => `<label>${l}<select name="${k}">${[5, 4, 3, 2, 1].map(v => `<option ${mine && mine[k] == v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}</div><label style="margin-top:10px">اقتراحاتك<textarea name="note">${esc(mine ? mine.note : '')}</textarea></label><button class="pri" style="margin-top:10px">${mine ? 'تحديث الرد' : 'إرسال'}</button></form>`;
}

A.renderPublic = h => {
  if (h.startsWith('p-')) h = 'p';
  const page = Object.assign({ home, prizes: prizesPage, matches, results, standings, news, gallery, register, track, survey }, A.pubX || {})[h] || (h === 'p' || h === 'player' ? () => playerPage(location.hash.slice(1)) : home);
  const S = A.S();
  document.getElementById('root').innerHTML = header(location.hash.slice(1) || 'home') + `<main>${A.st.err ? `<div class="warnbox">${esc(A.st.err)}</div>` : ''}${page()}${footer()}</main>`;
  if (h === 'register' && S.formUrl && /^https:\/\//.test(S.formUrl)) A.qrSvg(S.formUrl, 4).then(svg => { const e = document.getElementById('formQr'); if (e) e.innerHTML = svg; }).catch(() => { });
};

/* events */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pcat],[data-rsel],[data-pcat-go]'); if (!b) return;
  if (b.dataset.pcat) { cat = b.dataset.pcat; A.render(); }
  else if (b.dataset.rsel) { rsel[cat] = +b.dataset.rsel; A.render(); }
  else if (b.dataset.pcatGo) { cat = b.dataset.pcatGo; }
});
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'pfind') { e.preventDefault(); const raw = A.u.digits(document.getElementById('pno').value).trim(); const v = /\d/.test(raw) && !/[\u0600-\u06FF]/.test(raw) ? raw.split('-').pop().replace(/\D/g, '') : ''; A.ui = A.ui || {}; A.ui.pq = v ? '' : raw; if (v) location.hash = 'p-' + (+v); else if (location.hash !== '#player') location.hash = 'player'; else A.render(true); }
  else if (f.id === 'trk') {
    e.preventDefault(); const v = +A.u.digits(document.getElementById('tno').value).replace(/\D/g, ''); const r = A.byNo(v); const o = document.getElementById('trkOut');
    if (!r) { o.innerHTML = '<div class="empty">لا يوجد طلب بهذا الرقم.</div>'; return; }
    const p = r[1]; o.innerHTML = `<div class="card"><h3>${esc(p.name)} — ${esc(A.regNo(p))}</h3><p>الفئة: ${esc(A.catName(p.cat))}</p><p>حالة الطلب: <span class="pill ${K.REG_CLS[p.status]}">${esc(K.REG[p.status])}</span> • السداد: ${p.paid ? '<span class="pill ok">مدفوع</span>' : '<span class="pill warn">غير مدفوع</span>'}</p><p class="note">الحضور: ${esc(A.S().start)} مساءً في ${esc(A.S().place)}، قبل بداية الجولة بخمس دقائق.</p></div>`;
  }
  else if (f.id === 'regf') { e.preventDefault(); await A.submitRegistration(f); }
  else if (f.id === 'srv') {
    e.preventDefault(); const fd = new FormData(f), o = {}; fd.forEach((v, k) => o[k] = k === 'note' ? String(v).slice(0, 1000) : +v); o.at = A.u.now();
    await A.safe(() => A.put('survey/' + A.st.me, o), 'شكراً، وصل ردّك');
  }
});

/* registration (in-platform, for signed-in accounts) */
A.validateReg = o => {
  const errs = [];
  if (!o.name || o.name.trim().length < 3) errs.push('الاسم الكامل مطلوب (3 أحرف على الأقل)');
  if (!K.TYPES[o.type]) errs.push('اختر نوع المشارك');
  if (!validPhone(o.phone)) errs.push('رقم الجوال يجب أن يكون بصيغة 05xxxxxxxx');
  if (!o.terms) errs.push('الموافقة على الشروط مطلوبة');
  if (o.type === 'student' && !o.parent) errs.push('موافقة ولي الأمر مطلوبة للطالب');
  const dup = Object.entries(D.priv).find(([id, q]) => normPhone(q.phone) === normPhone(o.phone) && D.players[id] && D.players[id].name.trim() === o.name.trim() && !['cancelled', 'rejected'].includes(D.players[id].status));
  if (dup) errs.push('هذا المشارك مسجّل مسبقاً برقم ' + A.regNo(D.players[dup[0]]));
  return errs;
};
A.submitRegistration = async f => {
  const fd = new FormData(f), o = {}; fd.forEach((v, k) => o[k] = typeof v === 'string' ? v.trim() : v);
  ['terms', 'parent', 'photo'].forEach(k => o[k] = !!(f.elements[k] && f.elements[k].checked));
  const errs = A.validateReg(o), box = document.getElementById('regErr');
  if (errs.length) { box.hidden = false; box.textContent = errs.join(' • '); return; }
  box.hidden = true;
  if (A.isAdminLvl()) { const id = await A.createPlayer(Object.assign({}, o, { link: '' }), 'نموذج المنصة'); if (id) { if (o.partner) A.linkByNo && A.linkByNo(id, o.partner); A.confirmBox(id); f.reset(); } return; }
  const btn = document.getElementById('regBtn'); if (btn) { btn.disabled = true; btn.textContent = 'جارٍ التسجيل…'; }
  try {
    const r = await A.regServer(o);
    A.rememberCard(r); f.reset(); A.showMyCard(r, true);
  } catch (e) {
    box.hidden = false; box.textContent = e.message;
    if (e.dup) { A.rememberCard(e.dup); }
  } finally { if (btn) { btn.disabled = false; btn.textContent = 'تسجيل'; } }
};
A.confirmText = id => {
  const p = D.players[id], S = A.S();
  return `مرحباً ${p.name}\nتم تسجيلك في ${S.name} ${S.season}\nرقم المشارك: ${A.regNo(p)}\nالفئة: ${A.catName(p.cat)}\nحالة الطلب: ${K.REG[p.status]}\nالرسوم: ${S.fee} ريال\nالحضور: ${S.start} مساءً – ${S.place}، قبل الجولة بخمس دقائق.\n${S.school}`;
};
A.confirmBox = id => {
  const p = D.players[id], q = D.priv[id] || {}, wa = intl(q.phone);
  A.modal(`<h2>تم التسجيل</h2><p>رقم المشارك: <b>${esc(A.regNo(p))}</b> — رمز الربط: <b dir="ltr">${esc(q.linkCode || '')}</b></p><pre style="white-space:pre-wrap;background:var(--soft);padding:12px;border-radius:10px">${esc(A.confirmText(id))}</pre><div class="row">${wa ? `<a class="btn pri" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(A.confirmText(id))}">إرسال التأكيد عبر واتساب</a>` : ''}<button data-copy-conf="${esc(id)}">نسخ النص</button><button data-close>إغلاق</button></div><div id="confQr" style="max-width:160px;margin-top:10px"></div>`);
  A.qrSvg(A.regNo(p), 4).then(s => { const e = document.getElementById('confQr'); if (e) e.innerHTML = s + '<div class="note">رمز الحضور</div>'; }).catch(() => { });
};
}
