/* ============================================================
   private.js — xensenx private section
   Handles scroll reveals, print CV shortcut
   ============================================================ */
(function () {
  'use strict';

  // Scroll reveal observer for private page
  if ('IntersectionObserver' in window) {
    const style = document.createElement('style');
    style.textContent = `
      [data-reveal] {
        opacity: 0; transform: translateY(16px);
        transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                    transform 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      [data-reveal].revealed { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
  }

  // Keyboard shortcut: Ctrl/Cmd+P → trigger CV download
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      const cvLink = document.querySelector('a[download]');
      if (cvLink) {
        e.preventDefault();
        cvLink.click();
      }
    }
  });

})();
