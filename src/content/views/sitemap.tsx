import { component$ } from '@builder.io/qwik';

export const SitemapContent = component$(() => (
  <>
    <main class="privacy-page">
      <h1>Sitemap</h1>
      <p class="privacy-updated">every page on xensenx.dev</p>
      <h2>Main</h2>
      <ul>
        <li><a href="/">mind</a> — the landing page. where things begin.</li>
        <li><a href="/about-me/">about me</a> — a brief introduction to who Sen is.</li>
        <li><a href="/about-site/">about site</a> — information about this website.</li>
        <li><a href="/work/">work</a> — flagship projects and what they do.</li>
        <li><a href="/posts/">posts</a> — all writing, searchable and filterable.</li>
        <li><a href="/contact/">contact</a> — how to reach Sen.</li>
      </ul>
      <h2>Posts</h2>
      <ul>
        <li><a href="/posts/visual-identity-license-v1/">Visual Identity License v1</a> — a license for brand identity in open-source projects.</li>
        <li><a href="/posts/one-of-my-poems/">One of my poems</a> — The Source of Me. A poem about time and boredom.</li>
        <li><a href="/posts/everyday-another-chance/">Everyday Another Chance</a> — an essay on difficulty, escapism, and trying again.</li>
        <li><a href="/posts/literature-is-not-data/">Literature is not just Data!</a> — an essay on human narrative and abstraction.</li>
      </ul>
      <h2>Legal</h2>
      <ul>
        <li><a href="/privacy/">Privacy Policy</a> — site privacy policy and data practices.</li>
        <li><a href="/sitemap/">Sitemap</a> — you are here.</li>
      </ul>
    </main>
  </>
));
