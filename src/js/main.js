/**
 * main.js
 * 1. Flash screen — only on first visit per session, or when user
 *    explicitly clicks the xensenx logo (top-left).
 * 2. Typewriter + pronunciation fade-in.
 * 3. Dissolve flash → reveal main page.
 * 4. Scroll position restore — saves Y before navigating away,
 *    restores it instantly when the user navigates back.
 */

(function () {
  "use strict";

  const WORD          = "xensenx";
  const TYPE_SPEED_MS = 110;
  const HOLD_AFTER_MS = 1200;
  const FADE_MS       = 900;
  const SESSION_KEY   = "xsn_flash_done";
  const SCROLL_KEY    = "xsn_pos";

  const flashScreen    = document.getElementById("flash-screen");
  const typewriterEl   = document.getElementById("typewriter-text");
  const cursorEl       = document.getElementById("cursor");
  const pronunciationEl= document.getElementById("pronunciation");
  const mainPage       = document.getElementById("main-page");
  const navNameEl      = document.getElementById("nav-logo");

  /* ── Manual scroll restoration — we handle it ourselves ────── */
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  /* ── Save scroll position before navigating away ────────────── */
  window.addEventListener("pagehide", function () {
    if (sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
    }
  });

  /* ── Clicking the xensenx logo resets the flash ─────────────── */
  if (navNameEl) {
    navNameEl.addEventListener("click", function (e) {
      e.preventDefault();
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SCROLL_KEY);
      window.location.reload();
    });
  }

  /* ── Skip flash if already seen this session ─────────────────── */
  if (sessionStorage.getItem(SESSION_KEY)) {
    flashScreen.style.display = "none";

    // Read saved scroll position before revealing
    const savedY = parseInt(sessionStorage.getItem(SCROLL_KEY) || "0", 10);
    sessionStorage.removeItem(SCROLL_KEY);

    // Reveal immediately with a shorter fade (200ms feels like a "return")
    mainPage.style.transition = savedY > 0
      ? "opacity 0.2s ease, visibility 0s linear 0s"
      : "";

    mainPage.classList.remove("hidden");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        mainPage.classList.add("visible");
        // Restore scroll position after paint — no visual jump
        if (savedY > 0) {
          window.scrollTo(0, savedY);
        }
      });
    });
    return; // done — no typewriter
  }

  /* ── Typewriter ──────────────────────────────────────────────── */
  let charIndex = 0;

  function typeNextChar() {
    if (charIndex < WORD.length) {
      typewriterEl.textContent += WORD[charIndex];
      charIndex++;
      const jitter = Math.random() * 40 - 20;
      setTimeout(typeNextChar, TYPE_SPEED_MS + jitter);
    } else {
      // Show pronunciation, then dissolve after hold
      if (pronunciationEl) {
        pronunciationEl.classList.add("visible");
      }
      setTimeout(beginDissolve, HOLD_AFTER_MS);
    }
  }

  /* ── Dissolve ────────────────────────────────────────────────── */
  function beginDissolve() {
    cursorEl.style.animation  = "none";
    cursorEl.style.opacity    = "0";
    cursorEl.style.transition = "opacity 0.4s ease";

    flashScreen.classList.add("fade-out");

    setTimeout(function () {
      flashScreen.style.display = "none";
      sessionStorage.setItem(SESSION_KEY, "1");

      mainPage.classList.remove("hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          mainPage.classList.add("visible");
        });
      });
    }, FADE_MS);
  }

  setTimeout(typeNextChar, 400);

})();

// Copyright year
document.querySelectorAll('.foot-yr').forEach(function(el) {
  el.textContent = new Date().getFullYear();
});
