/**
 * nav-dropdown.js
 * Handles the header "xensenx ▾" dropdown menu, the Settings popup modal,
 * flash screen refresh, zero-latency background audio playback with continuous
 * playback memory, and seamless client-side SPA navigation.
 */
(function () {
  "use strict";

  // ── High-Performance Zero-Latency Background Audio Controller ──────
  // 1. Instant progressive streaming via HTML5 <audio> (0ms decode lag, starts in < 15ms).
  // 2. Native volume control keeps startup lightweight and works without Web Audio.
  // 3. Continuous track position memory: saves exact playback timestamp in localStorage,
  //    so switching pages or refreshing seamlessly resumes without restarting at 0:00.
  // 4. Native seamless looping (loop = true).
  // 5. Full MediaSession integration and robust user-interaction autoplay handling.

  var isAudioPlaying = false;
  var desiredPlaying = false;
  var audioPlayer = null;
  var lastSaveTime = 0;
  var playRequest = null;
  var positionRestored = false;

  function getAudioPath() {
    var rawPath = window.location.pathname.replace(/\\/g, "/");
    var inSubfolder = rawPath.indexOf("/posts/") !== -1 || rawPath.indexOf("/research/") !== -1;
    var rel = (inSubfolder ? "../" : "") + "assets/audio/alex-productions-lo-fi-hip-hop-galaxy-132921.mp3";
    try {
      return new URL(rel, window.location.href).href;
    } catch (e) {
      return rel;
    }
  }

  function getStoredVolume() {
    var savedVol = null;
    try { savedVol = localStorage.getItem("xsn_bg_audio_vol"); } catch (e) {}
    var vol = savedVol !== null ? parseInt(savedVol, 10) : 40;
    if (isNaN(vol) || vol < 0 || vol > 100) vol = 40;
    return vol;
  }

  function getAudioPlayer() {
    if (!audioPlayer) {
      audioPlayer = document.getElementById("xsn-bg-audio-player");
      if (!audioPlayer) {
        audioPlayer = document.createElement("audio");
        audioPlayer.id = "xsn-bg-audio-player";
        audioPlayer.className = "visually-hidden-audio";
        audioPlayer.setAttribute("preload", "auto");
        audioPlayer.setAttribute("aria-hidden", "true");
        audioPlayer.setAttribute("tabindex", "-1");
        (document.body || document.documentElement).appendChild(audioPlayer);
      }
      audioPlayer.loop = true;
      audioPlayer.volume = getStoredVolume() / 100;
      audioPlayer.preload = "auto";
      var targetSrc = getAudioPath();
      if (!audioPlayer.src || audioPlayer.src !== targetSrc) {
        audioPlayer.src = targetSrc;
        audioPlayer.load();
      }

      audioPlayer.addEventListener("play", function () {
        isAudioPlaying = true;
        updateAudioUIState(true);
        updateMediaSession(true);
      });

      audioPlayer.addEventListener("pause", function () {
        isAudioPlaying = false;
        updateAudioUIState(false);
        updateMediaSession(false);
      });

      audioPlayer.addEventListener("timeupdate", function () {
        var now = Date.now();
        if (now - lastSaveTime > 600) {
          lastSaveTime = now;
          savePlaybackPosition();
        }
      });
      audioPlayer.addEventListener("ended", function () {
        if (desiredPlaying) {
          audioPlayer.currentTime = 0;
          audioPlayer.play().catch(function () {});
        }
      });
    }
    return audioPlayer;
  }

  function savePlaybackPosition() {
    if (audioPlayer && !isNaN(audioPlayer.currentTime) && audioPlayer.currentTime > 0) {
      try {
        localStorage.setItem("xsn_bg_audio_pos", String(audioPlayer.currentTime));
        localStorage.setItem("xsn_bg_audio_ts", String(Date.now()));
      } catch (e) {}
    }
  }

  function restorePlaybackPosition() {
    if (!audioPlayer || positionRestored) return;
    try {
      var savedPos = parseFloat(localStorage.getItem("xsn_bg_audio_pos") || "0");
      var savedTs = parseInt(localStorage.getItem("xsn_bg_audio_ts") || "0", 10);
      if (!isNaN(savedPos) && savedPos > 0 && isFinite(audioPlayer.duration)) {
        var elapsed = (Date.now() - savedTs) / 1000;
        // If elapsed is within 45s (e.g. browsing between pages), seamlessly advance time
        var targetPos = (elapsed >= 0 && elapsed < 45) ? (savedPos + elapsed) : savedPos;
        var dur = audioPlayer.duration || 127.3;
        audioPlayer.currentTime = targetPos % dur;
        positionRestored = true;
      }
    } catch (e) {}
  }

  function updateMediaSession(playing) {
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Lo-Fi Hip Hop Galaxy",
          artist: "Alex-Productions",
          album: "xensenx.dev"
        });
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      } catch (e) {}
    }
  }

  function getVolumeSvg(vol) {
    if (vol <= 0) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
    } else if (vol <= 50) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    } else {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
    }
  }

  function updateAudioUIState(playing) {
    var dots = document.querySelectorAll("#audio-status-dot, .settings-credit-pulse");
    dots.forEach(function (dot) {
      if (playing) {
        dot.classList.add("playing");
      } else {
        dot.classList.remove("playing");
      }
    });

    var toggles = document.querySelectorAll("#setting-audio-toggle");
    toggles.forEach(function (toggle) {
      toggle.checked = playing;
    });
  }

  function updateVolumeUI(val) {
    var valDisplays = document.querySelectorAll("#settings-volume-value");
    valDisplays.forEach(function (el) {
      el.textContent = val + "%";
    });

    var sliders = document.querySelectorAll("#setting-audio-volume");
    sliders.forEach(function (slider) {
      if (slider.value !== String(val)) {
        slider.value = String(val);
      }
    });

    var icons = document.querySelectorAll("#settings-volume-icon");
    var svg = getVolumeSvg(val);
    icons.forEach(function (el) {
      el.innerHTML = svg;
    });
  }

  function startAudio() {
    desiredPlaying = true;
    try { localStorage.setItem("xsn_bg_audio", "true"); } catch (e) {}
    updateAudioUIState(true);

    var player = getAudioPlayer();
    if (playRequest) return playRequest;

    var playWhenReady = function () {
      if (!desiredPlaying) return Promise.resolve();
      restorePlaybackPosition();
      return player.play().then(function () {
        isAudioPlaying = true;
        updateAudioUIState(true);
        updateMediaSession(true);
      });
    };

    if (player.readyState >= 2) {
      playRequest = playWhenReady();
    } else {
      playRequest = new Promise(function (resolve, reject) {
        var onReady = function () {
          player.removeEventListener("canplay", onReady);
          player.removeEventListener("loadedmetadata", onReady);
          playWhenReady().then(resolve, reject);
        };
        player.addEventListener("canplay", onReady, { once: true });
        player.addEventListener("loadedmetadata", onReady, { once: true });
        player.load();
      });
    }
    playRequest.catch(function () {
      // Browsers may require a later user gesture. The interaction listener below retries.
    }).finally(function () {
      playRequest = null;
    });
    return playRequest;
  }

  function stopAudio() {
    desiredPlaying = false;
    isAudioPlaying = false;
    try { localStorage.setItem("xsn_bg_audio", "false"); } catch (e) {}

    savePlaybackPosition();

    if (audioPlayer) {
      audioPlayer.pause();
    }

    updateAudioUIState(false);
    updateMediaSession(false);
  }

  function applyVolume(vol) {
    var num = parseInt(vol, 10);
    if (isNaN(num)) num = 40;
    num = Math.max(0, Math.min(100, num));
    try { localStorage.setItem("xsn_bg_audio_vol", String(num)); } catch (e) {}

    if (audioPlayer) {
      audioPlayer.volume = num / 100;
    }

    updateVolumeUI(num);
  }

  function syncSettingsControls(root) {
    var context = root || document;
    var toggle = context.querySelector("#setting-audio-toggle");

    var isEnabled = false;
    try { isEnabled = localStorage.getItem("xsn_bg_audio") === "true"; } catch (e) {}

    var playing = isAudioPlaying || desiredPlaying;
    if (toggle) {
      toggle.checked = playing || isEnabled;
    }

    var vol = getStoredVolume();
    updateVolumeUI(vol);
    updateAudioUIState(playing || isEnabled);
  }

  // Pre-fetch & auto-resume background audio if user previously enabled it.
  // Playback itself is retried from the first trusted interaction to satisfy autoplay policy.
  try {
    if (localStorage.getItem("xsn_bg_audio") === "true") {
      desiredPlaying = true;
      getAudioPlayer();
      startAudio();

      var resumeOnInteraction = function () {
        if (localStorage.getItem("xsn_bg_audio") === "true" && !isAudioPlaying) {
          startAudio();
        }
        document.removeEventListener("pointerdown", resumeOnInteraction);
        document.removeEventListener("click", resumeOnInteraction);
        document.removeEventListener("keydown", resumeOnInteraction);
        document.removeEventListener("touchstart", resumeOnInteraction);
      };
      document.addEventListener("pointerdown", resumeOnInteraction, { once: true, passive: true });
      document.addEventListener("click", resumeOnInteraction, { once: true, passive: true });
      document.addEventListener("keydown", resumeOnInteraction, { once: true, passive: true });
      document.addEventListener("touchstart", resumeOnInteraction, { once: true, passive: true });
    }
  } catch (storageErr) {}

  window.addEventListener("pagehide", savePlaybackPosition);
  window.addEventListener("beforeunload", savePlaybackPosition);

  // MediaSession hardware controls
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", function () {
        startAudio();
      });
      navigator.mediaSession.setActionHandler("pause", function () {
        stopAudio();
      });
    } catch (e) {}
  }


  // ── Navigation Dropdown & Settings Modal ──────────────────────
  var lastActiveElement = null;
  var navOutsideBound = false;

  function closeAllDropdowns() {
    var dropdownWraps = document.querySelectorAll(".nav-dropdown-wrap");
    dropdownWraps.forEach(function (wrap) {
      if (wrap.classList.contains("open")) {
        wrap.classList.remove("open");
        var btn = wrap.querySelector(".nav-dropdown-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initNavDropdown() {
    var dropdownWraps = document.querySelectorAll(".nav-dropdown-wrap");

    dropdownWraps.forEach(function (wrap) {
      var oldBtn = wrap.querySelector(".nav-dropdown-btn");
      if (!oldBtn) return;

      var btn = oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(btn, oldBtn);

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        var isOpen = wrap.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
          wrap.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      }, true);
    });

    // Close on click outside. Keep one delegated listener across SPA swaps.
    if (!navOutsideBound) {
      navOutsideBound = true;
      document.addEventListener("click", function (e) {
        if (!e.target.closest(".nav-dropdown-wrap")) {
          closeAllDropdowns();
        }
      });
    }
  }

  function getOrCreateSettingsModal() {
    var modal = document.getElementById("settings-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "settings-modal";
      modal.className = "modal-overlay settings-modal-overlay";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="settings-modal-box" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">' +
          '<div class="settings-modal-header">' +
            '<div class="settings-modal-badge">' +
              '<span class="settings-badge-dot"></span>' +
              '<span class="settings-badge-text">preferences</span>' +
            '</div>' +
            '<button class="modal-close settings-modal-close" id="settings-modal-close" type="button" aria-label="Close settings">&times;</button>' +
          '</div>' +
          '<div class="settings-modal-title-wrap">' +
            '<h2 class="settings-modal-title" id="settings-modal-title">Settings</h2>' +
            '<p class="settings-modal-subtitle">Customize your experience on xensenx.dev</p>' +
          '</div>' +
          '<div class="settings-modal-divider"></div>' +
          '<div class="settings-modal-body">' +
            '<div class="settings-section">' +
              '<div class="settings-section-header">' +
                '<span class="settings-section-label">Audio &amp; Music</span>' +
              '</div>' +
              '<div class="settings-row">' +
                '<div class="settings-row-info">' +
                  '<div class="settings-row-title">Background Music</div>' +
                  '<div class="settings-row-desc">Play relaxing lo-fi background ambiance while you explore</div>' +
                '</div>' +
                '<div class="settings-row-control">' +
                  '<label class="settings-switch" for="setting-audio-toggle">' +
                    '<input type="checkbox" id="setting-audio-toggle" aria-label="Toggle background music" />' +
                    '<span class="settings-slider"></span>' +
                  '</label>' +
                '</div>' +
              '</div>' +
              '<div class="settings-row settings-volume-row">' +
                '<div class="settings-row-info">' +
                  '<div class="settings-row-title">Music Volume</div>' +
                  '<div class="settings-row-desc">Adjust background playback level</div>' +
                '</div>' +
                '<div class="settings-row-control settings-volume-control">' +
                  '<span class="settings-volume-icon" id="settings-volume-icon" aria-hidden="true">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>' +
                  '</span>' +
                  '<input type="range" id="setting-audio-volume" min="0" max="100" value="40" class="settings-range-slider" aria-label="Music volume" />' +
                  '<span class="settings-volume-value" id="settings-volume-value">40%</span>' +
                '</div>' +
              '</div>' +
              '<div class="settings-audio-credit">' +
                '<div class="settings-credit-info">' +
                  '<div class="settings-credit-header">' +
                    '<span class="settings-credit-pulse" id="audio-status-dot" aria-hidden="true"></span>' +
                    '<span class="settings-track-title">Lo-Fi Hip Hop Galaxy</span>' +
                  '</div>' +
                  '<div class="settings-credit-artist">' +
                    'Music by <a href="https://www.youtube.com/channel/UCx0_M61F81Nfb-BRXE-SeVA" target="_blank" rel="noopener noreferrer" class="settings-yt-link">Alex-Productions</a>' +
                  '</div>' +
                '</div>' +
                '<a href="https://www.youtube.com/channel/UCx0_M61F81Nfb-BRXE-SeVA" target="_blank" rel="noopener noreferrer" class="settings-yt-badge">' +
                  '<span>YouTube</span>' +
                  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' +
                '</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);

      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          closeSettings();
        }
      });

      var closeBtn = modal.querySelector(".settings-modal-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", function (e) {
          e.preventDefault();
          closeSettings();
        });
      }
    }
    return modal;
  }

  function openSettings() {
    closeAllDropdowns();
    var modal = getOrCreateSettingsModal();
    if (modal) {
      lastActiveElement = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      syncSettingsControls(modal);
      var closeBtn = modal.querySelector(".settings-modal-close");
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  }

  function closeSettings() {
    var modal = document.getElementById("settings-modal");
    if (modal && modal.classList.contains("open")) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
      }
    }
  }

  // Global delegation for open settings triggers
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("#nav-open-settings, [data-open-settings]");
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      openSettings();
    }
  });

  // Global delegation for modal close buttons
  document.addEventListener("click", function (e) {
    var closeBtn = e.target.closest(".settings-modal-close");
    if (closeBtn) {
      e.preventDefault();
      closeSettings();
    }
  });

  // Audio toggle change listener
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "setting-audio-toggle") {
      if (e.target.checked) {
        startAudio();
      } else {
        stopAudio();
      }
    }
  });

  // Audio volume slider listener
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "setting-audio-volume") {
      applyVolume(e.target.value);
    }
  });

  // Escape key listener for modal and dropdown
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      var modal = document.getElementById("settings-modal");
      if (modal && modal.classList.contains("open")) {
        closeSettings();
        return;
      }
      var openWrap = document.querySelector(".nav-dropdown-wrap.open");
      if (openWrap) {
        closeAllDropdowns();
        var btn = openWrap.querySelector(".nav-dropdown-btn");
        if (btn) btn.focus();
      }
    }
  });

  // Trigger flash screen refresh helper
  function triggerFlashRefresh() {
    closeAllDropdowns();
    try {
      sessionStorage.removeItem("xsn_flash_done");
      sessionStorage.removeItem("xsn_pos");
    } catch (err) {}

    var rawPath = window.location.pathname.replace(/\\/g, "/");
    var isIndex = (rawPath === "" || rawPath === "/" || rawPath.slice(-11) === "/index.html" || rawPath === "index.html");

    if (isIndex) {
      window.location.reload();
    } else {
      var inSubfolder = rawPath.indexOf("/posts/") !== -1 || rawPath.indexOf("/research/") !== -1;
      window.location.href = inSubfolder ? "../index.html" : "index.html";
    }
  }

  document.addEventListener("click", function (e) {
    var refreshTrigger = e.target.closest("#nav-refresh-flash, [data-refresh-flash]");
    if (refreshTrigger) {
      e.preventDefault();
      e.stopPropagation();
      triggerFlashRefresh();
    }
  });


  // ── Seamless Instant SPA Navigation Engine ────────────────────────
  // Intercepts internal links and swaps page content dynamically,
  // preventing browser document unloads. This keeps the <audio> element
  // playing continuously without interruption,
  // or restarts across pages!

  var pageCache = {};
  var pageRequests = {};

  function fetchPage(url) {
    var cleanUrl = url.split("#")[0];
    if (pageCache[cleanUrl]) return Promise.resolve(pageCache[cleanUrl]);
    if (pageRequests[cleanUrl]) return pageRequests[cleanUrl];

    pageRequests[cleanUrl] = fetch(cleanUrl).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (html) {
      pageCache[cleanUrl] = html;
      return html;
    }).finally(function () {
      delete pageRequests[cleanUrl];
    });
    return pageRequests[cleanUrl];
  }

  function isPersistentElement(node) {
    if (!node || node.nodeType !== 1) return true;
    var tag = node.tagName.toUpperCase();
    if (tag === "SCRIPT") return true;
    var id = node.id || "";
    if (id === "xsn-bg-audio-player") return true;
    if (id === "particle-canvas") return true;
    if (id === "ambient-canvas") return true;
    if (id === "settings-modal") return true;
    if (id === "dict-panel") return true;
    if (node.classList && (node.classList.contains("easter-toast") || node.classList.contains("visually-hidden-audio"))) return true;
    return false;
  }

  function swapPageContent(newDoc) {
    // 1. Remove non-persistent elements from document.body
    var currentElements = Array.prototype.slice.call(document.body.children);
    currentElements.forEach(function (el) {
      if (!isPersistentElement(el)) {
        el.remove();
      }
    });

    // 2. Locate insertion anchor (first persistent element or script)
    var insertBeforeNode = null;
    for (var i = 0; i < document.body.children.length; i++) {
      var child = document.body.children[i];
      if (isPersistentElement(child)) {
        insertBeforeNode = child;
        break;
      }
    }

    // 3. Import and insert new page elements
    var newElements = Array.prototype.slice.call(newDoc.body.children);
    newElements.forEach(function (el) {
      if (!isPersistentElement(el)) {
        // Hide flash screen if returning to index.html within same session
        if (el.id === "flash-screen") {
          el.style.display = "none";
        }
        // Ensure index main page is revealed immediately
        if (el.id === "main-page") {
          el.classList.remove("hidden");
          el.classList.add("visible");
          el.style.opacity = "1";
          el.style.visibility = "visible";
        }

        var clone = document.importNode(el, true);
        if (insertBeforeNode) {
          document.body.insertBefore(clone, insertBeforeNode);
        } else {
          document.body.appendChild(clone);
        }
      }
    });
  }

  function updateActiveNavLinks(targetUrl) {
    var path = "";
    try {
      path = new URL(targetUrl, window.location.href).pathname.replace(/\\/g, "/");
    } catch (e) {
      path = targetUrl;
    }
    var page = path.split("/").pop() || "index.html";
    if (page === "") page = "index.html";

    var navLinks = document.querySelectorAll(".nav-links a, .nav-dropdown-menu a");
    navLinks.forEach(function (link) {
      var linkHref = link.getAttribute("href") || "";
      var linkPath = linkHref.split("/").pop() || "index.html";
      if (linkPath === page) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function runPageInitializers(targetUrl) {
    // Update footer year
    document.querySelectorAll(".foot-yr").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    // Re-bind article nav & scroll header
    if (typeof window.__initNav === "function") {
      window.__initNav();
    }

    // Re-bind nav dropdown
    initNavDropdown();

    // Sync settings modal controls
    syncSettingsControls();

    // Page-specific initializers
    if (document.querySelector(".work-tab")) {
      if (typeof window.__initWorkTabs === "function") {
        window.__initWorkTabs();
      }
    }

    if (document.getElementById("posts-search")) {
      if (typeof window.__initPostsFilter === "function") {
        window.__initPostsFilter();
      }
    }

    if (document.getElementById("contact-form")) {
      if (typeof window.__initContactPage === "function") {
        window.__initContactPage();
      }
    }

    if (document.querySelector(".contact-page")) {
      if (typeof window.__initContactFlow === "function") {
        window.__initContactFlow();
      }
    }

    if (document.getElementById("mind-art-canvas")) {
      if (typeof window.__initMindWaves === "function") {
        window.__initMindWaves();
      }
    } else {
      if (typeof window.__stopMindWaves === "function") {
        window.__stopMindWaves();
      }
    }

    if (document.querySelector(".sticky-section")) {
      if (typeof window.__initScrollEffects === "function") {
        window.__initScrollEffects();
      }
    }

    updateActiveNavLinks(targetUrl);
  }

  function navigateTo(url, push) {
    var cleanUrl = url.split("#")[0];
    var hash = url.indexOf("#") !== -1 ? url.substring(url.indexOf("#")) : "";

    function applyNewPage(html) {
      var parser = new DOMParser();
      var newDoc = parser.parseFromString(html, "text/html");

      if (push) {
        window.history.pushState({ url: url }, "", url);
      }

      document.title = newDoc.title;
      document.body.className = newDoc.body.className;

      swapPageContent(newDoc);

      if (hash) {
        var targetEl = document.querySelector(hash);
        if (targetEl) {
          targetEl.scrollIntoView();
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        window.scrollTo(0, 0);
      }

      runPageInitializers(url);
    }

    fetchPage(cleanUrl)
      .then(function (html) {
        applyNewPage(html);
      })
      .catch(function (err) {
        console.warn("[spa-nav] Fallback to native navigation:", err);
        window.location.href = url;
      });
  }

  function prefetchPage(url) {
    if (!url || window.location.protocol === "file:") return;
    var cleanUrl = url.split("#")[0];
    if (pageCache[cleanUrl] || pageRequests[cleanUrl]) return;

    fetchPage(cleanUrl)
      .catch(function () {});
  }

  // Pre-fetch pages on link hover / touch
  document.addEventListener("mouseover", function (e) {
    var link = e.target.closest("a[href]");
    if (link && link.origin === window.location.origin && !link.target && !link.hasAttribute("download")) {
      prefetchPage(link.href);
    }
  }, { passive: true });

  document.addEventListener("touchstart", function (e) {
    var link = e.target.closest("a[href]");
    if (link && link.origin === window.location.origin && !link.target && !link.hasAttribute("download")) {
      prefetchPage(link.href);
    }
  }, { passive: true });

  // Intercept internal link clicks for seamless navigation
  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

    var link = e.target.closest("a[href]");
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (link.hasAttribute("download") || link.target === "_blank") return;

    var targetUrl;
    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (err) {
      return;
    }

    if (targetUrl.origin !== window.location.origin) return;

    // Handle same-page hash scrolling
    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
      if (targetUrl.hash) {
        var anchor = document.querySelector(targetUrl.hash);
        if (anchor) {
          e.preventDefault();
          anchor.scrollIntoView({ behavior: "smooth" });
          history.pushState(null, "", targetUrl.href);
          return;
        }
      } else {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    e.preventDefault();
    closeAllDropdowns();
    navigateTo(targetUrl.href, true);
  });

  // Browser back / forward buttons
  window.addEventListener("popstate", function () {
    navigateTo(window.location.href, false);
  });


  // ── Global Exports & Initialization ──────────────────────────────
  window.openSettingsModal = openSettings;
  window.closeSettingsModal = closeSettings;
  window.triggerFlashRefresh = triggerFlashRefresh;
  window.startBackgroundAudio = startAudio;
  window.stopBackgroundAudio = stopAudio;
  window.setBackgroundAudioVolume = applyVolume;
  window.__navigateTo = navigateTo;
  window.__initNavDropdown = initNavDropdown;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavDropdown);
  } else {
    initNavDropdown();
  }
})();
