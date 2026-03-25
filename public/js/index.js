/* ============================================================
   index.js — xensenx landing page
   Handles: typewriter, intersection observer reveals,
            animated counters, cursor glow
   ============================================================ */

(function () {
  'use strict';

  /* ─── TYPEWRITER ─────────────────────────────────────────
     Cycles through role strings with a blinking cursor      */
  const Typewriter = {
    el: null,
    roles: [
      'JavaScript Developer',
      'Graphic Designer',
      'UI/UX Craftsman',
      'Creative Technologist',
      'Open Source Contributor',
    ],
    index: 0,
    charIndex: 0,
    isDeleting: false,
    typingSpeed: 80,
    deletingSpeed: 45,
    pauseDuration: 2200,
    timer: null,

    init() {
      this.el = document.getElementById('typewriter');
      if (!this.el) return;
      this.tick();
    },

    tick() {
      const current = this.roles[this.index];

      if (this.isDeleting) {
        this.charIndex--;
        this.el.textContent = current.slice(0, this.charIndex);
      } else {
        this.charIndex++;
        this.el.textContent = current.slice(0, this.charIndex);
      }

      let delay = this.isDeleting ? this.deletingSpeed : this.typingSpeed;

      if (!this.isDeleting && this.charIndex === current.length) {
        // Finished typing — pause then delete
        delay = this.pauseDuration;
        this.isDeleting = true;
      } else if (this.isDeleting && this.charIndex === 0) {
        // Finished deleting — move to next role
        this.isDeleting = false;
        this.index = (this.index + 1) % this.roles.length;
        delay = 300;
      }

      this.timer = setTimeout(() => this.tick(), delay);
    },
  };

  /* ─── SCROLL REVEAL ──────────────────────────────────────
     Uses IntersectionObserver for performant fade-in        */
  const ScrollReveal = {
    observer: null,
    options: {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    },

    init() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: just show all elements
        document.querySelectorAll('[data-reveal]').forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              this.observer.unobserve(entry.target);
            }
          });
        },
        this.options
      );

      document.querySelectorAll('[data-reveal]').forEach(el => {
        this.observer.observe(el);
      });
    },
  };

  /* ─── COUNTER ANIMATION ──────────────────────────────────
     Counts up numeric stat values when they scroll into view */
  const CounterAnim = {
    duration: 1800,

    init() {
      const counters = document.querySelectorAll('[data-count]');
      if (!counters.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(el => observer.observe(el));
    },

    animateCounter(el) {
      const target   = parseInt(el.dataset.count, 10);
      const suffix   = el.dataset.suffix || '';
      const start    = performance.now();

      const update = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / this.duration, 1);
        const eased    = this.easeOutCubic(progress);
        const value    = Math.floor(eased * target);

        el.textContent = value + suffix;

        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target + suffix;
      };

      requestAnimationFrame(update);
    },

    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },
  };

  /* ─── CURSOR GLOW ────────────────────────────────────────
     Subtle ambient glow that follows the cursor on desktop  */
  const CursorGlow = {
    el: null,
    raf: null,
    mouse: { x: 0, y: 0 },
    pos:   { x: 0, y: 0 },
    lerp: 0.08,

    init() {
      // Only on desktop, prefer-motion safe
      if (window.matchMedia('(max-width: 900px)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      this.el = document.createElement('div');
      this.el.className = 'cursor-glow';
      this.el.style.cssText = `
        position: fixed;
        width: 600px;
        height: 600px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        transform: translate(-50%, -50%);
        will-change: transform, top, left;
        transition: none;
      `;
      document.body.appendChild(this.el);

      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }, { passive: true });

      this.animate();
    },

    animate() {
      this.pos.x += (this.mouse.x - this.pos.x) * this.lerp;
      this.pos.y += (this.mouse.y - this.pos.y) * this.lerp;

      if (this.el) {
        this.el.style.left = this.pos.x + 'px';
        this.el.style.top  = this.pos.y + 'px';
      }

      this.raf = requestAnimationFrame(() => this.animate());
    },
  };

  /* ─── TECH CHIP HOVER PARALLAX ────────────────────────── */
  const ChipParallax = {
    init() {
      const chips = document.querySelectorAll('.hero__chip');
      const visual = document.querySelector('.hero__visual');
      if (!chips.length || !visual) return;
      if (window.matchMedia('(max-width: 900px)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      visual.addEventListener('mousemove', (e) => {
        const rect = visual.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top  - rect.height / 2) / rect.height;

        chips.forEach((chip, i) => {
          const factor = (i + 1) * 6;
          chip.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
      });

      visual.addEventListener('mouseleave', () => {
        chips.forEach(chip => {
          chip.style.transform = '';
        });
      });
    },
  };

  /* ─── BOOTSTRAP ─────────────────────────────────────────── */
  function boot() {
    Typewriter.init();
    ScrollReveal.init();
    CounterAnim.init();
    CursorGlow.init();
    ChipParallax.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
