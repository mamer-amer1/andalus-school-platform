/* واجهة الشاشات المباشرة — بدون أدوات إدارة ولا بيانات شخصية */
{
const A = window.A, { esc } = A.u, K = A.K, D = A.D;
let idx = 0, timer = null, clock = null, lastKey = '';

function panes() {
  const h = location.hash.slice(1), only = h.match(/^tv-(\d)$/), cats = only ? [only[1]] : K.CATS;
  const out = [];
  const anyLive = K.CATS.some(c => { const R = A.catRounds(c), r = R[R.length - 1]; return r && (r.games || []).some(g => !g.res); });
  if (!anyLive) out.push({ t: 'welcome' });
  cats.forEach(c => {
    const R = A.catRounds(c), r = R[R.length - 1];
    if (r && (r.games || []).some(g => !g.res)) out.push({ t: 'matches', c });
    const done = [...R].reverse().find(x => (x.games || []).some(g => g.res));
    if (done) out.push({ t: 'results', c, r: done.n });
    if (A.table(c).length) out.push({ t: 'standings', c });
  });
  if (Object.values(D.ann).some(a => a.active !== false)) out.push({ t: 'ann' });
  if (!out.length || anyLive === false && out.length === 1) out.push({ t: 'welcome2' });
  return out;
}
function roundTimer(r) {
  if (!r || !r.startedAt) return '';
  const S = A.S(), total = (S.tc * 2 + 2) * 60000, left = new Date(r.startedAt).getTime() + total - Date.now();
  if (left <= 0) return '<span>انتهى الوقت المقرر للجولة</span>';
  const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
  return `<span>الوقت المتبقي للجولة <b class="tvclock" style="font-size:1em">${m}:${String(s).padStart(2, '0')}</b></span>`;
}
function rowsHtml(r) {
  const nm = id => { const p = D.players[id]; return p ? esc(p.name) : '—'; };
  return `<div class="tvg">${(r.games || []).map(g => `<div class="tvr"><div class="n">${g.bd}</div><div>${nm(g.w)}</div><div class="r">${g.res ? esc(g.res.replace('+-', '+/-').replace('-+', '-/+').replace('--', '-/-')) : (A.gameState(r, g) === 'live' ? '●' : 'vs')}</div><div class="bl">${nm(g.b)}</div></div>`).join('')}${r.bye ? `<div class="tvr"><div class="n">—</div><div>${nm(r.bye)}</div><div class="r">1</div><div class="bl">استراحة</div></div>` : ''}</div>`;
}
function paneHtml(p) {
  const S = A.S();
  if (p.t === 'welcome' || p.t === 'welcome2') {
    const q = S.quotes[Math.floor(Date.now() / 20000) % S.quotes.length] || '';
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2vw"><div style="position:relative;width:min(34vh,320px);height:min(34vh,320px)"><img class="ring" src="ring.png" alt="" style="position:absolute;inset:0;width:100%;height:100%"><img src="y1984.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;filter:brightness(4)"></div><div style="font-family:'Reem Kufi';font-size:clamp(30px,4vw,80px)">${esc(S.name)} ${esc(S.season)}</div><div style="font-size:clamp(22px,2.6vw,52px);color:#7fd6ec">${esc(q)}</div><div style="opacity:.8">${esc(S.school)}</div></div>`;
  }
  if (p.t === 'matches') { const R = A.catRounds(p.c), r = R[R.length - 1]; return `<div class="tvt"><b>${esc(A.catName(p.c))} — الجولة ${r.n}</b><span>المباريات الجارية</span>${roundTimer(r)}</div>${rowsHtml(r)}`; }
  if (p.t === 'results') { const r = A.catRounds(p.c).find(x => x.n === p.r); return `<div class="tvt"><b>${esc(A.catName(p.c))} — نتائج الجولة ${r.n}</b><span>${(r.games || []).filter(g => g.res).length} من ${(r.games || []).length} منتهية</span></div>${rowsHtml({ ...r, games: (r.games || []).filter(g => g.res), bye: r.bye })}`; }
  if (p.t === 'standings') {
    const T = A.table(p.c).slice(0, 12);
    return `<div class="tvt"><b>${esc(A.catName(p.c))} — الترتيب المؤقت</b><span>بعد الجولة ${A.catRounds(p.c).length}</span></div><table class="tvs"><thead><tr><th>المركز</th><th>اللاعب</th><th>المباريات</th><th>فوز</th><th>تعادل</th><th>خسارة</th><th>النقاط</th><th>بوخهولز</th></tr></thead><tbody>${T.map(x => `<tr><td>${x.rank <= 3 ? `<span class="medal m${x.rank}">${x.rank}</span>` : x.rank}</td><td>${esc(x.p.name)}</td><td>${x.gp + x.bye}</td><td>${x.w}</td><td>${x.d}</td><td>${x.l}</td><td><b>${x.pts}</b></td><td>${x.bh}</td></tr>`).join('')}</tbody></table>`;
  }
  if (p.t === 'ann') { const L = Object.values(D.ann).filter(a => a.active !== false).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 3); return `<div class="tvt"><b>إعلانات البطولة</b></div>${L.map(a => `<div class="tvann">${esc(a.text)}</div>`).join('')}`; }
  return '';
}
A.renderTV = () => {
  const S = A.S(), P = panes(); if (idx >= P.length) idx = 0; const p = P[idx];
  const t = new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('root').innerHTML = `<div class="tv" id="tvwrap"><div class="tvh"><img src="logo.png" alt="شعار مدارس الأندلس الأهلية"><div style="text-align:center"><h1>${esc(S.name)} ${esc(S.season)}</h1><div style="opacity:.8">${esc(S.club)}</div></div><div class="tvclock" id="tvclk">${t}</div></div>
  <div class="tvb">${paneHtml(p)}</div>
  <div class="tvf"><span>${D.online ? 'تحديث مباشر' : 'غير متصل — آخر بيانات محفوظة'}</span><div class="tvdots">${P.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')}</div><span><button class="sm" id="tvfs" style="background:#ffffff22;color:#fff;border-color:#ffffff44">ملء الشاشة</button> <a href="#home" style="color:#ffffffaa">خروج</a></span></div></div>`;
};
A.tvStart = () => {
  A.tvStop(); idx = 0;
  timer = setInterval(() => { idx++; A.renderTV(); }, Math.max(6, +A.S().tvSec || 15) * 1000);
  clock = setInterval(() => { const e = document.getElementById('tvclk'); if (e) e.textContent = new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' }); const pn = panes()[idx]; if (pn && pn.t === 'matches') A.renderTV(); }, 1000);
};
A.tvStop = () => { clearInterval(timer); clearInterval(clock); timer = clock = null; };
document.addEventListener('click', e => { if (e.target.id === 'tvfs') { const el = document.documentElement; (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => A.toast('ملء الشاشة غير متاح هنا — استخدم F11 في المتصفح')); } });
}
