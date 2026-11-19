import { component$ } from '@builder.io/qwik';

export const AboutSiteContent = component$(() => (
  <>
    <main class="article-page about-page">
      <article class="article-content about-content">
        <div class="article-title-row">
          <h1 class="article-title">About the site</h1>
        </div>
        <div class="article-meta">A personal portfolio by Sen</div>
        <div class="article-divider"></div>
        <div class="article-body about-body">
          <p><strong>xensenx.dev</strong> was first published on 26 August 2026 as a personal portfolio by Sen, an independent online developer who goes by the username <strong>xensenx</strong> on GitHub.</p>
          <p>It is an independently built personal website that brings together writing, software projects, technical research, and evolving ideas within a cohesive digital environment. It functions simultaneously as a personal archive, a record of ongoing work, and an experimental space for building small tools and interactive experiences.</p>
          <p>The source code for this website is publicly available and licensed under the <strong>PolyForm Internal Use License</strong>. Please read the license terms before using the source code.</p>
          <p>For site navigation, refer to the <a href="/sitemap/" class="highlight-link">Sitemap</a>.</p>
        </div>
      </article>
    </main>
  </>
));
