'use strict';
/* Cliente del add-on de reserva. Sólo se habilita si el backend responde en el MISMO origen
   (sandbox local o, en el futuro, el backend real del cliente). Nunca envía importes ni tarjetas.
   El estado final se lee del servidor; los parámetros ?status= de la URL se ignoran. */
function formatAmount(minor, currency) {
  if (!Number.isInteger(minor)) return '';
  return currency + ' ' + (minor / 100).toLocaleString('es-AR', {minimumFractionDigits: 2});
}
function describeState(data) {
  const labels = {
    held: 'Reservado temporalmente. Falta el pago o su verificación: todavía NO está confirmado.',
    confirmed: 'Confirmado: el servidor verificó el pago aprobado.',
    expired: 'La reserva temporal venció sin pago aprobado.',
    cancelled: 'Cancelado.', review: 'Pago recibido fuera de término: requiere revisión manual.',
    refund_review: 'Cancelado con pago: requiere revisión de reembolso.'
  };
  return labels[data && data.state] || 'Estado desconocido.';
}
if (typeof module !== 'undefined') module.exports = {formatAmount, describeState};

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', async () => {
  const $ = selector => document.querySelector(selector);
  const status = $('[data-status]'), button = $('[data-pay]'), slot = $('[data-slot]'), email = $('[data-email]');
  function show(title, detail, focus) {
    status.replaceChildren();
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Estado de la reserva';
    const strong = document.createElement('p'); strong.className = 'state-title'; strong.textContent = title;
    status.append(eyebrow, strong);
    if (detail) { const p = document.createElement('p'); p.textContent = detail; status.append(p); }
    if (focus) status.focus();
  }
  let health = null;
  try {
    const response = await fetch('/api/health', {cache: 'no-store'});
    if (response.ok) health = await response.json();
  } catch (_) { /* archivo estático o servidor sin backend: queda deshabilitado */ }
  if (!health || health.mode !== 'LOCAL_SANDBOX_NOT_MP') return;

  $('[data-sandbox-banner]').textContent = 'Sandbox local activo: el proveedor de pago es SIMULADO (no es Mercado Pago), no hay cobros y el email al dueño se guarda como archivo local.';
  const {slots} = await (await fetch('/api/slots', {cache: 'no-store'})).json();
  const wanted = new URLSearchParams(location.search).get('demo');
  slot.replaceChildren(...slots.map(item => {
    const option = document.createElement('option');
    option.value = item.slot; option.disabled = !item.available;
    option.textContent = item.label + ' · ' + formatAmount(item.amount_minor, item.currency) + ' (importe ficticio)' + (item.available ? '' : ' · ocupado');
    if (item.demo === wanted && item.available && !slot.dataset.picked) { option.selected = true; slot.dataset.picked = '1'; }
    return option;
  }));
  slot.disabled = false; email.disabled = false; button.disabled = false;
  button.textContent = 'Reservar y pagar en el checkout simulado';

  const reference = new URLSearchParams(location.search).get('ref');
  if (reference && /^fixture-[0-9a-f]{32}$/.test(reference)) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await fetch('/api/bookings/' + reference, {cache: 'no-store'});
      if (!response.ok) { show('Reserva no encontrada.', ''); break; }
      const data = await response.json();
      show(describeState(data), data.label + (data.owner_notified ? ' · Aviso al dueño generado (archivo .eml local, no enviado).' : ' · Sin aviso al dueño.'), attempt === 0);
      if (data.state !== 'held') break;
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    show('Creando reserva temporal…', '', false);
    try {
      const response = await fetch('/api/checkout', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({slot: slot.value, email: email.value.trim()})});
      const data = await response.json();
      if (!response.ok) { show('No se pudo reservar.', data.error || '', true); button.disabled = false; return; }
      const target = new URL(data.checkout_url, location.href);
      if (target.origin !== location.origin) throw new Error('Checkout fuera del sandbox');
      location.assign(target.href);
    } catch (error) {
      show('No se pudo iniciar el pago.', String(error.message || error), true);
      button.disabled = false;
    }
  });
});
