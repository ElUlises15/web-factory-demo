'use strict';
// Script temprano para evitar un destello. Solo guarda una preferencia visual local.
function resolveTheme(choice, systemDark) {
  return choice === 'light' || choice === 'dark' ? choice : systemDark ? 'dark' : 'light';
}
if (typeof module !== 'undefined') module.exports = {resolveTheme};
if (typeof document !== 'undefined') {
  (() => {
    const key='local-demo-theme';
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    let choice='system';
    try { const saved=localStorage.getItem(key); if(['system','light','dark'].includes(saved)) choice=saved; } catch (_) { /* file:// o almacenamiento restringido: sin persistencia */ }
    function apply() {
      document.documentElement.dataset.theme=resolveTheme(choice,media.matches);
      document.documentElement.dataset.themeChoice=choice;
      const select=document.querySelector('[data-theme-select]');
      if(select) select.value=choice;
    }
    apply();
    media.addEventListener('change',()=>{if(choice==='system') apply();});
    document.addEventListener('DOMContentLoaded',()=>{
      apply();
      const select=document.querySelector('[data-theme-select]');
      if(select) select.addEventListener('change',()=>{
        choice=['system','light','dark'].includes(select.value)?select.value:'system';
        try { localStorage.setItem(key,choice); } catch (_) { /* funcionamiento sin guardar */ }
        apply();
      });
    });
  })();
}
