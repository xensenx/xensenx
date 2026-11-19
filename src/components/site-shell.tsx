import { component$, $, useSignal, useVisibleTask$, type Signal } from '@builder.io/qwik';
import { Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { getSitePage } from '../content/site-pages';

type DialogKind = 'about' | 'email' | undefined;
type DictionaryMeaning = { pos: string; def: string; ex?: string[] };
type DictionaryEntry = { m?: DictionaryMeaning[]; syn?: string[]; ant?: string[] };
type DictionaryResult = { word: string; entry: DictionaryEntry | null };

const EMAIL = 'hello@xensenx.dev';
const NAVIGATION_STACK_KEY = 'xsn_navigation_stack';
const WORK_TAB_KEY = 'xsn_work_tab';

type PreviousPage = { url: string; x: number; y: number };

function savePreviousPage(url: string, x: number, y: number) {
  try {
    const stored = sessionStorage.getItem(NAVIGATION_STACK_KEY);
    const stack = stored ? JSON.parse(stored) as PreviousPage[] : [];
    stack.push({ url, x, y });
    sessionStorage.setItem(NAVIGATION_STACK_KEY, JSON.stringify(stack.slice(-50)));
  } catch {
    // Browser history remains available when session storage is unavailable.
  }
}

function updatePostCards(root: HTMLElement, query: string, category: string) {
  let visible = 0;
  for (const card of root.querySelectorAll<HTMLElement>('#posts-grid .card')) {
    const matchesQuery = `${card.dataset.title || ''} ${card.dataset.desc || ''}`.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || card.dataset.category === category;
    const show = matchesQuery && matchesCategory;
    card.hidden = !show;
    if (show) visible += 1;
  }
  const emptyMessage = root.querySelector<HTMLElement>('#posts-empty');
  if (emptyMessage) emptyMessage.hidden = visible > 0;
}

function activateWorkTab(root: HTMLElement, tabId: string) {
  try { sessionStorage.setItem(WORK_TAB_KEY, tabId); } catch { /* Tab state is a convenience. */ }
  let selectedTab: HTMLButtonElement | undefined;
  for (const tab of root.querySelectorAll<HTMLButtonElement>('.work-tab')) {
    const active = tab.dataset.tab === tabId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    if (active) selectedTab = tab;
  }
  for (const panel of root.querySelectorAll<HTMLElement>('.work-tab-panel')) {
    const active = panel.id === `tab-${tabId}`;
    panel.hidden = !active;
    panel.classList.toggle('hidden', !active);
  }
  const tabList = root.querySelector<HTMLElement>('.work-tabs');
  if (selectedTab && tabList) {
    tabList.style.setProperty('--work-tab-left', `${selectedTab.offsetLeft - tabList.clientLeft}px`);
    tabList.style.setProperty('--work-tab-width', `${selectedTab.offsetWidth}px`);
  }
}

export const SiteHeader = component$((props: { active: string }) => (
  <header class="site-header">
    <div class="site-nav-wrap">
      <details class="site-brand-dropdown">
        <summary class="site-brand-trigger" aria-label="Open xensenx menu">
          <span>xensenx</span><span class="site-brand-caret" aria-hidden="true">▾</span>
        </summary>
        <nav class="site-brand-menu" aria-label="Site menu">
          <Link class="site-brand-menu-item" href="/about-site/">about site</Link>
          <Link class="site-brand-menu-item" href="/privacy/">privacy policy</Link>
          <Link class="site-brand-menu-item" href="/sitemap/">sitemap</Link>
        </nav>
      </details>
      <nav class="site-nav" aria-label="Main navigation">
        <Link href="/" aria-current={props.active === 'home' ? 'page' : undefined}>mind</Link>
        <Link href="/posts/" aria-current={props.active === 'posts' ? 'page' : undefined}>posts</Link>
        <Link href="/work/" aria-current={props.active === 'work' ? 'page' : undefined}>work</Link>
        <Link href="/contact/" aria-current={props.active === 'contact' ? 'page' : undefined}>contact</Link>
      </nav>
    </div>
  </header>
));

export const SiteFooter = component$(() => (
  <footer class="site-footer">
    <div class="footer-inner">
      <span>© {new Date().getFullYear()} Sen</span>
      <nav aria-label="Footer navigation">
        <Link href="/about-site/">About</Link>
        <Link href="/privacy/">Privacy</Link>
        <Link href="/sitemap/">Sitemap</Link>
        <a href="https://github.com/xensenx" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://ko-fi.com/xensenx" target="_blank" rel="noopener noreferrer">Ko-fi</a>
      </nav>
    </div>
  </footer>
));

const ContactDialog = component$((props: { kind: Signal<DialogKind>; copied: Signal<boolean> }) => {
  const close = $(() => {
    props.kind.value = undefined;
    props.copied.value = false;
  });
  const copyEmail = $(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      props.copied.value = true;
    } catch {
      props.copied.value = false;
    }
  });

  if (!props.kind.value) return null;
  const about = props.kind.value === 'about';
  return (
    <div class="dialog-backdrop is-open" role="presentation" onClick$={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section class="contact-dialog-panel contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
        <div class="dialog-heading">
          <div><p class="eyebrow">{about ? 'Say hello' : 'Direct contact'}</p><h2 id="contact-dialog-title">{about ? 'Let’s talk.' : 'Mail directly.'}</h2></div>
          <button class="icon-button" type="button" aria-label="Close" onClick$={close}>×</button>
        </div>
        <p>{about ? 'Have an idea, a question, or just want to connect? I’m happy to hear from you.' : EMAIL}</p>
        <div class="dialog-actions">
          <a class="button button-primary" href={`mailto:${EMAIL}`}>Open mail app <span aria-hidden="true">↗</span></a>
          <button class="button" type="button" onClick$={copyEmail}>{props.copied.value ? 'Copied' : 'Copy email'}</button>
        </div>
      </section>
    </div>
  );
});

export const PageView = component$((props: { path: string }) => {
  const page = getSitePage(props.path);
  const dialogKind = useSignal<DialogKind>();
  const emailCopied = useSignal(false);
  const pageRoot = useSignal<HTMLElement>();
  const postCategory = useSignal('all');
  const dictionary = useSignal<DictionaryResult>();
  const dictionaryOpen = useSignal(false);
  const dictionaryCache = useSignal<Record<string, Record<string, DictionaryEntry> | null>>({});
  const location = useLocation();
  const navigate = useNavigate();

  useVisibleTask$(({ cleanup }) => {
    const restoreWorkTab = () => {
      if (window.location.pathname.replace(/\/+$/, '') !== '/work') return;
      const root = document.querySelector<HTMLElement>('.page-content');
      if (!root?.querySelector('.work-tab')) return;
      let tabId = root.querySelector<HTMLButtonElement>('.work-tab.active')?.dataset.tab || 'projects';
      try {
        const savedTab = sessionStorage.getItem(WORK_TAB_KEY);
        if (savedTab && ['projects', 'research', 'future'].includes(savedTab)) tabId = savedTab;
      } catch {
        // Keep the currently active tab if session storage is unavailable.
      }
      activateWorkTab(root, tabId);
    };
    const restorePendingPage = () => {
      const root = document.documentElement;
      if (!root.classList.contains('xsn-scroll-restore')) return;
      try {
        const saved = sessionStorage.getItem('xsn_page_restore');
        if (!saved) return;
        const position = JSON.parse(saved) as { url?: string; x?: number; y?: number; token?: string };
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (position.url !== currentUrl || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
        sessionStorage.removeItem('xsn_page_restore');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.scrollTo(position.x!, position.y!);
          root.classList.remove('xsn-scroll-restore');
        }));
      } catch {
        try { sessionStorage.removeItem('xsn_page_restore'); } catch { /* Restore state is optional. */ }
        root.classList.remove('xsn-scroll-restore');
      }
    };
    const reconcilePageState = () => {
      restoreWorkTab();
      restorePendingPage();
    };
    const observer = new MutationObserver(reconcilePageState);
    const reconcileBackStack = () => {
      try {
        const stored = sessionStorage.getItem(NAVIGATION_STACK_KEY);
        const stack = stored ? JSON.parse(stored) as PreviousPage[] : [];
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (stack[stack.length - 1]?.url === currentUrl) {
          stack.pop();
          sessionStorage.setItem(NAVIGATION_STACK_KEY, JSON.stringify(stack));
        }
      } catch {
        // Keep native browser history working if session storage is unavailable.
      }
    };
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['q:route'],
    });
    window.addEventListener('popstate', reconcileBackStack);
    window.addEventListener('resize', restoreWorkTab, { passive: true });
    reconcilePageState();
    cleanup(() => {
      observer.disconnect();
      window.removeEventListener('popstate', reconcileBackStack);
      window.removeEventListener('resize', restoreWorkTab);
    });
  }, { strategy: 'document-ready' });

  const returnToPreviousPage = $(async () => {
    let previous: PreviousPage | undefined;
    try {
      const stored = sessionStorage.getItem(NAVIGATION_STACK_KEY);
      const stack = stored ? JSON.parse(stored) as PreviousPage[] : [];
      previous = stack.pop();
      sessionStorage.setItem(NAVIGATION_STACK_KEY, JSON.stringify(stack));
    } catch {
      previous = undefined;
    }
    if (!previous) {
      if (window.history.length > 1) window.history.back();
      return;
    }

    let shouldRestore = false;
    let restoreToken: string | undefined;
    try {
      const target = new URL(previous.url, location.url);
      restoreToken = `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem('xsn_page_restore', JSON.stringify({
        url: `${target.pathname}${target.search}`,
        x: previous.x,
        y: previous.y,
        token: restoreToken,
      }));
      document.documentElement.classList.add('xsn-scroll-restore');
      shouldRestore = true;
      window.setTimeout(() => {
        try {
          const pending = sessionStorage.getItem('xsn_page_restore');
          if (!pending || JSON.parse(pending).token !== restoreToken) return;
          sessionStorage.removeItem('xsn_page_restore');
        } catch {
          // A failed fallback restore should still reveal the page.
        }
        document.documentElement.classList.remove('xsn-scroll-restore');
      }, 2500);
    } catch {
      // Navigate to the previous page even if its scroll position cannot be saved.
    }
    // Replace the current subpage entry so browser Back does not send the user
    // right back to the page they just left.
    try {
      await navigate(previous.url, { replaceState: true, scroll: !shouldRestore });
    } catch {
      sessionStorage.removeItem('xsn_page_restore');
      document.documentElement.classList.remove('xsn-scroll-restore');
    }
  });

  const lookupSelection = $(async (event: Event) => {
    if ((event.target as HTMLElement).closest('.dict-panel')) return;
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    const selection = window.getSelection();
    const selected = selection?.toString().trim() || '';
    const withinPage = selection?.anchorNode?.parentElement && pageRoot.value?.contains(selection.anchorNode.parentElement);
    const word = selected.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!withinPage || /\s/.test(selected) || word.length < 2 || word.length > 40) {
      dictionaryOpen.value = false;
      return;
    }
    const letter = /^[a-z]/.test(word[0]) ? word[0] : '_other';
    let words = dictionaryCache.value[letter];
    if (words === undefined && !Object.prototype.hasOwnProperty.call(dictionaryCache.value, letter)) {
      try {
        const response = await fetch(`/assets/dict/${letter}.json`);
        words = response.ok ? await response.json() as Record<string, DictionaryEntry> : null;
        dictionaryCache.value = { ...dictionaryCache.value, [letter]: words };
      } catch {
        words = null;
        dictionaryCache.value = { ...dictionaryCache.value, [letter]: null };
      }
    }
    dictionary.value = { word, entry: words?.[word] || null };
    dictionaryOpen.value = true;
  });

  if (!page) {
    return (
      <div class="site-shell" onClick$={async (event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest<HTMLAnchorElement>('a[href]');
        if (!anchor || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
        const destination = new URL(anchor.href, location.url);
        const currentUrl = `${location.url.pathname}${location.url.search}${location.url.hash}`;
        const next = `${destination.pathname}${destination.search}${destination.hash}`;
        if (destination.origin !== location.url.origin || destination.pathname.includes('.') || next === currentUrl) return;
        event.preventDefault();
        savePreviousPage(currentUrl, window.scrollX, window.scrollY);
        await navigate(next);
      }}>
        <SiteHeader active="" />
        <button class="page-back-button" type="button" onClick$={returnToPreviousPage}>← back</button>
        <main class="page-not-found"><p class="eyebrow">404</p><h1>That page isn’t here.</h1><Link class="button button-primary" href="/">Return home</Link></main>
        <SiteFooter />
      </div>
    );
  }

  const PageContent = page.component;
  const active = page.route === '' ? 'home' : page.route.split('/')[0];
  const isArticle = page.route.startsWith('posts/') || page.route.startsWith('research/');
  const showBackButton = page.route !== '' && !['posts', 'work', 'contact'].includes(page.route);

  return (
    <div
      class="site-shell"
      onClick$={async (event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest<HTMLAnchorElement>('a[href]');
        if (anchor && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !anchor.hasAttribute('download') && (!anchor.target || anchor.target === '_self')) {
          const destination = new URL(anchor.href, location.url);
          const currentUrl = `${location.url.pathname}${location.url.search}${location.url.hash}`;
          const next = `${destination.pathname}${destination.search}${destination.hash}`;
          if (destination.origin === location.url.origin && !destination.pathname.includes('.') && next !== currentUrl && (destination.pathname !== location.url.pathname || destination.search !== location.url.search)) {
            event.preventDefault();
            savePreviousPage(currentUrl, window.scrollX, window.scrollY);
            await navigate(next);
            return;
          }
        }
        if (!target.closest('.dict-panel')) dictionaryOpen.value = false;
        const dropdown = target.closest<HTMLDetailsElement>('.site-brand-dropdown');
        if (dropdown) return;
        const menu = document.querySelector<HTMLDetailsElement>('.site-brand-dropdown');
        if (menu) menu.open = false;
      }}
      onKeyDown$={(event) => {
        if (event.key === 'Escape') {
          dialogKind.value = undefined;
          const menu = document.querySelector<HTMLDetailsElement>('.site-brand-dropdown');
          if (menu) menu.open = false;
          dictionaryOpen.value = false;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          const form = (event.target as HTMLElement).closest<HTMLFormElement>('#contact-form');
          if (form) { event.preventDefault(); form.requestSubmit(); }
        }
      }}
    >
      <SiteHeader active={active} />
      <div
        class="interaction-layer"
        onInput$={(event) => {
          const target = event.target as HTMLInputElement;
          const root = pageRoot.value;
          if (!root) return;
          if (target.id === 'posts-search') updatePostCards(root, target.value.trim().toLowerCase(), postCategory.value);
          if (target.id === 'mc-body') {
            target.classList.toggle('empty', target.innerText.trim() === '');
            target.classList.remove('mc-body-error');
          }
          if (target.id === 'mc-name' || target.id === 'mc-email') root.querySelector('#mc-from-row')?.classList.remove('mc-row-error');
          if (target.id === 'mc-subject') root.querySelector('#mc-subject-row')?.classList.remove('mc-row-error');
          const status = root.querySelector<HTMLElement>('#mc-status');
          if (status?.classList.contains('mc-status-error')) { status.classList.remove('mc-status-error'); status.textContent = ''; }
        }}
        onMouseDown$={(event) => { if ((event.target as HTMLElement).closest('.mc-tool')) event.preventDefault(); }}
        onMouseUp$={lookupSelection}
        onTouchEnd$={lookupSelection}
        onKeyDown$={async (event) => {
          const card = (event.target as HTMLElement).closest<HTMLElement>('.research-card');
          if (card && !(event.target as HTMLElement).closest('a, button') && (event.key === 'Enter' || event.key === ' ')) {
            const destination = card.dataset.href;
            if (destination) {
              event.preventDefault();
              const url = new URL(destination, location.url);
              savePreviousPage(`${location.url.pathname}${location.url.search}${location.url.hash}`, window.scrollX, window.scrollY);
              await navigate(`${url.pathname}${url.search}${url.hash}`);
            }
          }
        }}
        onClick$={async (event) => {
          const root = pageRoot.value;
          const target = event.target as HTMLElement;
          if (!root || !target) return;

          const filter = target.closest<HTMLButtonElement>('.filter-btn');
          if (filter) {
            postCategory.value = filter.dataset.filter || 'all';
            for (const button of root.querySelectorAll('.filter-btn')) button.classList.toggle('active', button === filter);
            const search = root.querySelector<HTMLInputElement>('#posts-search')?.value.trim().toLowerCase() || '';
            updatePostCards(root, search, postCategory.value);
          }

          const workTab = target.closest<HTMLButtonElement>('.work-tab');
          if (workTab?.dataset.tab) activateWorkTab(root, workTab.dataset.tab);

          const researchCard = target.closest<HTMLElement>('.research-card');
          if (researchCard && !target.closest('a') && researchCard.dataset.href) {
            const destination = new URL(researchCard.dataset.href, location.url);
            event.preventDefault();
            savePreviousPage(`${location.url.pathname}${location.url.search}${location.url.hash}`, window.scrollX, window.scrollY);
            await navigate(`${destination.pathname}${destination.search}${destination.hash}`);
          }

          const editorTool = target.closest<HTMLButtonElement>('.mc-tool');
          if (editorTool) {
            const editor = root.querySelector<HTMLElement>('#mc-body');
            const command = editorTool.dataset.cmd || '';
            if (editor && ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'removeFormat'].includes(command)) {
              editor.focus();
              document.execCommand(command, false);
              editor.classList.toggle('empty', editor.innerText.trim() === '');
            }
          }

          if (target.closest('#talk-btn')) dialogKind.value = 'about';
          if (target.closest('#direct-mail-btn')) dialogKind.value = 'email';
          if (target.closest('#dict-close')) dictionaryOpen.value = false;
          if (target.closest('#direct-mail-copy')) {
            try { await navigator.clipboard.writeText(EMAIL); emailCopied.value = true; }
            catch { emailCopied.value = false; }
          }
          if (target.closest('#about-modal-close') || target.closest('#direct-mail-close')) dialogKind.value = undefined;

          if (target.closest('#vil-copy-btn')) {
            const license = root.querySelector('#vil-license-text')?.textContent || '';
            const button = root.querySelector<HTMLButtonElement>('#vil-copy-btn');
            try {
              await navigator.clipboard.writeText(license);
              if (button) { button.textContent = 'Copied'; window.setTimeout(() => { if (button) button.textContent = 'Copy'; }, 1800); }
            } catch {
              if (button) button.textContent = 'Copy unavailable';
            }
          }

          if (target.closest('#mc-reset-btn')) {
            const form = root.querySelector<HTMLFormElement>('#contact-form');
            const success = root.querySelector<HTMLElement>('#mc-success-card');
            if (form && success) {
              form.reset();
              form.dataset.submitting = 'false';
              form.setAttribute('aria-busy', 'false');
              const send = root.querySelector<HTMLButtonElement>('#mc-send-btn');
              if (send) send.disabled = false;
              const sendText = send?.querySelector<HTMLElement>('.mc-send-text');
              if (sendText) sendText.textContent = 'Send message';
              form.hidden = false;
              form.classList.remove('is-hidden');
              success.hidden = true;
              success.setAttribute('aria-hidden', 'true');
              success.classList.remove('is-visible');
              const editor = root.querySelector<HTMLElement>('#mc-body');
              editor?.replaceChildren();
              editor?.classList.add('empty');
              editor?.classList.remove('mc-body-error');
              root.querySelector<HTMLElement>('#mc-from-row')?.classList.remove('mc-row-error');
              root.querySelector<HTMLElement>('#mc-subject-row')?.classList.remove('mc-row-error');
              const status = root.querySelector<HTMLElement>('#mc-status');
              if (status) { status.textContent = ''; status.classList.remove('mc-status-error'); }
              root.querySelector<HTMLInputElement>('#mc-name')?.focus();
            }
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
          const editor = root?.querySelector<HTMLElement>('#mc-body');
          const status = root?.querySelector<HTMLElement>('#mc-status');
          const send = root?.querySelector<HTMLButtonElement>('#mc-send-btn');
          const sendText = send?.querySelector<HTMLElement>('.mc-send-text');
          const success = root?.querySelector<HTMLElement>('#mc-success-card');
          const fromRow = root?.querySelector<HTMLElement>('#mc-from-row');
          const subjectRow = root?.querySelector<HTMLElement>('#mc-subject-row');
          if (!nameInput || !emailInput || !subjectInput || !editor || !status || !send || !sendText || !success || !fromRow || !subjectRow) return;
          if (form.dataset.submitting === 'true') return;

          fromRow.classList.remove('mc-row-error');
          subjectRow.classList.remove('mc-row-error');
          editor.classList.remove('mc-body-error');
          status.classList.remove('mc-status-error');
          const name = nameInput.value.trim();
          const email = emailInput.value.trim();
          const subject = subjectInput.value.trim();
          const message = editor.innerText.replace(/\u00a0/g, ' ').trim();
          const fail = (messageText: string, focus?: HTMLElement) => {
            status.textContent = messageText;
            status.classList.add('mc-status-error');
            focus?.focus();
          };
          if (!name) { fromRow.classList.add('mc-row-error'); fail('Please enter your name.', nameInput); return; }
          if (!email || !emailInput.checkValidity()) { fromRow.classList.add('mc-row-error'); fail('Please enter a valid email address.', emailInput); return; }
          if (!subject) { subjectRow.classList.add('mc-row-error'); fail('Please add a subject.', subjectInput); return; }
          if (!message) { editor.classList.add('mc-body-error'); fail('Please write a message before sending.', editor); return; }
          if (root?.querySelector<HTMLInputElement>('#mc-website')?.value.trim()) { fail('Your message could not be submitted.'); return; }
          if (!['xensenx.dev', 'www.xensenx.dev'].includes(window.location.hostname)) {
            fail('The contact form is available on xensenx.dev. You can email hello@xensenx.dev directly.');
            return;
          }

          const accessKey = form.querySelector<HTMLInputElement>('[name="access_key"]')?.value || '';
          form.dataset.submitting = 'true';
          send.disabled = true;
          sendText.textContent = 'Sending…';
          form.setAttribute('aria-busy', 'true');
          status.textContent = 'Sending your message…';
          try {
            const response = await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ access_key: accessKey, subject: `${subject} — [sent from xensenx.dev]`, from_name: name, name, email, replyto: email, message: `${message}\n\n— sent from xensenx.dev`, botcheck: '' }),
            });
            const result = await response.json() as { success?: boolean; message?: unknown };
            if (!response.ok || result.success !== true) throw new Error(typeof result.message === 'string' ? result.message : `Submission failed (${response.status}).`);
            form.dataset.submitting = 'false';
            form.setAttribute('aria-busy', 'false');
            form.hidden = true;
            success.hidden = false;
            success.setAttribute('aria-hidden', 'false');
            success.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
          } catch (error) {
            form.dataset.submitting = 'false';
            form.setAttribute('aria-busy', 'false');
            send.disabled = false;
            sendText.textContent = 'Send message';
            fail(`We couldn’t confirm the submission. Please try again or email ${EMAIL}. ${error instanceof Error ? error.message : ''}`);
          }
        }}
      >
        <div class={isArticle ? 'page-content page-content-article' : 'page-content'} ref={pageRoot}>
          {showBackButton && <button class="page-back-button" type="button" onClick$={returnToPreviousPage}>← back</button>}
          <PageContent />
        </div>
        <SiteFooter />
        <ContactDialog kind={dialogKind} copied={emailCopied} />
        <aside
          class={dictionaryOpen.value ? 'dict-panel is-open' : 'dict-panel'}
          role="dialog"
          aria-hidden={!dictionaryOpen.value}
          aria-label={dictionary.value ? `Definition of ${dictionary.value.word}` : 'Word definition'}
        >
          {dictionary.value && (
            <>
              <div class="dict-heading"><span class="dict-word">{dictionary.value.word}</span><button id="dict-close" class="icon-button" type="button" tabIndex={dictionaryOpen.value ? 0 : -1} aria-label="Close definition">×</button></div>
              {dictionary.value.entry?.m?.length ? dictionary.value.entry.m.slice(0, 4).map((meaning, index) => (
                <div class="dict-def" key={`${meaning.pos}-${index}`}><span class="dict-pos">{meaning.pos}</span><p class="dict-deftext">{meaning.def}</p>{meaning.ex?.[0] && <p class="dict-ex">“{meaning.ex[0]}”</p>}</div>
              )) : <p class="dict-empty">No definition found.</p>}
              {dictionary.value.entry?.syn?.length ? <p class="dict-section"><span class="dict-label">Synonyms</span>{dictionary.value.entry.syn.join(', ')}</p> : null}
              {dictionary.value.entry?.ant?.length ? <p class="dict-section"><span class="dict-label">Antonyms</span>{dictionary.value.entry.ant.join(', ')}</p> : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
});
