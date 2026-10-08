'use strict';
/* CONFIGURACIÓN POR DEMO. Todo vacío por defecto: nada se muestra ni se abre hasta cargar datos reales.

   1) WhatsApp: solo dígitos, formato internacional, sin + ni espacios.
      Celular argentino: 54 + 9 + código de área sin 0 + número sin 15.
      Confirmar el formato con el dueño. Nunca probar con números de terceros. */
const CONTACTS = {
  cafeteria: 'REEMPLAZAR_TELEFONO', restaurante: 'REEMPLAZAR_TELEFONO',
  catering: 'REEMPLAZAR_TELEFONO', barberia: 'REEMPLAZAR_TELEFONO',
  estetica: 'REEMPLAZAR_TELEFONO', pilates: 'REEMPLAZAR_TELEFONO',
  estudio: 'REEMPLAZAR_TELEFONO', consultorio: 'REEMPLAZAR_TELEFONO',
  consultoria: 'REEMPLAZAR_TELEFONO', oficios: 'REEMPLAZAR_TELEFONO',
  reformas: 'REEMPLAZAR_TELEFONO', limpieza: 'REEMPLAZAR_TELEFONO',
  indumentaria: 'REEMPLAZAR_TELEFONO', mascotas: 'REEMPLAZAR_TELEFONO',
  deco: 'REEMPLAZAR_TELEFONO', gimnasio: 'REEMPLAZAR_TELEFONO',
  regaleria: 'REEMPLAZAR_TELEFONO', 'servicio-tecnico': 'REEMPLAZAR_TELEFONO'
};

/* 2) Redes: {instagram, facebook, tiktok, youtube} con la URL HTTPS del perfil REAL del negocio.
      Vacío = no se muestra. No hay perfiles ficticios ni embeds/scripts de terceros. Ejemplo:
      SOCIAL_LINKS.cafeteria.instagram = 'PEGAR_URL_REAL_AUTORIZADA'; */
const SOCIAL_LINKS = Object.fromEntries(Object.keys(CONTACTS).map(slug => [slug, {
  instagram: '', facebook: '', tiktok: '', youtube: ''
}]));

/* 3) Mapa: enlace "Cómo llegar" (Google Maps u OpenStreetMap). Vacío = oculto. Sin iframes. */
const MAP_LINKS = Object.fromEntries(Object.keys(CONTACTS).map(slug => [slug, '']));

const SOCIAL_HOSTS = {
  instagram: ['instagram.com', 'www.instagram.com'], facebook: ['facebook.com', 'www.facebook.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'], youtube: ['youtube.com', 'www.youtube.com']
};
const MAP_HOSTS = ['www.google.com', 'google.com', 'maps.google.com', 'maps.app.goo.gl', 'www.openstreetmap.org', 'openstreetmap.org'];

function safeHttpsUrl(value, hosts, allowRootWithParams) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    const emptyPath = url.pathname === '/' && !(allowRootWithParams && (url.search || url.hash));
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname) || emptyPath) return null;
    return value;
  } catch (_) { return null; }
}
function safeSocialUrl(value, network) {
  return Object.prototype.hasOwnProperty.call(SOCIAL_HOSTS, network) ? safeHttpsUrl(value, SOCIAL_HOSTS[network]) : null;
}
function safeMapUrl(value) { return safeHttpsUrl(value, MAP_HOSTS, true); }

// Valida sintaxis; no certifica que el número exista o pertenezca al cliente.
function buildWhatsAppUrl(phone, message) {
  if (typeof phone !== 'string' || !/^[1-9]\d{7,14}$/.test(phone)) return null;
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}

if (typeof module !== 'undefined') module.exports = { buildWhatsAppUrl, safeSocialUrl, safeMapUrl, CONTACTS, SOCIAL_LINKS, MAP_LINKS };
if (typeof document !== 'undefined') {
  const slug = Object.keys(CONTACTS).find(key => document.body.classList.contains(key));
  const phone = CONTACTS[slug];
  const social = document.querySelector('[data-social-links]');
  if (social && slug) {
    const names = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
    Object.entries(SOCIAL_LINKS[slug]).forEach(([network, value]) => {
      const url = safeSocialUrl(value, network);
      if (!url) return;
      const link = document.createElement('a');
      link.href = url; link.textContent = names[network]; link.rel = 'noopener';
      social.append(link); social.hidden = false;
    });
  }
  const map = document.querySelector('[data-map-link]');
  const mapUrl = slug ? safeMapUrl(MAP_LINKS[slug]) : null;
  if (map && mapUrl) { map.href = mapUrl; map.rel = 'noopener'; map.hidden = false; }

  const status = document.querySelector('[data-contact-status]');
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    const url = buildWhatsAppUrl(phone, link.dataset.message || 'Hola, quisiera hacer una consulta.');
    if (url) {
      link.href = url; // misma pestaña: sin popup ni permiso especial
    } else {
      link.addEventListener('click', event => {
        event.preventDefault();
        if (status) {
          status.textContent = 'Esta es una demo: configurá el teléfono en assets/site.js para habilitar WhatsApp. No se envió ningún mensaje.';
          status.tabIndex = -1;
          status.focus();
        }
      });
    }
  });
  if (status && buildWhatsAppUrl(phone, '') !== null) status.textContent = 'Se abrirá WhatsApp. La disponibilidad y las condiciones se acuerdan por mensaje.';

  // Barra de CTA móvil: aparece recién cuando el CTA principal del hero sale de pantalla.
  // Sin JS o sin IntersectionObserver, la barra queda siempre visible (mejora progresiva).
  const bar = document.querySelector('.mobile-cta');
  const heroCta = document.querySelector('.hero-actions [data-whatsapp]');
  if (bar && heroCta && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('cta-observer');
    new IntersectionObserver(([entry]) => bar.classList.toggle('is-shown', !entry.isIntersecting)).observe(heroCta);
  }
}
