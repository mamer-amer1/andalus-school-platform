/* التقارير والتصدير والشهادات والبطاقات */
{
const A = window.A, { esc, fmtD, fmtDT, money, now } = A.u, K = A.K, D = A.D;
const day = () => new Date().toISOString().slice(0, 10);

A.xlsx = async (filename, sheets) => {
  try {
    const X = await A.XLSX(); const wb = X.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
    sheets.forEach(s => { const ws = X.utils.aoa_to_sheet(s.rows); ws['!cols'] = (s.rows[0] || []).map(() => ({ wch: 18 })); X.utils.book_append_sheet(wb, ws, String(s.name).slice(0, 30).replace(/[\\/?*[\]:]/g, ' ')); });
    const buf = X.write(wb, { type: 'array', bookType: 'xlsx' });
    await A.save(filename + '.xlsx', new Blob([buf]));
  } catch (e) { A.toast('تعذّر إنشاء ملف Excel', 3500); }
};
A.printDoc = async (title, body) => {
  const S = A.S(), logo = await A.logoData();
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@600&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet"><style>
  body{font:13px/1.6 'IBM Plex Sans Arabic',Tahoma,sans-serif;color:#14201f;margin:24px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #123885;padding-bottom:10px;margin-bottom:16px}header img{height:56px}h1{font-family:'Reem Kufi',serif;color:#123885;font-size:22px;margin:0}h2{font-family:'Reem Kufi',serif;color:#123885;font-size:17px;margin:18px 0 8px}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #c9d6ea;padding:5px 7px;text-align:start}th{background:#eef4fb}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.k div{border:1px solid #c9d6ea;border-radius:8px;padding:8px}.k b{display:block;font-size:17px;color:#123885}footer{margin-top:20px;color:#666;font-size:11px;border-top:1px solid #ddd;padding-top:6px}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.idc{border:2px solid #123885;border-radius:12px;padding:10px;text-align:center;break-inside:avoid}.idc img{height:30px}.idc b{display:block;font-size:16px}.idc svg{width:110px;height:110px}
  @media print{body{margin:10mm}.noprint{display:none}}</style></head><body><header><div><h1>${esc(title)}</h1><div>${esc(S.name)} ${esc(S.season)} — ${esc(S.school)}</div></div>${logo ? `<img src="${logo}" alt="">` : ''}</header>${body}<footer>أُنشئ في ${esc(fmtDT(now()))} من منصة ${esc(S.club)}</footer><p class="noprint" style="color:#123885">للطباعة: Ctrl+P (أو مشاركة ← طباعة على الجوال).</p></body></html>`;
  await A.save(title.replace(/\s+/g, '-') + '-' + day() + '.html', html);
};
const tbl = (head, rows) => `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const pv = id => D.priv[id] || {};
const yn = v => v ? 'نعم' : 'لا';

function data(k) {
  const S = A.S(), P = Object.entries(D.players).sort((a, b) => a[1].no - b[1].no);
  if (k === 'participants') return [{ name: 'المشاركون', head: ['رقم التسجيل', 'الاسم', 'الفئة', 'النوع', 'الصف', 'المدرسة/الفرع', 'الجوال', 'المستوى', 'الحالة', 'المدفوع', 'موافقة الشروط', 'موافقة ولي الأمر', 'موافقة التصوير', 'شريك تحدي الأسرة', 'منسحب'], rows: P.map(([id, p]) => [A.regNo(p), p.name, A.catName(p.cat), K.TYPES[p.type] || '', pv(id).grade || '', pv(id).branch || '', pv(id).phone || '', K.LEVELS[p.level] || '', K.REG[p.status], +pv(id).payAmount || 0, yn(pv(id).terms), yn(pv(id).parent), yn(pv(id).photo), p.duo && D.players[p.duo] ? D.players[p.duo].name : '', yn(p.withdrawn)]) }];
  if (k === 'attendance') { const n = S.days.length; return [{ name: 'الحضور', head: ['رقم التسجيل', 'الاسم', 'الفئة', ...S.days.map((d, i) => 'اليوم ' + (i + 1)), 'أيام الحضور'], rows: P.filter(([, p]) => p.status === 'approved').map(([id, p]) => { const a = p.att || {}; const v = [...Array(n)].map((_, i) => a['d' + (i + 1)] ? 'حاضر' : '—'); return [A.regNo(p), p.name, A.catName(p.cat), ...v, v.filter(x => x === 'حاضر').length]; }) }]; }
  if (k === 'payments') { const rows = P.filter(([, p]) => !['rejected', 'cancelled'].includes(p.status)).map(([id, p]) => [A.regNo(p), p.name, A.catName(p.cat), K.PAYM[pv(id).payMethod] || '', +pv(id).payAmount || 0, pv(id).payDate || '', pv(id).payRef || '', Math.max(0, S.fee - (+pv(id).payAmount || 0)), p.paid ? 'مسدد' : 'غير مسدد']); return [{ name: 'المدفوعات', head: ['رقم التسجيل', 'الاسم', 'الفئة', 'وسيلة الدفع', 'المدفوع', 'التاريخ', 'المرجع', 'المتبقي', 'الحالة'], rows, total: ['الإجمالي', '', '', '', rows.reduce((s, r) => s + r[4], 0), '', '', rows.reduce((s, r) => s + r[7], 0), ''] }]; }
  if (k === 'matches') return K.CATS.map(c => ({ name: A.catName(c), head: ['الجولة', 'الطاولة', 'الأبيض', 'النتيجة', 'الأسود'], rows: A.catRounds(c).flatMap(r => (r.games || []).map(g => [r.n, g.bd, D.players[g.w]?.name || '', g.res || 'لم تنتهِ', D.players[g.b]?.name || '']).concat(r.bye ? [[r.n, '—', D.players[r.bye]?.name || '', 'استراحة', '']] : [])) }));
  if (k === 'standings') return K.CATS.map(c => ({ name: A.catName(c), head: ['المركز', 'رقم التسجيل', 'الاسم', 'المباريات', 'فوز', 'تعادل', 'خسارة', 'النقاط', ...S.tb.map(t => K.TB[t]), 'الحالة'], rows: A.table(c).map(x => [x.rank, A.regNo(x.p), x.p.name, x.gp + x.bye, x.w, x.d, x.l, x.pts, ...S.tb.map(t => x[t] ?? 0), x.p.withdrawn ? 'منسحب' : 'نشط']) }));
  if (k === 'winners') { const aw = S.awards, duo = A.duos()[0]; return [{ name: 'الفائزون', head: ['الفئة', 'المركز', 'الاسم', 'النقاط', 'الجائزة'], rows: K.CATS.flatMap(c => A.table(c).slice(0, 3).map(x => [A.catName(c), x.rank, x.p.name, x.pts, ['كأس ذهبي', 'كأس فضي', 'كأس برونزي'][x.rank - 1] + ' + ' + S.prizes[x.rank] + ' ريال' + (x.rank === 1 ? ' — بطل الأندلس' : '')])) }, { name: 'الجوائز التشجيعية', head: ['الجائزة', 'الفائز'], rows: [['أفضل روح رياضية', D.players[aw.sport]?.name || '—'], ['أصغر مشارك', D.players[aw.youngest]?.name || '—'], ['أفضل لاعب متطور', D.players[aw.improved]?.name || '—'], ['أفضل ثنائي (تحدي الأسرة)', duo ? D.players[duo.a]?.name + ' + ' + D.players[duo.b]?.name + ' (' + duo.pts + ')' : '—']] }]; }
  if (k === 'financial') {
    const F = Object.values(D.finance), paid = Object.entries(D.priv).reduce((s, [id, q]) => s + (D.players[id] ? +q.payAmount || 0 : 0), 0), inc = F.filter(f => f.kind === 'income').reduce((s, f) => s + (+f.amount || 0), 0), exp = F.filter(f => f.kind !== 'income').reduce((s, f) => s + (+f.amount || 0), 0);
    return [{ name: 'الملخص', head: ['البند', 'المبلغ (ريال)'], rows: [['رسوم الاشتراك المحصلة', paid], ['إيرادات أخرى', inc], ['إجمالي الإيرادات', paid + inc], ['إجمالي المصروفات', exp], ['صافي الميزانية', paid + inc - exp]] }, { name: 'القيود', head: ['التاريخ', 'النوع', 'البند', 'الوصف', 'المبلغ', 'فاتورة'], rows: F.sort((a, b) => String(a.date).localeCompare(String(b.date))).map(f => [f.date, f.kind === 'income' ? 'إيراد' : 'مصروف', f.cat, f.desc, +f.amount, f.receipt ? 'مرفقة' : '']) }];
  }
  if (k === 'survey') { const L = Object.values(D.survey); const avg = key => L.length ? (L.reduce((s, x) => s + (+x[key] || 0), 0) / L.length).toFixed(2) : '—'; return [{ name: 'متوسط التقييم', head: ['المحور', 'المتوسط من 5', 'عدد الردود'], rows: [['التنظيم', avg('org'), L.length], ['المواعيد', avg('time'), L.length], ['التحكيم', avg('ref'), L.length], ['المكان والضيافة', avg('place'), L.length]] }, { name: 'الاقتراحات', head: ['الاقتراح'], rows: L.filter(x => x.note).map(x => [x.note]) }]; }
  if (k === 'final') {
    const act = Object.values(D.players).filter(p => !['rejected', 'cancelled'].includes(p.status));
    const games = Object.values(D.rounds).reduce((s, r) => s + (r.games || []).length, 0), done = Object.values(D.rounds).reduce((s, r) => s + (r.games || []).filter(g => g.res).length, 0);
    return [{ name: 'ملخص البطولة', head: ['المؤشر', 'القيمة'], rows: [['اسم البطولة', S.name + ' ' + S.season], ['الجهة المنظمة', S.org], ['المسجلون', act.length], ['المعتمدون', act.filter(p => p.status === 'approved').length], ...K.CATS.map(c => ['لاعبو ' + A.catName(c), act.filter(p => p.cat === c && p.status === 'approved').length]), ['الجولات المقامة', K.CATS.map(c => A.catName(c) + ': ' + A.catRounds(c).length).join(' • ')], ['المباريات', done + ' منتهية من ' + games], ['البلاغات', Object.keys(D.incidents).length], ['ردود الاستبيان', Object.keys(D.survey).length]] }, ...data('winners'), ...(A.isAdminLvl() && A.can('finance') ? data('financial').slice(0, 1) : [])];
  }
  return [];
}
const TITLES = { participants: 'تقرير المشاركين', attendance: 'تقرير الحضور', payments: 'تقرير المدفوعات', matches: 'تقرير المباريات', standings: 'تقرير ترتيب الفئات', winners: 'تقرير الفائزين', financial: 'التقرير المالي', final: 'التقرير الختامي للبطولة', survey: 'نتائج استبيان الرضا' };
A.report = async (k, fmt) => {
  const secs = data(k); if (!secs.length) return;
  if (fmt === 'xlsx') return A.xlsx(TITLES[k], secs.map(s => ({ name: s.name, rows: [s.head, ...s.rows, ...(s.total ? [s.total] : [])] })));
  return A.printDoc(TITLES[k], secs.map(s => `<h2>${esc(s.name)}</h2>${s.rows.length ? tbl(s.head, s.rows.concat(s.total ? [s.total] : [])) : '<p>لا توجد بيانات.</p>'}`).join(''));
};

/* cards with QR */
async function cards() {
  const L = Object.values(D.players).filter(p => p.status === 'approved').sort((a, b) => a.no - b.no);
  if (!L.length) { A.toast('لا يوجد لاعبون معتمدون'); return; }
  const logo = await A.logoData(), S = A.S(); let html = '';
  try { for (const p of L) { const svg = await A.qrSvg(A.regNo(p), 3); html += `<div class="idc">${logo ? `<img src="${logo}" alt="">` : ''}<div>${esc(S.name)} ${esc(S.season)}</div>${svg}<b>${esc(p.name)}</b><div>${esc(A.regNo(p))}</div><div>${esc(A.catName(p.cat))}</div></div>`; } }
  catch (e) { A.toast('تعذّر تحميل مكتبة QR'); return; }
  A.printDoc('بطاقات المشاركين', `<div class="cards">${html}</div>`);
}

/* certificates (canvas → PDF; Arabic shaping done by the browser) */
async function certs(kind) {
  const S = A.S(); let list = [];
  if (kind === 'all') list = Object.values(D.players).filter(p => p.status === 'approved').sort((a, b) => a.no - b.no).map(p => ({ p, title: 'شهادة مشاركة', line: 'تقديراً لمشاركته المتميزة في ' + S.name + ' ' + S.season }));
  else {
    K.CATS.forEach(c => A.table(c).slice(0, 3).forEach(x => list.push({ p: x.p, title: x.rank === 1 ? 'شهادة بطل الأندلس' : 'شهادة تفوق', line: 'لحصوله على المركز ' + ['الأول', 'الثاني', 'الثالث'][x.rank - 1] + ' في ' + A.catName(c) })));
    const aw = S.awards; [['sport', 'أفضل روح رياضية'], ['youngest', 'أصغر مشارك'], ['improved', 'أفضل لاعب متطور']].forEach(([k, l]) => { if (D.players[aw[k]]) list.push({ p: D.players[aw[k]], title: 'شهادة تقدير', line: 'لفوزه بجائزة ' + l }); });
    const duo = A.duos()[0]; if (duo) [duo.a, duo.b].forEach(id => list.push({ p: D.players[id], title: 'شهادة أفضل ثنائي', line: 'لفوزه مع ' + D.players[id === duo.a ? duo.b : duo.a].name + ' بتحدي الأسرة' }));
  }
  if (!list.length) { A.toast('لا يوجد من تُصدر له الشهادات بعد'); return; }
  A.toast('جارٍ إنشاء ' + list.length + ' شهادة…', 4000);
  let jsPDF; try { jsPDF = await A.jsPDF(); } catch (e) { A.toast('تعذّر تحميل مكتبة PDF'); return; }
  try { await Promise.all([document.fonts.load('700 80px "Reem Kufi"'), document.fonts.load('400 40px "IBM Plex Sans Arabic"')]); } catch (e) { }
  const logo = await A.img('logo.png').catch(() => null), ring = await A.img('emblem.png').catch(() => null);
  const W = 1754, H = 1240, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  list.forEach((it, i) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    ['#07a7d0', '#0f69b2', '#a24c92', '#e16363'].forEach((c, k) => { x.fillStyle = c; x.fillRect(k * W / 4, 0, W / 4, 22); x.fillRect(k * W / 4, H - 22, W / 4, 22); });
    x.strokeStyle = '#123885'; x.lineWidth = 6; x.strokeRect(60, 70, W - 120, H - 140); x.lineWidth = 2; x.strokeRect(78, 88, W - 156, H - 176);
    if (ring) { x.globalAlpha = .07; x.drawImage(ring, W / 2 - 330, H / 2 - 300, 660, 660); x.globalAlpha = 1; }
    if (logo) { const lw = 520, lh = lw * logo.height / logo.width; x.drawImage(logo, W / 2 - lw / 2, 120, lw, lh); }
    x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#123885';
    x.font = '700 92px "Reem Kufi", serif'; x.fillText(it.title, W / 2, 420);
    x.fillStyle = '#333'; x.font = '400 40px "IBM Plex Sans Arabic", sans-serif'; x.fillText('تشهد ' + S.org + ' بأن', W / 2, 510);
    x.fillStyle = '#a24c92'; x.font = '700 84px "Reem Kufi", serif'; x.fillText(it.p.name, W / 2, 630);
    x.fillStyle = '#333'; x.font = '400 40px "IBM Plex Sans Arabic", sans-serif'; x.fillText(it.line, W / 2, 730); x.fillText(A.catName(it.p.cat) + ' — رقم المشارك ' + A.regNo(it.p), W / 2, 790);
    x.font = '400 32px "IBM Plex Sans Arabic", sans-serif'; x.fillStyle = '#555';
    const sd = S.days[S.days.length - 1] && S.days[S.days.length - 1].date; x.fillText(sd ? fmtD(sd) : day(), W / 2, 880);
    x.textAlign = 'center'; x.fillText('مدير البطولة', W - 420, 1040); x.fillText('قائد المدرسة', 420, 1040);
    x.strokeStyle = '#999'; x.lineWidth = 2; x.beginPath(); x.moveTo(W - 560, 990); x.lineTo(W - 280, 990); x.moveTo(280, 990); x.lineTo(560, 990); x.stroke();
    if (i) pdf.addPage(); pdf.addImage(cv.toDataURL('image/jpeg', .86), 'JPEG', 0, 0, 842, 595);
  });
  await A.save((kind === 'all' ? 'شهادات-المشاركة' : 'شهادات-الفائزين') + '-' + day() + '.pdf', pdf.output('arraybuffer'));
}
function achv() {
  const S = A.S(), rows = [];
  K.CATS.forEach(c => A.table(c).forEach(x => rows.push([A.catName(c), x.rank, x.p.name, A.regNo(x.p), x.pts, x.w + '/' + x.d + '/' + x.l])));
  const arch = Object.values(D.archive).sort((a, b) => String(b.season).localeCompare(String(a.season)));
  A.printDoc('سجل إنجازات البطولة', `<h2>${esc(S.name)} ${esc(S.season)}</h2>${tbl(['الفئة', 'المركز', 'الاسم', 'الرقم', 'النقاط', 'فوز/تعادل/خسارة'], rows)}${data('winners').map(s => `<h2>${esc(s.name)}</h2>${tbl(s.head, s.rows)}`).join('')}${arch.length ? '<h2>المواسم السابقة</h2>' + arch.map(a => `<p><b>${esc(a.name)} ${esc(a.season)}</b>: ${(a.winners || []).map(w => esc(w.catName) + ' — ' + esc(w.name)).join(' • ')}</p>`).join('') : ''}`);
}
A.out = act => {
  if (act === 'xPlayers') return A.report('participants', 'xlsx');
  if (act === 'pPlayers') return A.report('participants', 'html');
  if (act === 'xFinance') return A.report('financial', 'xlsx');
  if (act === 'cards') return cards();
  if (act === 'certAll') return certs('all');
  if (act === 'certWin') return certs('win');
  if (act === 'achv') return achv();
};
}
