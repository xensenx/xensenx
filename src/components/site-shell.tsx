import { component$, $, useSignal, useVisibleTask$, type Signal } from '@builder.io/qwik';
import { Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { getPage } from '../content/pages';

function getClientPageHref(href: string, baseUrl: URL): string | undefined {
  try {
    const target = new URL(href, baseUrl);
    if (target.origin !== baseUrl.origin) return undefined;

    let pathname = target.pathname;
    if (pathname === '/index.html') pathname = '/';
    else if (pathname.endsWith('.html')) pathname = `/${pathname.slice(1, -5).replace(/\/+$/, '')}/`;
    else if (pathname !== '/' && !pathname.endsWith('/') && !/\.[^/]+$/.test(pathname)) pathname += '/';

    if (/\.[^/]+$/.test(pathname)) return undefined;
    return `${pathname}${target.search}${target.hash}`;
  } catch {
    return undefined;
  }
}

function setDialog(id: string, open: boolean) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  dialog.setAttribute('aria-hidden', open ? 'false' : 'true');
  dialog.classList.toggle('open', open);
}

function updatePostCards(root: HTMLElement | undefined, query: string, category: string) {
  if (!root) return;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('#posts-grid .card'));
  let visible = 0;
  for (const card of cards) {
    const title = (card.dataset.title || '').toLowerCase();
    const description = (card.dataset.desc || '').toLowerCase();
    const matchesQuery = !query || title.includes(query) || description.includes(query);
    const matchesCategory = category === 'all' || card.dataset.category === category;
    const show = matchesQuery && matchesCategory;
    card.style.display = show ? '' : 'none';
    if (show) visible += 1;
  }
  const emptyMessage = root.querySelector<HTMLElement>('#posts-empty');
  if (emptyMessage) emptyMessage.style.display = visible === 0 ? 'block' : 'none';
}

function activateWorkTab(root: HTMLElement, tabId: string) {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.work-tab'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.work-tab-panel'));
  const activeTab = tabs.find((tab) => tab.dataset.tab === tabId);
  if (!activeTab) return;

  for (const tab of tabs) {
    const active = tab === activeTab;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  }
  for (const panel of panels) panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);

  const indicator = root.querySelector<HTMLElement>('.work-tab-indicator');
  if (indicator) {
    indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    indicator.style.width = `${activeTab.offsetWidth}px`;
  }
  try {
    sessionStorage.setItem('xsn_active_work_tab', tabId);
  } catch {
    // Storage is optional.
  }
}

export const SiteHeader = component$((props: { active: string; settingsOpen: Signal<boolean> }) => {
  const menuOpen = useSignal(false);
  const navigate = useNavigate();

  useVisibleTask$(({ cleanup }) => {
    const header = document.querySelector<HTMLElement>('header');
    if (!header || props.active === 'mind') return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        header.classList.toggle('scrolled', y > 80);
        if (y <= 80) header.classList.remove('nav-hidden');
        else if (y > lastY + 4) header.classList.add('nav-hidden');
        else if (y < lastY - 4) header.classList.remove('nav-hidden');
        lastY = y;
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    cleanup(() => {
      window.removeEventListener('scroll', update);
      if (frame) window.cancelAnimationFrame(frame);
    });
  });

  return (
    <header>
      <nav>
        <div class={menuOpen.value ? 'nav-dropdown-wrap open' : 'nav-dropdown-wrap'}>
          <button
            id="nav-logo"
            class="nav-name nav-dropdown-btn"
            type="button"
            aria-expanded={menuOpen.value}
            aria-haspopup="true"
            aria-controls="nav-dropdown-menu"
            onClick$={() => menuOpen.value = !menuOpen.value}
            onKeyDown$={(event) => {
              if (event.key === 'Escape') menuOpen.value = false;
            }}
          >
            <span class="nav-name-text">xensenx</span>
            <span class="nav-dropdown-caret" aria-hidden="true">&#x25BE;</span>
          </button>
          <div id="nav-dropdown-menu" class="nav-dropdown-menu" role="menu" aria-label="Site menu">
            <button
              type="button"
              class="nav-dropdown-item"
              id="nav-open-settings"
              role="menuitem"
              onClick$={() => {
                menuOpen.value = false;
                props.settingsOpen.value = true;
              }}
            >
              <span>settings</span>
            </button>
            <Link href="/about-site/" class="nav-dropdown-item" role="menuitem"><span>about site</span></Link>
            <Link href="/privacy/" class="nav-dropdown-item" role="menuitem"><span>privacy-policy</span></Link>
            <Link href="/contact/" class="nav-dropdown-item" role="menuitem"><span>contact</span></Link>
            <div class="nav-dropdown-divider"></div>
            <button
              type="button"
              class="nav-dropdown-item"
              id="nav-refresh-flash"
              role="menuitem"
              onClick$={async () => {
                menuOpen.value = false;
                try { sessionStorage.removeItem('xsn_flash_done'); } catch { /* Storage is optional. */ }
                if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') await navigate('/');
                else window.location.reload();
              }}
            >
              <span>refresh</span>
            </button>
          </div>
        </div>
        <div class="nav-links">
          <Link href="/" aria-current={props.active === 'mind' ? 'page' : undefined}>mind</Link>
          <Link href="/posts/" aria-current={props.active === 'posts' ? 'page' : undefined}>posts</Link>
          <Link href="/work/" aria-current={props.active === 'work' ? 'page' : undefined}>work</Link>
          <Link href="/contact/" aria-current={props.active === 'contact' ? 'page' : undefined}>contact</Link>
        </div>
      </nav>
    </header>
  );
});

export const ArticleNav = component$((props: { pagePath: string; fromMind: boolean; settingsOpen: Signal<boolean> }) => {
  const menuOpen = useSignal(false);
  const navigate = useNavigate();
  let href = '/';
  let label = 'Back to mind';
  if (props.pagePath.startsWith('posts/')) {
    href = props.fromMind ? '/' : '/posts/';
    label = props.fromMind ? 'Back to mind' : 'Back to posts';
  } else if (props.pagePath.startsWith('research/')) {
    href = '/work/';
    label = 'Back to work';
  } else if (props.pagePath === 'about-me.html') {
    href = '/';
  }

  useVisibleTask$(({ cleanup }) => {
    const nav = document.querySelector<HTMLElement>('.article-nav');
    if (!nav) return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 80);
        if (y <= 80) nav.classList.remove('nav-hidden');
        else if (y > lastY + 4) nav.classList.add('nav-hidden');
        else if (y < lastY - 4) nav.classList.remove('nav-hidden');
        lastY = y;
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    cleanup(() => {
      window.removeEventListener('scroll', update);
      if (frame) window.cancelAnimationFrame(frame);
    });
  });

  return (
    <nav class="article-nav">
      <Link href={href} class="article-back" aria-label={label} data-back>&larr; back</Link>
      {props.pagePath === 'about-me.html' ? (
        <span class="nav-name">xensenx</span>
      ) : (
        <div class={menuOpen.value ? 'nav-dropdown-wrap open' : 'nav-dropdown-wrap'}>
          <button
            class="nav-name nav-dropdown-btn"
            type="button"
            aria-expanded={menuOpen.value}
            aria-haspopup="true"
            aria-controls="nav-dropdown-menu"
            onClick$={() => menuOpen.value = !menuOpen.value}
            onKeyDown$={(event) => { if (event.key === 'Escape') menuOpen.value = false; }}
          >
            <span class="nav-name-text">xensenx</span>
            <span class="nav-dropdown-caret" aria-hidden="true">&#x25BE;</span>
          </button>
          <div id="nav-dropdown-menu" class="nav-dropdown-menu" role="menu" aria-label="Site menu">
            <button type="button" class="nav-dropdown-item" role="menuitem" onClick$={() => { menuOpen.value = false; props.settingsOpen.value = true; }}><span>settings</span></button>
            <Link href="/about-site/" class="nav-dropdown-item" role="menuitem"><span>about site</span></Link>
            <Link href="/privacy/" class="nav-dropdown-item" role="menuitem"><span>privacy-policy</span></Link>
            <Link href="/contact/" class="nav-dropdown-item" role="menuitem"><span>contact</span></Link>
            <div class="nav-dropdown-divider"></div>
            <button
              type="button"
              class="nav-dropdown-item"
              role="menuitem"
              onClick$={async () => {
                menuOpen.value = false;
                try { sessionStorage.removeItem('xsn_flash_done'); } catch { /* Storage is optional. */ }
                if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') await navigate('/');
                else window.location.reload();
              }}
            ><span>refresh</span></button>
          </div>
        </div>
      )}
    </nav>
  );
});

export const SiteFooter = component$(() => (
  <footer id="footer">
    <div class="footer-inner">
      <span class="footer-name">Sen &copy; <span class="foot-yr">{new Date().getFullYear()}</span></span>
      <Link href="/privacy/" class="footer-legal-link">Privacy Policy</Link>
      <div class="footer-icons">
        <a href="https://github.com/xensenx" class="footer-icon" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor" /></svg>
        </a>
        <a href="https://ko-fi.com/xensenx" class="footer-icon" target="_blank" rel="noopener noreferrer" aria-label="Ko-fi">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.694.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="currentColor" /></svg>
        </a>
        <Link href="/sitemap/" class="footer-icon" aria-label="Sitemap">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 12H7.6C7.04 12 6.76 12 6.546 12.109C6.358 12.205 6.205 12.358 6.109 12.546C6 12.76 6 13.04 6 13.6V16M12 12H16.4C16.96 12 17.24 12 17.454 12.109C17.642 12.205 17.795 12.358 17.891 12.546C18 12.76 18 13.04 18 13.6V16M12 12V8M11.1 8H12.9C13.46 8 13.74 8 13.954 7.891C14.142 7.795 14.295 7.642 14.391 7.454C14.5 7.24 14.5 6.96 14.5 6.4V4.6C14.5 4.04 14.5 3.76 14.391 3.546C14.295 3.358 14.142 3.205 13.954 3.109C13.74 3 13.46 3 12.9 3H11.1C10.54 3 10.26 3 10.046 3.109C9.858 3.205 9.705 3.358 9.609 3.546C9.5 3.76 9.5 4.04 9.5 4.6V6.4C9.5 6.96 9.5 7.24 9.609 7.454C9.705 7.642 9.858 7.795 10.046 7.891C10.26 8 10.54 8 11.1 8ZM5.1 21H6.9C7.46 21 7.74 21 7.954 20.891C8.142 20.795 8.295 20.642 8.391 20.454C8.5 20.24 8.5 19.96 8.5 19.4V17.6C8.5 17.04 8.5 16.76 8.391 16.546C8.295 16.358 8.142 16.205 8.046 16.109C7.74 16 7.46 16 6.9 16H5.1C4.54 16 4.26 16 4.046 16.109C3.858 16.205 3.705 16 3.609 16.546V19.4C3.5 19.96 3.5 20.24 3.609 20.454C3.705 20.642 3.858 20.795 4.046 20.891C4.26 21 4.54 21 5.1 21ZM17.1 21H18.9C19.46 21 19.74 21 19.954 20.891C20.142 20.795 20.295 20.642 20.391 20.454C20.5 20.24 20.5 19.96 20.5 19.4V17.6C20.5 17.04 20.5 16.76 20.391 16.546C20.295 16.358 20.142 16.205 19.954 16.109C19.74 16 19.46 16 18.9 16H17.1C16.54 16 16.26 16 16.046 16.109C15.858 16.205 15.705 16.358 15.609 16.546C15.5 16.76 15.5 16.24 15.5 17.6V19.4C15.5 19.96 15.5 20.24 15.609 20.454C15.705 20.642 15.858 20.795 16.046 20.891C16.26 21 16.54 21 17.1 21Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </Link>
      </div>
    </div>
  </footer>
));

export const SettingsModal = component$((props: { open: Signal<boolean> }) => {
  const musicEnabled = useSignal(false);
  const volume = useSignal(40);
  const customCursor = useSignal(true);

  useVisibleTask$(() => {
    try {
      const storedVolume = Number(localStorage.getItem('xsn_bg_audio_vol'));
      if (Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 100) volume.value = storedVolume;
      const storedCursor = localStorage.getItem('xsn_custom_cursor');
      customCursor.value = storedCursor === null || storedCursor === 'true';
      document.documentElement.classList.toggle('cursor-normal', !customCursor.value);
      musicEnabled.value = localStorage.getItem('xsn_bg_audio_enabled') === 'true';
      const audio = document.getElementById('xsn-bg-audio-player') as HTMLAudioElement | null;
      if (audio) {
        audio.volume = volume.value / 100;
        if (musicEnabled.value && audio.paused) audio.play().catch(() => { /* The browser may require another user gesture. */ });
      }
    } catch {
      // Preferences are optional.
    }
  });

  const setMusic = $((enabled: boolean) => {
    musicEnabled.value = enabled;
    try { localStorage.setItem('xsn_bg_audio_enabled', String(enabled)); } catch { /* Storage is optional. */ }
    const audio = document.getElementById('xsn-bg-audio-player') as HTMLAudioElement | null;
    if (!audio) return;
    if (enabled) {
      audio.play().catch(() => { musicEnabled.value = false; });
    } else {
      audio.pause();
    }
  });

  const setVolume = $((value: number) => {
    const nextVolume = Math.max(0, Math.min(100, value));
    volume.value = nextVolume;
    try { localStorage.setItem('xsn_bg_audio_vol', String(nextVolume)); } catch { /* Storage is optional. */ }
    const audio = document.getElementById('xsn-bg-audio-player') as HTMLAudioElement | null;
    if (audio) audio.volume = nextVolume / 100;
  });

  const setCursor = $((enabled: boolean) => {
    customCursor.value = enabled;
    document.documentElement.classList.toggle('cursor-normal', !enabled);
    try { localStorage.setItem('xsn_custom_cursor', String(enabled)); } catch { /* Storage is optional. */ }
  });

  return (
    <>
      <div
        id="settings-modal"
        class={props.open.value ? 'modal-overlay settings-modal-overlay open' : 'modal-overlay settings-modal-overlay'}
        aria-hidden={!props.open.value}
        onClick$={(event) => {
          if (event.target === event.currentTarget) props.open.value = false;
        }}
        onKeyDown$={(event) => {
          if (event.key === 'Escape') props.open.value = false;
        }}
      >
        <div class="settings-modal-box" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
          <div class="settings-modal-header">
            <div class="settings-modal-badge"><span class="settings-badge-dot"></span><span class="settings-badge-text">preferences</span></div>
            <button class="modal-close settings-modal-close" type="button" aria-label="Close settings" onClick$={() => props.open.value = false}>&times;</button>
          </div>
          <div class="settings-modal-title-wrap">
            <h2 class="settings-modal-title" id="settings-modal-title">Settings</h2>
            <p class="settings-modal-subtitle">Customize your experience on xensenx.dev</p>
          </div>
          <div class="settings-modal-divider"></div>
          <div class="settings-modal-body">
            <div class="settings-section">
              <div class="settings-section-header"><span class="settings-section-label">Audio &amp; Music</span></div>
              <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-title">Background Music</div><div class="settings-row-desc">Play relaxing lo-fi background ambiance while you explore</div></div>
                <div class="settings-row-control">
                  <label class="settings-switch" for="setting-audio-toggle">
                    <input type="checkbox" id="setting-audio-toggle" aria-label="Toggle background music" checked={musicEnabled.value} onChange$={(event) => setMusic((event.target as HTMLInputElement).checked)} />
                    <span class="settings-slider"></span>
                  </label>
                </div>
              </div>
              <div class="settings-row settings-volume-row">
                <div class="settings-row-info"><div class="settings-row-title">Music Volume</div><div class="settings-row-desc">Adjust background playback level</div></div>
                <div class="settings-row-control settings-volume-control">
                  <span class="settings-volume-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></span>
                  <input type="range" id="setting-audio-volume" min="0" max="100" value={volume.value} class="settings-range-slider" aria-label="Music volume" onInput$={(event) => setVolume(Number((event.target as HTMLInputElement).value))} />
                  <span class="settings-volume-value">{volume.value}%</span>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-title">Custom Cat Cursor</div><div class="settings-row-desc">Use the cat and paw cursors throughout the site</div></div>
                <div class="settings-row-control">
                  <label class="settings-switch" for="setting-cursor-toggle">
                    <input type="checkbox" id="setting-cursor-toggle" aria-label="Toggle custom cat cursor" checked={customCursor.value} onChange$={(event) => setCursor((event.target as HTMLInputElement).checked)} />
                    <span class="settings-slider"></span>
                  </label>
                </div>
              </div>
              <div class="settings-audio-credit">
                <div class="settings-credit-info">
                  <div class="settings-credit-header"><span class="settings-credit-pulse" aria-hidden="true"></span><span class="settings-track-title">Lo-Fi Hip Hop Galaxy</span></div>
                  <div class="settings-credit-artist">Music by <a href="https://www.youtube.com/channel/UCx0_M61F81Nfb-BRXE-SeVA" target="_blank" rel="noopener noreferrer" class="settings-yt-link">Alex-Productions</a></div>
                </div>
                <a href="https://www.youtube.com/channel/UCx0_M61F81Nfb-BRXE-SeVA" target="_blank" rel="noopener noreferrer" class="settings-yt-badge"><span>YouTube</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export const PageEffects = component$((props: { home: boolean; contact: boolean; readingMode: boolean }) => {
  useVisibleTask$(({ track, cleanup }) => {
    const home = track(() => props.home);
    const contact = track(() => props.contact);
    const readingMode = track(() => props.readingMode);
    document.body.classList.toggle('reading-mode', readingMode);
    const scripts = [
      '/legacy/js/particles.js',
      '/legacy/js/ambient.js',
      ...(home ? ['/legacy/js/mind-waves.js', '/legacy/js/scroll-effects.js'] : []),
      ...(contact ? ['/legacy/js/contact-flow.js'] : []),
      '/legacy/js/dict.js',
    ];
    let cancelled = false;
    const loadScripts = async () => {
      for (const src of scripts) {
        if (cancelled) return;
        if (document.querySelector(`script[data-qwik-effect="${src}"]`)) continue;
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.dataset.qwikEffect = src;
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }
      if (cancelled) return;
      const flowWindow = window as Window & { __initContactFlow?: () => void; __stopContactFlow?: () => void };
      const wavesWindow = window as Window & { __initMindWaves?: () => void; __stopMindWaves?: () => void; __initScrollEffects?: () => void };
      if (home) {
        wavesWindow.__initMindWaves?.();
        wavesWindow.__initScrollEffects?.();
      } else {
        wavesWindow.__stopMindWaves?.();
      }
      if (contact) flowWindow.__initContactFlow?.();
      else flowWindow.__stopContactFlow?.();
    };

    void loadScripts();
    cleanup(() => {
      cancelled = true;
      const flowWindow = window as Window & { __stopContactFlow?: () => void };
      const wavesWindow = window as Window & { __stopMindWaves?: () => void };
      flowWindow.__stopContactFlow?.();
      wavesWindow.__stopMindWaves?.();
    });
  }, { strategy: 'document-ready' });

  return null;
});

export const PageView = component$((props: { path: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = getPage(props.path);
  const settingsOpen = useSignal(false);
  const pageRoot = useSignal<HTMLElement>();
  const postQuery = useSignal('');
  const postCategory = useSignal('all');

  useVisibleTask$(({ cleanup, track }) => {
    const path = track(() => props.path);
    if (path !== 'index.html') return;
    const flash = document.getElementById('flash-screen');
    const main = document.getElementById('main-page');
    const typewriter = document.getElementById('typewriter-text');
    const pronunciation = document.getElementById('pronunciation');
    const cursor = document.getElementById('cursor');
    if (!flash || !main || !typewriter) return;

    let timer = 0;
    let cancelled = false;
    const reveal = (duration: number) => {
      if (cancelled) return;
      if (cursor) {
        cursor.style.animation = 'none';
        cursor.style.opacity = '0';
      }
      flash.classList.add('fade-out');
      timer = window.setTimeout(() => {
        if (cancelled) return;
        flash.style.display = 'none';
        try { sessionStorage.setItem('xsn_flash_done', '1'); } catch { /* Storage is optional. */ }
        main.classList.remove('hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => main.classList.add('visible')));
      }, duration);
    };

    try {
      if (sessionStorage.getItem('xsn_flash_done')) {
        flash.style.display = 'none';
        main.classList.remove('hidden');
        main.classList.add('visible');
        cleanup(() => { cancelled = true; });
        return;
      }
    } catch {
      // Continue with the intro if session storage is blocked.
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      typewriter.textContent = 'xensenx';
      pronunciation?.classList.add('visible');
      timer = window.setTimeout(() => reveal(900), 600);
    } else {
      let index = 0;
      const typeNext = () => {
        if (cancelled) return;
        if (index < 'xensenx'.length) {
          typewriter.textContent += 'xensenx'[index++];
          timer = window.setTimeout(typeNext, 90 + Math.random() * 40);
        } else {
          pronunciation?.classList.add('visible');
          timer = window.setTimeout(() => reveal(900), 1200);
        }
      };
      timer = window.setTimeout(typeNext, 400);
    }

    cleanup(() => {
      cancelled = true;
      window.clearTimeout(timer);
    });
  }, { strategy: 'document-ready' });

  useVisibleTask$(({ cleanup, track }) => {
    const path = track(() => props.path);
    if (path !== 'work.html' || !pageRoot.value) return;
    let active = 'projects';
    try { active = sessionStorage.getItem('xsn_active_work_tab') || active; } catch { /* Storage is optional. */ }
    const root = pageRoot.value;
    const frame = requestAnimationFrame(() => activateWorkTab(root, active));
    const resize = () => {
      const tab = root.querySelector<HTMLButtonElement>('.work-tab.active');
      const indicator = root.querySelector<HTMLElement>('.work-tab-indicator');
      if (tab && indicator) {
        indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
        indicator.style.width = `${tab.offsetWidth}px`;
      }
    };
    window.addEventListener('resize', resize);
    cleanup(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    });
  }, { strategy: 'document-ready' });

  if (!page) {
    return <main class="article-page"><h1>Page not found</h1><Link href="/">Return to mind</Link></main>;
  }

  const active = page.path === 'index.html' ? 'mind' : page.path.replace('.html', '');
  const home = page.path === 'index.html';
  const fromMind = location.url.searchParams.get('from') === 'mind';

  return (
    <div class="page-shell" onKeyDown$={(event) => { if (event.key === 'Escape') settingsOpen.value = false; }}>
      {page.hasSiteHeader && <SiteHeader active={active} settingsOpen={settingsOpen} />}
      {page.hasArticleNav && <ArticleNav pagePath={page.path} fromMind={fromMind} settingsOpen={settingsOpen} />}
      {page.styles.map((style, index) => <style key={`page-style-${index}`} dangerouslySetInnerHTML={style} />)}
      <div
        class="page-content"
        ref={pageRoot}
        dangerouslySetInnerHTML={page.body}
        preventdefault:submit
        onInput$={(event) => {
          const target = event.target as HTMLInputElement;
          const root = pageRoot.value;
          if (target.id === 'posts-search') {
            postQuery.value = target.value.trim().toLowerCase();
            updatePostCards(root, postQuery.value, postCategory.value);
          }
          if (!root) return;
          if (target.id === 'mc-body') {
            target.classList.toggle('empty', target.innerText.trim() === '');
            target.classList.remove('mc-body-error');
            const status = root.querySelector<HTMLElement>('#mc-status');
            if (status?.classList.contains('mc-status-error')) {
              status.classList.remove('mc-status-error');
              status.textContent = '';
            }
          } else if (target.id === 'mc-name' || target.id === 'mc-email') {
            root.querySelector('#mc-from-row')?.classList.remove('mc-row-error');
            const status = root.querySelector<HTMLElement>('#mc-status');
            if (status?.classList.contains('mc-status-error')) { status.classList.remove('mc-status-error'); status.textContent = ''; }
          } else if (target.id === 'mc-subject') {
            root.querySelector('#mc-subject-row')?.classList.remove('mc-row-error');
            const status = root.querySelector<HTMLElement>('#mc-status');
            if (status?.classList.contains('mc-status-error')) { status.classList.remove('mc-status-error'); status.textContent = ''; }
          }
        }}
        onMouseDown$={(event) => {
          if ((event.target as HTMLElement).closest('.mc-tool')) event.preventDefault();
        }}
        onClick$={async (event) => {
          const root = pageRoot.value;
          const target = event.target as HTMLElement;
          if (!root || !target) return;

          const anchor = target.closest<HTMLAnchorElement>('a[href]');
          if (
            anchor &&
            !event.defaultPrevented &&
            event.button === 0 &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !anchor.hasAttribute('download') &&
            (!anchor.target || anchor.target === '_self')
          ) {
            const destination = new URL(anchor.href, location.url);
            const nextPage = getClientPageHref(destination.href, location.url);
            if (
              nextPage &&
              (destination.pathname !== location.url.pathname || destination.search !== location.url.search)
            ) {
              event.preventDefault();
              await navigate(nextPage);
              return;
            }
          }

          const filter = target.closest<HTMLButtonElement>('.filter-btn');
          if (filter) {
            postCategory.value = filter.dataset.filter || 'all';
            for (const button of root.querySelectorAll('.filter-btn')) button.classList.toggle('active', button === filter);
            updatePostCards(root, postQuery.value, postCategory.value);
          }

          const workTab = target.closest<HTMLButtonElement>('.work-tab');
          if (workTab?.dataset.tab) activateWorkTab(root, workTab.dataset.tab);

          const researchCard = target.closest<HTMLElement>('.research-card');
          if (researchCard && !target.closest('a')) {
            const destination = researchCard.dataset.href;
            if (destination) {
              const nextPage = getClientPageHref(destination, location.url);
              if (nextPage) await navigate(nextPage);
              else window.location.href = new URL(destination, window.location.href).href;
            }
          }

          const editorTool = target.closest<HTMLButtonElement>('.mc-tool');
          if (editorTool) {
            const editor = root.querySelector<HTMLElement>('#mc-body');
            const command = editorTool.dataset.cmd || '';
            const allowed = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'removeFormat'];
            if (editor && allowed.includes(command)) {
              editor.focus();
              document.execCommand(command, false);
              editor.classList.toggle('empty', editor.innerText.trim() === '');
              if (['bold', 'italic', 'underline'].includes(command)) {
                try { editorTool.classList.toggle('active', document.queryCommandState(command)); } catch { /* Browser command state varies. */ }
              }
            }
          }

          if (target.closest('#talk-btn')) setDialog('about-modal', true);
          if (target.closest('#about-modal-close')) setDialog('about-modal', false);
          if (target.closest('#about-modal') && target.id === 'about-modal') setDialog('about-modal', false);
          if (target.closest('#direct-mail-btn')) {
            const email = 'hello@xensenx.dev';
            const address = root.querySelector('#direct-mail-address');
            const link = root.querySelector<HTMLAnchorElement>('#direct-mail-open');
            const status = root.querySelector('#direct-mail-status');
            if (address) address.textContent = email;
            if (link) link.href = `mailto:${email}`;
            if (status) status.textContent = '';
            setDialog('direct-mail-modal', true);
          }
          if (target.closest('#direct-mail-close')) setDialog('direct-mail-modal', false);
          if (target.closest('#direct-mail-modal') && target.id === 'direct-mail-modal') setDialog('direct-mail-modal', false);
          if (target.closest('#direct-mail-copy')) {
            try {
              await navigator.clipboard.writeText('hello@xensenx.dev');
              const status = root.querySelector('#direct-mail-status');
              if (status) status.textContent = 'Copied to clipboard.';
            } catch {
              const status = root.querySelector('#direct-mail-status');
              const field = document.createElement('textarea');
              field.value = 'hello@xensenx.dev';
              field.setAttribute('readonly', '');
              field.style.position = 'fixed';
              field.style.opacity = '0';
              document.body.appendChild(field);
              field.select();
              const copied = document.execCommand('copy');
              field.remove();
              if (status) status.textContent = copied ? 'Email copied.' : 'Copy failed. Select the email manually.';
            }
          }
          if (target.closest('#vil-copy-btn')) {
            const button = root.querySelector<HTMLButtonElement>('#vil-copy-btn');
            const license = root.querySelector('#vil-license-text')?.textContent || '';
            try {
              await navigator.clipboard.writeText(license);
              if (button) {
                button.textContent = 'Copied';
                button.classList.add('copied');
                window.setTimeout(() => {
                  button.textContent = 'Copy';
                  button.classList.remove('copied');
                }, 2000);
              }
            } catch {
              if (button) button.textContent = 'Copy unavailable';
            }
          }

          if (target.closest('#mc-reset-btn')) {
            const form = root.querySelector<HTMLFormElement>('#contact-form');
            const successCard = root.querySelector<HTMLElement>('#mc-success-card');
            const nameInput = root.querySelector<HTMLInputElement>('#mc-name');
            const emailInput = root.querySelector<HTMLInputElement>('#mc-email');
            const subjectInput = root.querySelector<HTMLInputElement>('#mc-subject');
            const editor = root.querySelector<HTMLElement>('#mc-body');
            const status = root.querySelector<HTMLElement>('#mc-status');
            if (form && successCard) {
              successCard.classList.remove('is-visible');
              window.setTimeout(() => {
                successCard.style.display = 'none';
                successCard.setAttribute('aria-hidden', 'true');
                form.hidden = false;
                form.reset();
                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (subjectInput) subjectInput.value = '';
                if (editor) { editor.innerHTML = ''; editor.classList.add('empty'); }
                root.querySelector('#mc-from-row')?.classList.remove('mc-row-error');
                root.querySelector('#mc-subject-row')?.classList.remove('mc-row-error');
                editor?.classList.remove('mc-body-error');
                status?.classList.remove('mc-status-error');
                if (status) status.textContent = '';
                form.classList.remove('is-hidden');
                nameInput?.focus();
              }, 300);
            }
          }
        }}
        onKeyDown$={(event) => {
          const researchCard = (event.target as HTMLElement).closest<HTMLElement>('.research-card');
          if (researchCard && (event.key === 'Enter' || event.key === ' ')) {
            const destination = researchCard.dataset.href;
            if (destination) {
              event.preventDefault();
              const nextPage = getClientPageHref(destination, location.url);
              if (nextPage) void navigate(nextPage);
              else window.location.href = new URL(destination, window.location.href).href;
            }
          }
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            const form = (event.target as HTMLElement).closest<HTMLFormElement>('#contact-form');
            if (form) {
              event.preventDefault();
              form.requestSubmit();
            }
          }
          if (event.key === 'Escape') {
            setDialog('about-modal', false);
            setDialog('direct-mail-modal', false);
          }
        }}
        onSubmit$={async (event) => {
          const form = event.target as HTMLFormElement;
          if (form.id !== 'contact-form') return;
          event.preventDefault();

          const root = pageRoot.value;
          const nameInput = root?.querySelector<HTMLInputElement>('#mc-name');
          const emailInput = root?.querySelector<HTMLInputElement>('#mc-email');
          const subjectInput = root?.querySelector<HTMLInputElement>('#mc-subject');
          const messageEditor = root?.querySelector<HTMLElement>('#mc-body');
          const status = root?.querySelector<HTMLElement>('#mc-status');
          const sendButton = root?.querySelector<HTMLButtonElement>('#mc-send-btn');
          const sendButtonText = sendButton?.querySelector<HTMLElement>('.mc-send-text');
          const fromRow = root?.querySelector('#mc-from-row');
          const subjectRow = root?.querySelector('#mc-subject-row');
          const honeypot = root?.querySelector<HTMLInputElement>('#mc-website');
          const successCard = root?.querySelector<HTMLElement>('#mc-success-card');
          if (!root || !nameInput || !emailInput || !subjectInput || !messageEditor || !status || !sendButton || !sendButtonText || !fromRow || !subjectRow || !successCard) return;
          if (form.dataset.submitting === 'true') return;

          fromRow.classList.remove('mc-row-error');
          subjectRow.classList.remove('mc-row-error');
          messageEditor.classList.remove('mc-body-error');
          status.classList.remove('mc-status-error');
          const name = nameInput.value.trim();
          const email = emailInput.value.trim();
          const subject = subjectInput.value.trim();
          const messageText = messageEditor.innerText.replace(/\u00a0/g, ' ').trim();

          if (!name) {
            fromRow.classList.add('mc-row-error');
            nameInput.focus();
            status.textContent = 'Please enter your name.';
            status.classList.add('mc-status-error');
            return;
          }
          if (!email || !emailInput.checkValidity()) {
            fromRow.classList.add('mc-row-error');
            emailInput.focus();
            status.textContent = 'Please enter a valid email address.';
            status.classList.add('mc-status-error');
            return;
          }
          if (!subject) {
            subjectRow.classList.add('mc-row-error');
            subjectInput.focus();
            status.textContent = 'Please add a subject.';
            status.classList.add('mc-status-error');
            return;
          }
          if (!messageText) {
            messageEditor.classList.add('mc-body-error');
            messageEditor.focus();
            status.textContent = 'Please write a message before sending.';
            status.classList.add('mc-status-error');
            return;
          }
          if (honeypot?.value.trim()) {
            status.textContent = 'Your message could not be submitted.';
            status.classList.add('mc-status-error');
            return;
          }
          if (!['xensenx.dev', 'www.xensenx.dev'].includes(window.location.hostname)) {
            status.textContent = 'This contact form is configured for xensenx.dev. Please test the deployed site or email hello@xensenx.dev directly.';
            status.classList.add('mc-status-error');
            return;
          }

          const accessKey = form.querySelector<HTMLInputElement>('[name="access_key"]')?.value || '';
          const payload = {
            access_key: accessKey,
            subject: `${subject} — [sent from xensenx.dev]`,
            from_name: name,
            name,
            email,
            replyto: email,
            message: `${messageText}\n\n— sent from xensenx.dev`,
            botcheck: '',
          };

          form.dataset.submitting = 'true';
          sendButton.disabled = true;
          sendButtonText.textContent = 'Sending…';
          form.setAttribute('aria-busy', 'true');
          status.textContent = 'Submitting your message…';
          try {
            const response = await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(payload),
            });
            const result = await response.json() as { success?: boolean; message?: unknown };
            if (!response.ok || result.success !== true) {
              const message = typeof result.message === 'string' ? result.message : `Submission failed (HTTP ${response.status}).`;
              throw new Error(message);
            }

            form.dataset.submitting = 'false';
            sendButton.disabled = false;
            sendButtonText.textContent = 'Send message';
            form.setAttribute('aria-busy', 'false');
            form.classList.add('is-hidden');
            window.setTimeout(() => {
              form.hidden = true;
              successCard.style.display = 'block';
              successCard.setAttribute('aria-hidden', 'false');
              requestAnimationFrame(() => {
                successCard.classList.add('is-visible');
                successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              });
              successCard.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
            }, 300);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
            form.dataset.submitting = 'false';
            sendButton.disabled = false;
            sendButtonText.textContent = 'Send message';
            form.setAttribute('aria-busy', 'false');
            status.textContent = `We couldn't confirm the submission: ${message} If the issue persists, email hello@xensenx.dev directly.`;
            status.classList.add('mc-status-error');
          }
        }}
      />
      <SiteFooter />
      <SettingsModal open={settingsOpen} />
      <PageEffects home={home} contact={page.path === 'contact.html'} readingMode={page.readingMode} />
    </div>
  );
});
