/* ============================================================
   nav.js — xensenx navigation component
   Handles: scroll state, mobile drawer, active link
   ============================================================ */

(function () {
  'use strict';

  // ─── NAV COMPONENT ──────────────────────────────────────
  const Nav = {
    el: null,
    hamburger: null,
    drawer: null,
    drawerLinks: null,
    isOpen: false,
    scrollThreshold: 10,

    init() {
      this.el        = document.querySelector('.nav');
      this.hamburger = document.querySelector('.nav__hamburger');
      this.drawer    = document.querySelector('.nav__drawer');
      this.drawerLinks = document.querySelectorAll('.nav__drawer-link');

      if (!this.el) return;

      this.bindScrollBehavior();
      this.bindHamburger();
      this.setActiveLink();
      this.bindKeyboard();
      this.bindDrawerLinks();
    },

    // Scroll → glass effect
    bindScrollBehavior() {
      const update = () => {
        if (window.scrollY > this.scrollThreshold) {
          this.el.classList.add('scrolled');
        } else {
          this.el.classList.remove('scrolled');
        }
      };
      window.addEventListener('scroll', update, { passive: true });
      update(); // run on init
    },

    // Hamburger toggle
    bindHamburger() {
      if (!this.hamburger || !this.drawer) return;

      this.hamburger.addEventListener('click', () => {
        this.toggleDrawer();
      });

      // Close on backdrop click (outside drawer)
      document.addEventListener('click', (e) => {
        if (
          this.isOpen &&
          !this.drawer.contains(e.target) &&
          !this.hamburger.contains(e.target)
        ) {
          this.closeDrawer();
        }
      });
    },

    toggleDrawer() {
      this.isOpen ? this.closeDrawer() : this.openDrawer();
    },

    openDrawer() {
      this.isOpen = true;
      this.drawer.classList.add('open');
      this.hamburger.classList.add('open');
      this.hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    },

    closeDrawer() {
      this.isOpen = false;
      this.drawer.classList.remove('open');
      this.hamburger.classList.remove('open');
      this.hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    },

    // Close drawer when a drawer link is clicked
    bindDrawerLinks() {
      this.drawerLinks.forEach(link => {
        link.addEventListener('click', () => this.closeDrawer());
      });
    },

    // Keyboard: Escape closes drawer
    bindKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeDrawer();
        }
      });
    },

    // Mark current page link as active
    setActiveLink() {
      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      const allLinks = document.querySelectorAll('.nav__link, .nav__drawer-link');

      allLinks.forEach(link => {
        const href = link.getAttribute('href')?.replace(/\/$/, '') || '';
        if (href === currentPath || (currentPath === '/' && href === '')) {
          link.classList.add('active');
        }
      });
    },
  };

  // ─── MOUNT ON DOM READY ──────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Nav.init());
  } else {
    Nav.init();
  }

  // Export for use in other modules if needed
  window.XSNav = Nav;

})();
