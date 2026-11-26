/* واجهة الإدارة والحكام */
{
const A = window.A, { esc, fmtD, fmtDT, money, normPhone, validPhone, intl, rid, now, digits } = A.u, K = A.K, D = A.D;
const UI = A.ui = { cat: '1', rsel: {}, q: '', fcat: '', fst: '', day: 0, backups: null, people: null };
A.names = {};
const nm = id => { const p = D.players[id]; return p ? esc(p.name) : '—'; };
const who = uid => esc(A.names[uid] || (uid === A.st.me ? 'أنت' : 'مستخدم'));
const lockCat = () => A.catLock();
const curCat = () => lockCat() || UI.cat;

function side(sec) {
  const r = A.role(), secs = K.ROLES[r].s;
  const badge = { requests: Object.values(D.requests).reduce((s, q) => s + (q.items || []).filter(i => !i.done).length, 0) + Object.values(D.players).filter(p => p.status === 'new').length, ref: Object.keys(D.subs).length + Object.values(D.incidents).filter(i => i.status !== 'closed').length };
  return `<aside class="side"><img src="logo.png" alt="شعار مدارس الأندلس الأهلية">${A.emb ? A.emb(64) : ''}<div class="who">${esc(K.ROLES[r].n)}<br>${esc(A.S().name)} ${esc(A.S().season)}</div>${secs.map(s => `<a href="#a-${s}" class="${s === sec ? 'on' : ''}">${K.SECTIONS[s]}${badge[s] ? `<span class="bdg">${badge[s]}</span>` : ''}</a>`).join('')}<div class="sep" style="border-top:1px solid #ffffff33;margin:8px 0"></div><a href="#home">واجهة الجمهور</a><a href="#tv">الشاشة المباشرة</a></aside>`;
}
const catTabs = () => lockCat() ? `<div class="cats"><span class="pill">${esc(A.catName(lockCat()))}</span></div>` : `<div class="cats">${K.CATS.map(c => `<button data-acat="${c}" class="${c === UI.cat ? 'on' : ''}">${esc(A.catName(c))}</button>`).join('')}</div>`;

/* ---------- dashboard ---------- */
function dash() {
  const P = Object.values(D.players), S = A.S();
  const active = P.filter(p => !['rejected', 'cancelled'].includes(p.status));
  const paidAmt = Object.entries(D.priv).reduce((s, [id, q]) => s + (D.players[id] ? (+q.payAmount || 0) : 0), 0);
  const inc = Object.values(D.finance).filter(f => f.kind === 'income').reduce((s, f) => s + (+f.amount || 0), 0);
  const exp = Object.values(D.finance).filter(f => f.kind !== 'income').reduce((s, f) => s + (+f.amount || 0), 0);
  let done = 0, open = 0, planned = 0;
  K.CATS.forEach(c => { const R = A.catRounds(c); R.forEach(r => (r.games || []).forEach(g => g.res ? done++ : open++)); const n = A.eligible(c).length; planned += Math.max(0, S.maxRounds - R.length) * Math.floor(n / 2); });
  const cur = K.CATS.map(c => `${A.catName(c).split('–').pop().trim()}: ${A.catRounds(c).length}/${S.maxRounds}`).join(' • ');
  const k = [['إجمالي المسجلين', active.length], ['الطلاب', active.filter(p => p.cat === '1').length], ['أولياء الأمور الرجال', active.filter(p => p.cat === '2').length], ['أولياء الأمور النساء', active.filter(p => p.cat === '3').length], ['الطلبات الجديدة', P.filter(p => p.status === 'new').length], ['المسددون', P.filter(p => p.paid).length], ['المعتمدون', P.filter(p => p.status === 'approved').length], ['إجمالي الإيرادات', money(paidAmt + inc)], ['إجمالي المصروفات', money(exp)], ['صافي الميزانية', money(paidAmt + inc - exp)], ['المباريات المنجزة', done], ['المباريات المتبقية', open + planned], ['بانتظار الاعتماد', Object.keys(D.subs).length]];
  const canFin = A.can('finance') || A.role() === 'sys' || A.role() === 'director';
  return `<h2>لوحة المؤشرات</h2><div class="kpis">${k.filter(([l]) => canFin || !/إيرادات|مصروفات|الميزانية/.test(l)).map(([l, v]) => `<div class="kpi"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
  <div class="card"><h3>الجولة الحالية</h3><p>${esc(cur)}</p><div class="row">${K.CATS.map(c => { const R = A.catRounds(c), r = R[R.length - 1]; return `<span class="pill ${r && (r.games || []).every(g => g.res) ? 'ok' : 'warn'}">${esc(A.catName(c))}: ${r ? (r.games || []).filter(g => g.res).length + '/' + (r.games || []).length : 'لم تبدأ'}</span>`; }).join('')}</div></div>
  <div class="card"><h3>آخر التحديثات</h3>${D.audit.length ? D.audit.slice(0, 10).map(a => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(a.act)} ${a.target ? '— ' + esc(a.target) : ''} <span class="note">${esc(a.info || '')}</span></span><span class="note">${who(a.uid)} • ${esc(fmtDT(a.at))}</span></div>`).join('') : '<p class="note">لا توجد عمليات بعد.</p>'}</div>
  ${D.legacy && !Object.keys(D.players).length ? '<div class="warnbox">توجد بيانات من النسخة السابقة للمنصة. انقلها من الإعدادات ← «نقل البيانات القديمة».</div>' : ''}`;
}

/* ---------- players ---------- */
function players() {
  const lc = lockCat(); let L = Object.entries(D.players);
  if (lc) L = L.filter(([, p]) => p.cat === lc); else if (UI.fcat) L = L.filter(([, p]) => p.cat === UI.fcat);
  if (UI.fst) L = L.filter(([, p]) => p.status === UI.fst);
  const q = digits(UI.q).trim().toLowerCase();
  if (q) L = L.filter(([id, p]) => p.name.toLowerCase().includes(q) || A.regNo(p).toLowerCase().includes(q) || String(p.no) === q.replace(/\D/g, '') || (D.priv[id] && normPhone(D.priv[id].phone).includes(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length > 3));
  L.sort((a, b) => (a[1].no || 0) - (b[1].no || 0));
  const fin = A.role() === 'finance';
  return `<div class="row sp"><h2 style="margin:0">المشاركون (${L.length})</h2><div class="row">${fin ? '' : '<button class="pri" data-act="addPlayer">إضافة لاعب</button><button data-act="import">استيراد من ملف</button>'}<button data-act="xPlayers">تصدير Excel</button><button data-act="pPlayers">طباعة القائمة</button><button data-act="cards">بطاقات QR</button></div></div>
  <div class="row card" style="margin-top:14px"><label style="flex:2 1 220px">بحث بالاسم أو رقم التسجيل أو الجوال<input id="pq" value="${esc(UI.q)}" placeholder="اكتب للبحث"></label>${lc ? '' : `<label style="flex:1 1 160px">الفئة<select id="pfc"><option value="">الكل</option>${K.CATS.map(c => `<option value="${c}" ${UI.fcat === c ? 'selected' : ''}>${esc(A.catName(c))}</option>`).join('')}</select></label>`}<label style="flex:1 1 160px">الحالة<select id="pfs"><option value="">الكل</option>${Object.entries(K.REG).map(([k, v]) => `<option value="${k}" ${UI.fst === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
  ${L.length ? `<div class="scroll"><table class="stack"><thead><tr><th>رقم التسجيل</th><th>الاسم</th><th>الفئة</th><th>الجوال</th><th>الحالة</th><th>السداد</th><th>تحدي الأسرة</th><th></th></tr></thead><tbody>${L.map(([id, p]) => { const q = D.priv[id] || {}; return `<tr><td class="n">${esc(A.regNo(p))}</td><td><b>${esc(p.name)}</b>${p.withdrawn ? ' <span class="pill bad">منسحب</span>' : ''}<br><span class="note">${esc(K.TYPES[p.type] || '')}${q.grade ? ' • ' + esc(q.grade) : ''}</span></td><td>${esc(A.catName(p.cat))}</td><td class="n" dir="ltr">${esc(q.phone || '')}</td><td><span class="pill ${K.REG_CLS[p.status]}">${esc(K.REG[p.status])}</span></td><td>${p.paid ? `<span class="pill ok">${esc(money(q.payAmount))}</span>` : `<button class="sm" data-pay="${id}">تسجيل دفع</button>`}</td><td>${p.duo && D.players[p.duo] ? nm(p.duo) : ''}</td><td><div class="row"><button class="sm" data-xcard="${id}" title="بطاقة المشارك">البطاقة</button>${fin ? '' : `<button class="sm" data-edit="${id}">تعديل</button>${['new', 'await', 'paid'].includes(p.status) ? `<button class="sm" data-st="${id}:approved">اعتماد</button>` : ''}${p.status === 'new' ? `<button class="sm" data-st="${id}:await">بانتظار السداد</button><button class="sm dan" data-st="${id}:rejected">رفض</button>` : ''}`}<button class="sm" data-conf="${id}">تأكيد</button></div></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">لا يوجد مشاركون بهذه التصفية.</div>'}`;
}
function playerForm(id) {
  const p = id ? D.players[id] : { type: 'student', level: 'beg', status: 'new' }, q = id ? (D.priv[id] || {}) : { branch: A.S().school, payMethod: 'cash' }, lc = lockCat();
  const types = Object.entries(K.TYPES).filter(([k]) => !lc || K.TYPE_CAT[k] === lc);
  return `<h2>${id ? 'تعديل ' + esc(p.name) + ' — ' + esc(A.regNo(p)) : 'إضافة لاعب'}</h2><form id="pform" data-id="${esc(id || '')}" novalidate><div class="grid">
  <label>الاسم الكامل *<input name="name" value="${esc(p.name || '')}"></label>
  <label>نوع المشارك *<select name="type">${types.map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  <label>رقم الجوال *<input name="phone" dir="ltr" inputmode="tel" value="${esc(q.phone || '')}"></label>
  <label>الصف الدراسي<input name="grade" value="${esc(q.grade || '')}"></label>
  <label>المدرسة / الفرع<input name="branch" value="${esc(q.branch || '')}"></label>
  <label>المستوى<select name="level">${Object.entries(K.LEVELS).map(([k, v]) => `<option value="${k}" ${p.level === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  <label>التصنيف (اختياري)<input name="rating" inputmode="numeric" value="${esc(p.rating || '')}"></label>
  <label>وسيلة الدفع<select name="payMethod">${Object.entries(K.PAYM).map(([k, v]) => `<option value="${k}" ${q.payMethod === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  ${id ? `<label>حالة الطلب<select name="status">${Object.entries(K.REG).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>` : ''}
  <label>تحدي الأسرة: رقم تسجيل الشريك<input name="link" dir="ltr" placeholder="مثال: AND26-012"></label></div>
  <label class="ck" style="margin-top:10px"><input type="checkbox" name="terms" ${q.terms || !id ? 'checked' : ''}> الموافقة على الشروط</label>
  <label class="ck"><input type="checkbox" name="parent" ${q.parent ? 'checked' : ''}> موافقة ولي الأمر (للطلاب)</label>
  <label class="ck"><input type="checkbox" name="photo" ${q.photo ? 'checked' : ''}> موافقة التصوير والنشر</label>
  ${id ? `<label class="ck"><input type="checkbox" name="withdrawn" ${p.withdrawn ? 'checked' : ''}> منسحب من البطولة (يبقى في السجل ولا يُوزَّع)</label>` : ''}
  <label>ملاحظات / سبب التغيير<textarea name="notes">${esc(q.notes || '')}</textarea></label>
  <div id="pfErr" class="warnbox" hidden></div>
  <div class="row" style="margin-top:12px"><button class="pri">حفظ</button><button type="button" data-close>إلغاء</button>${id && p.duo ? `<button type="button" class="dan" data-unlink="${esc(id)}">فك ربط الثنائي</button>` : ''}</div></form>
  ${id && (q.history || []).length ? `<h3 style="margin-top:16px">سجل العمليات</h3>${q.history.slice().reverse().map(h => `<div class="note">${esc(fmtDT(h.at))} — ${esc(h.text)}</div>`).join('')}` : ''}`;
}
A.nextNo = () => Object.values(D.players).reduce((m, p) => Math.max(m, +p.no || 0), 0) + 1;
A.memberFor = (name, phone) => { const ph = normPhone(phone); const f = Object.entries(D.members || {}).find(([, m]) => normPhone(m.phone) === ph && String(m.name).trim() === String(name).trim()); return f ? f[0] : null; };
A.createPlayer = async (o, source) => {
  const S = A.S(), id = 'p' + Date.now().toString(36) + rid(3), no = A.nextNo(), cat = K.TYPE_CAT[o.type] || '1';
  let mk = A.memberFor(o.name, o.phone), newM = !mk; if (!mk) mk = 'm' + rid(8);
  const pub = { no, name: o.name.trim(), cat, type: o.type, level: o.level || 'beg', rating: +digits(o.rating || '') || 0, status: o.status || 'new', paid: false, withdrawn: false, duo: '', mk, att: {}, season: S.season, createdAt: now() };
  const pv = { phone: normPhone(o.phone), grade: o.grade || '', branch: o.branch || '', terms: !!o.terms, parent: !!o.parent, photo: !!o.photo, wantsDuo: !!o.duo, payMethod: o.payMethod || 'cash', payAmount: 0, linkCode: rid(6), notes: o.notes || '', source: source || '', history: [{ at: now(), text: 'إنشاء الطلب (' + (source || 'يدوي') + ')' }] };
  const r = await A.safe(async () => {
    await A.put('players/' + id, pub); await A.put('private/' + id, pv);
    if (newM) await A.put('members/' + mk, { name: pub.name, phone: pv.phone, first: S.season });
    D.players[id] = pub; D.priv[id] = pv;
    if (o.link) await A.linkDuo(id, o.link);
    await A.log('تسجيل مشارك', A.regNo(pub), pub.name + ' — ' + A.catName(cat));
    return id;
  });
  return r;
};
A.linkDuo = async (id, code) => {
  const c = String(code).trim().toUpperCase(); let f = Object.entries(D.priv).find(([oid, q]) => oid !== id && String(q.linkCode).toUpperCase() === c);
  if (!f && /\d/.test(c)) { const t = A.byNo(+c.split('-').pop().replace(/\D/g, '')); if (t && t[0] !== id) f = [t[0]]; }
  if (!f) { A.toast('رمز الربط غير صحيح'); return false; }
  const oid = f[0];
  await A.upd('players/' + id, { duo: oid }); await A.upd('players/' + oid, { duo: id });
  await A.log('ربط ثنائي', A.regNo(D.players[id]), 'مع ' + A.regNo(D.players[oid]));
  A.toast('تم ربط ' + D.players[id].name + ' مع ' + D.players[oid].name); return true;
};
async function savePlayerForm(f) {
  const id = f.dataset.id, fd = new FormData(f), o = {}; fd.forEach((v, k) => o[k] = typeof v === 'string' ? v.trim() : v);
  ['terms', 'parent', 'photo', 'withdrawn'].forEach(k => o[k] = !!(f.elements[k] && f.elements[k].checked));
  const errs = [];
  if (!o.name || o.name.length < 3) errs.push('الاسم مطلوب');
  if (!validPhone(o.phone)) errs.push('الجوال بصيغة 05xxxxxxxx');
  if (o.type === 'student' && !o.parent && (!id || o.status === 'approved')) errs.push('موافقة ولي الأمر مطلوبة للطالب');
  const box = document.getElementById('pfErr'); if (errs.length) { box.hidden = false; box.textContent = errs.join(' • '); return; }
  if (!id) { const nid = await A.createPlayer(o, 'إضافة يدوية'); if (nid) { A.closeModal(); A.confirmBox(nid); } return; }
  const p = D.players[id], q = D.priv[id] || {};
  const pub = { name: o.name, type: o.type, cat: K.TYPE_CAT[o.type], level: o.level, rating: +digits(o.rating) || 0, status: o.status, withdrawn: o.withdrawn };
  if (pub.cat !== p.cat && A.catRounds(p.cat).some(r => (r.games || []).some(g => g.w === id || g.b === id))) { box.hidden = false; box.textContent = 'لا يمكن نقل لاعب لعب مباريات إلى فئة أخرى'; return; }
  const changes = Object.keys(pub).filter(k => String(pub[k]) !== String(p[k] ?? '')).map(k => k + ': ' + (p[k] ?? '') + ' ← ' + pub[k]);
  const pvt = { phone: normPhone(o.phone), grade: o.grade, branch: o.branch, terms: o.terms, parent: o.parent, photo: o.photo, payMethod: o.payMethod, notes: o.notes };
  const hist = (q.history || []).concat(changes.length ? [{ at: now(), text: 'تعديل: ' + changes.join('، ') + (o.notes && o.notes !== q.notes ? ' — ' + o.notes : '') }] : []).slice(-40);
  await A.safe(async () => {
    await A.upd('players/' + id, pub); await A.put('private/' + id, Object.assign({}, q, pvt, { history: hist }));
    if (o.link) await A.linkDuo(id, o.link);
    await A.log('تعديل مشارك', A.regNo(p), changes.join('، ').slice(0, 300), { status: p.status, cat: p.cat, withdrawn: !!p.withdrawn }, { status: pub.status, cat: pub.cat, withdrawn: pub.withdrawn });
    A.closeModal();
  }, 'تم الحفظ');
}
A.setStatus = async (id, st, reason) => {
  const p = D.players[id], q = D.priv[id] || {};
  if (st === 'approved' && p.type === 'student' && !q.parent) { A.toast('لا يمكن اعتماد طالب دون موافقة ولي الأمر — عدّل بياناته أولاً', 4000); return; }
  const hist = (q.history || []).concat([{ at: now(), text: 'الحالة: ' + K.REG[p.status] + ' ← ' + K.REG[st] + (reason ? ' — ' + reason : '') }]).slice(-40);
  await A.safe(async () => { await A.upd('players/' + id, { status: st }); await A.upd('private/' + id, { history: hist }); await A.log('تغيير حالة', A.regNo(p), K.REG[p.status] + ' ← ' + K.REG[st] + (reason ? ' — ' + reason : ''), p.status, st); }, 'تم: ' + K.REG[st]);
};
function payForm(id) {
  const p = D.players[id], q = D.priv[id] || {}, S = A.S();
  return `<h2>تسجيل دفع — ${esc(p.name)}</h2><form id="payf" data-id="${esc(id)}"><div class="grid"><label>المبلغ (ريال)<input name="amount" inputmode="decimal" value="${esc(q.payAmount || S.fee)}"></label><label>وسيلة الدفع<select name="method">${Object.entries(K.PAYM).map(([k, v]) => `<option value="${k}" ${q.payMethod === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>التاريخ<input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label><label>مرجع العملية<input name="ref" value="${esc(q.payRef || '')}"></label></div><div class="row" style="margin-top:12px"><button class="pri">حفظ الدفع</button><button type="button" data-close>إلغاء</button></div></form>`;
}
async function savePay(f) {
  const id = f.dataset.id, fd = new FormData(f), amt = +digits(fd.get('amount')) || 0, p = D.players[id], q = D.priv[id] || {}, S = A.S();
  if (amt <= 0) { A.toast('أدخل مبلغاً صحيحاً'); return; }
  const full = amt >= S.fee, st = full && ['new', 'await'].includes(p.status) ? 'paid' : p.status;
  const hist = (q.history || []).concat([{ at: now(), text: 'دفع ' + amt + ' ريال (' + K.PAYM[fd.get('method')] + ')' }]).slice(-40);
  await A.safe(async () => {
    await A.upd('private/' + id, { payAmount: amt, payMethod: fd.get('method'), payDate: fd.get('date'), payRef: fd.get('ref'), history: hist });
    await A.upd('players/' + id, { paid: full, status: st });
    await A.log('تسجيل دفع', A.regNo(p), amt + ' ريال', q.payAmount || 0, amt); A.closeModal();
  }, 'تم تسجيل الدفع');
}

/* ---------- requests & import ---------- */
function requests() {
  const fromAcc = []; Object.entries(D.requests).forEach(([uid, r]) => (r.items || []).forEach((it, i) => { if (!it.done) fromAcc.push({ uid, i, it }); }));
  const newP = Object.entries(D.players).filter(([, p]) => p.status === 'new');
  return `<h2>طلبات التسجيل</h2><div class="card"><h3>استيراد من نموذج Google</h3><p class="note">من جدول ردود النموذج: ملف ← تنزيل ← CSV أو Excel، ثم ارفعه هنا. تُنشأ الطلبات بحالة «طلب جديد» ويُتجاهل المكرر (نفس الاسم والجوال).</p><button class="pri" data-act="import">رفع ملف الردود</button></div>
  <div class="card"><h3>طلبات من حسابات المنصة (${fromAcc.length})</h3>${fromAcc.length ? fromAcc.map(r => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:8px 0"><span><b>${esc(r.it.name)}</b> — ${esc(K.TYPES[r.it.type] || '')} — <span dir="ltr">${esc(r.it.phone)}</span> <span class="note">${esc(fmtDT(r.it.at))}</span></span><span class="row"><button class="sm pri" data-reqok="${esc(r.uid)}:${r.i}">قبول وإنشاء</button><button class="sm dan" data-reqno="${esc(r.uid)}:${r.i}">رفض</button></span></div>`).join('') : '<p class="note">لا توجد طلبات معلّقة.</p>'}</div>
  <div class="card"><h3>طلبات جديدة بانتظار المراجعة (${newP.length})</h3>${newP.length ? newP.map(([id, p]) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:8px 0"><span>${esc(A.regNo(p))} — <b>${esc(p.name)}</b> — ${esc(A.catName(p.cat))}</span><span class="row"><button class="sm" data-st="${id}:await">بانتظار السداد</button><button class="sm pri" data-st="${id}:approved">اعتماد</button><button class="sm dan" data-st="${id}:rejected">رفض</button></span></div>`).join('') : '<p class="note">لا توجد.</p>'}</div>${A.reqX ? A.reqX() : ''}`;
}
const HMAP = { name: ['الاسم', 'name'], type: ['نوع', 'المشارك', 'type'], phone: ['جوال', 'الجوال', 'هاتف', 'phone', 'mobile'], grade: ['الصف', 'grade'], branch: ['المدرسة', 'الفرع', 'branch'], level: ['المستوى', 'level'], terms: ['الشروط', 'terms'], parent: ['ولي الأمر على', 'موافقة ولي', 'parent'], photo: ['التصوير', 'photo'], payMethod: ['الدفع', 'payment'], link: ['رمز الربط', 'link'] };
A.importRows = async rows => {
  if (!rows.length) { A.toast('الملف فارغ'); return; }
  const head = rows[0].map(h => String(h || '').trim()), col = {};
  Object.entries(HMAP).forEach(([k, keys]) => { const i = head.findIndex(h => keys.some(x => h.toLowerCase().includes(x.toLowerCase()))); if (i >= 0 && !(k === 'type' && col.name === i)) col[k] = i; });
  if (col.name === undefined || col.phone === undefined) { A.toast('لم أجد عمودي الاسم والجوال في الملف', 4000); return; }
  const yes = v => /نعم|موافق|أوافق|yes|true|1/i.test(String(v || ''));
  const typeOf = v => { v = String(v || ''); return /أم|ولية|mother/i.test(v) ? 'mother' : /أب|ولي|father|parent/i.test(v) ? 'father' : 'student'; };
  const lvl = v => /متقدم|adv/i.test(v) ? 'adv' : /متوسط|mid/i.test(v) ? 'mid' : 'beg';
  const pay = v => /تحويل|transfer/i.test(v) ? 'transfer' : /شبكة|بطاقة|card|مدى/i.test(v) ? 'card' : 'cash';
  const list = rows.slice(1).filter(r => r && r[col.name]).map(r => ({ name: String(r[col.name]).trim(), type: typeOf(r[col.type]), phone: normPhone(r[col.phone]), grade: col.grade !== undefined ? String(r[col.grade] || '') : '', branch: col.branch !== undefined ? String(r[col.branch] || '') : A.S().school, level: lvl(r[col.level]), terms: col.terms !== undefined ? yes(r[col.terms]) : true, parent: col.parent !== undefined ? yes(r[col.parent]) : false, photo: col.photo !== undefined ? yes(r[col.photo]) : false, payMethod: pay(r[col.payMethod]), link: col.link !== undefined ? String(r[col.link] || '') : '' }));
  const exist = new Set(Object.entries(D.priv).map(([id, q]) => D.players[id] ? D.players[id].name.trim() + '|' + normPhone(q.phone) : ''));
  const seenK = new Set(), fresh = list.filter(o => { const k = o.name + '|' + o.phone; if (exist.has(k) || seenK.has(k)) return false; seenK.add(k); return true; }), bad = fresh.filter(o => !validPhone(o.phone) || o.name.length < 3), good = fresh.filter(o => validPhone(o.phone) && o.name.length >= 3);
  A.modal(`<h2>استيراد الطلبات</h2><p>في الملف ${list.length} صفاً: ${good.length} طلب جديد صالح، ${list.length - fresh.length} مكرر سيُتجاهل، ${bad.length} بجوال أو اسم غير صالح.</p>${bad.length ? `<div class="warnbox">${bad.slice(0, 8).map(b => esc(b.name || '؟') + ' (' + esc(b.phone) + ')').join('، ')}</div>` : ''}<div class="row"><button class="pri" id="impGo" ${good.length ? '' : 'disabled'}>استيراد ${good.length}</button><button data-close>إلغاء</button></div>`);
  document.getElementById('impGo').onclick = async () => { A.closeModal(); await A.backup('قبل الاستيراد'); let n = 0; for (const o of good) { if (await A.createPlayer(o, 'استيراد ملف')) n++; } A.toast('تم استيراد ' + n + ' طلباً', 3500); };
};
document.getElementById('fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const X = await A.XLSX(); const wb = f.name.toLowerCase().endsWith('.csv') ? X.read(await f.text(), { type: 'string' }) : X.read(await f.arrayBuffer(), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; await A.importRows(X.utils.sheet_to_json(ws, { header: 1, raw: false })); }
  catch (err) { A.toast('تعذّرت قراءة الملف', 3500); }
});

/* ---------- attendance ---------- */
function attend() {
  const S = A.S(), lc = lockCat(); const day = UI.day; const key = 'd' + (day + 1);
  let L = Object.entries(D.players).filter(([, p]) => p.status === 'approved' && (!lc || p.cat === lc)).sort((a, b) => a[1].no - b[1].no);
  const present = L.filter(([, p]) => p.att && p.att[key]).length;
  return `<h2>الحضور</h2><div class="row card"><label style="flex:1 1 200px">اليوم<select id="attDay">${S.days.map((d, i) => `<option value="${i}" ${i === day ? 'selected' : ''}>اليوم ${i + 1}${d.date ? ' — ' + esc(fmtD(d.date)) : ''}</option>`).join('')}</select></label><form id="scanF" style="flex:2 1 260px" class="row"><label style="flex:1">امسح بطاقة QR أو اكتب رقم المشارك<input id="scan" autocomplete="off" placeholder="AND26-012 أو 12" autofocus></label><button class="pri" style="align-self:end">تسجيل حضور</button></form></div>
  <div class="row" style="margin-bottom:10px"><button class="pri" data-x="camScan">📷 مسح البطاقات بالكاميرا</button><button data-x="attSheet">🖨️ كشف الحضور حسب الفئة</button></div><p><b>${present}</b> حاضر و<b>${L.length - present}</b> غائب من ${L.length} • <span class="note">يمكن أيضاً استخدام قارئ الباركود: ضع المؤشر في الخانة وامسح البطاقة.</span></p>
  <div class="scroll"><table class="stack"><thead><tr><th>رقم التسجيل</th><th>الاسم</th><th>الفئة</th><th>حاضر</th></tr></thead><tbody>${L.map(([id, p]) => `<tr><td class="n">${esc(A.regNo(p))}</td><td>${esc(p.name)}</td><td>${esc(A.catName(p.cat))}</td><td><input type="checkbox" data-att="${id}" ${p.att && p.att[key] ? 'checked' : ''} aria-label="حضور ${esc(p.name)}"></td></tr>`).join('')}</tbody></table></div>`;
}
A.markAtt = async (id, val) => { const p = D.players[id], key = 'd' + (UI.day + 1); const att = Object.assign({}, p.att || {}, { [key]: val }); await A.safe(async () => { await A.upd('players/' + id, { att }); await A.log(val ? 'تسجيل حضور' : 'إلغاء حضور', A.regNo(p), 'اليوم ' + (UI.day + 1)); }); };

/* ---------- rounds ---------- */
function rounds() {
  const c = curCat(), R = A.catRounds(c), S = A.S(), last = R[R.length - 1], complete = !last || (last.games || []).every(g => g.res);
  const sys = A.systemFor(c), el = A.eligible(c).length, ap = A.canApprove();
  let i = UI.rsel[c] ?? R.length - 1; if (i >= R.length) i = R.length - 1; UI.rsel[c] = i; const r = R[i];
  return `<h2>الجولات</h2>${catTabs()}<div class="card"><div class="row sp"><div><b>${esc(A.catName(c))}</b> — ${sys === 'rr' ? 'نظام الدوري (كل لاعب يقابل الجميع)' : 'النظام السويسري'} — ${el} لاعباً معتمداً — الجولات ${R.length}/${S.maxRounds}</div>
  <div class="row">${ap ? `<button class="pri" data-act="pair" ${!complete || R.length >= S.maxRounds || el < 2 ? 'disabled' : ''}>توزيع الجولة ${R.length + 1}</button>` : ''}${ap && last && !last.startedAt ? '<button data-act="startRound">بدء الجولة</button>' : ''}${last ? '<button data-act="copyPair">نسخ التوزيع لواتساب</button>' : ''}${ap && last ? '<button class="dan" data-act="delRound">حذف آخر جولة</button>' : ''}</div></div>
  ${!complete ? '<p class="note" style="margin:8px 0 0">لا يمكن توزيع جولة جديدة قبل اعتماد كل نتائج الجولة الحالية (سجّل الغياب كنتيجة غياب إن لزم).</p>' : ''}${el < 2 ? '<p class="note">يلزم لاعبان معتمدان على الأقل.</p>' : ''}</div>
  ${R.length ? `<div class="row" style="margin-bottom:12px">${R.map((x, k) => `<button data-arsel="${k}" class="${k === i ? 'on' : ''}">الجولة ${x.n}${(x.games || []).every(g => g.res) ? ' ✓' : ''}</button>`).join('')}</div>${refBoard(r, true)}` : '<div class="empty">لم تُوزَّع أي جولة لهذه الفئة.</div>'}`;
}
function refBoard(r, full) {
  const ap = A.canApprove(), sc = {}; A.table(r.cat).forEach(x => sc[x.id] = x.pts);
  return `<div class="games">${(r.games || []).map(g => {
    const st = A.gameState(r, g), sub = D.subs[A.roundId(r.cat, r.n) + '-' + g.bd];
    return `<div class="card" style="margin:0;padding:12px"><div class="g" style="border:0;padding:0"><div class="bd">${g.bd}</div><div class="pl"><span><span class="dot w"></span>${nm(g.w)}</span><small>${esc(A.regNo(D.players[g.w]))} • ${sc[g.w] ?? 0} ن</small></div><div class="rv">${g.res ? esc(g.res) : `<span class="pill ${st === 'live' ? 'live' : st === 'await' || st === 'help' ? 'warn' : ''}">${K.GST[st]}</span>`}</div><div class="pl b"><span>${nm(g.b)}<span class="dot k" style="margin:0 6px 0 0"></span></span><small>${esc(A.regNo(D.players[g.b]))} • ${sc[g.b] ?? 0} ن</small></div></div>
    ${sub ? `<div class="warnbox" style="margin:10px 0 0">${sub.help ? 'طلب تدخل الحكم الرئيسي' : 'نتيجة مقترحة: <b>' + esc(sub.res) + '</b>'} — ${who(sub.by)} • ${esc(fmtDT(sub.at))}${sub.note ? ' — ' + esc(sub.note) : ''}${ap ? `<div class="row" style="margin-top:8px">${sub.res ? `<button class="sm pri" data-subok="${esc(r.cat)}:${r.n}:${g.bd}">اعتماد ${esc(sub.res)}</button>` : ''}<button class="sm dan" data-subno="${esc(r.cat)}:${r.n}:${g.bd}">${sub.help ? 'تم التعامل' : 'رفض'}</button></div>` : ''}</div>` : ''}
    <div class="row" style="margin-top:10px"><div class="res" role="group" aria-label="نتيجة الطاولة ${g.bd}">${Object.keys(K.RES).map(v => `<button data-res="${esc(r.cat)}:${r.n}:${g.bd}:${v}" class="${g.res === v ? 'on' : ''}" title="${K.RES_LBL[v]}">${K.RES_LBL[v]}</button>`).join('')}</div>
    ${!g.res && ap ? `<button class="sm" data-gst="${esc(r.cat)}:${r.n}:${g.bd}:${g.st === 'live' ? 'pending' : 'live'}">${g.st === 'live' ? 'إيقاف' : 'بدء'}</button>` : ''}
    <button class="sm" data-help="${esc(r.cat)}:${r.n}:${g.bd}">طلب الحكم الرئيسي</button><button class="sm dan" data-inc="${esc(r.cat)}:${r.n}:${g.bd}">الإبلاغ عن مخالفة</button></div></div>`;
  }).join('')}${r.bye ? `<div class="g"><div class="bd">—</div><div class="pl"><span>${nm(r.bye)}</span><small>استراحة — نقطة كاملة</small></div></div>` : ''}</div>`;
}
function ref() {
  const c = curCat(), R = A.catRounds(c), r = R[R.length - 1], ap = A.canApprove();
  const inc = Object.entries(D.incidents).filter(([, x]) => x.status !== 'closed' && (!lockCat() || x.cat === lockCat())).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)));
  const subs = Object.entries(D.subs).filter(([k]) => !lockCat() || k.startsWith(lockCat() + '-'));
  return `<h2>التحكيم والنتائج</h2>${catTabs()}${!ap && !A.cfg.interactWrites ? '<div class="warnbox">إرسال النتائج من الحكم المساعد معطّل لأن المنصة مشاركة برابط عام. اطلب من مدير النظام تفعيله، أو اطلب منه منحك دور محرر.</div>' : ''}<p class="note">${ap ? 'أنت معتمِد: النتيجة التي تُدخلها تُعتمد فوراً، وتعديل نتيجة معتمدة يتطلب ذكر السبب ويُسجَّل.' : 'النتيجة التي تُدخلها تُرسل للحكم الرئيسي للاعتماد.'}</p>
  ${subs.length && ap ? `<div class="card"><h3>بانتظار الاعتماد (${subs.length})</h3>${subs.map(([k, s]) => { const [cc, n, bd] = k.split('-'); return `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(A.catName(cc))} • ج${esc(n)} • طاولة ${esc(bd)}: ${s.help ? 'طلب تدخل' : esc(s.res)}</span><span class="row">${s.res ? `<button class="sm pri" data-subok="${esc(cc)}:${esc(n)}:${esc(bd)}">اعتماد</button>` : ''}<button class="sm dan" data-subno="${esc(cc)}:${esc(n)}:${esc(bd)}">${s.help ? 'تم' : 'رفض'}</button></span></div>`; }).join('')}</div>` : ''}
  ${inc.length ? `<div class="card"><h3>البلاغات المفتوحة (${inc.length})</h3>${inc.map(([id, x]) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(A.catName(x.cat))} • ج${esc(x.n)} • طاولة ${esc(x.bd)}: ${esc(x.text)} <span class="note">${who(x.by)} • ${esc(fmtDT(x.at))}</span></span>${ap ? `<button class="sm" data-incclose="${esc(id)}">إغلاق البلاغ</button>` : ''}</div>`).join('')}</div>` : ''}
  ${r ? `<h3>الجولة ${r.n} — ${esc(A.catName(c))}</h3>${refBoard(r)}` : '<div class="empty">لا توجد جولة جارية في هذه الفئة.</div>'}`;
}
A.pairNext = async () => {
  const c = curCat(), R = A.catRounds(c), S = A.S(), n = R.length + 1;
  if (R.length && !(R[R.length - 1].games || []).every(g => g.res)) { A.toast('أكمل نتائج الجولة الحالية أولاً'); return; }
  if (n > S.maxRounds) { A.toast('اكتملت جولات البطولة'); return; }
  const sys = A.systemFor(c); let games, bye = null, rrOrder = null, relaxed = false;
  try {
    if (sys === 'rr') {
      rrOrder = R.length ? R[0].rrOrder : A.eligible(c).sort((a, b) => (D.players[b].rating || 0) - (D.players[a].rating || 0) || D.players[a].no - D.players[b].no);
      const plan = AndSwiss.roundRobin(rrOrder || []); if (n > plan.length) { A.toast('اكتمل الدوري: لعب كل لاعب مع الجميع'); return; }
      const el = new Set(A.eligible(c)); games = plan[n - 1].games; bye = plan[n - 1].bye;
      if (games.some(g => !el.has(g.w) || !el.has(g.b))) A.toast('تنبيه: لاعب منسحب في التوزيع — سجّل له غياباً', 4500);
    } else { const out = AndSwiss.pairRound(A.pairInput(c), { round: n }); games = out.games; bye = out.bye; relaxed = out.relaxed; }
  } catch (e) { A.toast('تعذّر التوزيع: ' + e.message, 4000); return; }
  const doc = { cat: c, n, sys, games: games.map((g, i) => ({ bd: i + 1, w: g.w, b: g.b, res: null, st: 'pending' })), bye: bye || null, createdAt: now(), by: A.st.me || '' };
  if (rrOrder) doc.rrOrder = rrOrder;
  await A.safe(async () => { await A.backup('قبل توزيع ' + A.catName(c) + ' ج' + n); await A.put('rounds/' + A.roundId(c, n), doc); await A.log('توزيع جولة', A.catName(c) + ' ج' + n, doc.games.length + ' مباراة' + (bye ? ' + استراحة' : '') + (relaxed ? ' (تكرار مواجهة اضطراري)' : '')); UI.rsel[c] = n - 1; }, 'تم توزيع الجولة ' + n);
  if (relaxed) A.toast('تنبيه: الفئة صغيرة فاضطر النظام لتكرار مواجهة واحدة على الأقل', 5000);
};
async function freshRound(c, n) { const s = await A.st.db.doc('rounds/' + A.roundId(c, n)).get(); return s.exists ? JSON.parse(JSON.stringify(s.data())) : null; }
A.setResult = async (c, n, bd, res, reason) => {
  const ap = A.canApprove(), key = A.roundId(c, n) + '-' + bd;
  if (!ap) { await A.safe(async () => { await A.put('subs/' + key, { res, by: A.st.me || '', at: now(), help: false }); await A.log('اقتراح نتيجة', A.catName(c) + ' ج' + n + ' ط' + bd, res); }, 'أُرسلت النتيجة للاعتماد'); return; }
  const r = await A.safe(() => freshRound(c, n)); if (!r) return; const g = r.games.find(x => x.bd === +bd); if (!g) return;
  if (g.res && g.res !== res && !reason) { A.modal(`<h2>تعديل نتيجة معتمدة</h2><p>الطاولة ${esc(bd)}: ${esc(g.res)} ← ${esc(res)}</p><form id="reasonF" data-k="${esc(c)}:${n}:${bd}:${esc(res)}"><label>سبب التعديل *<textarea name="reason" required></textarea></label><div class="row" style="margin-top:10px"><button class="pri">اعتماد التعديل</button><button type="button" data-close>إلغاء</button></div></form>`); return; }
  if (g.res === res) return;
  const before = g.res; g.res = res; g.st = 'done';
  await A.safe(async () => { await A.upd('rounds/' + A.roundId(c, n), { games: r.games }); if (D.subs[key]) await A.del('subs/' + key); await A.log(before ? 'تعديل نتيجة معتمدة' : 'اعتماد نتيجة', A.catName(c) + ' ج' + n + ' ط' + bd, reason || '', before, res); }, before ? 'عُدّلت النتيجة' : 'اعتُمدت النتيجة');
};
A.setGameSt = async (c, n, bd, st) => { const r = await A.safe(() => freshRound(c, n)); if (!r) return; const g = r.games.find(x => x.bd === +bd); g.st = st; await A.safe(() => A.upd('rounds/' + A.roundId(c, n), { games: r.games })); };

/* ---------- finance ---------- */
function finance() {
  const S = A.S(), P = Object.entries(D.players).filter(([, p]) => !['rejected', 'cancelled'].includes(p.status));
  const paid = P.reduce((s, [id]) => s + (+(D.priv[id] || {}).payAmount || 0), 0);
  const due = P.filter(([id, p]) => (+(D.priv[id] || {}).payAmount || 0) < S.fee);
  const F = Object.entries(D.finance).sort((a, b) => String(b[1].date).localeCompare(String(a[1].date)));
  const inc = F.filter(([, f]) => f.kind === 'income').reduce((s, [, f]) => s + (+f.amount || 0), 0);
  const byCat = {}; F.filter(([, f]) => f.kind !== 'income').forEach(([, f]) => byCat[f.cat] = (byCat[f.cat] || 0) + (+f.amount || 0));
  const exp = Object.values(byCat).reduce((s, v) => s + v, 0), prizeCommit = 3 * (+S.prizes[1] + +S.prizes[2] + +S.prizes[3]);
  return `<div class="row sp"><h2 style="margin:0">المالية</h2><div class="row"><button class="pri" data-act="addFin">إضافة مصروف أو إيراد</button><button data-act="xFinance">تصدير التقرير المالي</button></div></div>
  <div class="kpis" style="margin-top:14px">${[['رسوم الاشتراك المحصّلة', money(paid)], ['إيرادات أخرى (رعاية)', money(inc)], ['إجمالي الإيرادات', money(paid + inc)], ['إجمالي المصروفات', money(exp)], ['صافي الميزانية', money(paid + inc - exp)], ['المتأخرات', money(due.reduce((s, [id]) => s + S.fee - (+(D.priv[id] || {}).payAmount || 0), 0))], ['الجوائز النقدية المقررة', money(prizeCommit)], ['المتوقع عند سداد الجميع', money(P.length * S.fee)]].map(([l, v]) => `<div class="kpi"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
  <div class="grid"><div class="card"><h3>المصروفات حسب البند</h3>${Object.keys(byCat).length ? Object.entries(byCat).map(([k, v]) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(k)}</span><b>${esc(money(v))}</b></div>`).join('') : '<p class="note">لا توجد مصروفات مسجلة.</p>'}</div>
  <div class="card"><h3>المتأخرات (${due.length})</h3>${due.slice(0, 30).map(([id, p]) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(A.regNo(p))} ${esc(p.name)}</span><span class="row"><span class="note">${esc(money(S.fee - (+(D.priv[id] || {}).payAmount || 0)))}</span><button class="sm" data-pay="${id}">دفع</button></span></div>`).join('') || '<p class="note">لا توجد متأخرات.</p>'}</div></div>
  <div class="card"><h3>القيود</h3>${F.length ? `<div class="scroll"><table class="stack"><thead><tr><th>التاريخ</th><th>النوع</th><th>البند</th><th>الوصف</th><th class="n">المبلغ</th><th>الفاتورة</th><th></th></tr></thead><tbody>${F.map(([id, f]) => `<tr><td class="n">${esc(f.date)}</td><td>${f.kind === 'income' ? 'إيراد' : 'مصروف'}</td><td>${esc(f.cat)}</td><td>${esc(f.desc)}</td><td class="n">${esc(money(f.amount))}</td><td>${f.receipt ? `<a href="/_blob/${esc(f.receipt)}" target="_blank" rel="noopener">عرض</a>` : ''}</td><td><button class="sm dan" data-findel="${id}">حذف</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">لا توجد قيود.</p>'}</div>`;
}
const FINCATS = ['الجوائز', 'المشتريات', 'الكؤوس والميداليات', 'الشهادات والطباعة', 'الضيافة', 'رعاية', 'أخرى'];
function finForm() { return `<h2>قيد مالي</h2><form id="finf"><div class="grid"><label>النوع<select name="kind"><option value="expense">مصروف</option><option value="income">إيراد (رعاية/دعم)</option></select></label><label>البند<select name="cat">${FINCATS.map(c => `<option>${c}</option>`).join('')}</select></label><label>المبلغ (ريال) *<input name="amount" inputmode="decimal"></label><label>التاريخ<input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label></div><label style="margin-top:10px">الوصف *<input name="desc"></label><div class="row" style="margin-top:10px"><button type="button" data-act="rcpt">إرفاق فاتورة</button><span id="rcptName" class="note"></span></div><div class="row" style="margin-top:12px"><button class="pri">حفظ</button><button type="button" data-close>إلغاء</button></div></form>`; }
let pendingRcpt = null;
document.getElementById('rcptIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!A.st.assets) { A.toast('رفع الملفات متاح للمحررين فقط'); return; }
  const lbl = document.getElementById('rcptName'); if (lbl) lbl.textContent = 'جارٍ الرفع…';
  try { const r = await A.st.assets.upload(f); pendingRcpt = r.id; if (lbl) lbl.textContent = 'أُرفق: ' + f.name; } catch (err) { if (lbl) lbl.textContent = 'تعذّر الرفع'; }
});
async function saveFin(f) {
  const fd = new FormData(f), amount = +digits(fd.get('amount')) || 0, desc = String(fd.get('desc') || '').trim();
  if (amount <= 0 || !desc) { A.toast('المبلغ والوصف مطلوبان'); return; }
  const id = 'f' + Date.now().toString(36);
  const doc = { kind: fd.get('kind'), cat: fd.get('cat'), amount, date: fd.get('date'), desc, receipt: pendingRcpt || '', by: A.st.me || '', at: now() };
  await A.safe(async () => { await A.put('finance/' + id, doc); await A.log('قيد مالي', doc.kind === 'income' ? 'إيراد' : 'مصروف', desc + ' — ' + amount); pendingRcpt = null; A.closeModal(); }, 'تم الحفظ');
}

/* ---------- prizes ---------- */
function prizes() {
  const S = A.S(), aw = S.awards, all = Object.entries(D.players).filter(([, p]) => p.status === 'approved');
  const sel = (k, l) => `<label>${l}<select data-award="${k}"><option value="">— لم يُحدَّد —</option>${all.map(([id, p]) => `<option value="${id}" ${aw[k] === id ? 'selected' : ''}>${esc(p.name)} (${esc(A.catName(p.cat))})</option>`).join('')}</select></label>`;
  const duo = A.duos()[0];
  return `<div class="row sp"><h2 style="margin:0">الجوائز والشهادات</h2><div class="row"><button class="pri" data-act="certAll">شهادات المشاركة (PDF)</button><button data-act="certWin">شهادات الفائزين والجوائز (PDF)</button><button data-act="achv">سجل إنجازات البطولة</button></div></div>
  <div style="margin-top:14px">${A.prizesSection(true)}</div><h2>الفائزون</h2><div class="grid" style="margin-top:14px">${K.CATS.map(c => { const T = A.table(c).slice(0, 3), done = A.catRounds(c).length >= S.maxRounds && A.catRounds(c).every(r => (r.games || []).every(g => g.res)); return `<div class="card"><h3>${esc(A.catName(c))} ${done ? '<span class="pill ok">نهائي</span>' : '<span class="pill warn">مؤقت</span>'}</h3>${T.length ? T.map(x => `<div class="row sp" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><span class="medal m${x.rank}">${x.rank}</span> ${esc(x.p.name)} — ${x.pts} ن</span><span class="note">${['كأس ذهبي', 'كأس فضي', 'كأس برونزي'][x.rank - 1]} + ${esc(S.prizes[x.rank])} ريال</span></div>`).join('') : '<p class="note">لا يوجد ترتيب بعد.</p>'}<p class="note" style="margin-top:8px">لقب «بطل الأندلس» لصاحب المركز الأول.</p></div>`; }).join('')}</div>
  <div class="card"><h3>الجوائز التشجيعية</h3><div class="grid">${sel('sport', 'أفضل روح رياضية')}${sel('youngest', 'أصغر مشارك')}${sel('improved', 'أفضل لاعب متطور')}</div><p style="margin-top:10px">أفضل ثنائي (تحدي الأسرة) تلقائياً: ${duo ? `${nm(duo.a)} + ${nm(duo.b)} — ${duo.pts} نقطة` : 'لا يوجد ثنائي مرتبط بعد'}</p></div>`;
}

/* ---------- reports ---------- */
const REPORTS = [['participants', 'تقرير المشاركين'], ['attendance', 'تقرير الحضور'], ['payments', 'تقرير المدفوعات'], ['matches', 'تقرير المباريات'], ['standings', 'تقرير ترتيب الفئات'], ['winners', 'تقرير الفائزين'], ['financial', 'التقرير المالي'], ['final', 'التقرير الختامي للبطولة'], ['survey', 'نتائج استبيان الرضا']];
function reports() {
  const fin = A.role() === 'finance', reg = A.role() === 'registrar';
  const ok = k => fin ? ['payments', 'financial', 'final'].includes(k) : reg ? ['participants', 'attendance', 'payments'].includes(k) : true;
  return `<h2>التقارير</h2><p class="note">«طباعة» تنزّل صفحة جاهزة للطباعة بهوية المدرسة؛ افتحها واضغط Ctrl+P (أو مشاركة ← طباعة على الجوال) واختر «حفظ PDF» إن أردت. «Excel» ينزّل جدولاً قابلاً للتحليل.</p><div class="grid">${REPORTS.filter(([k]) => ok(k)).map(([k, l]) => `<div class="card" style="margin:0"><h3>${l}</h3><div class="row"><button data-rep="${k}:html">طباعة</button><button data-rep="${k}:xlsx">Excel</button></div></div>`).join('')}</div>
  ${A.reportsX ? A.reportsX() : ''}`;
}

/* ---------- notify ---------- */
function notify() {
  const L = Object.entries(D.ann).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))), S = A.S();
  const tpl = UI.waTpl || `تذكير من ${S.name}: الجولة القادمة اليوم الساعة ${S.start} مساءً في ${S.place}. نرجو الحضور قبل الموعد بخمس دقائق.`;
  const P = Object.entries(D.players).filter(([id, p]) => p.status === 'approved' && D.priv[id] && intl(D.priv[id].phone));
  return `<h2>الإشعارات والإعلانات</h2><div class="card"><h3>إعلان جديد داخل المنصة والشاشات</h3><form id="annF" class="row"><label style="flex:3 1 300px">النص<input name="text" placeholder="مثال: تبدأ الجولة الثالثة الساعة 2:00 مساءً"></label><label style="flex:1 1 140px">النوع<select name="level"><option value="info">معلومة</option><option value="alert">تنبيه مهم</option></select></label><button class="pri" style="align-self:end">نشر</button><button type="button" data-act="annNext" style="align-self:end">إعلان الجولة القادمة</button></form></div>
  <div class="card"><h3>الإعلانات (${L.length})</h3>${L.map(([id, a]) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${a.level === 'alert' ? '<span class="pill bad">مهم</span> ' : ''}${esc(a.text)} <span class="note">${esc(fmtDT(a.at))}</span></span><span class="row"><button class="sm" data-anntog="${id}">${a.active === false ? 'إظهار' : 'إخفاء'}</button><button class="sm dan" data-anndel="${id}">حذف</button></span></div>`).join('') || '<p class="note">لا توجد إعلانات.</p>'}</div>
  <div class="card"><h3>تذكير عبر واتساب (${P.length} لاعباً)</h3><p class="note">لا ترسل المنصة رسائل تلقائياً: كل زر يفتح واتساب برسالة جاهزة تضغط فيها «إرسال». تُضاف تفاصيل طاولة كل لاعب تلقائياً عند توزيع الجولة.</p><label>نص التذكير<textarea id="waTpl">${esc(tpl)}</textarea></label>
  <div class="grid" style="margin-top:12px">${P.map(([id, p]) => { const nx = A.nextOpp(id), extra = nx && !nx.bye ? `\nالجولة ${nx.n}: الطاولة ${nx.bd} بالـ${nx.color === 'w' ? 'أبيض' : 'أسود'} ضد ${D.players[nx.opp] ? D.players[nx.opp].name : ''}` : ''; return `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${intl(D.priv[id].phone)}?text=${encodeURIComponent(p.name + '\n' + tpl + extra)}">${esc(p.name)}</a>`; }).join('')}</div></div>`;
}

/* ---------- gallery ---------- */
function gallery() {
  const L = Object.entries(D.gallery).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)));
  return `<div class="row sp"><h2 style="margin:0">معرض الصور</h2>${A.st.assets ? '<label class="btn pri" style="flex-direction:row">رفع صور<input type="file" id="galIn" accept="image/*" multiple hidden></label>' : '<span class="note">الرفع متاح للمحررين</span>'}</div><p class="note">ارفع فقط صور من وافق أولياء أمورهم على التصوير والنشر.</p><div class="grid">${L.map(([id, g]) => `<figure class="card" style="margin:0;padding:8px"><img src="/_blob/${esc(g.asset)}" alt="${esc(g.caption || '')}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px"><input data-gcap="${id}" value="${esc(g.caption || '')}" placeholder="وصف الصورة" style="width:100%;margin-top:6px"><button class="sm dan" data-gdel="${id}" style="margin-top:6px">حذف</button></figure>`).join('') || '<div class="empty">لا توجد صور.</div>'}</div>`;
}

/* ---------- roles ---------- */
function roles() {
  const list = UI.people || [];
  const assigned = Object.entries(D.roles);
  return `<h2>الصلاحيات والحكام</h2><div class="card"><p>كيف تعمل الصلاحيات: أضف الموظف من زر <b>المشاركة</b> في claude.ai بمستوى <b>محرر</b> (للإدارة والحكم الرئيسي والمالية والتسجيل ومشرفة النساء)، أو <b>مساهم</b> (للحكم المساعد: يقترح النتائج فقط ولا يرى الجوالات ولا المالية)، أو <b>مشاهد</b> (للجمهور وشاشة العرض). ثم حدّد هنا دور كل محرر.</p><p class="note">حدود الحماية: مستويات المشاركة الثلاثة محمية من الخادم. أما الفروق بين أدوار «المحرر» الخمسة فتنظيم في الواجهة، وكل عملية منهم تُسجَّل في سجل التدقيق باسم صاحبها.</p></div>
  <div class="card"><div class="row sp"><h3 style="margin:0">الأشخاص</h3><button data-act="people">تحميل أعضاء المؤسسة</button></div>
  ${(list.length || assigned.length) ? `<div class="scroll" style="margin-top:10px"><table class="stack"><thead><tr><th>الاسم</th><th>الدور</th></tr></thead><tbody>${[...new Map([...assigned.map(([uid]) => [uid, A.names[uid] || 'مستخدم']), ...list.map(p => [p.id, p.name])]).entries()].map(([uid, name]) => `<tr><td>${esc(name || A.names[uid] || 'مستخدم')}${uid === A.st.me ? ' (أنت)' : ''}</td><td>${uid === A.st.me ? 'مدير النظام' : `<select data-role="${esc(uid)}"><option value="">— بدون دور —</option>${Object.entries(K.ROLES).filter(([k]) => k !== 'sys').map(([k, r]) => `<option value="${k}" ${(D.roles[uid] || {}).role === k ? 'selected' : ''}>${r.n}</option>`).join('')}</select>`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">اضغط «تحميل أعضاء المؤسسة» لعرض الأشخاص.</p>'}</div>`;
}

/* ---------- settings ---------- */
function settings() {
  const S = A.S(), f = (k, l, t = 'text', a = '') => `<label>${l}<input data-set="${k}" type="${t}" value="${esc(S[k])}" ${a}></label>`;
  const bk = UI.backups;
  return `<h2>الإعدادات</h2><div class="savebar"><span>✓ تُحفظ كل خانة تلقائياً عند تغييرها، وتظهر رسالة «تم حفظ الإعدادات».</span><button class="pri" data-x="saveAll">حفظ الإعدادات</button></div><div class="card"><h3>البطولة</h3><div class="grid">${f('name', 'اسم البطولة')}${f('season', 'الموسم')}${f('club', 'اسم النادي')}${f('org', 'الجهة المنظمة')}${f('school', 'المدرسة / الفرع')}${f('place', 'مكان المنافسات')}${f('start', 'بداية المنافسات', 'time')}${f('end', 'نهاية المنافسات', 'time')}${f('tc', 'دقائق لكل لاعب (زمن المباراة)', 'number', 'min="1" max="90"')}${f('inc', 'ثوانٍ إضافية بعد كل نقلة', 'number', 'min="0" max="60"')}${f('maxRounds', 'عدد الجولات', 'number', 'min="1" max="15"')}${f('fee', 'رسوم الاشتراك (ريال)', 'number', 'min="0"')}${f('target', 'العدد المستهدف', 'number', 'min="0"')}${f('phone', 'جوال التواصل')}${f('wa', 'واتساب المنسّق')}${f('formUrl', 'رابط نموذج التسجيل (Google)', 'url')}${f('surveyUrl', 'رابط استبيان الرضا', 'url')}${f('tvSec', 'ثوانٍ لكل شاشة عرض', 'number', 'min="6"')}</div>
  <label class="ck" style="margin-top:10px"><input type="checkbox" data-setb="regOpen" ${S.regOpen ? 'checked' : ''}> التسجيل مفتوح</label></div>
  <div class="card"><h3>الفئات والجوائز</h3><div class="grid">${K.CATS.map(c => `<label>الفئة ${c}<input data-setn="cats.${c}" value="${esc(S.cats[c])}"></label><label>نظام الفئة ${c}<select data-setn="sys.${c}"><option value="auto" ${S.sys[c] === 'auto' ? 'selected' : ''}>تلقائي (دوري للفئات الصغيرة)</option><option value="swiss" ${S.sys[c] === 'swiss' ? 'selected' : ''}>سويسري</option><option value="rr" ${S.sys[c] === 'rr' ? 'selected' : ''}>دوري</option></select></label>`).join('')}${[1, 2, 3].map(i => `<label>جائزة المركز ${i} (ريال)<input data-setn="prizes.${i}" type="number" value="${esc(S.prizes[i])}"></label>`).join('')}</div></div>
  <div class="card"><h3>الجدول الزمني</h3>${S.days.map((d, i) => `<div class="grid" style="margin-bottom:8px"><label>اليوم ${i + 1}<input type="date" data-day="${i}:date" value="${esc(d.date)}"></label><label>البرنامج<input data-day="${i}:title" value="${esc(d.title)}"></label><label>الجولات<input data-day="${i}:rounds" value="${esc(d.rounds)}" placeholder="مثال: 4,5"></label></div>`).join('')}<div class="row"><button data-act="dayAdd">إضافة يوم</button>${S.days.length > 1 ? '<button class="dan" data-act="dayDel">حذف آخر يوم</button>' : ''}</div></div>
  <div class="card"><h3>معايير كسر التعادل (بالترتيب)</h3>${S.tb.map((t, i) => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${i + 1}. ${esc(K.TB[t])}</span><span class="row"><button class="sm" data-tb="${i}:-1" ${i ? '' : 'disabled'} aria-label="أعلى">▲</button><button class="sm" data-tb="${i}:1" ${i < S.tb.length - 1 ? '' : 'disabled'} aria-label="أسفل">▼</button><button class="sm dan" data-tb="${i}:x">إزالة</button></span></div>`).join('')}<div class="row" style="margin-top:8px">${Object.keys(K.TB).filter(t => !S.tb.includes(t)).map(t => `<button class="sm" data-tbadd="${t}">+ ${esc(K.TB[t])}</button>`).join('')}</div></div>
  <div class="card"><h3>عبارات شاشة الترحيب</h3><textarea data-setq="1">${esc(S.quotes.join('\n'))}</textarea></div>
  <div class="card"><h3>الخطوط</h3><div class="grid"><label>خط العناوين<select data-set="hf">${A.HF.map(x => `<option ${x === S.hf ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>خط النصوص<select data-set="bf">${A.BF.map(x => `<option ${x === S.bf ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>حجم النص<input type="range" min="13" max="22" data-set="fs" value="${esc(S.fs)}"></label></div></div>
  <div class="card"><h3>النسخ الاحتياطي</h3><p class="note">تُحفظ نسخة تلقائياً قبل كل توزيع جولة واستيراد وبدء موسم (آخر 15 نسخة).</p><div class="row"><button class="pri" data-act="bkNow">نسخة الآن</button><button data-act="bkList">عرض النسخ</button><button data-act="bkFile">تنزيل نسخة كاملة (JSON)</button></div>
  ${bk ? (bk.length ? bk.map(b => `<div class="row sp" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${esc(fmtDT(b.at))} — ${esc(b.reason)}</span><span class="row"><button class="sm" data-bkdl="${esc(b.id)}">تنزيل</button>${A.st.level === 'owner' ? `<button class="sm dan" data-bkrs="${esc(b.id)}">استعادة</button>` : ''}</span></div>`).join('') : '<p class="note">لا توجد نسخ.</p>') : ''}</div>
  ${D.legacy && (D.legacy.players || []).length ? `<div class="card"><h3>نقل البيانات القديمة</h3><p>توجد ${(D.legacy.players || []).length} لاعباً من النسخة السابقة. النقل يحفظ نسخة احتياطية أولاً، ويُبقي البيانات القديمة كما هي.</p><button class="pri" data-act="migrate">نقل البيانات</button></div>` : ''}`;
}

/* ---------- season ---------- */
function season() {
  const S = A.S(), L = Object.values(D.archive).sort((a, b) => String(b.season).localeCompare(String(a.season)));
  return `<h2>المواسم والأرشيف</h2><div class="card"><p>المنصة دائمة لـ${esc(S.club)}: في نهاية كل بطولة تُؤرشف النتائج النهائية والفائزون، ثم يبدأ موسم جديد بقائمة لاعبين فارغة، ويبقى سجل إنجازات كل لاعب ظاهراً في صفحته عبر المواسم (يُعرف اللاعب العائد من اسمه وجواله).</p>
  <div class="row"><button class="pri" data-act="archive">أرشفة موسم ${esc(S.season)}</button><button class="dan" data-act="newSeason" ${D.archive[S.season] ? '' : 'disabled'}>بدء موسم جديد</button></div>${D.archive[S.season] ? '<p class="note">هذا الموسم مؤرشف. إعادة الأرشفة تحدّث الأرشيف.</p>' : '<p class="note">أرشف الموسم قبل بدء موسم جديد.</p>'}</div>
  <div class="card"><h3>المواسم المؤرشفة</h3>${L.length ? L.map(a => `<div style="border-bottom:1px solid var(--line);padding:8px 0"><b>${esc(a.name)} ${esc(a.season)}</b> <span class="note">${esc(fmtDT(a.at))} • ${(a.results || []).length} لاعباً</span><div class="note">${(a.winners || []).map(w => esc(w.catName) + ': ' + esc(w.name)).join(' • ')}</div></div>`).join('') : '<p class="note">لا توجد مواسم مؤرشفة.</p>'}</div>`;
}
A.archiveSeason = async () => {
  const S = A.S(), results = [], winners = [];
  const awardOf = id => Object.entries({ sport: 'أفضل روح رياضية', youngest: 'أصغر مشارك', improved: 'أفضل لاعب متطور' }).filter(([k]) => S.awards[k] === id).map(([, v]) => v).join('، ');
  const duo = A.duos()[0];
  K.CATS.forEach(c => A.table(c).forEach(x => { const aw = [x.rank === 1 ? 'بطل الأندلس' : '', awardOf(x.id), duo && (duo.a === x.id || duo.b === x.id) ? 'أفضل ثنائي' : ''].filter(Boolean).join('، '); results.push({ mk: x.p.mk || '', name: x.p.name, cat: c, catName: A.catName(c), rank: x.rank, pts: x.pts, w: x.w, d: x.d, l: x.l, award: aw }); if (x.rank === 1) winners.push({ catName: A.catName(c), name: x.p.name }); }));
  const doc = { season: S.season, name: S.name, at: now(), results, winners, counts: { players: Object.keys(D.players).length, games: Object.values(D.rounds).reduce((s, r) => s + (r.games || []).length, 0) } };
  await A.safe(async () => { await A.put('archive/' + String(S.season).replace(/[^\w.-]/g, '_'), doc); await A.log('أرشفة موسم', S.season, results.length + ' لاعباً'); }, 'تمت أرشفة الموسم');
};
A.newSeason = async ns => {
  await A.backup('قبل بدء موسم ' + ns);
  const cols = ['players', 'private', 'rounds', 'subs', 'incidents', 'finance', 'requests', 'survey'];
  let n = 0;
  for (const c of cols) { try { const q = await A.st.db.collection(c).get(); for (const d of q.docs) { await A.del(c + '/' + d.id); n++; if (n % 20 === 0) { A.toast('جارٍ التنظيف… ' + n); await new Promise(r => setTimeout(r, 400)); } } } catch (e) { } }
  const S = A.S(); const ns2 = Object.assign({}, D.settings || {}, { season: ns, awards: { sport: '', youngest: '', improved: '', duo: '' }, days: S.days.map(d => ({ ...d, date: '' })) });
  await A.safe(async () => { await A.put('settings/main', ns2); await A.log('بدء موسم جديد', ns, 'حُذف ' + n + ' مستنداً بعد الأرشفة والنسخ'); }, 'بدأ موسم ' + ns);
};

/* ---------- audit ---------- */
function audit() {
  return `<h2>سجل التدقيق</h2><p class="note">آخر 300 عملية: من قام بها، ومتى، وما الذي تغيّر.</p><div class="scroll"><table class="stack"><thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>الهدف</th><th>التفاصيل</th><th>قبل ← بعد</th></tr></thead><tbody>${D.audit.map(a => `<tr><td class="n">${esc(fmtDT(a.at))}</td><td>${who(a.uid)}</td><td>${esc(a.act)}</td><td>${esc(a.target)}</td><td>${esc(a.info)}</td><td>${a.before !== null && a.before !== undefined ? esc(JSON.stringify(a.before)) + ' ← ' + esc(JSON.stringify(a.after)) : ''}</td></tr>`).join('')}</tbody></table></div>`;
}
function screens() { return `<h2>الشاشات المباشرة</h2><div class="grid">${[['tv', 'كل الفئات بالتناوب'], ...K.CATS.map(c => ['tv-' + c, A.catName(c)])].map(([h, l]) => `<a class="card btn" style="margin:0;justify-content:center;min-height:90px;font-size:20px" href="#${h}">${esc(l)}</a>`).join('')}</div><p class="note">افتح الشاشة على جهاز العرض، ثم اضغط «ملء الشاشة». تتنقل تلقائياً بين المباريات والنتائج والترتيب والإعلانات، وتتحدّث فور اعتماد أي نتيجة.</p>`; }

const PAGES = { dash, players, requests, attend, rounds, ref, standings: () => `<h2>الترتيب</h2>${catTabs()}${A.standTable(curCat())}<div class="row" style="margin-top:10px"><button data-rep="standings:xlsx">Excel</button><button data-rep="standings:html">طباعة</button><button data-act="copyStand">نسخ لواتساب</button></div>`, finance, prizes, reports, notify, gallery, roles, settings, season, audit, screens };
A.renderAdmin = h => {
  const r = A.role();
  if (!r) { document.getElementById('root').innerHTML = `<main><div class="card" style="max-width:560px;margin:60px auto;text-align:center"><img src="logo.png" alt="" style="height:56px"><h2>لوحة الإدارة للموظفين فقط</h2><p>لا تملك صلاحية الإدارة في هذه المنصة. إذا كنت من فريق البطولة، اطلب من مدير النظام إضافتك من زر المشاركة.</p><a class="btn pri" href="#home">واجهة الجمهور</a></div></main>`; return; }
  let sec = h === 'admin' ? K.ROLES[r].s[0] : h.slice(2);
  if (!K.ROLES[r].s.includes(sec)) sec = K.ROLES[r].s[0];
  if (sec === 'screens' && r === 'display') { /* display-only staff */ }
  const lc = lockCat(); if (lc) UI.cat = lc;
  document.getElementById('root').innerHTML = `<div class="adm">${side(sec)}<div class="work">${A.st.err ? `<div class="warnbox">${esc(A.st.err)}</div>` : ''}${(Object.assign({}, PAGES, A.admX || {}))[sec]()}</div></div>`;
};

/* ---------- events ---------- */
const parse = s => s.split(':');
document.addEventListener('click', async e => {
  const b = e.target.closest('button,[data-act]'); if (!b || !document.querySelector('.adm,#modal.on')) return; const d = b.dataset;
  if (d.acat) { UI.cat = d.acat; A.render(); }
  else if (d.arsel) { UI.rsel[curCat()] = +d.arsel; A.render(); }
  else if (d.edit) A.modal(playerForm(d.edit));
  else if (d.pay) A.modal(payForm(d.pay));
  else if (d.conf) A.confirmBox(d.conf);
  else if (d.st) { const [id, st] = parse(d.st); if (st === 'rejected' || st === 'cancelled') { A.modal(`<h2>${K.REG[st]}: ${esc(D.players[id].name)}</h2><form id="stF" data-k="${esc(d.st)}"><label>السبب *<textarea name="reason" required></textarea></label><div class="row" style="margin-top:10px"><button class="pri">تأكيد</button><button type="button" data-close>إلغاء</button></div></form>`); } else A.setStatus(id, st); }
  else if (d.unlink) { const id = d.unlink, o = D.players[id].duo; await A.safe(async () => { await A.upd('players/' + id, { duo: '' }); if (D.players[o]) await A.upd('players/' + o, { duo: '' }); await A.log('فك ربط ثنائي', A.regNo(D.players[id]), ''); A.closeModal(); }, 'تم فك الربط'); }
  else if (d.res) { const [c, n, bd, v] = parse(d.res); A.setResult(c, +n, +bd, v); }
  else if (d.gst) { const [c, n, bd, st] = parse(d.gst); A.setGameSt(c, +n, +bd, st); }
  else if (d.help) { const [c, n, bd] = parse(d.help); A.modal(`<h2>طلب الحكم الرئيسي — طاولة ${esc(bd)}</h2><form id="helpF" data-k="${esc(d.help)}"><label>وصف مختصر<textarea name="note"></textarea></label><div class="row" style="margin-top:10px"><button class="pri">إرسال</button><button type="button" data-close>إلغاء</button></div></form>`); }
  else if (d.inc) { A.modal(`<h2>الإبلاغ عن مخالفة — طاولة ${esc(parse(d.inc)[2])}</h2><form id="incF" data-k="${esc(d.inc)}"><label>وصف المخالفة *<textarea name="text" required></textarea></label><div class="row" style="margin-top:10px"><button class="pri">إرسال البلاغ</button><button type="button" data-close>إلغاء</button></div></form>`); }
  else if (d.incclose) { await A.safe(async () => { await A.upd('incidents/' + d.incclose, { status: 'closed', closedBy: A.st.me || '', closedAt: now() }); await A.log('إغلاق بلاغ', d.incclose, ''); }, 'أُغلق البلاغ'); }
  else if (d.subok) { const [c, n, bd] = parse(d.subok); const s = D.subs[A.roundId(c, n) + '-' + bd]; if (s && s.res) A.setResult(c, +n, +bd, s.res); }
  else if (d.subno) { const [c, n, bd] = parse(d.subno); await A.safe(async () => { await A.del('subs/' + A.roundId(c, n) + '-' + bd); await A.log('رفض/إغلاق طلب حكم', A.catName(c) + ' ج' + n + ' ط' + bd, ''); }); }
  else if (d.reqok || d.reqno) { const [uid, i] = parse(d.reqok || d.reqno); const R = D.requests[uid]; const items = JSON.parse(JSON.stringify(R.items)); const it = items[+i]; if (d.reqok) { const id = await A.createPlayer(it, 'حساب المنصة'); if (!id) return; } items[+i].done = d.reqok ? 'accepted' : 'rejected'; await A.safe(() => A.put('requests/' + uid, { items }), d.reqok ? 'أُنشئ المشارك' : 'رُفض الطلب'); }
  else if (d.findel) { A.modal(`<h2>حذف القيد؟</h2><p>${esc(D.finance[d.findel].desc)} — ${esc(money(D.finance[d.findel].amount))}</p><div class="row"><button class="pri dan" id="finDelGo">حذف</button><button data-close>إلغاء</button></div>`); document.getElementById('finDelGo').onclick = async () => { const f = D.finance[d.findel]; await A.safe(async () => { await A.del('finance/' + d.findel); await A.log('حذف قيد مالي', f.desc, f.amount); A.closeModal(); }, 'حُذف'); }; }
  else if (d.anntog) { const a = D.ann[d.anntog]; await A.safe(() => A.upd('ann/' + d.anntog, { active: a.active === false })); }
  else if (d.anndel) { await A.safe(async () => { await A.del('ann/' + d.anndel); await A.log('حذف إعلان', '', ''); }); }
  else if (d.gdel) { const g = D.gallery[d.gdel]; await A.safe(async () => { await A.del('gallery/' + d.gdel); try { await A.st.assets.delete(g.asset); } catch (x) { } await A.log('حذف صورة', '', ''); }, 'حُذفت الصورة'); }
  else if (d.tb) { const [i, m] = parse(d.tb), S = A.S(), tb = S.tb.slice(); if (m === 'x') tb.splice(+i, 1); else { const j = +i + +m; [tb[i], tb[j]] = [tb[j], tb[i]]; } A.saveSettings({ tb }); }
  else if (d.tbadd) { A.saveSettings({ tb: A.S().tb.concat([d.tbadd]) }); }
  else if (d.bkdl) { const s = await A.st.db.doc('backups/' + d.bkdl).get(); if (s.exists) A.save('نسخة-احتياطية-' + d.bkdl + '.json', JSON.stringify(s.data(), null, 1)); }
  else if (d.bkrs) { A.modal(`<h2>استعادة نسخة احتياطية</h2><p>ستُستبدل بيانات البطولة الحالية بالكامل ببيانات النسخة. تُحفظ نسخة من الوضع الحالي أولاً.</p><div class="row"><button class="pri dan" id="bkGo">استعادة</button><button data-close>إلغاء</button></div>`); document.getElementById('bkGo').onclick = () => { A.closeModal(); A.restore(d.bkdl || d.bkrs); }; }
  else if (d.rep) { const [k, fmt] = parse(d.rep); A.report(k, fmt); }
  const act = d.act; if (!act) return;
  if (act === 'addPlayer') A.modal(playerForm(null));
  else if (act === 'import') document.getElementById('fileIn').click();
  else if (act === 'pair') A.pairNext();
  else if (act === 'startRound') { const c = curCat(), R = A.catRounds(c), r = R[R.length - 1]; const fr = await A.safe(() => freshRound(c, r.n)); if (!fr) return; fr.games.forEach(g => { if (!g.res) g.st = 'live'; }); await A.safe(async () => { await A.upd('rounds/' + A.roundId(c, r.n), { games: fr.games, startedAt: now() }); await A.log('بدء جولة', A.catName(c) + ' ج' + r.n, ''); }, 'بدأت الجولة'); }
  else if (act === 'delRound') { const c = curCat(), R = A.catRounds(c), r = R[R.length - 1]; A.modal(`<h2>حذف الجولة ${r.n}؟</h2><p>${(r.games || []).filter(g => g.res).length} نتيجة معتمدة ستُحذف معها. تُحفظ نسخة احتياطية أولاً.</p><form id="delRF"><label>السبب *<input name="reason" required></label><div class="row" style="margin-top:10px"><button class="pri dan">حذف</button><button type="button" data-close>إلغاء</button></div></form>`); }
  else if (act === 'copyPair' || act === 'copyStand') { const c = curCat(), R = A.catRounds(c), r = R[UI.rsel[c] ?? R.length - 1] || R[R.length - 1], S = A.S(); const t = act === 'copyPair' ? `♟ ${S.name} ${S.season}\n${A.catName(c)} — الجولة ${r.n}\n` + r.games.map(g => `${g.bd}) ${D.players[g.w]?.name} ⚪ ${g.res || '—'} ⚫ ${D.players[g.b]?.name}`).join('\n') + (r.bye ? `\nاستراحة: ${D.players[r.bye]?.name}` : '') : `🏆 ${S.name}\nترتيب ${A.catName(c)} بعد الجولة ${R.length}\n` + A.table(c).map(x => `${x.rank}. ${x.p.name} — ${x.pts}`).join('\n'); navigator.clipboard.writeText(t).then(() => A.toast('تم النسخ'), () => A.toast('تعذّر النسخ')); }
  else if (act === 'addFin') { pendingRcpt = null; A.modal(finForm()); }
  else if (act === 'rcpt') document.getElementById('rcptIn').click();
  else if (act === 'annNext') { const S = A.S(); const i = document.querySelector('#annF [name=text]'); const nxt = Math.min(S.maxRounds, Math.max(...K.CATS.map(c => A.catRounds(c).length)) + 1); i.value = `تبدأ الجولة ${nxt} الساعة ${S.start} مساءً — نرجو الحضور قبل الموعد بخمس دقائق`; i.focus(); }
  else if (act === 'people') { if (!A.st.user) return; try { const r = await A.st.user.search(''); UI.people = (r || []).map(p => ({ id: p.id, name: p.name || '' })); (r || []).forEach(p => { if (p.name) A.names[p.id] = p.name; }); A.render(); } catch (err) { A.toast('تعذّر تحميل الأعضاء'); } }
  else if (act === 'bkNow') { await A.safe(() => A.backup('نسخة يدوية'), 'حُفظت النسخة'); UI.backups = null; }
  else if (act === 'bkList') { const q = await A.safe(() => A.st.db.collection('backups').get()); if (q) { UI.backups = q.docs.map(d => ({ id: d.id, at: d.data().at, reason: d.data().reason })).sort((a, b) => b.id.localeCompare(a.id)); A.render(); } }
  else if (act === 'bkFile') A.save('شطرنج-الأندلس-نسخة-كاملة-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ at: now(), data: A.snapshot() }, null, 1));
  else if (act === 'migrate') A.migrate();
  else if (act === 'dayAdd') A.saveSettings({ days: A.S().days.concat([{ date: '', title: '', rounds: '' }]) });
  else if (act === 'dayDel') A.saveSettings({ days: A.S().days.slice(0, -1) });
  else if (act === 'archive') A.archiveSeason();
  else if (act === 'newSeason') { A.modal(`<h2>بدء موسم جديد</h2><p>سيُحذف اللاعبون والجولات والمالية الحالية بعد حفظ نسخة احتياطية (الأرشيف وسجل الإنجازات يبقيان).</p><form id="nsF"><label>اسم الموسم الجديد *<input name="season" required value="${esc(+A.S().season + 1 || '')}"></label><div class="row" style="margin-top:10px"><button class="pri dan">بدء الموسم</button><button type="button" data-close>إلغاء</button></div></form>`); }
  else if (['xPlayers', 'pPlayers', 'cards', 'certAll', 'certWin', 'achv', 'xFinance'].includes(act)) A.out(act);
});
document.addEventListener('change', async e => {
  const t = e.target, d = t.dataset; if (!document.querySelector('.adm')) return;
  if (t.id === 'pfc') { UI.fcat = t.value; A.render(); }
  else if (t.id === 'pfs') { UI.fst = t.value; A.render(); }
  else if (t.id === 'attDay') { UI.day = +t.value; A.render(); }
  else if (d.att) A.markAtt(d.att, t.checked);
  else if (d.award) { const aw = Object.assign({}, A.S().awards, { [d.award]: t.value }); A.saveSettings({ awards: aw }); A.log('تحديد جائزة تشجيعية', d.award, t.value ? D.players[t.value].name : ''); }
  else if (d.role) { await A.safe(async () => { if (t.value) await A.put('roles/' + d.role, { role: t.value, at: now() }); else await A.del('roles/' + d.role); await A.log('تعيين دور', A.names[d.role] || d.role, t.value ? K.ROLES[t.value].n : 'بدون'); }, 'تم تعيين الدور'); }
  else if (d.set) { let v = t.value; if (t.type === 'number' || t.type === 'range') v = +v; A.saveSettings({ [d.set]: v }); }
  else if (d.setb) A.saveSettings({ [d.setb]: t.checked });
  else if (d.setn) { const [k, sub] = d.setn.split('.'), S = A.S(); const o = Object.assign({}, S[k], { [sub]: t.type === 'number' ? +t.value : t.value }); A.saveSettings({ [k]: o }); }
  else if (d.day) { const [i, k] = d.day.split(':'), days = A.S().days.map(x => ({ ...x })); days[+i][k] = t.value; A.saveSettings({ days }); }
  else if (d.setq) A.saveSettings({ quotes: t.value.split('\n').map(s => s.trim()).filter(Boolean) });
  else if (d.gcap) await A.safe(() => A.upd('gallery/' + d.gcap, { caption: t.value.slice(0, 200) }));
  else if (t.id === 'galIn') { const files = [...t.files]; t.value = ''; for (const f of files) { try { A.toast('جارٍ رفع ' + f.name); const r = await A.st.assets.upload(f); await A.put('gallery/g' + Date.now().toString(36) + rid(3), { asset: r.id, caption: '', at: now(), by: A.st.me || '' }); } catch (err) { A.toast(A.errMsg(err)); } } A.log('رفع صور', '', files.length + ' صورة'); }
});
document.addEventListener('input', e => { if (e.target.id === 'pq') { UI.q = e.target.value; clearTimeout(UI.qt); UI.qt = setTimeout(() => { const pos = e.target.selectionStart; A.render(); const i = document.getElementById('pq'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 250); } else if (e.target.id === 'waTpl') { UI.waTpl = e.target.value; } });
document.addEventListener('submit', async e => {
  const f = e.target; const id = f.id; if (!['pform', 'payf', 'finf', 'annF', 'scanF', 'stF', 'reasonF', 'helpF', 'incF', 'delRF', 'nsF'].includes(id)) return; e.preventDefault();
  if (id === 'pform') savePlayerForm(f);
  else if (id === 'payf') savePay(f);
  else if (id === 'finf') saveFin(f);
  else if (id === 'annF') { const fd = new FormData(f), text = String(fd.get('text') || '').trim(); if (!text) return; await A.safe(async () => { await A.put('ann/a' + Date.now().toString(36), { text: text.slice(0, 500), level: fd.get('level'), at: now(), active: true, by: A.st.me || '' }); await A.log('نشر إعلان', '', text.slice(0, 80)); }, 'نُشر الإعلان'); }
  else if (id === 'scanF') { const v = digits(document.getElementById('scan').value).trim(); const m = v.match(/(\d+)\s*$/); const r = m && A.byNo(+m[1]); if (!r) { A.toast('رقم غير معروف: ' + v); } else { await A.markAtt(r[0], true); A.toast('حضور: ' + r[1].name); } const s = document.getElementById('scan'); if (s) { s.value = ''; s.focus(); } }
  else if (id === 'stF') { const [pid, st] = parse(f.dataset.k), reason = String(new FormData(f).get('reason') || '').trim(); if (!reason) return; await A.setStatus(pid, st, reason); A.closeModal(); }
  else if (id === 'reasonF') { const [c, n, bd, v] = parse(f.dataset.k), reason = String(new FormData(f).get('reason') || '').trim(); if (!reason) return; A.closeModal(); A.setResult(c, +n, +bd, v, reason); }
  else if (id === 'helpF') { const [c, n, bd] = parse(f.dataset.k); await A.safe(async () => { await A.put('subs/' + A.roundId(c, n) + '-' + bd, { res: null, help: true, note: String(new FormData(f).get('note') || '').slice(0, 300), by: A.st.me || '', at: now() }); await A.log('طلب الحكم الرئيسي', A.catName(c) + ' ج' + n + ' ط' + bd, ''); A.closeModal(); }, 'أُرسل الطلب'); }
  else if (id === 'incF') { const [c, n, bd] = parse(f.dataset.k), text = String(new FormData(f).get('text') || '').trim(); if (!text) return; await A.safe(async () => { await A.put('incidents/i' + Date.now().toString(36) + rid(3), { cat: c, n: +n, bd: +bd, text: text.slice(0, 600), by: A.st.me || '', at: now(), status: 'open' }); await A.log('بلاغ مخالفة', A.catName(c) + ' ج' + n + ' ط' + bd, text.slice(0, 120)); A.closeModal(); }, 'أُرسل البلاغ'); }
  else if (id === 'delRF') { const reason = String(new FormData(f).get('reason') || '').trim(); if (!reason) return; const c = curCat(), R = A.catRounds(c), r = R[R.length - 1]; A.closeModal(); await A.safe(async () => { await A.backup('قبل حذف ' + A.catName(c) + ' ج' + r.n); await A.del('rounds/' + A.roundId(c, r.n)); for (const k of Object.keys(D.subs)) if (k.startsWith(A.roundId(c, r.n) + '-')) await A.del('subs/' + k); await A.log('حذف جولة', A.catName(c) + ' ج' + r.n, reason); UI.rsel[c] = R.length - 2; }, 'حُذفت الجولة'); }
  else if (id === 'nsF') { const ns = String(new FormData(f).get('season') || '').trim().replace(/[^\w.-]/g, ''); if (!ns) return; A.closeModal(); A.newSeason(ns); }
});

/* settings save (merge) */
let setQ = Promise.resolve();
A.saveSettings = patch => { setQ = setQ.then(() => A.safe(async () => { const cur = Object.assign({}, D.settings || {}, patch); D.settings = cur; await A.put('settings/main', cur); await A.log('تعديل الإعدادات', Object.keys(patch).join('، '), ''); A.render(); }, '✓ تم حفظ الإعدادات')); return setQ; };

/* restore & migrate */
A.restore = async bid => {
  const s = await A.safe(() => A.st.db.doc('backups/' + bid).get()); if (!s || !s.exists) return;
  const data = s.data().data || {}; await A.backup('قبل الاستعادة');
  const map = { players: 'players', priv: 'private', rounds: 'rounds', finance: 'finance', ann: 'ann', gallery: 'gallery', archive: 'archive' };
  let n = 0;
  for (const [k, col] of Object.entries(map)) {
    const want = data[k] || {}; const cur = await A.st.db.collection(col).get();
    for (const d of cur.docs) if (!want[d.id]) { await A.del(col + '/' + d.id); n++; }
    for (const [id, v] of Object.entries(want)) { await A.put(col + '/' + id, v); n++; if (n % 25 === 0) { A.toast('جارٍ الاستعادة… ' + n); await new Promise(r => setTimeout(r, 300)); } }
  }
  if (data.settings) await A.put('settings/main', data.settings);
  await A.log('استعادة نسخة احتياطية', bid, n + ' عملية'); A.toast('تمت الاستعادة', 3500);
};
A.migrate = async () => {
  const L = D.legacy; if (!L) return;
  await A.backup('قبل نقل البيانات القديمة');
  const idMap = {}; let no = A.nextNo();
  const typeOf = c => c === '2' ? 'father' : c === '3' ? 'mother' : 'student';
  for (const p of L.players || []) {
    const id = 'p' + Date.now().toString(36) + rid(3); idMap[p.id] = id;
    await A.put('players/' + id, { no: no++, name: p.name, cat: p.cat, type: typeOf(p.cat), level: 'beg', rating: +p.rating || 0, status: 'approved', paid: !!p.paid, withdrawn: !!p.out, duo: '', mk: 'm' + rid(8), att: {}, season: A.S().season, createdAt: now() });
    await A.put('private/' + id, { phone: '', grade: p.info || '', branch: '', terms: true, parent: true, photo: false, payMethod: 'cash', payAmount: p.paid ? A.S().fee : 0, linkCode: rid(6), notes: 'منقول من النسخة السابقة', history: [{ at: now(), text: 'نُقل من النسخة السابقة' }] });
  }
  for (const c of K.CATS) { (L.rounds && L.rounds[c] || []).forEach(() => { }); let n = 0; for (const r of (L.rounds && L.rounds[c]) || []) { n++; await A.put('rounds/' + A.roundId(c, n), { cat: c, n, sys: 'swiss', games: (r.games || []).map((g, i) => ({ bd: i + 1, w: idMap[g.w], b: idMap[g.b], res: g.r || null, st: g.r ? 'done' : 'pending' })), bye: r.bye ? idMap[r.bye] : null, createdAt: now(), by: A.st.me || '' }); } }
  await A.saveSettings({ name: L.name || A.S().name });
  await A.log('نقل البيانات القديمة', '', (L.players || []).length + ' لاعباً'); A.toast('تم نقل البيانات', 3500);
};
}
