/* شطرنج أندلس — إضافات المنصة: التسجيل الإلكتروني وبطاقة المشارك، ساعة الشطرنج، لوحة المتابعة،
   مسح الحضور بالكاميرا، التقارير الشاملة، المساعدة */
{
const A = window.A, { esc, fmtD, fmtDT, money, normPhone, validPhone, intl, digits, now } = A.u, K = A.K, D = A.D;
const fmtN = v => Number(v || 0).toLocaleString('en-US');
const SCHOOL = 'مدارس الأندلس الأهلية';

/* the animated 1984 emblem (ring turns, year stays still) */
A.emb = (size = 56, cls = '') => `<span class="emb2 ${cls}" style="width:${size}px;height:${size}px" role="img" aria-label="شعار مدارس الأندلس الأهلية 1984"><img class="ring" src="ring.png" alt=""><img src="y1984.png" alt=""></span>`;

/* ---------- printing: opens the print dialog (choose «حفظ PDF») ---------- */
A.printHtml = (html, name) => {
  try {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    f.srcdoc = html.replace('</head>', '<style>.noprint{display:none}</style></head>');
    document.body.appendChild(f);
    f.onload = () => setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); A.toast('اختر «حفظ بصيغة PDF» من نافذة الطباعة', 4000); }
      catch (e) { A.save(name + '.html', html); }
      setTimeout(() => f.remove(), 60000);
    }, 700);
  } catch (e) { A.save(name + '.html', html); }
};

/* ---------- participant card ---------- */
const imgP = {};
const img = src => imgP[src] || (imgP[src] = A.img(src).catch(() => null));
async function qrMatrix(text) { const q = await A.QR(); const qr = q(0, 'M'); qr.addData(text); qr.make(); const n = qr.getModuleCount(); return { n, at: (r, c) => qr.isDark(r, c) }; }
const rr = (x, X, Y, W, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); };
function fit(x, text, max, size, font) { let s = size; do { x.font = `700 ${s}px ${font}`; s -= 2; } while (x.measureText(text).width > max && s > 18); return x.font; }
A.cardCanvas = async (p, scale = 1) => {
  const S = A.S(), W = 1012 * scale, H = 638 * scale, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.scale(scale, scale); x.direction = 'rtl';
  try { await document.fonts.load("700 40px 'Reem Kufi'"); await document.fonts.load("500 20px 'IBM Plex Sans Arabic'"); } catch (e) { }
  const HF = "'Reem Kufi','IBM Plex Sans Arabic',Tahoma,sans-serif", BF = "'IBM Plex Sans Arabic',Tahoma,sans-serif";
  const navy = '#123885';
  x.fillStyle = '#fff'; rr(x, 0, 0, 1012, 638, 34); x.fill(); x.save(); rr(x, 0, 0, 1012, 638, 34); x.clip();
  // top band
  const g = x.createLinearGradient(0, 0, 1012, 0); g.addColorStop(0, '#0e2c6b'); g.addColorStop(1, navy); x.fillStyle = g; x.fillRect(0, 0, 1012, 150);
  const st = ['#17a9d9', '#0f69b2', '#9b4fa3', '#e8665d']; st.forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 253, 150, 253, 8); });
  // faint emblem watermark
  const [logo, ring, yr] = await Promise.all([img('logo.png'), img('ring.png'), img('y1984.png')]);
  if (ring) { x.globalAlpha = .06; x.drawImage(ring, 600, 230, 420, 420); x.globalAlpha = 1; }
  // logo on a white plate (right), emblem (left)
  if (logo) { x.fillStyle = '#fff'; rr(x, 1012 - 36 - 300, 28, 300, 94, 18); x.fill(); x.drawImage(logo, 1012 - 36 - 284, 36, 268, 268 * logo.height / logo.width); }
  if (ring) { x.fillStyle = '#fff'; x.beginPath(); x.arc(92, 75, 56, 0, 7); x.fill(); x.drawImage(ring, 40, 23, 104, 104); if (yr) x.drawImage(yr, 40, 23, 104, 104); }
  x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `700 30px ${HF}`; x.fillText('بطاقة مشارك', 430, 66);
  x.font = `500 21px ${BF}`; x.fillText(`${S.name} ${S.season}`, 430, 104);
  // QR (left)
  const code = A.regNo(p);
  try { const m = await qrMatrix(code), box = 250, cs = box / (m.n + 2); x.fillStyle = '#fff'; rr(x, 44, 200, box + 24, box + 24, 18); x.fill(); x.strokeStyle = '#c9d6ea'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#0b1b3a';
    for (let r = 0; r < m.n; r++) for (let k = 0; k < m.n; k++) if (m.at(r, k)) x.fillRect(56 + (k + 1) * cs, 212 + (r + 1) * cs, Math.ceil(cs), Math.ceil(cs)); } catch (e) { }
  x.textAlign = 'center'; x.fillStyle = navy; x.font = `700 26px ${BF}`; x.fillText(code, 44 + 137, 514);
  // name + details (right)
  x.textAlign = 'right'; x.fillStyle = '#0b1b3a'; x.font = fit(x, p.name || '', 620, 50, HF); x.fillText(p.name || '', 968, 258);
  x.font = `500 22px ${BF}`; x.fillStyle = '#55625f'; x.fillText('الفئة', 968, 316);
  const cat = A.catName(p.cat); x.font = `700 28px ${BF}`; const cw = x.measureText(cat).width + 40; x.fillStyle = '#e8f1fb'; rr(x, 968 - cw, 330, cw, 50, 25); x.fill(); x.fillStyle = navy; x.fillText(cat, 948, 365);
  x.font = `500 22px ${BF}`; x.fillStyle = '#55625f'; x.fillText('رقم المشارك', 968, 424); x.font = `700 30px ${BF}`; x.fillStyle = '#0b1b3a'; x.fillText(code, 968, 462);
  // footer
  x.fillStyle = '#f1f6f5'; x.fillRect(0, 560, 1012, 78); x.fillStyle = '#334'; x.font = `500 20px ${BF}`; x.textAlign = 'center';
  x.fillText('احتفظ بهذه البطاقة — يُمسح رمز QR عند الحضور لتسجيل حضورك', 506, 592); x.fillStyle = '#55625f'; x.font = `400 17px ${BF}`; x.fillText(S.school || SCHOOL, 506, 620);
  x.restore(); x.strokeStyle = navy; x.lineWidth = 4; rr(x, 2, 2, 1008, 634, 32); x.stroke();
  return c;
};
const cardName = p => 'بطاقة-' + A.regNo(p) + '-' + String(p.name || '').replace(/\s+/g, '-');
A.cardPNG = async p => { const c = await A.cardCanvas(p, 1); const b = await new Promise(r => c.toBlob(r, 'image/png')); A.save(cardName(p) + '.png', b); };
A.cardsPDF = async (list, name) => {
  list = list || Object.values(D.players).filter(p => !['rejected', 'cancelled'].includes(p.status)).sort((a, b) => a.no - b.no);
  if (!list.length) { A.toast('لا يوجد مشاركون'); return; }
  let jsPDF; try { jsPDF = await A.jsPDF(); } catch (e) { A.toast('تعذّر تحميل مكتبة PDF'); return; }
  A.toast('جارٍ إنشاء ' + list.length + ' بطاقة…', 4000);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' }), cw = 85.6, ch = 54, gx = 12, gy = 10, mx = (210 - 2 * cw - gx) / 2, my = (297 - 4 * ch - 3 * gy) / 2;
  for (let i = 0; i < list.length; i++) {
    if (i && i % 8 === 0) pdf.addPage();
    const k = i % 8, col = k % 2, row = Math.floor(k / 2);
    const c = await A.cardCanvas(list[i], 1);
    pdf.addImage(c.toDataURL('image/jpeg', .92), 'JPEG', mx + (1 - col) * (cw + gx), my + row * (ch + gy), cw, ch);
  }
  A.save((name || 'بطاقات-المشاركين') + '.pdf', pdf.output('blob'));
};
A.cardPDF = p => A.cardsPDF([p], cardName(p));

/* ---------- self-registration through the platform server ---------- */
const ERR = { closed: 'التسجيل مغلق حالياً', name: 'الاسم الكامل مطلوب', type: 'اختر نوع المشارك', phone: 'رقم الجوال يجب أن يكون بصيغة 05xxxxxxxx', terms: 'الموافقة على الشروط مطلوبة', parent: 'موافقة ولي الأمر مطلوبة للطالب', too_many: 'عدد كبير من التسجيلات من هذا الجهاز اليوم — تواصل مع منسّق البطولة' };
A.regServer = async o => {
  let r; try { r = await fetch('/api/chess/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Uid': localStorage.getItem('andalusUid') || '', ...(localStorage.getItem('andalusTok') ? { Authorization: 'Bearer ' + localStorage.getItem('andalusTok') } : {}) }, body: JSON.stringify(o) }); }
  catch (e) { throw new Error('تعذّر الاتصال — تأكد من الإنترنت وأعد المحاولة'); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 409 && j.error === 'dup') { const e = new Error('هذا المشارك مسجّل مسبقاً برقم ' + A.regNo({ no: j.no }) + ' — تجد بطاقته في «بطاقتي».'); e.dup = { id: j.id, no: j.no, name: j.name, cat: j.cat, season: A.S().season }; throw e; }
  if (!r.ok) throw new Error(ERR[j.error] || 'تعذّر التسجيل، حاول مرة أخرى');
  return j;
};
const MY = 'chessCards';
A.myCards = () => { try { return JSON.parse(localStorage.getItem(MY) || '[]'); } catch (e) { return []; } };
A.rememberCard = r => { const L = A.myCards().filter(x => x.id !== r.id); L.unshift({ id: r.id, no: r.no, name: r.name, cat: r.cat, season: r.season || A.S().season }); try { localStorage.setItem(MY, JSON.stringify(L.slice(0, 12))); } catch (e) { } };
const asP = c => Object.assign({}, c, D.players[c.id] || {});
A.showMyCard = async (c, fresh) => {
  const p = asP(c);
  A.modal(`<div class="row" style="gap:10px">${A.emb(48)}<h2 style="margin:0">${fresh ? '✓ تم التسجيل بنجاح' : 'بطاقة المشارك'}</h2></div>
  ${fresh ? `<div class="okbox"><b>احتفظ بهذه البطاقة.</b> نزّلها أو التقط لها صورة، وأحضرها يوم البطولة: يُمسح رمز QR عند وصولك لتسجيل حضورك.</div>` : ''}
  <div id="cardImg" class="cardimg"><div class="empty">جارٍ تجهيز البطاقة…</div></div>
  <p>رقم المشارك: <b dir="ltr">${esc(A.regNo(p))}</b> • الفئة: ${esc(A.catName(p.cat))}<br>رسوم الاشتراك: <b>${fmtN(A.S().fee)} ريال</b> — ${p.paid ? '<span class="pill ok">مسددة</span>' : '<span class="pill warn">تُسدَّد لدى إدارة البطولة</span>'}</p>
  <div class="row"><button class="pri" data-x="cardPng" data-id="${esc(c.id)}">تنزيل البطاقة (صورة)</button><button data-x="cardPdf" data-id="${esc(c.id)}">تنزيل PDF</button><a class="btn" href="#mine" data-close>بطاقتي</a><button data-close>إغلاق</button></div>`);
  try { const cv = await A.cardCanvas(p, 1); const e = document.getElementById('cardImg'); if (e) e.innerHTML = `<img src="${cv.toDataURL('image/png')}" alt="بطاقة ${esc(p.name)}">`; } catch (e) { }
};
const cardById = id => { const m = A.myCards().find(x => x.id === id); return m ? asP(m) : D.players[id] ? Object.assign({ id }, D.players[id]) : null; };

/* ---------- public pages ---------- */
function mine() {
  const L = A.myCards(), S = A.S();
  return `<h2>بطاقتي</h2>
  <p class="note">هنا تجد بطاقات من سجّلتهم من هذا الجهاز، وحالة الطلب والرسوم فقط.</p>
  ${L.length ? `<div class="grid">${L.map(c => { const p = asP(c); return `<div class="card mycard" style="margin:0"><div class="row sp"><div><b>${esc(p.name)}</b><div class="note">${esc(A.regNo(p))} • ${esc(A.catName(p.cat))}</div></div>${A.emb(40)}</div>
    <div class="row" style="margin:10px 0"><span class="pill ${K.REG_CLS[p.status] || ''}">${esc(K.REG[p.status] || 'طلب جديد')}</span>${p.paid ? '<span class="pill ok">الرسوم مسددة</span>' : `<span class="pill warn">الرسوم: ${fmtN(S.fee)} ريال</span>`}</div>
    <div class="row"><button class="pri" data-x="showCard" data-id="${esc(c.id)}">عرض البطاقة و QR</button>${p.no ? `<a class="btn" href="#p-${p.no}">النتائج</a>` : ''}<button class="sm dan" data-x="forget" data-id="${esc(c.id)}">إزالة من الجهاز</button></div></div>`; }).join('')}</div>` : `<div class="empty">لا توجد بطاقات محفوظة على هذا الجهاز. ${S.regOpen ? '<a href="#register">سجّل الآن</a> أو ابحث عن بطاقتك بالأسفل.' : ''}</div>`}
  <form id="findCard" class="card" style="margin-top:18px"><h3>استرجاع بطاقة</h3><p class="note">إذا سجّلت من جهاز آخر: اكتب رقم المشارك ورقم الجوال المسجّل.</p><div class="grid"><label>رقم المشارك<input name="no" dir="ltr" placeholder="AND26-012 أو 12"></label><label>رقم الجوال<input name="phone" dir="ltr" inputmode="tel" placeholder="05xxxxxxxx"></label></div><div id="fcErr" class="warnbox" hidden></div><button class="pri" style="margin-top:10px">عرض بطاقتي</button></form>`;
}
function help() {
  const S = A.S();
  return `<h2>المساعدة</h2><div class="grid help">
  <div class="card"><h3>1. التسجيل</h3><p>افتح «التسجيل»، واكتب الاسم ونوع المشارك ورقم الجوال، ووافق على الشروط ثم اضغط «تسجيل». تظهر لك فوراً <b>بطاقة المشارك</b> برقمك ورمز QR.</p><p class="note">رسوم الاشتراك ${fmtN(S.fee)} ريال لكل مشارك، تُسدَّد لإدارة البطولة ثم يُعتمد التسجيل.</p></div>
  <div class="card"><h3>2. البطاقة و QR</h3><p>نزّل البطاقة أو التقط لها صورة. تجدها دائماً في «بطاقتي» على نفس الجهاز، أو استرجعها برقم المشارك والجوال.</p></div>
  <div class="card"><h3>3. الحضور</h3><p>عند وصولك إلى ${esc(S.place)} اعرض البطاقة على المنظّم ليمسح رمز QR، فيُسجَّل حضورك تلقائياً. احضر قبل بداية الجولة بخمس دقائق.</p></div>
  <div class="card"><h3>4. المباريات والنتائج</h3><p>«المباريات» تعرض توزيع الجولة الحالية والطاولات، و«النتائج» نتائج كل جولة، و«الترتيب» ترتيب كل فئة، و«صفحة اللاعب» سجل مباريات أي لاعب بالبحث باسمه أو رقمه.</p></div>
  <div class="card"><h3>5. زمن المباراة</h3><p>لكل لاعب ${esc(S.tc)} دقيقة${+S.inc ? ' + ' + esc(S.inc) + ' ثانية لكل نقلة' : ''}. من ينتهي وقته يخسر المباراة وفق قواعد البطولة.</p></div>
  <div class="card"><h3>6. تحدي الأسرة</h3><p>يُجمع رصيد الطالب وولي أمره. عند التسجيل اكتب رقم تسجيل الشريك (مثل AND${esc(String(S.season).slice(-2))}-012) في خانة «تحدي الأسرة».</p></div></div>
  ${S.phone || S.wa ? `<p>للاستفسار: ${S.phone ? `<span dir="ltr">${esc(S.phone)}</span>` : ''} ${intl(S.wa) ? `• <a href="https://wa.me/${intl(S.wa)}" target="_blank" rel="noopener">واتساب المنسّق</a>` : ''}</p>` : ''}`;
}

/* ---------- chess clock ---------- */
const CK = A.clk = A.clk || { w: 0, b: 0, run: null, last: 0, flag: null, mins: 0, inc: 0, link: null, moves: { w: 0, b: 0 } };
const fmtT = ms => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return ms < 10000 ? (ms / 1000).toFixed(1) : m + ':' + String(s % 60).padStart(2, '0'); };
function ckReset(mins, inc) { const S = A.S(); CK.mins = +mins || +S.tc || 15; CK.inc = inc !== undefined ? +inc : (+S.inc || 0); CK.w = CK.b = CK.mins * 60000; CK.run = null; CK.flag = null; CK.moves = { w: 0, b: 0 }; CK.done = false; }
if (!CK.mins) ckReset();
let ticking = false;
const startTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
function tick() {
  if (CK.run && !CK.flag) {
    const t = performance.now(); CK[CK.run] -= t - CK.last; CK.last = t;
    if (CK[CK.run] <= 0) { CK[CK.run] = 0; CK.flag = CK.run; CK.run = null; ticking = false; beep(); A.render(true); return; }
  }
  ['w', 'b'].forEach(s => { const e = document.getElementById('ck-' + s); if (e) e.textContent = fmtT(CK[s]); });
  if (CK.run) requestAnimationFrame(tick); else ticking = false;
}
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.value = .2; o.start(); o.stop(a.currentTime + .6); } catch (e) { } if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
function press(side) { // side = the player who just moved
  if (CK.flag || CK.done) return;
  const other = side === 'w' ? 'b' : 'w';
  if (CK.run && CK.run !== side) return;
  if (CK.run === side) { CK[side] += CK.inc * 1000; CK.moves[side]++; }
  CK.run = other; CK.last = performance.now(); startTick(); A.render(true);
}
const linkName = s => { const L = CK.link; if (!L) return s === 'w' ? 'الأبيض' : 'الأسود'; const r = D.rounds[A.roundId(L.c, L.n)], g = r && (r.games || []).find(x => x.bd === L.bd); return g && D.players[g[s]] ? D.players[g[s]].name : (s === 'w' ? 'الأبيض' : 'الأسود'); };
function clockView() {
  const S = A.S(), ap = A.canApprove && A.canApprove(), staff = A.isAdminLvl() || !!A.role();
  const lk = CK.link, r = lk && D.rounds[A.roundId(lk.c, lk.n)], g = r && (r.games || []).find(x => x.bd === lk.bd);
  const flagTxt = CK.flag ? `انتهى وقت ${linkName(CK.flag)} — الفوز لـ${linkName(CK.flag === 'w' ? 'b' : 'w')}` : '';
  const res = CK.flag ? (CK.flag === 'w' ? '0-1' : '1-0') : null;
  const side = s => `<button class="ckside ${CK.run === s ? 'on' : ''} ${CK.flag === s ? 'flag' : ''} ${s === 'b' ? 'top' : ''}" data-ck="${s}" aria-label="ساعة ${linkName(s)}"><span class="ckn">${s === 'w' ? '⚪' : '⚫'} ${esc(linkName(s))}</span><span class="ckt" id="ck-${s}">${fmtT(CK[s])}</span><span class="note">${CK.run === s ? 'يفكّر الآن — اضغط بعد نقلتك' : CK.run ? '' : CK.flag ? '' : s === 'w' ? 'اضغط «ابدأ» لتشغيل ساعة الأبيض' : ''}</span></button>`;
  let linkBox = '';
  if (staff) {
    const cats = K.CATS.filter(c => !A.catLock() || c === A.catLock());
    const opts = cats.flatMap(c => { const R = A.catRounds(c), last = R[R.length - 1]; return last ? (last.games || []).filter(x => !x.res).map(x => `<option value="${c}:${last.n}:${x.bd}" ${lk && lk.c === c && lk.n === last.n && lk.bd === x.bd ? 'selected' : ''}>${esc(A.catName(c))} • ج${last.n} • طاولة ${x.bd}: ${esc(D.players[x.w]?.name || '')} × ${esc(D.players[x.b]?.name || '')}</option>`) : []; }).join('');
    linkBox = `<label style="flex:2 1 280px">ربط الساعة بمباراة (تُسجَّل النتيجة تلقائياً)<select id="ckLink"><option value="">— ساعة حرة —</option>${opts}</select></label>`;
  }
  const after = CK.flag && g && !g.res ? (ap || staff ? `<button class="pri" data-ckres="${res}">اعتماد النتيجة ${res} (خسارة بالوقت)</button>` : '') : '';
  return `<div class="row sp"><div class="row">${A.emb(44)}<h2 style="margin:0">ساعة الشطرنج</h2></div><span class="pill">${esc(CK.mins)} دقيقة لكل لاعب${CK.inc ? ' + ' + esc(CK.inc) + ' ث' : ''}</span></div>
  ${flagTxt ? `<div class="warnbox ckflag">⏰ ${esc(flagTxt)} ${after}</div>` : ''}
  ${g && g.res ? `<div class="okbox">✓ سُجّلت نتيجة هذه المباراة: ${esc(g.res)}</div>` : ''}
  <div class="clock">${side('b')}<div class="ckbar row">${!CK.run && !CK.flag ? `<button class="pri" data-ckgo="1">${CK.moves.w + CK.moves.b || CK.w !== CK.b ? '▶ متابعة' : '▶ ابدأ'}</button>` : ''}${CK.run ? '<button data-ckpause="1">⏸ إيقاف مؤقت</button>' : ''}<button data-ckreset="1">↺ إعادة الضبط</button></div>${side('w')}</div>
  <div class="card row" style="margin-top:14px">${linkBox}<label style="flex:1 1 110px">الدقائق<input id="ckMin" type="number" min="1" max="180" value="${esc(CK.mins)}"></label><label style="flex:1 1 110px">ثوانٍ لكل نقلة<input id="ckInc" type="number" min="0" max="60" value="${esc(CK.inc)}"></label>
   ${g && !g.res && (ap || staff) ? `<div class="row" style="flex:1 1 100%"><span class="note">إنهاء المباراة بنتيجة أخرى:</span><button class="sm" data-ckres="1-0">فوز الأبيض 1-0</button><button class="sm" data-ckres="½-½">تعادل ½-½</button><button class="sm" data-ckres="0-1">فوز الأسود 0-1</button></div>` : ''}</div>
  <p class="note">ضع الجهاز بين اللاعبين: كل لاعب يضغط على ساعته بعد أن ينقل، فتتوقف ساعته وتبدأ ساعة منافسه. عند انتهاء وقت لاعب يُعلن الفوز لمنافسه${staff ? '، وتُعتمد النتيجة بضغطة واحدة إذا كانت الساعة مربوطة بمباراة' : ''}.</p>`;
}
A.pubX = { mine, help, clock: clockView };

/* ---------- admin: follow-up dashboard ---------- */
const bar = (v, max, col) => `<span class="hbar"><i style="width:${max ? Math.round(v / max * 100) : 0}%;background:${col}"></i></span>`;
const ring = (pct, col, label) => `<div class="ringc" style="--p:${Math.max(0, Math.min(100, pct))};--c:${col}"><b>${Math.round(pct)}%</b><span>${label}</span></div>`;
A.regLink = () => location.origin + location.pathname.replace(/[^/]*$/, '') + '#register';
function regCard() {
  const S = A.S(), url = A.regLink(), msg = `التسجيل في ${S.name} ${S.season}\nرسوم الاشتراك: ${fmtN(S.fee)} ريال\nسجّل من الرابط: ${url}`;
  return `<div class="card"><div class="row sp"><h3 style="margin:0">رابط التسجيل لأولياء الأمور</h3><span class="pill ${S.regOpen ? 'ok' : 'bad'}">${S.regOpen ? 'التسجيل مفتوح' : 'التسجيل مغلق'}</span></div>
  <div class="row" style="margin-top:10px;align-items:flex-start"><div id="regQr" class="qrbox"></div><div style="flex:1 1 260px"><input readonly value="${esc(url)}" dir="ltr" style="width:100%" id="regUrl">
  <div class="row" style="margin-top:10px"><button class="pri" data-x="copyReg">نسخ الرابط</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">مشاركة عبر واتساب</a><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">معاينة النموذج</a>
  ${A.can('settings') ? `<button class="${S.regOpen ? 'dan' : 'pri'}" data-x="regToggle">${S.regOpen ? 'إيقاف التسجيل' : 'فتح التسجيل'}</button>` : ''}</div><p class="note">الرابط يفتح نموذج التسجيل مباشرة. عند الإيقاف تظهر لأولياء الأمور رسالة «التسجيل مغلق».</p></div></div></div>`;
}
function todayIdx(S) { const t = new Date().toISOString().slice(0, 10); const i = S.days.findIndex(d => d.date === t); return i >= 0 ? i : (A.ui ? A.ui.day : 0) || 0; }
function dashX() {
  const S = A.S(), P = Object.entries(D.players), act = P.filter(([, p]) => !['rejected', 'cancelled'].includes(p.status)), ap = act.filter(([, p]) => p.status === 'approved');
  const canFin = A.can('finance') || ['sys', 'director', 'finance', 'registrar'].includes(A.role());
  const byCat = K.CATS.map(c => act.filter(([, p]) => p.cat === c).length), maxC = Math.max(1, ...byCat);
  const di = todayIdx(S), key = 'd' + (di + 1), present = ap.filter(([, p]) => p.att && p.att[key]).length;
  const fee = +S.fee || 0, paidAmt = act.reduce((s, [id]) => s + (+((D.priv[id] || {}).payAmount) || 0), 0), due = act.length * fee, unpaidAmt = Math.max(0, due - paidAmt);
  const paidN = act.filter(([, p]) => p.paid).length;
  let done = 0, open = 0, planned = 0;
  K.CATS.forEach(c => { const R = A.catRounds(c); R.forEach(r => (r.games || []).forEach(g => g.res ? done++ : open++)); planned += Math.max(0, S.maxRounds - R.length) * Math.floor(A.eligible(c).length / 2); });
  const target = +S.target || 0, pct = target ? act.length / target * 100 : 0;
  const k = [['إجمالي المسجلين', act.length, 'navy'], ['الطلاب', byCat[0], 'cy'], ['أولياء الأمور', byCat[1] + byCat[2], 'pu'], ['الطلبات الجديدة', act.filter(([, p]) => p.status === 'new').length, 'co'], ['المعتمدون', ap.length, 'ok'],
    ['الحاضرون (اليوم ' + (di + 1) + ')', present, 'ok'], ['المتغيبون', ap.length - present, 'co'], ['المباريات المنفذة', done, 'navy'], ['المباريات المتبقية', open + planned, 'cy']];
  const last = K.CATS.flatMap(c => { const R = A.catRounds(c), r = R[R.length - 1]; return r ? (r.games || []).filter(g => g.res).slice(-3).map(g => ({ c, n: r.n, g })) : []; });
  return `<div class="row sp"><div class="row">${A.emb(52)}<h2 style="margin:0">لوحة المتابعة</h2></div><span class="note">تتحدّث تلقائياً</span></div>
  <div class="kpis dk">${k.map(([l, v, cl]) => `<div class="kpi k-${cl}"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
  <div class="grid dgrid">
   <div class="card"><h3>المسجلون حسب الفئة</h3>${K.CATS.map((c, i) => `<div class="hrow"><span>${esc(A.catName(c))}</span>${bar(byCat[i], maxC, ['#17a9d9', '#123885', '#9b4fa3'][i])}<b>${byCat[i]}</b></div>`).join('')}
    <div class="row" style="margin-top:12px;justify-content:space-around">${ring(pct, '#123885', target ? `من المستهدف (${target})` : 'حدّد العدد المستهدف من الإعدادات')}${ring(ap.length ? present / ap.length * 100 : 0, '#1f9d55', 'نسبة الحضور')}</div></div>
   ${canFin ? `<div class="card"><h3>الرسوم</h3><div class="row" style="justify-content:space-around">${ring(due ? paidAmt / due * 100 : 0, '#1f9d55', 'نسبة التحصيل')}<div class="fin3"><div><span>المستحقة</span><b>${fmtN(due)} ريال</b></div><div><span>المسددة</span><b class="okc">${fmtN(paidAmt)} ريال</b></div><div><span>غير المسددة</span><b class="bdc">${fmtN(unpaidAmt)} ريال</b></div><div><span>المسددون / غير المسددين</span><b>${paidN} / ${act.length - paidN}</b></div></div></div></div>` : ''}
   <div class="card"><h3>آخر النتائج</h3>${last.length ? last.map(x => `<div class="row sp lrow"><span>${esc(A.catName(x.c).split('–').pop().trim())} • ج${x.n} ط${x.g.bd}</span><span>${esc(D.players[x.g.w]?.name || '')} <b>${esc(x.g.res)}</b> ${esc(D.players[x.g.b]?.name || '')}</span></div>`).join('') : '<p class="note">لا توجد نتائج بعد.</p>'}</div>
   <div class="card"><h3>الترتيب الحالي (أول 3)</h3>${K.CATS.map(c => { const T = A.table(c).slice(0, 3); return `<div style="margin-bottom:8px"><b class="note">${esc(A.catName(c))}</b>${T.length && A.catRounds(c).length ? T.map(x => `<div class="row sp lrow"><span><span class="medal m${x.rank}">${x.rank}</span> ${esc(x.p.name)}</span><b>${x.pts}</b></div>`).join('') : '<div class="note">لم تبدأ</div>'}</div>`; }).join('')}</div>
  </div>
  ${regCard()}
  <div class="card"><h3>آخر العمليات</h3>${D.audit.length ? D.audit.slice(0, 8).map(a => `<div class="row sp lrow"><span>${esc(a.act)} ${a.target ? '— ' + esc(a.target) : ''} <span class="note">${esc(a.info || '')}</span></span><span class="note">${esc(fmtDT(a.at))}</span></div>`).join('') : '<p class="note">لا توجد عمليات بعد.</p>'}</div>`;
}
A.admX = { dash: dashX, clock: clockView, help: () => help() + `<div class="card"><h3>للإدارة</h3><p>لوحة المتابعة ← انسخ رابط التسجيل وشاركه، وأوقف التسجيل أو افتحه بزر واحد. الحضور ← «مسح البطاقات بالكاميرا». الجولات ← «توزيع الجولة» (النظام يتجنب تكرار المواجهات). التحكيم أو ساعة الشطرنج ← تسجيل النتائج. التقارير ← PDF و Excel لكل فئة.</p></div>` };

/* ---------- admin: reports, requests, cards ---------- */
A.reportsX = () => `<div class="card" style="margin-top:18px"><h3>التقرير الشامل للمباريات</h3><p class="note">أسماء اللاعبين، رقم المباراة والجولة، النتائج، عدد مرات الفوز والتعادل والخسارة، والترتيب النهائي — بهوية مدارس الأندلس.</p>
  <div class="grid">${[['all', 'كل الفئات'], ...K.CATS.map(c => [c, A.catName(c)])].map(([c, l]) => `<div class="card" style="margin:0"><b>${esc(l)}</b><div class="row" style="margin-top:8px"><button class="pri" data-full="${c}:pdf">PDF</button><button data-full="${c}:xlsx">Excel</button></div></div>`).join('')}</div></div>
  <div class="card"><h3>بطاقات المشاركين و QR</h3><p class="note">بطاقة لكل مشارك فيها الشعار والاسم والفئة ورمز QR. ملف PDF جاهز للطباعة (8 بطاقات في الصفحة).</p><div class="row"><button class="pri" data-act="cards">كل البطاقات PDF</button>${K.CATS.map(c => `<button data-x="cardsCat" data-c="${c}">${esc(A.catName(c))}</button>`).join('')}<button data-x="listQR">قائمة المشاركين مع الأرقام و QR</button></div></div>`;
function fullData(c) {
  const cats = c === 'all' ? K.CATS : [c]; const out = [];
  cats.forEach(cc => {
    const T = A.table(cc), R = A.catRounds(cc); let no = 0;
    const games = R.flatMap(r => (r.games || []).map(g => { no++; const w = D.players[g.w]?.name || '', b = D.players[g.b]?.name || ''; const win = !g.res ? 'لم تنتهِ' : ['1-0', '+-'].includes(g.res) ? w : ['0-1', '-+'].includes(g.res) ? b : g.res === '½-½' ? 'تعادل' : '—'; return [no, r.n, g.bd, w, b, g.res ? (K.RES_LBL[g.res] || g.res) : 'لم تنتهِ', win]; }).concat(r.bye ? [['—', r.n, '—', D.players[r.bye]?.name || '', '', 'استراحة (نقطة)', '']] : []));
    out.push({ name: A.catName(cc) + ' — الترتيب', head: ['المركز', 'رقم التسجيل', 'اللاعب', 'المباريات', 'فوز', 'تعادل', 'خسارة', 'النقاط'], rows: T.map(x => [x.rank, A.regNo(x.p), x.p.name, x.gp + x.bye, x.w, x.d, x.l, x.pts]) });
    out.push({ name: A.catName(cc) + ' — المباريات', head: ['رقم المباراة', 'الجولة', 'الطاولة', 'الأبيض', 'الأسود', 'النتيجة', 'الفائز'], rows: games });
  });
  return out;
}
A.fullReport = (c, fmt) => {
  const secs = fullData(c), title = 'التقرير الشامل للمباريات — ' + (c === 'all' ? 'كل الفئات' : A.catName(c));
  if (fmt === 'xlsx') return A.xlsx(title, secs.map(s => ({ name: s.name.replace(' — ', ' ').slice(0, 30), rows: [s.head, ...s.rows] })));
  const tb = s => `<table><thead><tr>${s.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return A.printDoc(title, secs.map(s => `<h2>${esc(s.name)}</h2>${s.rows.length ? tb(s) : '<p>لا توجد بيانات بعد.</p>'}`).join(''));
};
A.reqX = () => {
  const L = Object.entries(D.players).filter(([id, p]) => (D.priv[id] || {}).partner && !p.duo && !['rejected', 'cancelled'].includes(p.status));
  return L.length ? `<div class="card"><h3>طلبات ربط تحدي الأسرة (${L.length})</h3>${L.map(([id, p]) => { const t = A.byNo(+String(D.priv[id].partner).split('-').pop().replace(/\D/g, '')); return `<div class="row sp lrow"><span><b>${esc(p.name)}</b> (${esc(A.regNo(p))}) يطلب الربط مع <b dir="ltr">${esc(D.priv[id].partner)}</b>${t ? ' — ' + esc(t[1].name) : ' — <span class="note">رقم غير موجود</span>'}</span>${t ? `<button class="sm pri" data-x="linkDuo" data-id="${esc(id)}">ربط</button>` : ''}</div>`; }).join('')}</div>` : '';
};
A.linkByNo = async (id, code) => { const t = A.byNo(+String(code).split('-').pop().replace(/\D/g, '')); if (!t || t[0] === id) { A.toast('رقم الشريك غير صحيح'); return false; } await A.safe(async () => { await A.upd('players/' + id, { duo: t[0] }); await A.upd('players/' + t[0], { duo: id }); await A.log('ربط ثنائي', A.regNo(D.players[id]), 'مع ' + A.regNo(t[1])); }, '✓ تم الربط في تحدي الأسرة'); return true; };

/* ---------- attendance: camera scanning + sheets ---------- */
let cam = null;
async function camScan() {
  A.modal(`<div class="row sp"><h2 style="margin:0">مسح بطاقات الحضور</h2><button data-x="camStop" data-close>إغلاق</button></div><p class="note">وجّه الكاميرا إلى رمز QR في بطاقة المشارك. يُسجَّل الحضور تلقائياً لليوم ${(A.ui.day || 0) + 1}.</p><div class="camwrap"><video id="camV" playsinline muted></video><div class="camframe"></div></div><div id="camMsg" class="camMsg">جارٍ تشغيل الكاميرا…</div><div id="camLog"></div>`);
  const v = document.getElementById('camV');
  try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); cam = { stream, last: '', lastAt: 0 }; v.srcObject = stream; await v.play(); }
  catch (e) { document.getElementById('camMsg').textContent = 'تعذّر تشغيل الكاميرا — اسمح للمتصفح باستخدامها، أو اكتب رقم المشارك في خانة الحضور.'; return; }
  document.getElementById('camMsg').textContent = 'جاهز للمسح';
  let det = null; if ('BarcodeDetector' in window) { try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { } }
  let jsqr = null; if (!det) { try { jsqr = await A.JSQR(); } catch (e) { } }
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  const loop = async () => {
    if (!cam || !document.getElementById('camV')) { stopCam(); return; }
    let txt = null;
    try {
      if (det) { const r = await det.detect(v); if (r[0]) txt = r[0].rawValue; }
      else if (jsqr && v.videoWidth) { cv.width = 480; cv.height = Math.round(480 * v.videoHeight / v.videoWidth); cx.drawImage(v, 0, 0, cv.width, cv.height); const d = cx.getImageData(0, 0, cv.width, cv.height); const r = jsqr(d.data, d.width, d.height); if (r) txt = r.data; }
    } catch (e) { }
    if (txt && (txt !== cam.last || Date.now() - cam.lastAt > 4000)) { cam.last = txt; cam.lastAt = Date.now(); await onScan(txt); }
    setTimeout(loop, 250);
  };
  loop();
}
function stopCam() { if (cam && cam.stream) cam.stream.getTracks().forEach(t => t.stop()); cam = null; }
async function onScan(txt) {
  const n = +String(digits(txt)).split('-').pop().replace(/\D/g, ''), f = n ? A.byNo(n) : null, m = document.getElementById('camMsg'), log = document.getElementById('camLog');
  if (!f) { if (m) { m.className = 'camMsg bad'; m.textContent = '✗ رمز غير معروف: ' + txt; } return; }
  const [id, p] = f, key = 'd' + ((A.ui.day || 0) + 1);
  if (p.status !== 'approved') { if (m) { m.className = 'camMsg warn'; m.textContent = `⚠ ${p.name}: الطلب غير معتمد بعد (${K.REG[p.status] || ''})`; } beep(); return; }
  if (p.att && p.att[key]) { if (m) { m.className = 'camMsg ok'; m.textContent = `✓ ${p.name} — مسجّل حضوره مسبقاً`; } return; }
  await A.markAtt(id, true);
  try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(); o.frequency.value = 1320; o.connect(a.destination); o.start(); o.stop(a.currentTime + .12); } catch (e) { }
  if (m) { m.className = 'camMsg ok'; m.textContent = `✓ تم تسجيل حضور ${p.name} — ${A.catName(p.cat)}`; }
  if (log) log.insertAdjacentHTML('afterbegin', `<div class="note">✓ ${esc(fmtDT(now()))} — ${esc(p.name)} (${esc(A.regNo(p))})</div>`);
}
function attSheet() {
  const S = A.S(), di = A.ui.day || 0, key = 'd' + (di + 1);
  const body = K.CATS.filter(c => !A.catLock() || c === A.catLock()).map(c => { const L = Object.values(D.players).filter(p => p.status === 'approved' && p.cat === c).sort((a, b) => a.no - b.no);
    return `<h2>${esc(A.catName(c))} — اليوم ${di + 1}${S.days[di] && S.days[di].date ? ' (' + esc(fmtD(S.days[di].date)) + ')' : ''}</h2><table><thead><tr><th>#</th><th>رقم التسجيل</th><th>الاسم</th><th>الحضور</th><th>التوقيع</th></tr></thead><tbody>${L.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(A.regNo(p))}</td><td>${esc(p.name)}</td><td>${p.att && p.att[key] ? '✓ حاضر' : '☐'}</td><td style="width:30%"></td></tr>`).join('') || '<tr><td colspan="5">لا يوجد لاعبون معتمدون</td></tr>'}</tbody></table><div style="break-after:page"></div>`; }).join('');
  A.printDoc('كشف الحضور', body);
}
async function listQR() {
  const L = Object.values(D.players).filter(p => !['rejected', 'cancelled'].includes(p.status)).sort((a, b) => a.no - b.no);
  if (!L.length) { A.toast('لا يوجد مشاركون'); return; }
  let rows = ''; for (const p of L) { let svg = ''; try { svg = await A.qrSvg(A.regNo(p), 2); } catch (e) { } rows += `<tr><td>${esc(A.regNo(p))}</td><td>${esc(p.name)}</td><td>${esc(A.catName(p.cat))}</td><td>${esc(K.REG[p.status] || '')}</td><td style="width:90px">${svg}</td></tr>`; }
  A.printDoc('قائمة المشاركين ورموز QR', `<style>td svg{width:70px;height:70px}</style><table><thead><tr><th>رقم التسجيل</th><th>الاسم</th><th>الفئة</th><th>الحالة</th><th>QR</th></tr></thead><tbody>${rows}</tbody></table>`);
}

/* ---------- events ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-x],[data-ck],[data-ckgo],[data-ckpause],[data-ckreset],[data-ckres],[data-full],[data-xcard]'); if (!t) return;
  const d = t.dataset, x = d.x;
  if (d.ck) { press(d.ck); return; }
  if (d.ckgo) { if (!CK.run) { CK.run = CK.moves.w + CK.moves.b || CK.w !== CK.b ? (CK.paused || 'w') : 'w'; CK.last = performance.now(); startTick(); const L = CK.link; if (L && A.canApprove && A.canApprove()) { const r = D.rounds[A.roundId(L.c, L.n)], g = r && r.games.find(z => z.bd === L.bd); if (g && g.st !== 'live' && !g.res) A.setGameSt(L.c, L.n, L.bd, 'live'); } A.render(true); } return; }
  if (d.ckpause) { CK.paused = CK.run; CK.run = null; A.render(true); return; }
  if (d.ckreset) { ckReset(document.getElementById('ckMin')?.value, document.getElementById('ckInc')?.value); A.render(true); return; }
  if (d.ckres) { const L = CK.link; if (!L) return; await A.setResult(L.c, L.n, L.bd, d.ckres); CK.done = true; CK.run = null; A.render(true); return; }
  if (d.full) { const [c, f] = d.full.split(':'); A.fullReport(c, f); return; }
  if (d.xcard) { const p = D.players[d.xcard]; if (!p) return; A.modal(`<h2>بطاقة ${esc(p.name)}</h2><div id="cardImg" class="cardimg"><div class="empty">جارٍ التجهيز…</div></div><div class="row"><button class="pri" data-x="cardPng" data-id="${esc(d.xcard)}">تنزيل صورة</button><button data-x="cardPdf" data-id="${esc(d.xcard)}">تنزيل PDF</button><button data-close>إغلاق</button></div>`); const cv = await A.cardCanvas(Object.assign({ id: d.xcard }, p)); const el = document.getElementById('cardImg'); if (el) el.innerHTML = `<img src="${cv.toDataURL('image/png')}" alt="">`; return; }
  if (x === 'showCard') { const m = A.myCards().find(c => c.id === d.id); if (m) A.showMyCard(m); }
  else if (x === 'forget') { try { localStorage.setItem(MY, JSON.stringify(A.myCards().filter(c => c.id !== d.id))); } catch (err) { } A.render(true); }
  else if (x === 'cardPng') { const p = cardById(d.id); if (p) A.cardPNG(p); }
  else if (x === 'cardPdf') { const p = cardById(d.id); if (p) A.cardPDF(p); }
  else if (x === 'cardsCat') A.cardsPDF(Object.values(D.players).filter(p => p.cat === d.c && !['rejected', 'cancelled'].includes(p.status)).sort((a, b) => a.no - b.no), 'بطاقات-' + A.catName(d.c).replace(/\s+/g, '-'));
  else if (x === 'listQR') listQR();
  else if (x === 'copyReg') { const u = A.regLink(); try { await navigator.clipboard.writeText(u); A.toast('✓ تم نسخ رابط التسجيل'); } catch (err) { const i = document.getElementById('regUrl'); if (i) { i.select(); document.execCommand('copy'); A.toast('✓ تم نسخ رابط التسجيل'); } } }
  else if (x === 'regToggle') { const open = !A.S().regOpen; await A.saveSettings({ regOpen: open }); A.toast(open ? '✓ فُتح التسجيل' : '✓ أُوقف التسجيل'); }
  else if (x === 'saveAll') { const patch = {}; document.querySelectorAll('[data-set]').forEach(i => { patch[i.dataset.set] = i.type === 'number' || i.type === 'range' ? +i.value : i.value; }); document.querySelectorAll('[data-setb]').forEach(i => patch[i.dataset.setb] = i.checked); const S = A.S(); document.querySelectorAll('[data-setn]').forEach(i => { const [k, sub] = i.dataset.setn.split('.'); patch[k] = Object.assign({}, S[k], patch[k] || {}, { [sub]: i.type === 'number' ? +i.value : i.value }); }); await A.saveSettings(patch); }
  else if (x === 'camScan') camScan();
  else if (x === 'camStop') stopCam();
  else if (x === 'attSheet') attSheet();
  else if (x === 'linkDuo') A.linkByNo(d.id, D.priv[d.id].partner);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'ckLink') { const v = t.value; CK.link = v ? (([c, n, bd]) => ({ c, n: +n, bd: +bd }))(v.split(':')) : null; ckReset(CK.mins, CK.inc); A.render(true); }
  else if (t.id === 'ckMin' || t.id === 'ckInc') { if (!CK.run) { ckReset(document.getElementById('ckMin').value, document.getElementById('ckInc').value); A.render(true); } }
  else if (t.name === 'type' && t.closest('#regf')) regType(t.form);
});
function regType(f) { const st = f.elements.type.value === 'student'; f.querySelectorAll('[data-only=student]').forEach(el => el.hidden = !st); }
document.addEventListener('submit', async e => {
  if (e.target.id !== 'findCard') return; e.preventDefault();
  const f = e.target, box = document.getElementById('fcErr'); box.hidden = true;
  try { const r = await fetch('/api/chess/card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ no: f.elements.no.value, phone: f.elements.phone.value }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { box.hidden = false; box.textContent = 'لم نجد بطاقة بهذا الرقم والجوال. تأكد من البيانات.'; return; }
    A.rememberCard(j); A.render(true); A.showMyCard(j); } catch (err) { box.hidden = false; box.textContent = 'تعذّر الاتصال، حاول مرة أخرى.'; }
});
addEventListener('hashchange', () => { const m = document.getElementById('modal'); if (m && m.classList.contains('on')) A.closeModal(); });
/* after each render: registration form type, registration QR on the dashboard, modal camera cleanup */
new MutationObserver(() => {
  const f = document.getElementById('regf'); if (f && !f.dataset.t) { f.dataset.t = 1; regType(f); }
  const q = document.getElementById('regQr'); if (q && !q.dataset.t) { q.dataset.t = 1; A.qrSvg(A.regLink(), 3).then(s => { q.innerHTML = s; }).catch(() => { q.remove(); }); }
  if (cam && !document.getElementById('camV')) stopCam();
}).observe(document.getElementById('root').parentNode, { childList: true, subtree: true });
}
