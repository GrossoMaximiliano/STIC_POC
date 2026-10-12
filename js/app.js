/* =========================================================
   STIC · App de Socios — Lógica del mock
   SPA liviana: vistas + pila de navegación + datos en memoria
   ========================================================= */

/* ---------- Utilidades ---------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isoDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const isoPlus = (iso, n) => { const d = isoDate(iso); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtTime = min => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const fmtLong = iso => { const d = isoDate(iso); return `${DIAS_FULL[d.getDay()]} ${d.getDate()} de ${MESES_FULL[d.getMonth()]}`; };
const fmtMed  = iso => { const d = isoDate(iso); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const fmtVigencia = iso => { const d = isoDate(iso); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

/* ---------- Pseudo-azar determinista (ocupación consistente) ---------- */
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- QR simulado (patrón determinista a partir del texto) ---------- */
function qrSVG(text) {
  const n = 21, rnd = mulberry(hashSeed(String(text)));
  const fd = (lx, ly) => lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
  let dark = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let d;
      if (x < 7 && y < 7) d = fd(x, y);
      else if (x >= n - 7 && y < 7) d = fd(x - (n - 7), y);
      else if (x < 7 && y >= n - 7) d = fd(x, y - (n - 7));
      else d = rnd() < 0.44;
      if (d) dark += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg class="qr" viewBox="0 0 21 21" shape-rendering="crispEdges" role="img" aria-label="Código QR"><rect width="21" height="21" fill="#fff"/><path d="${dark}" fill="#0C2214"/></svg>`;
}

/* ---------- Estado ---------- */
const state = {
  logged: false,
  reservations: initialReservations(todayISO(), isoPlus),
  coupons: [],
  cat: 'Todas',
  q: '',
  bookingTab: 'proximas',
  currentFac: null,
  currentDate: null,
  pendingSlot: null,
  currentBenefit: null
};

const facById = id => FACILITIES.find(f => f.id === id);
const couponOf = id => state.coupons.find(c => c.benefitId === id);

/* ---------- Turnos / disponibilidad ---------- */
function getSlots(fac) {
  if (fac.franjas) return fac.franjas.map(f => ({ start: f.inicio * 60, dur: f.dur, label: f.label, rango: f.rango, wide: true }));
  const out = [];
  for (let m = fac.apertura * 60; m + fac.duracion <= fac.cierre * 60; m += fac.duracion) {
    out.push({ start: m, dur: fac.duracion, label: fmtTime(m), rango: fac.duracion >= 120 ? '2 h' : '1 h' });
  }
  return out;
}
function isMine(facId, iso, start) {
  return state.reservations.some(r => r.status === 'proxima' && r.facilityId === facId && r.date === iso && r.start === start);
}
function slotState(fac, iso, s) {
  if (isMine(fac.id, iso, s.start)) return 'mine';
  if (iso === todayISO() && s.start <= nowMin()) return 'past';
  if (mulberry(hashSeed(`${fac.id}|${iso}|${s.start}`))() < (fac.ocupa ?? 0.35)) return 'occupied';
  return 'available';
}
const freeToday = fac => getSlots(fac).filter(s => slotState(fac, todayISO(), s) === 'available').length;
const horarioStr = fac => fac.franjas ? '3 franjas por día' : `${fmtTime(fac.apertura * 60)}–${fmtTime(fac.cierre * 60)} h`;

/* ---------- Navegación ---------- */
const TAB_VIEWS = ['view-home', 'view-facilities', 'view-benefits', 'view-carnet', 'view-profile'];
const TAB_OF = { 'view-slots': 'view-facilities', 'view-mybookings': 'view-facilities', 'view-benefit-detail': 'view-benefits' };
let stack = [];

function currentViewId() { return $('.view.active')?.id; }

function navTo(id) {
  const cur = currentViewId();
  if (cur === id) return;
  if (!TAB_VIEWS.includes(id) && cur && cur !== 'view-login') stack.push(cur);
  if (TAB_VIEWS.includes(id)) stack = [];
  $('.view.active').classList.remove('active');
  $('#'+id).classList.add('active');
  renderers[id]?.();
  updateNav(id);
  scrollToTop(id);
}
function goBack() {
  const prev = stack.pop() || 'view-home';
  $('.view.active').classList.remove('active');
  $('#'+prev).classList.add('active');
  renderers[prev]?.();
  updateNav(prev);
  scrollToTop(prev);
}
function updateNav(id) {
  const tab = TAB_VIEWS.includes(id) ? id : (TAB_OF[id] || 'view-home');
  $$('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.view === tab));
}
function scrollToTop(id) {
  window.scrollTo(0, 0);
  const v = $('#'+id);
  if (v && getComputedStyle(v).overflowY === 'auto') v.scrollTop = 0;
}

/* ---------- Overlays ---------- */
function openSheet(html) { $('#sheet').innerHTML = html; $('#sheet').classList.add('show'); $('#backdrop').classList.add('show'); }
function openModal(html) { $('#modal-card').innerHTML = html; $('#modal').classList.add('show'); $('#backdrop').classList.add('show'); }
function closeOverlays() {
  $('#sheet').classList.remove('show');
  $('#modal').classList.remove('show');
  $('#backdrop').classList.remove('show');
}

let toastTimer;
function toast(msg, icon = 'check') {
  const t = $('#toast');
  t.innerHTML = `<svg class="ic ic-sm"><use href="#i-${icon}"/></svg>${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function copyText(txt) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(txt).then(() => toast('Código copiado')).catch(() => toast('Código: ' + txt));
  } else toast('Código: ' + txt);
}

/* ---------- Renderers ---------- */
function renderHome() {
  $('#home-name').textContent = SOCIO.nombre;
  $('#home-avatar').textContent = initials(SOCIO.nombre);
  $('#home-cuota').innerHTML =
    `<svg class="ic ic-sm"><use href="#i-shield"/></svg> Cuota ${SOCIO.cuota.estado.toLowerCase()} · vence ${fmtVigencia(SOCIO.cuota.vence)}`;

  const prox = state.reservations
    .filter(r => r.status === 'proxima')
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  $('#home-bookings').innerHTML = prox.length
    ? prox.slice(0, 2).map(r => {
        const f = facById(r.facilityId);
        return `<button class="fac" data-go="view-mybookings">
          <span class="fac-icon sm"><svg class="ic"><use href="#i-${f.icono}"/></svg></span>
          <span class="fac-body">
            <span class="fac-name">${f.nombre}<em>${fmtLong(r.date)}</em></span>
            <span class="fac-meta"><svg class="ic ic-xs"><use href="#i-clock"/></svg>${r.label}<span class="badge ok">Confirmada</span></span>
          </span>
          <svg class="ic ic-sm"><use href="#i-chev-right"/></svg>
        </button>`;
      }).join('')
    : `<div class="empty-mini">No tenés turnos próximos.<button class="btn btn-primary" data-go="view-facilities">Reservar turno</button></div>`;

  $('#home-benefits').innerHTML = BENEFICIOS
    .filter(b => b.destacado)
    .map(b => `<button class="mini-benefit" data-benefit="${b.id}">
        <span class="mb-top"><svg class="ic ic-xs"><use href="#i-${CAT_ICON[b.cat]}"/></svg>${b.cat}</span>
        <h4>${b.titulo}</h4>
        <p>${b.comercio}</p>
        <span class="mb-vig"><svg class="ic ic-xs"><use href="#i-clock"/></svg>Vence ${fmtVigencia(b.vigencia)}</span>
      </button>`).join('');
}

function renderFacilities() {
  $('#fac-list').innerHTML = FACILITIES.map(f => {
    const n = freeToday(f);
    return `<button class="fac" data-fac="${f.id}">
      <span class="fac-icon"><svg class="ic"><use href="#i-${f.icono}"/></svg></span>
      <span class="fac-body">
        <span class="fac-name">${f.nombre}<em>${f.desc}</em></span>
        <span class="fac-meta">
          <svg class="ic ic-xs"><use href="#i-clock"/></svg>${horarioStr(f)} · ${f.sede} ·
          <span class="fac-libres ${n ? '' : 'cero'}">${n ? n + ' libres hoy' : 'sin turnos hoy'}</span>
        </span>
      </span>
      <svg class="ic ic-sm"><use href="#i-chev-right"/></svg>
    </button>`;
  }).join('');
}

function renderSlots() {
  const f = state.currentFac;
  if (!f) return;
  $('#slots-title').textContent = f.nombre;
  $('#slots-sub').textContent = f.franjas
    ? '3 franjas por día · ' + f.sede
    : `Turnos de ${f.duracion / 60} h · ${fmtTime(f.apertura * 60)} a ${fmtTime(f.cierre * 60)} h · ${f.sede}`;

  const t = todayISO();
  let ds = '';
  for (let i = 0; i < 14; i++) {
    const iso = isoPlus(t, i), d = isoDate(iso);
    const dow = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS[d.getDay()];
    const dm = (i === 0 || d.getDate() === 1) ? MESES[d.getMonth()] : '\u00A0';
    ds += `<button class="day ${iso === state.currentDate ? 'selected' : ''}" data-day="${iso}">
        <span class="dow">${dow}</span><span class="dn">${d.getDate()}</span><span class="dm">${dm}</span>
      </button>`;
  }
  $('#daystrip').innerHTML = ds;

  const slots = getSlots(f);
  const wide = !!f.franjas;
  $('#slotgrid').className = 'slotgrid' + (wide ? ' franjas' : '');
  $('#slotgrid').innerHTML = slots.map((s, i) => {
    const st = slotState(f, state.currentDate, s);
    const sub = { available: 'Libre', occupied: 'Ocupado', past: 'Pasó', mine: 'Tu turno' }[st];
    return wide
      ? `<button class="slot wide ${st}" data-slot="${i}"><span class="w-l"><b>${s.label}</b><small>${sub}</small></span><span class="rango">${s.rango}</span></button>`
      : `<button class="slot ${st}" data-slot="${i}"><b>${s.label}</b><small>${sub}</small></button>`;
  }).join('');
  $('#slots-hint').textContent = f.info;
}

function bookingCard(r) {
  const f = facById(r.facilityId);
  const badge = r.status === 'proxima'
    ? '<span class="badge ok">Confirmada</span>'
    : r.status === 'cancelada' ? '<span class="badge bad">Cancelada</span>' : '<span class="badge">Finalizada</span>';
  return `<div class="card">
    <div class="bcard-main">
      <span class="fac-icon sm"><svg class="ic"><use href="#i-${f.icono}"/></svg></span>
      <div class="bcard-info">
        <h4>${f.nombre}</h4>
        <p>${fmtLong(r.date)} · ${r.label}</p>
        <div class="bcard-tags">${badge}<span class="badge ghost">Cód. ${r.code}</span></div>
      </div>
    </div>
    ${r.status === 'proxima' ? `<div class="bcard-actions">
      <button class="btn-mini" data-qr="${r.id}"><svg class="ic ic-xs"><use href="#i-qr"/></svg> Ver QR</button>
      <button class="btn-mini danger" data-cancel="${r.id}">Cancelar</button>
    </div>` : ''}
  </div>`;
}

function renderBookings() {
  $$('#view-mybookings .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === state.bookingTab));
  const list = $('#bookings-list');
  if (state.bookingTab === 'proximas') {
    const items = state.reservations.filter(r => r.status === 'proxima')
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    list.innerHTML = items.length ? items.map(bookingCard).join('') : `
      <div class="empty">
        <svg class="ic"><use href="#i-calendar"/></svg>
        <h4>No tenés turnos próximos</h4>
        <p>Reservá una cancha, la pileta o el gimnasio en un par de toques.</p>
        <button class="btn btn-primary" data-go="view-facilities">Reservar turno</button>
      </div>`;
  } else {
    const items = state.reservations.filter(r => r.status !== 'proxima')
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
    list.innerHTML = items.length ? items.map(bookingCard).join('') : `
      <div class="empty">
        <svg class="ic"><use href="#i-clock"/></svg>
        <h4>Sin historial por ahora</h4>
        <p>Acá van a aparecer tus turnos pasados y cancelados.</p>
      </div>`;
  }
}

function renderBenefits() {
  $('#benefit-cats').innerHTML = BENEFIT_CATS
    .map(c => `<button class="chip ${state.cat === c ? 'selected' : ''}" data-cat="${c}">${c}</button>`).join('');
  renderBenefitList();
}
function renderBenefitList() {
  const q = state.q.trim().toLowerCase();
  const items = BENEFICIOS.filter(b =>
    (state.cat === 'Todas' || b.cat === state.cat) &&
    (!q || [b.titulo, b.comercio, b.cat].join(' ').toLowerCase().includes(q))
  );
  $('#benefit-list').innerHTML = items.length ? items.map(b => `
    <button class="benefit" data-benefit="${b.id}">
      <span class="b-ic"><svg class="ic"><use href="#i-${CAT_ICON[b.cat]}"/></svg></span>
      <span class="b-body">
        <span class="b-com">${b.comercio}</span>
        <span class="b-title">${b.titulo}</span>
        <span class="b-meta">
          <span class="b-vig">Vence ${fmtVigencia(b.vigencia)}</span>
          ${couponOf(b.id) ? '<span class="b-coupon">Cupón activo</span>' : ''}
        </span>
      </span>
      <svg class="ic ic-sm"><use href="#i-chev-right"/></svg>
    </button>`).join('') : `
    <div class="empty">
      <svg class="ic"><use href="#i-search"/></svg>
      <h4>Sin resultados</h4>
      <p>Probá con otra búsqueda o cambiá de categoría.</p>
    </div>`;
}

function renderBenefitDetail() {
  const b = state.currentBenefit;
  if (!b) return;
  const cp = couponOf(b.id);
  $('#benefit-detail-body').innerHTML = `
    <div class="bd-hero">
      <span class="bd-badge"><svg class="ic"><use href="#i-${CAT_ICON[b.cat]}"/></svg></span>
      <h2>${b.titulo}</h2>
      <p class="bd-com">${b.comercio}<span class="badge ok">${b.cat}</span></p>
    </div>
    <p class="bd-desc">${b.detalle}</p>
    <div class="bd-sec">
      <h4>Condiciones</h4>
      <ul class="cond">${b.condiciones.map(c => `<li><svg class="ic ic-xs"><use href="#i-check"/></svg>${c}</li>`).join('')}</ul>
    </div>
    <div class="card bd-sec" style="padding-top:8px;padding-bottom:8px">
      <div class="bd-vig-row"><svg class="ic ic-sm"><use href="#i-clock"/></svg>Vence el ${fmtVigencia(b.vigencia)}</div>
      <div class="bd-vig-row"><svg class="ic ic-sm"><use href="#i-id"/></svg>Exclusivo socios con cuota al día</div>
    </div>
    <div class="bd-actions">
      ${cp
        ? `<button class="btn btn-ghost btn-block" id="btn-view-coupon"><svg class="ic ic-sm"><use href="#i-ticket"/></svg>Ver mi cupón (${cp.code})</button>`
        : `<button class="btn btn-primary btn-block" data-get-coupon><svg class="ic ic-sm"><use href="#i-ticket"/></svg>Obtener beneficio</button>`}
      <p class="bd-note">El cupón se canjea mostrando el código junto con tu carnet digital.</p>
    </div>`;
}

function renderCarnet() {
  $('#cred-avatar').textContent = initials(SOCIO.nombre);
  $('#cred-name').textContent = SOCIO.nombre;
  $('#cred-dni').textContent = `DNI ${SOCIO.dni}`;
  $('#cred-nro').textContent = `Socio N° ${SOCIO.nro} · desde ${SOCIO.desde}`;
  $('#cred-cuota-estado').textContent = SOCIO.cuota.estado;
  $('#cred-cuota-vence').textContent = `Vence ${fmtVigencia(SOCIO.cuota.vence)}`;
  $('#btn-qr-big').innerHTML = qrSVG('STIC-SOCIO-' + SOCIO.nro);
}

function renderProfile() {
  $('#prof-avatar').textContent = initials(SOCIO.nombre);
  $('#prof-name').textContent = SOCIO.nombre;
  $('#prof-email').textContent = SOCIO.email;
  $('#prof-dni').textContent = SOCIO.dni;
  $('#prof-nro').textContent = SOCIO.nro;
  $('#prof-tel').textContent = SOCIO.telefono;
  $('#prof-mail').textContent = SOCIO.email;
  $('#prof-sede').textContent = SOCIO.sede;
}

const renderers = {
  'view-home': renderHome,
  'view-facilities': renderFacilities,
  'view-slots': renderSlots,
  'view-mybookings': renderBookings,
  'view-benefits': renderBenefits,
  'view-benefit-detail': renderBenefitDetail,
  'view-carnet': renderCarnet,
  'view-profile': renderProfile
};

/* ---------- Flujo de reserva ---------- */
function openSlots(facId) {
  state.currentFac = facById(facId);
  state.currentDate = todayISO();
  navTo('view-slots');
}

function openBookingSheet(fac, iso, s) {
  const label = s.wide ? `${s.label} (${s.rango})` : `${s.label} · ${s.rango}`;
  openSheet(`
    <div class="grabber"></div>
    <h3>Confirmar reserva</h3>
    <p class="sheet-sub">Revisá los datos antes de confirmar.</p>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-${fac.icono}"/></svg></span>
      <div class="txt"><small>Instalación</small><b>${fac.nombre} · ${fac.sede}</b></div></div>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-calendar"/></svg></span>
      <div class="txt"><small>Día</small><b>${fmtLong(iso)}</b></div></div>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-clock"/></svg></span>
      <div class="txt"><small>Horario</small><b>${label}</b></div></div>
    <div class="sumrow"><span class="sum-ic amber"><svg class="ic"><use href="#i-user"/></svg></span>
      <div class="txt"><small>A nombre de</small><b>${SOCIO.nombre} · Socio N° ${SOCIO.nro}</b></div></div>
    <div class="sheet-actions">
      <button class="btn btn-primary btn-block" data-confirm-booking>Confirmar turno</button>
      <button class="btn btn-outline btn-block" data-close>Seguir mirando horarios</button>
    </div>
    <p class="sheet-note">Podés cancelarlo gratis hasta 3 h antes desde “Mis reservas”.</p>
  `);
}

function confirmBooking() {
  const fac = state.currentFac;
  const s = getSlots(fac)[state.pendingSlot];
  const iso = state.currentDate;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = mulberry(Date.now() >>> 0);
  let code = 'STIC-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(rnd() * chars.length)];
  state.reservations.push({
    id: 'r' + Date.now(),
    facilityId: fac.id,
    date: iso,
    start: s.start,
    dur: s.dur,
    label: s.wide ? `${s.label} · ${s.rango}` : s.label,
    status: 'proxima',
    code
  });
  closeOverlays();
  state.bookingTab = 'proximas';
  navTo('view-mybookings');
  toast('¡Turno confirmado!');
}

function openCancelSheet(id) {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  const f = facById(r.facilityId);
  openSheet(`
    <div class="grabber"></div>
    <h3>¿Cancelar el turno?</h3>
    <p class="sheet-sub">El horario queda liberado para otros socios.</p>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-${f.icono}"/></svg></span>
      <div class="txt"><small>Instalación</small><b>${f.nombre}</b></div></div>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-calendar"/></svg></span>
      <div class="txt"><small>Día</small><b>${fmtLong(r.date)}</b></div></div>
    <div class="sumrow"><span class="sum-ic"><svg class="ic"><use href="#i-clock"/></svg></span>
      <div class="txt"><small>Horario</small><b>${r.label}</b></div></div>
    <div class="sheet-actions">
      <button class="btn btn-danger btn-block" data-confirm-cancel data-res="${r.id}">Sí, cancelar turno</button>
      <button class="btn btn-outline btn-block" data-close>No, volver</button>
    </div>
  `);
}

function doCancel(id) {
  const r = state.reservations.find(x => x.id === id);
  if (r) r.status = 'cancelada';
  closeOverlays();
  renderBookings();
  toast('Turno cancelado');
}

function openResQR(id) {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  const f = facById(r.facilityId);
  openModal(`
    <h3>${f.nombre}</h3>
    <p class="modal-sub">${fmtLong(r.date)} · ${r.label}</p>
    <div class="modal-qr">${qrSVG(r.code)}</div>
    <div class="coupon-code">${r.code}</div>
    <p class="modal-sub">Presentá este código en recepción al llegar.</p>
    <div class="modal-actions"><button class="btn btn-primary btn-block" data-close>Listo</button></div>
  `);
}

/* ---------- Beneficios · cupones ---------- */
function openBenefit(id) {
  state.currentBenefit = BENEFICIOS.find(b => b.id === id);
  navTo('view-benefit-detail');
}

function makeCoupon(b) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = mulberry((Date.now() ^ hashSeed(b.id)) >>> 0);
  let c = 'STIC-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(rnd() * chars.length)];
  return { benefitId: b.id, code: c, obtenido: todayISO() };
}

function getCoupon() {
  const b = state.currentBenefit;
  let cp = couponOf(b.id);
  if (!cp) { cp = makeCoupon(b); state.coupons.push(cp); }
  openCouponModal(b, cp);
  renderBenefitDetail();
}

function openCouponModal(b, cp) {
  openModal(`
    <h3>${b.titulo}</h3>
    <p class="modal-sub">${b.comercio} · Beneficio socios STIC</p>
    <div class="modal-qr">${qrSVG(cp.code)}</div>
    <div class="coupon-code">${cp.code}<button data-copy="${cp.code}" aria-label="Copiar código"><svg class="ic ic-sm"><use href="#i-copy"/></svg></button></div>
    <p class="modal-sub">Vence el ${fmtVigencia(b.vigencia)} · Mostralo junto con tu carnet digital</p>
    <div class="modal-actions"><button class="btn btn-primary btn-block" data-close>Listo</button></div>
  `);
}

function openCarnetQR() {
  openModal(`
    <h3>${SOCIO.nombre}</h3>
    <p class="modal-sub">DNI ${SOCIO.dni} · Socio N° ${SOCIO.nro}</p>
    <div class="modal-qr">${qrSVG('STIC-SOCIO-' + SOCIO.nro)}</div>
    <p class="modal-sub">Credencial verificable · Cuota ${SOCIO.cuota.estado.toLowerCase()}</p>
    <div class="modal-actions"><button class="btn btn-primary btn-block" data-close>Listo</button></div>
  `);
}

/* ---------- Login / logout ---------- */
function doLogin() {
  $('#login-error').hidden = true;
  state.logged = true;
  $('#app').classList.add('logged');
  stack = [];
  navTo('view-home');
  toast(`¡Hola, ${SOCIO.nombre.split(' ')[0]}!`);
}
function logout() {
  state.logged = false;
  $('#app').classList.remove('logged');
  stack = [];
  closeOverlays();
  navTo('view-login');
}

/* ---------- Eventos ---------- */
$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  const dni = $('#login-dni').value.trim(), pass = $('#login-pass').value.trim();
  if (!dni || !pass) { $('#login-error').hidden = false; return; }
  doLogin();
});

$('#benefit-search').addEventListener('input', e => {
  state.q = e.target.value;
  renderBenefitList();
});

document.addEventListener('click', e => {
  const q = sel => e.target.closest(sel);
  let el;

  if ((el = q('#login-demo'))) {
    $('#login-dni').value = '30456789';
    $('#login-pass').value = 'demo';
    doLogin(); return;
  }
  if ((el = q('#login-forgot'))) { toast('Te enviaríamos un email de recuperación (mock)', 'info'); return; }
  if ((el = q('[data-toggle]'))) {
    el.classList.toggle('on');
    el.setAttribute('aria-pressed', el.classList.contains('on'));
    toast(el.classList.contains('on') ? 'Preferencia activada' : 'Preferencia desactivada', 'info');
    return;
  }
  if ((el = q('#btn-bell'))) { toast('No tenés notificaciones nuevas (mock)', 'info'); return; }
  if ((el = q('#btn-logout'))) { logout(); return; }
  if (q('#btn-qr-big') || q('#btn-qr-big-2')) { openCarnetQR(); return; }
  if ((el = q('#btn-call'))) { toast('Sede central: (011) 5555-1200 (mock)', 'phone'); return; }
  if ((el = q('[data-toast]'))) { toast(el.dataset.toast, 'info'); return; }

  if (e.target.id === 'backdrop' || e.target.id === 'modal') { closeOverlays(); return; }
  if ((el = q('[data-close]'))) { closeOverlays(); return; }
  if ((el = q('[data-copy]'))) { copyText(el.dataset.copy); return; }
  if (q('[data-confirm-booking]')) { confirmBooking(); return; }
  if ((el = q('[data-confirm-cancel]'))) { doCancel(el.dataset.res); return; }
  if (q('[data-get-coupon]')) { getCoupon(); return; }
  if (q('#btn-view-coupon')) { openCouponModal(state.currentBenefit, couponOf(state.currentBenefit.id)); return; }
  if ((el = q('[data-qr]'))) { openResQR(el.dataset.qr); return; }
  if ((el = q('[data-cancel]'))) { openCancelSheet(el.dataset.cancel); return; }

  if ((el = q('[data-back]'))) { goBack(); return; }
  if ((el = q('[data-view]'))) { navTo(el.dataset.view); return; }
  if ((el = q('[data-go]'))) { navTo(el.dataset.go); return; }

  if ((el = q('[data-fac]'))) { openSlots(el.dataset.fac); return; }
  if ((el = q('[data-benefit]'))) { openBenefit(el.dataset.benefit); return; }
  if ((el = q('[data-day]'))) { state.currentDate = el.dataset.day; renderSlots(); return; }
  if ((el = q('[data-cat]'))) { state.cat = el.dataset.cat; renderBenefits(); return; }
  if ((el = q('[data-tab]'))) { state.bookingTab = el.dataset.tab; renderBookings(); return; }

  if ((el = q('[data-slot]'))) {
    const idx = +el.dataset.slot;
    const fac = state.currentFac, s = getSlots(fac)[idx];
    const st = slotState(fac, state.currentDate, s);
    if (st === 'available') { state.pendingSlot = idx; openBookingSheet(fac, state.currentDate, s); }
    else if (st === 'mine') toast('Ya tenés este turno reservado', 'info');
    return;
  }
});
