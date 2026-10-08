'use strict';
// Conecta los botones de contacto con la configuración de assets/config.js. Sin dependencias.
(function () {
  var config = window.WEB_FACTORY_CONTACT || {};
  var message = 'Hola, quiero consultar por una página web para mi negocio.';
  var builders = {
    whatsapp: function (value) {
      var digits = String(value).replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15 ? 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message) : null;
    },
    email: function (value) {
      var email = String(value).trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'mailto:' + email + '?subject=' + encodeURIComponent('Consulta por una web') : null;
    },
    instagram: function (value) {
      try {
        var url = new URL(String(value).trim());
        return url.protocol === 'https:' && /(^|\.)instagram\.com$/.test(url.hostname) ? url.href : null;
      } catch (error) { return null; }
    }
  };
  var shown = 0;
  document.querySelectorAll('[data-contact]').forEach(function (link) {
    var kind = link.getAttribute('data-contact');
    var value = config[kind];
    var href = value && builders[kind] ? builders[kind](value) : null;
    if (!href) { return; }
    link.href = href;
    if (/^https:/.test(href)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    link.hidden = false;
    shown += 1;
  });
  var fallback = document.querySelector('[data-contact-fallback]');
  if (fallback && shown) { fallback.hidden = true; }
  var year = document.querySelector('[data-year]');
  if (year) { year.textContent = String(new Date().getFullYear()); }
}());
