/* شطرنج أندلس — إضافات المنصة: التسجيل الإلكتروني وبطاقة المشارك، ساعة الشطرنج، لوحة المتابعة،
   مسح الحضور بالكاميرا، التقارير الشاملة، المساعدة */
{
const A = window.A, { esc, fmtD, fmtDT, money, normPhone, validPhone, intl, digits, now } = A.u, K = A.K, D = A.D;
/* photo or the category's default avatar (same style for all, in the school colours) */
A.avatar = p => 'avatars/' + ({ student: 'student', father: 'man', mother: 'woman' }[p && p.type] || { 1: 'student', 2: 'man', 3: 'woman' }[p && p.cat] || 'student') + '.svg';
A.photoOf = (p, id) => { id = id || (p && p.id); const mine = id && (JSON.parse(localStorage.getItem('chessCards') || '[]').find(c => c.id === id) || {}).photo; const ph = (p && p.photo) || (id && (A.D.priv[id] || {}).photo) || mine; return ph ? '/_blob/' + encodeURIComponent(ph) : A.avatar(p); };
A.thumb = (p, id, size = 44) => `<img class="pthumb" src="${A.photoOf(p, id)}" alt="" width="${size}" height="${Math.round(size * 1.25)}" loading="lazy" onerror="this.onerror=null;this.src='${A.avatar(p)}'">`;
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
  // photo (right) — kept private: only the participant's own card and the organisers can load it
  const phId = p.photo || (p.id && (D.priv[p.id] || {}).photo) || '';
  const ph = (phId ? await A.img('/_blob/' + encodeURIComponent(phId)).catch(() => null) : null) || await img(A.avatar(p));
  let R = 968;
  if (ph) { const pw = 172, phh = 215, px = 968 - pw, py = 196; x.save(); rr(x, px, py, pw, phh, 18); x.clip(); const sc = Math.max(pw / ph.width, phh / ph.height), dw = ph.width * sc, dh = ph.height * sc; x.drawImage(ph, px + (pw - dw) / 2, py + (phh - dh) / 2, dw, dh); x.restore(); x.strokeStyle = navy; x.lineWidth = 4; rr(x, px, py, pw, phh, 18); x.stroke(); R = px - 26; }
  // name + details
  const nmax = R - 360;
  x.textAlign = 'right'; x.fillStyle = '#0b1b3a'; x.font = fit(x, p.name || '', nmax, ph ? 42 : 50, HF); x.fillText(p.name || '', R, 258);
  x.font = `500 22px ${BF}`; x.fillStyle = '#55625f'; x.fillText('الفئة', R, 316);
  const cat = A.catName(p.cat); x.font = fit(x, cat, nmax - 40, 28, BF); const cw = x.measureText(cat).width + 40; x.fillStyle = '#e8f1fb'; rr(x, R - cw, 330, cw, 50, 25); x.fill(); x.fillStyle = navy; x.fillText(cat, R - 20, 365);
  x.font = `500 22px ${BF}`; x.fillStyle = '#55625f'; x.fillText('رقم المشارك', R, 424); x.font = `700 30px ${BF}`; x.fillStyle = '#0b1b3a'; x.fillText(code, R, 462);
  // footer
  x.fillStyle = '#f1f6f5'; x.fillRect(0, 560, 1012, 78); x.fillStyle = '#334'; x.font = `500 20px ${BF}`; x.textAlign = 'center';
  x.fillText('احتفظ بهذه البطاقة — يُمسح رمز QR عند الحضور لتسجيل حضورك', 506, 592); x.fillStyle = '#55625f'; x.font = `400 17px ${BF}`; x.fillText(S.school || SCHOOL, 506, 620);
  x.restore(); x.strokeStyle = navy; x.lineWidth = 4; rr(x, 2, 2, 1008, 634, 32); x.stroke();
  return c;
};
A.plist = f => Object.entries(D.players).filter(([, p]) => f(p)).map(([id, p]) => Object.assign({ id }, p)).sort((a, b) => a.no - b.no);
/* photo: crop to 4:5 and shrink before sending (small file, fast card) */
A.shrinkPhoto = file => new Promise((res, rej) => { if (!file || !/^image\//.test(file.type)) return rej(new Error('type')); const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const W = 400, H = 500, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), sc = Math.max(W / im.width, H / im.height); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(im, (W - im.width * sc) / 2, (H - im.height * sc) / 2, im.width * sc, im.height * sc); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .82)); };
  im.onerror = () => rej(new Error('img')); im.src = u; });
const cardName = p => 'بطاقة-' + A.regNo(p) + '-' + String(p.name || '').replace(/\s+/g, '-');
A.cardPNG = async p => { const c = await A.cardCanvas(p, 1); const b = await new Promise(r => c.toBlob(r, 'image/png')); A.save(cardName(p) + '.png', b); };
A.cardsPDF = async (list, name) => {
  list = list || A.plist(p => !['rejected', 'cancelled'].includes(p.status));
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
const ERR = { closed: 'التسجيل مغلق حالياً', name: 'الاسم الكامل مطلوب', type: 'اختر نوع المشارك', phone: 'رقم الجوال يجب أن يكون بصيغة 05xxxxxxxx', terms: 'الموافقة على الشروط مطلوبة', parent: 'موافقة ولي الأمر مطلوبة للطالب', photo: 'الصورة غير صالحة أو كبيرة جداً — اختر صورة أخرى', too_many: 'عدد كبير من التسجيلات من هذا الجهاز اليوم — تواصل مع منسّق البطولة' };
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
A.rememberCard = r => { const L = A.myCards().filter(x => x.id !== r.id); L.unshift({ id: r.id, no: r.no, name: r.name, cat: r.cat, season: r.season || A.S().season, photo: r.photo || '' }); try { localStorage.setItem(MY, JSON.stringify(L.slice(0, 12))); } catch (e) { } };
const asP = c => Object.assign({}, c, D.players[c.id] || {}, { id: c.id, photo: c.photo || (D.priv[c.id] || {}).photo || '' });
A.showMyCard = async (c, fresh) => {
  const p = asP(c);
  A.modal(`<div class="row" style="gap:10px">${A.emb(48)}<h2 style="margin:0">${fresh ? '✓ تم التسجيل بنجاح' : 'بطاقة المشارك'}</h2></div>
  ${fresh ? `<div class="okbox"><b>احتفظ بهذه البطاقة.</b> نزّلها أو التقط لها صورة، وأحضرها يوم البطولة: يُمسح رمز QR عند وصولك لتسجيل حضورك.</div>` : ''}
  <div id="cardImg" class="cardimg"><div class="empty">جارٍ تجهيز البطاقة…</div></div>
  <p>رقم المشارك: <b dir="ltr">${esc(A.regNo(p))}</b> • الفئة: ${esc(A.catName(p.cat))}<br>رسوم الاشتراك: <b>${fmtN(A.S().fee)} ريال</b> — ${p.paid ? '<span class="pill ok">مسددة</span>' : '<span class="pill warn">تُسدَّد لدى إدارة البطولة</span>'}</p>
  <div class="row"><button class="pri" data-x="cardPng" data-id="${esc(c.id)}">تنزيل البطاقة (صورة)</button><button data-x="cardPdf" data-id="${esc(c.id)}">تنزيل PDF</button><a class="btn" href="#mine" data-close>بطاقتي</a><button data-close>إغلاق</button></div>`);
  try { const cv = await A.cardCanvas(p, 1); const e = document.getElementById('cardImg'); if (e) e.innerHTML = `<img src="${cv.toDataURL('image/png')}" alt="بطاقة ${esc(p.name)}">`; } catch (e) { }
};
const cardById = id => { const m = A.myCards().find(x => x.id === id); return m ? asP(m) : D.players[id] ? Object.assign({ id }, D.players[id], { photo: (D.priv[id] || {}).photo || '' }) : null; };

/* ---------- public pages ---------- */
function mine() {
  const L = A.myCards(), S = A.S();
  return `<h2>بطاقتي</h2>
  <p class="note">هنا تجد بطاقات من سجّلتهم من هذا الجهاز، وحالة الطلب والرسوم فقط.</p>
  ${L.length ? `<div class="grid">${L.map(c => { const p = asP(c); return `<div class="card mycard" style="margin:0"><div class="row sp"><div class="row" style="flex-wrap:nowrap">${A.thumb(p, c.id, 56)}<div><b>${esc(p.name)}</b><div class="note">${esc(A.regNo(p))} • ${esc(A.catName(p.cat))}</div></div></div>${A.emb(40)}</div>
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
  if (p.archived || p.status === 'cancelled') { if (m) { m.className = 'camMsg bad'; m.textContent = `✗ ${p.name}: التسجيل ملغى (مؤرشف)`; } beep(); return; }
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

/* ---------- admin: card with photo, delete participant ---------- */
const canManage = A.canManageP = () => A.isAdminLvl() && (A.st.level === 'owner' || ['sys', 'director', 'registrar'].includes(A.role()));
A.cardModal = async id => {
  const p = D.players[id]; if (!p) return; const ph = (D.priv[id] || {}).photo;
  A.modal(`<h2>بطاقة ${esc(p.name)}</h2><div id="cardImg" class="cardimg"><div class="empty">جارٍ التجهيز…</div></div>
  <div class="row"><button class="pri" data-x="cardPng" data-id="${esc(id)}">تنزيل صورة</button><button data-x="cardPdf" data-id="${esc(id)}">تنزيل PDF</button>
  ${canManage() ? `<label class="btn" style="flex-direction:row">${ph ? 'تغيير الصورة الشخصية' : 'إضافة صورة شخصية'}<input type="file" accept="image/*" data-xphoto="${esc(id)}" hidden></label>${ph ? `<button data-x="rmPhoto" data-id="${esc(id)}">إزالة الصورة</button>` : ''}<button class="dan" data-x="delP" data-id="${esc(id)}">حذف المشارك</button>` : ''}<button data-close>إغلاق</button></div>`);
  const cv = await A.cardCanvas(Object.assign({ id }, p, { photo: ph || '' })); const el = document.getElementById('cardImg'); if (el) el.innerHTML = `<img src="${cv.toDataURL('image/png')}" alt="">`;
};
const setPhoto = A.setPhoto = async (id, file) => {
  if (!A.st.assets) { A.toast('رفع الصور متاح للإدارة فقط'); return; }
  A.toast('جارٍ رفع الصورة…');
  try { const du = await A.shrinkPhoto(file); const blob = await (await fetch(du)).blob(); const r = await A.st.assets.upload(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    const q = Object.assign({}, D.priv[id] || {}, { photo: r.id }); await A.put('private/' + id, q); D.priv[id] = q; await A.log('صورة المشارك', A.regNo(D.players[id]), 'رفع صورة'); A.toast('✓ أُضيفت الصورة إلى البطاقة'); A.cardModal(id); }
  catch (e) { A.toast('تعذّر رفع الصورة — اختر صورة بصيغة JPG أو PNG', 4000); }
};
const playedGames = id => Object.values(D.rounds).some(r => (r.games || []).some(g => g.w === id || g.b === id) || r.bye === id);
const isBoss = A.isBoss = () => A.st.level === 'owner' || A.role() === 'sys';
/* archive (cancel registration, reversible) is the default; permanent delete is for the manager only */
function delPlayer(id) {
  const p = D.players[id]; if (!p) return; const played = playedGames(id);
  A.modal(`<h2>إلغاء تسجيل ${esc(p.name)}</h2><p class="note">${esc(A.regNo(p))} • ${esc(A.catName(p.cat))}</p>
  <div class="card" style="margin:10px 0"><h3>📦 أرشفة (موصى بها)</h3><p>يُلغى التسجيل ويختفي المشارك من القوائم العامة وتوزيع الجولات القادمة، مع <b>الاحتفاظ</b> ببياناته ودفعاته وحضوره ونتائجه. لا تُقبل بطاقته عند مسح الحضور. <b>يمكن استعادته</b> في أي وقت من «المشتركون والمدفوعات ← المؤرشفون».</p>
   <form id="archF" data-id="${esc(id)}"><label>السبب *<input name="reason" required placeholder="مثال: طلب ولي الأمر"></label><button class="pri" style="margin-top:8px">أرشفة</button></form></div>
  ${isBoss() ? `<div class="card" style="margin:10px 0;border-color:#d0453b"><h3>🗑️ حذف نهائي (للمدير فقط)</h3>${played ? '<p>لا يمكن الحذف النهائي: المشارك لعب مباريات، وحذفه يُفسد نتائج منافسيه والترتيب. استخدم الأرشفة.</p>' : `<p>يُحذف التسجيل وبيانات التواصل والدفعات وسجل الحضور، وتصبح بطاقته ورمز QR غير صالحين. <b>لا يمكن التراجع</b> إلا من نسخة احتياطية (تُحفظ تلقائياً قبل الحذف). تُسجَّل العملية في سجل التدقيق.</p>
   <form id="delPF" data-id="${esc(id)}"><label>اكتب «حذف» للتأكيد<input name="confirm" required autocomplete="off"></label><label>السبب *<input name="reason" required></label><button class="pri dan" style="margin-top:8px">حذف نهائياً</button></form>`}</div>` : '<p class="note">الحذف النهائي متاح لمدير النظام فقط.</p>'}
  <div class="row"><button data-close>إلغاء</button></div>`);
}
A.archiveP = async (id, reason) => {
  const p = D.players[id], q = D.priv[id] || {}; if (!p) return;
  const hist = (q.history || []).concat([{ at: now(), text: 'أرشفة (إلغاء التسجيل) — ' + reason }]).slice(-40);
  await A.safe(async () => {
    await A.upd('players/' + id, { status: 'cancelled', archived: true, withdrawn: true, prevStatus: p.status, prevWithdrawn: !!p.withdrawn, archivedAt: now() });
    await A.put('private/' + id, Object.assign({}, q, { history: hist }));
    await A.log('أرشفة مشارك', A.regNo(p), p.name + ' — ' + reason, p.status, 'cancelled');
  }, '✓ أُرشف المشارك — يمكن استعادته من قائمة المؤرشفين');
  A.closeModal();
};
A.restoreP = async id => {
  const p = D.players[id], q = D.priv[id] || {}; if (!p) return;
  const st = p.prevStatus && p.prevStatus !== 'cancelled' ? p.prevStatus : 'new';
  const hist = (q.history || []).concat([{ at: now(), text: 'استعادة من الأرشيف' }]).slice(-40);
  await A.safe(async () => {
    await A.upd('players/' + id, { status: st, archived: false, withdrawn: !!p.prevWithdrawn, archivedAt: '' });
    await A.put('private/' + id, Object.assign({}, q, { history: hist }));
    await A.log('استعادة مشارك', A.regNo(p), p.name, 'cancelled', st);
  }, '✓ استُعيد المشارك');
};
async function doDelete(id, reason) {
  const p = D.players[id]; if (!p || !isBoss() || playedGames(id)) return;
  const ok = await A.safe(async () => {
    await A.backup('قبل حذف ' + A.regNo(p));
    if (p.duo && D.players[p.duo]) await A.upd('players/' + p.duo, { duo: '' });
    await A.del('players/' + id); await A.del('private/' + id).catch(() => { });
    await A.log('حذف مشارك نهائياً', A.regNo(p), p.name + ' — ' + reason);
    delete D.players[id]; delete D.priv[id]; return true;
  }, '✓ حُذف المشارك نهائياً');
  if (ok) { A.closeModal(); A.render(true); }
}

/* ---------- subscribers & payments (management only) ---------- */
const canPay = () => A.st.level === 'owner' || ['sys', 'director', 'finance', 'registrar'].includes(A.role());
const SU = { c: 'all', q: '', pay: '' };
const payOf = id => { const q = D.priv[id] || {}, p = D.players[id] || {}; return { paid: !!p.paid, amt: +q.payAmount || 0, date: q.payDate || '', note: q.payNote || '', method: q.payMethod || '' }; };
function subRows() {
  const q = digits(SU.q).trim(); let L = Object.entries(D.players);
  L = SU.c === 'arch' ? L.filter(([, p]) => p.archived || p.status === 'cancelled') : L.filter(([, p]) => !p.archived && p.status !== 'cancelled' && p.status !== 'rejected');
  if (K.CATS.includes(SU.c)) L = L.filter(([, p]) => p.cat === SU.c);
  if (SU.pay === 'paid') L = L.filter(([, p]) => p.paid); else if (SU.pay === 'unpaid') L = L.filter(([, p]) => !p.paid);
  if (q) { const n = q.split('-').pop().replace(/\D/g, ''); L = L.filter(([, p]) => p.name.includes(q) || A.regNo(p).toUpperCase().includes(q.toUpperCase()) || (n && String(p.no) === String(+n))); }
  return L.sort((a, b) => a[1].cat.localeCompare(b[1].cat) || a[1].no - b[1].no);
}
function subsPage() {
  const S = A.S(), fee = +S.fee || 0, act = Object.entries(D.players).filter(([, p]) => !p.archived && !['cancelled', 'rejected'].includes(p.status));
  const paidAmt = act.reduce((s, [id]) => s + payOf(id).amt, 0), due = act.length * fee, paidN = act.filter(([, p]) => p.paid).length;
  const L = subRows(), arch = SU.c === 'arch', cp = canPay(), cm = A.canManageP();
  const catStat = c => { const X = act.filter(([, p]) => p.cat === c); return `${X.length} • 🟢 ${X.filter(([, p]) => p.paid).length} • 🔴 ${X.filter(([, p]) => !p.paid).length}`; };
  let hc = false;
  const row = ([id, p], i) => { const y = payOf(id), q = D.priv[id] || {}; return `<tr class="${p.paid ? 'paidrow' : ''}"><td class="n">${i + 1}</td><td class="n">${esc(A.regNo(p))}</td><td><div class="row" style="flex-wrap:nowrap;gap:8px">${A.thumb(p, id, 36)}<div><b>${esc(p.name)}</b><br><span class="note">${esc(K.TYPES[p.type] || '')}</span></div></div></td>${hc ? '' : `<td>${esc(A.catName(p.cat))}</td>`}<td class="n" dir="ltr">${esc(q.phone || '')}</td>
    <td>${arch ? '<span class="pill bad">مؤرشف</span>' : `<span class="pill ${K.REG_CLS[p.status] || ''}">${esc(K.REG[p.status] || '')}</span>`}</td>
    <td>${p.paid ? '<span class="paybadge ok">🟢 تم الدفع</span>' : '<span class="paybadge no">🔴 لم يتم الدفع بعد</span>'}</td><td class="n">${y.amt ? fmtN(y.amt) + ' ريال' : '—'}</td><td class="n">${esc(y.date || '—')}</td><td>${esc(y.note || '')}</td>
    <td><div class="row">${cp && !arch ? `<button class="sm ${p.paid ? '' : 'pri'}" data-x="payM" data-id="${esc(id)}">${p.paid ? 'تعديل الدفع' : 'تسجيل الدفع'}</button>` : ''}<button class="sm" data-xcard="${esc(id)}">البطاقة</button>${cm ? (arch ? `<button class="sm pri" data-x="restoreP" data-id="${esc(id)}">استعادة</button>` : `<button class="sm dan" data-x="delP" data-id="${esc(id)}">إلغاء/حذف</button>`) : ''}</div></td></tr>`; };
  const table = (rows, h) => { hc = !!h; return rows.length ? `<div class="scroll"><table class="stack subt"><thead><tr><th>#</th><th>رقم التسجيل</th><th>الاسم</th>${hc ? '' : '<th>الفئة</th>'}<th>الجوال</th><th>حالة الطلب</th><th>السداد</th><th>المبلغ</th><th>تاريخ السداد</th><th>ملاحظات</th><th></th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>` : '<div class="empty">لا يوجد مشتركون بهذه التصفية.</div>'; };
  return `<div class="row sp"><div class="row">${A.emb(46)}<h2 style="margin:0">المشتركون والمدفوعات</h2></div><div class="row"><button data-x="subX" data-f="xlsx">⬇ Excel</button><button data-x="subX" data-f="pdf">⬇ PDF</button></div></div>
  <div class="kpis dk">${[['إجمالي المشتركين', act.length, 'navy'], ['🟢 سددوا', paidN, 'ok'], ['🔴 لم يسددوا', act.length - paidN, 'co'], ['المبالغ المسددة', fmtN(paidAmt) + ' ريال', 'ok'], ['المبالغ المتبقية', fmtN(Math.max(0, due - paidAmt)) + ' ريال', 'co'], ['المستحق الكلي', fmtN(due) + ' ريال', 'navy']].map(([l, v, c]) => `<div class="kpi k-${c}"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
  <div class="cats subtabs">${[['all', 'الكل (قائمة موحدة)'], ...K.CATS.map(c => [c, A.catName(c)]), ['arch', '📦 المؤرشفون']].map(([k, l]) => `<button data-x="suC" data-c="${k}" class="${SU.c === k ? 'on' : ''}">${esc(l)}${K.CATS.includes(k) ? `<small> (${catStat(k)})</small>` : ''}</button>`).join('')}</div>
  <div class="row card"><label style="flex:2 1 240px">بحث بالاسم أو رقم التسجيل<input id="sq" value="${esc(SU.q)}" placeholder="مثال: أحمد أو AND26-012"></label><label style="flex:1 1 170px">حالة السداد<select id="spay"><option value="">الكل</option><option value="paid" ${SU.pay === 'paid' ? 'selected' : ''}>🟢 تم الدفع</option><option value="unpaid" ${SU.pay === 'unpaid' ? 'selected' : ''}>🔴 لم يتم الدفع بعد</option></select></label></div>
  ${SU.c === 'all' && !SU.q && !SU.pay ? K.CATS.map(c => { const R = L.filter(([, p]) => p.cat === c); return `<h3 style="margin-top:18px">${esc(A.catName(c))} <span class="note">(${R.length})</span></h3>${table(R, true)}`; }).join('') : table(L, K.CATS.includes(SU.c))}
  <p class="note">تغيير حالة السداد متاح لفريق الإدارة فقط، ولا يرى أولياء الأمور حالة سداد غيرهم أو أي بيانات مالية.</p>`;
}
function payModal(id) {
  const p = D.players[id], y = payOf(id), S = A.S();
  A.modal(`<h2>السداد — ${esc(p.name)}</h2><p class="note">${esc(A.regNo(p))} • ${esc(A.catName(p.cat))} • الرسوم ${fmtN(S.fee)} ريال</p><form id="payX" data-id="${esc(id)}">
  <div class="row paych"><label class="ck"><input type="radio" name="st" value="paid" ${p.paid || !y.amt ? 'checked' : ''}> 🟢 تم الدفع</label><label class="ck"><input type="radio" name="st" value="unpaid" ${!p.paid && y.amt ? 'checked' : ''}> 🔴 لم يتم الدفع بعد</label></div>
  <div class="grid"><label>المبلغ المدفوع (ريال)<input name="amount" inputmode="decimal" value="${esc(y.amt || S.fee)}"></label><label>تاريخ السداد<input type="date" name="date" value="${esc(y.date || new Date().toISOString().slice(0, 10))}"></label><label>وسيلة الدفع<select name="method">${Object.entries(K.PAYM).map(([k, v]) => `<option value="${k}" ${y.method === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
  <label>ملاحظات<textarea name="note" placeholder="مثال: دُفع نقداً للمنسّق">${esc(y.note)}</textarea></label>
  <div class="row" style="margin-top:12px"><button class="pri">حفظ</button><button type="button" data-close>إلغاء</button></div></form>`);
}
async function savePayX(f) {
  const id = f.dataset.id, p = D.players[id], q = D.priv[id] || {}, S = A.S(), fd = new FormData(f);
  const paid = fd.get('st') === 'paid', amt = paid ? (+digits(fd.get('amount')) || 0) : 0;
  if (paid && amt <= 0) { A.toast('أدخل المبلغ المدفوع'); return; }
  const st = paid ? (['new', 'await'].includes(p.status) ? 'paid' : p.status) : (p.status === 'paid' ? 'await' : p.status);
  const txt = paid ? `تم الدفع: ${amt} ريال بتاريخ ${fd.get('date')} (${K.PAYM[fd.get('method')]})` : 'تغيير السداد إلى: لم يتم الدفع';
  const hist = (q.history || []).concat([{ at: now(), text: txt + (fd.get('note') ? ' — ' + fd.get('note') : '') }]).slice(-40);
  await A.safe(async () => {
    await A.put('private/' + id, Object.assign({}, q, { payAmount: amt, payDate: paid ? fd.get('date') : '', payMethod: fd.get('method'), payNote: String(fd.get('note') || '').slice(0, 300), history: hist }));
    await A.upd('players/' + id, { paid: paid && amt >= (+S.fee || 0) ? true : paid, status: st });
    await A.log(paid ? 'تسجيل دفع' : 'إلغاء حالة الدفع', A.regNo(p), txt, q.payAmount || 0, amt);
    A.closeModal();
  }, paid ? '✓ سُجّل الدفع' : '✓ عُدّلت حالة السداد');
}
function subExport(fmt) {
  const S = A.S(), head = ['رقم التسجيل', 'الاسم', 'الفئة', 'النوع', 'الجوال', 'حالة الطلب', 'السداد', 'المبلغ المدفوع', 'المتبقي', 'تاريخ السداد', 'وسيلة الدفع', 'ملاحظات'];
  const toRow = ([id, p]) => { const y = payOf(id), q = D.priv[id] || {}; return [A.regNo(p), p.name, A.catName(p.cat), K.TYPES[p.type] || '', q.phone || '', p.archived ? 'مؤرشف' : K.REG[p.status] || '', p.paid ? 'تم الدفع' : 'لم يتم الدفع بعد', y.amt, Math.max(0, (+S.fee || 0) - y.amt), y.date, K.PAYM[y.method] || '', y.note]; };
  const L = subRows(), cats = K.CATS.includes(SU.c) ? [SU.c] : K.CATS;
  const secs = SU.c === 'arch' ? [{ name: 'المؤرشفون', rows: L.map(toRow) }] : [{ name: 'جميع المشتركين', rows: L.map(toRow) }, ...(K.CATS.includes(SU.c) ? [] : cats.map(c => ({ name: A.catName(c), rows: L.filter(([, p]) => p.cat === c).map(toRow) })))];
  const sum = rows => ['الإجمالي', rows.length + ' مشترك', '', '', '', '', rows.filter(r => r[6] === 'تم الدفع').length + ' سددوا', rows.reduce((s, r) => s + (+r[7] || 0), 0), rows.reduce((s, r) => s + (+r[8] || 0), 0), '', '', ''];
  const title = 'كشف المشتركين والمدفوعات' + (K.CATS.includes(SU.c) ? ' — ' + A.catName(SU.c) : SU.c === 'arch' ? ' — المؤرشفون' : '');
  if (fmt === 'xlsx') return A.xlsx(title, secs.map(s => ({ name: s.name.slice(0, 30), rows: [head, ...s.rows, sum(s.rows)] })));
  const tb = rows => `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td${i === 6 ? ` style="color:${v === 'تم الدفع' ? '#1f9d55' : '#d0453b'};font-weight:700"` : ''}>${esc(v)}</td>`).join('')}</tr>`).join('')}<tr style="background:#eef4fb;font-weight:700">${sum(rows).map(v => `<td>${esc(v)}</td>`).join('')}</tr></tbody></table>`;
  A.printDoc(title, `<style>table{font-size:11px}</style>` + secs.slice(secs.length > 1 ? 1 : 0).map(s => `<h2>${esc(s.name)}</h2>${s.rows.length ? tb(s.rows) : '<p>لا يوجد.</p>'}`).join(''));
}
A.admX.subs = subsPage;
document.addEventListener('input', e => { if (e.target.id !== 'sq') return; SU.q = e.target.value; clearTimeout(SU.t); SU.t = setTimeout(() => { const pos = e.target.selectionStart; A.render(true); const i = document.getElementById('sq'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) { } } }, 250); });
document.addEventListener('change', e => { if (e.target.id === 'spay') { SU.pay = e.target.value; A.render(true); } });
document.addEventListener('submit', async e => { const f = e.target; if (f.id === 'payX') { e.preventDefault(); await savePayX(f); } else if (f.id === 'archF') { e.preventDefault(); const r = f.elements.reason.value.trim(); if (r) await A.archiveP(f.dataset.id, r); } });
A.subsX = { payModal, subExport, SU };
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.xphoto) { const f = t.files[0]; t.value = ''; if (f) setPhoto(t.dataset.xphoto, f); }
  else if (t.name === 'pic' && t.closest('#regf')) { const f = t.files[0], pv = document.getElementById('picPrev'); if (!pv) return; if (!f) { pv.innerHTML = ''; return; } A.shrinkPhoto(f).then(u => { pv.innerHTML = `<img src="${u}" alt="">`; }).catch(() => { pv.innerHTML = '<span class="note">اختر صورة بصيغة JPG أو PNG</span>'; }); } });
document.addEventListener('submit', async e => { if (e.target.id !== 'delPF') return; e.preventDefault(); const f = e.target; if (f.elements.confirm.value.trim() !== 'حذف') { A.toast('اكتب كلمة «حذف» للتأكيد'); return; } const r = f.elements.reason.value.trim(); if (!r) return; await doDelete(f.dataset.id, r); });

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
  if (d.xcard) { A.cardModal(d.xcard); return; }
  if (x === 'showCard') { const m = A.myCards().find(c => c.id === d.id); if (m) A.showMyCard(m); }
  else if (x === 'forget') { try { localStorage.setItem(MY, JSON.stringify(A.myCards().filter(c => c.id !== d.id))); } catch (err) { } A.render(true); }
  else if (x === 'cardPng') { const p = cardById(d.id); if (p) A.cardPNG(p); }
  else if (x === 'cardPdf') { const p = cardById(d.id); if (p) A.cardPDF(p); }
  else if (x === 'cardsCat') A.cardsPDF(A.plist(p => p.cat === d.c && !['rejected', 'cancelled'].includes(p.status)), 'بطاقات-' + A.catName(d.c).replace(/\s+/g, '-'));
  else if (x === 'listQR') listQR();
  else if (x === 'copyReg') { const u = A.regLink(); try { await navigator.clipboard.writeText(u); A.toast('✓ تم نسخ رابط التسجيل'); } catch (err) { const i = document.getElementById('regUrl'); if (i) { i.select(); document.execCommand('copy'); A.toast('✓ تم نسخ رابط التسجيل'); } } }
  else if (x === 'regToggle') { const open = !A.S().regOpen; await A.saveSettings({ regOpen: open }); A.toast(open ? '✓ فُتح التسجيل' : '✓ أُوقف التسجيل'); }
  else if (x === 'saveAll') { const patch = {}; document.querySelectorAll('[data-set]').forEach(i => { patch[i.dataset.set] = i.type === 'number' || i.type === 'range' ? +i.value : i.value; }); document.querySelectorAll('[data-setb]').forEach(i => patch[i.dataset.setb] = i.checked); const S = A.S(); document.querySelectorAll('[data-setn]').forEach(i => { const [k, sub] = i.dataset.setn.split('.'); patch[k] = Object.assign({}, S[k], patch[k] || {}, { [sub]: i.type === 'number' ? +i.value : i.value }); }); await A.saveSettings(patch); }
  else if (x === 'camScan') camScan();
  else if (x === 'camStop') stopCam();
  else if (x === 'attSheet') attSheet();
  else if (x === 'delP') delPlayer(d.id);
  else if (x === 'payM') payModal(d.id);
  else if (x === 'restoreP') A.restoreP(d.id);
  else if (x === 'suC') { SU.c = d.c; A.render(true); }
  else if (x === 'subX') subExport(d.f);
  else if (x === 'withdraw') { await A.safe(() => A.upd('players/' + d.id, { withdrawn: true }), '✓ سُجّل منسحباً'); await A.log('انسحاب مشارك', A.regNo(D.players[d.id]), ''); A.closeModal(); }
  else if (x === 'rmPhoto') { const q = Object.assign({}, D.priv[d.id] || {}, { photo: '' }); await A.safe(() => A.put('private/' + d.id, q), '✓ أُزيلت الصورة'); D.priv[d.id] = q; A.cardModal(d.id); }
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
