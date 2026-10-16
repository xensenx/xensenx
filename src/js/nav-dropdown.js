/**
 * nav-dropdown.js
 * Handles the header "xensenx ▾" dropdown menu, the Settings popup modal,
 * flash screen refresh, and background audio playback with volume control and YouTube attribution.
 */
(function () {
  "use strict";

  // ── High-Performance Background Audio Controller ────────────────────────
  // Solves tab-switch interruptions & network latency stalls:
  // 1. In-memory pre-fetching (ArrayBuffer & Blob) -> Zero streaming during playback.
  // 2. Web Audio API (AudioContext) running on OS real-time audio thread -> Immune to tab switching.
  // 3. Hardware-level sample-accurate loop (sourceNode.loop = true) -> Gapless looping.
  // 4. MediaSession API integration -> Browser tab priority protection.
  // 5. Automatic DOM audio element fallback for non-WebAudio environments.

  var audioCtx = null;
  var gainNode = null;
  var currentSource = null;
  var cachedAudioBuffer = null;
  var cachedBlobUrl = null;
  var isPreloading = false;
  var isAudioPlaying = false;
  var desiredPlaying = false;
  var fallbackAudio = null;
  var preloadPromise = null;

  function getAudioPath() {
    var rawPath = window.location.pathname.replace(/\\/g, "/");
    var inSubfolder = rawPath.indexOf("/posts/") !== -1 || rawPath.indexOf("/research/") !== -1;
    return (inSubfolder ? "../" : "") + "assets/audio/alex-productions-lo-fi-hip-hop-galaxy-132921.mp3";
  }

  function getStoredVolume() {
    var savedVol = null;
    try { savedVol = localStorage.getItem("xsn_bg_audio_vol"); } catch (e) {}
    var vol = savedVol !== null ? parseInt(savedVol, 10) : 40;
    if (isNaN(vol) || vol < 0 || vol > 100) vol = 40;
    return vol;
  }

  function getAudioContext() {
    if (!audioCtx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        var vol = getStoredVolume();
        gainNode.gain.setValueAtTime(vol / 100, audioCtx.currentTime);
      }
    }
    return audioCtx;
  }

  function getDomAudio() {
    if (!fallbackAudio) {
      fallbackAudio = document.getElementById("xsn-bg-audio-host");
      if (!fallbackAudio) {
        fallbackAudio = document.createElement("audio");
        fallbackAudio.id = "xsn-bg-audio-host";
        fallbackAudio.setAttribute("preload", "auto");
        fallbackAudio.setAttribute("aria-hidden", "true");
        fallbackAudio.setAttribute("tabindex", "-1");
        fallbackAudio.style.position = "fixed";
        fallbackAudio.style.width = "0";
        fallbackAudio.style.height = "0";
        fallbackAudio.style.opacity = "0";
        fallbackAudio.style.pointerEvents = "none";
        fallbackAudio.style.zIndex = "-9999";
        (document.body || document.documentElement).appendChild(fallbackAudio);
      }
      fallbackAudio.loop = true;
      fallbackAudio.volume = getStoredVolume() / 100;
    }
    return fallbackAudio;
  }

  function updateMediaSession(playing) {
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Lo-Fi Hip Hop Galaxy",
          artist: "Alex-Productions",
          album: "xensenx"
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

  function preloadAudio() {
    if (preloadPromise) return preloadPromise;
    isPreloading = true;
    var audioUrl = getAudioPath();

    preloadPromise = fetch(audioUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.blob();
      })
      .then(function (blob) {
        cachedBlobUrl = URL.createObjectURL(blob);
        var el = getDomAudio();
        if (el && !el.src) {
          el.src = cachedBlobUrl;
        }

        var ctx = getAudioContext();
        if (ctx) {
          return blob.arrayBuffer().then(function (ab) {
            return new Promise(function (resolve) {
              ctx.decodeAudioData(
                ab,
                function (decoded) {
                  cachedAudioBuffer = decoded;
                  isPreloading = false;
                  resolve(decoded);
                },
                function (err) {
                  console.warn("[audio] decodeAudioData error, using fallback:", err);
                  isPreloading = false;
                  resolve(null);
                }
              );
            });
          });
        } else {
          isPreloading = false;
          return null;
        }
      })
      .catch(function (err) {
        console.warn("[audio] Preload error:", err);
        isPreloading = false;
        return null;
      });

    return preloadPromise;
  }

  function playWebAudioBuffer() {
    var ctx = getAudioContext();
    if (!ctx || !cachedAudioBuffer) return;

    if (currentSource) {
      try {
        currentSource.onended = null;
        currentSource.stop();
        currentSource.disconnect();
      } catch (e) {}
      currentSource = null;
    }

    if (fallbackAudio) {
      fallbackAudio.pause();
    }

    currentSource = ctx.createBufferSource();
    currentSource.buffer = cachedAudioBuffer;
    currentSource.loop = true;
    currentSource.connect(gainNode);

    var vol = getStoredVolume();
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(vol / 100, ctx.currentTime);

    currentSource.start(0);
    isAudioPlaying = true;
    updateAudioUIState(true);
    updateMediaSession(true);
  }

  function playFallbackAudio() {
    var el = getDomAudio();
    if (!el) return;
    if (cachedBlobUrl && el.src !== cachedBlobUrl) {
      el.src = cachedBlobUrl;
    } else if (!el.src) {
      el.src = getAudioPath();
    }
    el.loop = true;
    var vol = getStoredVolume();
    el.volume = vol / 100;
    var p = el.play();
    if (p !== undefined) {
      p.then(function () {
        isAudioPlaying = true;
        updateAudioUIState(true);
        updateMediaSession(true);
      }).catch(function (err) {
        console.log("[audio] Fallback play awaiting interaction:", err);
      });
    }
  }

  function startAudio() {
    desiredPlaying = true;
    try { localStorage.setItem("xsn_bg_audio", "true"); } catch (e) {}
    updateAudioUIState(true);

    var ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }

    if (cachedAudioBuffer && ctx) {
      playWebAudioBuffer();
    } else {
      preloadAudio().then(function () {
        if (desiredPlaying) {
          if (cachedAudioBuffer && ctx) {
            playWebAudioBuffer();
          } else {
            playFallbackAudio();
          }
        }
      });
    }
  }

  function stopAudio() {
    desiredPlaying = false;
    isAudioPlaying = false;
    try { localStorage.setItem("xsn_bg_audio", "false"); } catch (e) {}

    if (currentSource) {
      try {
        currentSource.onended = null;
        currentSource.stop();
        currentSource.disconnect();
      } catch (e) {}
      currentSource = null;
    }

    if (fallbackAudio) {
      fallbackAudio.pause();
    }

    updateAudioUIState(false);
    updateMediaSession(false);
  }

  function applyVolume(vol) {
    var num = parseInt(vol, 10);
    if (isNaN(num)) num = 40;
    num = Math.max(0, Math.min(100, num));
    var volFraction = num / 100;

    var ctx = getAudioContext();
    if (gainNode && ctx) {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volFraction, ctx.currentTime + 0.02);
      } catch (e) {
        gainNode.gain.value = volFraction;
      }
    }

    if (fallbackAudio) {
      fallbackAudio.volume = volFraction;
    }

    try { localStorage.setItem("xsn_bg_audio_vol", String(num)); } catch (e) {}
    updateVolumeUI(num);
  }

  function syncSettingsControls(root) {
    var context = root || document;
    var toggle = context.querySelector("#setting-audio-toggle");

    var isEnabled = false;
    try { isEnabled = localStorage.getItem("xsn_bg_audio") === "true"; } catch (e) {}

    var playing = isAudioPlaying || (desiredPlaying && isPreloading);
    if (toggle) {
      toggle.checked = playing || isEnabled;
    }

    var vol = getStoredVolume();
    updateVolumeUI(vol);
    updateAudioUIState(playing || isEnabled);
  }

  // Pre-fetch & auto-resume background audio if user previously enabled it
  try {
    if (localStorage.getItem("xsn_bg_audio") === "true") {
      desiredPlaying = true;
      preloadAudio();
      startAudio();

      var resumeOnInteraction = function () {
        if (localStorage.getItem("xsn_bg_audio") === "true" && !isAudioPlaying) {
          var ctx = getAudioContext();
          if (ctx && ctx.state === "suspended") {
            ctx.resume().then(function () {
              if (desiredPlaying) startAudio();
            }).catch(function () {});
          } else {
            startAudio();
          }
        }
        document.removeEventListener("pointerdown", resumeOnInteraction);
        document.removeEventListener("click", resumeOnInteraction);
        document.removeEventListener("keydown", resumeOnInteraction);
        document.removeEventListener("touchstart", resumeOnInteraction);
      };
      document.addEventListener("pointerdown", resumeOnInteraction, { once: true });
      document.addEventListener("click", resumeOnInteraction, { once: true });
      document.addEventListener("keydown", resumeOnInteraction, { once: true });
      document.addEventListener("touchstart", resumeOnInteraction, { once: true });
    }
  } catch (storageErr) {}

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
  function initNavDropdown() {
    var dropdownWraps = document.querySelectorAll(".nav-dropdown-wrap");

    function closeAllDropdowns() {
      dropdownWraps.forEach(function (wrap) {
        if (wrap.classList.contains("open")) {
          wrap.classList.remove("open");
          var btn = wrap.querySelector(".nav-dropdown-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    }

    dropdownWraps.forEach(function (wrap) {
      var btn = wrap.querySelector(".nav-dropdown-btn");
      if (!btn) return;

      btn.addEventListener("mouseenter", function () {
        if (!preloadPromise) preloadAudio();
      });

      btn.addEventListener("focus", function () {
        if (!preloadPromise) preloadAudio();
      });

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!preloadPromise) preloadAudio();
        var isOpen = wrap.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
          wrap.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav-dropdown-wrap")) {
        closeAllDropdowns();
      }
    });

    var lastActiveElement = null;

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

    // Open settings click delegation
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("#nav-open-settings, [data-open-settings]");
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        openSettings();
      }
    });

    // Close settings button delegation
    document.addEventListener("click", function (e) {
      var closeBtn = e.target.closest(".settings-modal-close");
      if (closeBtn) {
        e.preventDefault();
        closeSettings();
      }
    });

    // Existing modal backdrop click
    var existingModal = document.getElementById("settings-modal");
    if (existingModal) {
      existingModal.addEventListener("click", function (e) {
        if (e.target === existingModal) {
          closeSettings();
        }
      });
      syncSettingsControls(existingModal);
    }

    // Audio toggle checkbox change listener
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

    // Keyboard navigation (Escape key)
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

    // Helper: trigger flash screen refresh
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

    // Refresh click delegation
    document.addEventListener("click", function (e) {
      var refreshTrigger = e.target.closest("#nav-refresh-flash, [data-refresh-flash]");
      if (refreshTrigger) {
        e.preventDefault();
        e.stopPropagation();
        triggerFlashRefresh();
      }
    });

    // Expose helpers globally
    window.openSettingsModal = openSettings;
    window.closeSettingsModal = closeSettings;
    window.triggerFlashRefresh = triggerFlashRefresh;
    window.startBackgroundAudio = startAudio;
    window.stopBackgroundAudio = stopAudio;
    window.setBackgroundAudioVolume = applyVolume;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavDropdown);
  } else {
    initNavDropdown();
  }
})();
