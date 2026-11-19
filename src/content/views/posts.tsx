import { component$ } from '@builder.io/qwik';

export const PostsContent = component$(() => (
  <>
    <main class="posts-page">
      <h1 class="posts-page-title">Posts</h1>
      <div class="posts-controls">
        <input type="search" class="posts-search" id="posts-search" placeholder="Search..." aria-label="Search posts" />
        <div class="posts-filters" role="group" aria-label="Filter by category">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="license">License</button>
          <button class="filter-btn" data-filter="poem">Poem</button>
          <button class="filter-btn" data-filter="essay">Essay</button>
        </div>
      </div>
      <div class="posts-grid" id="posts-grid">
        <a class="card" href="/posts/visual-identity-license-v1/" data-category="license" data-title="Visual Identity License v1" data-desc="A license for protecting brand identity in open-source projects — keep your visual identity yours while your code stays free."><div class="card-img-wrap">
            <img src="/assets/Blog_banners/VIL_V1.jpeg" alt="Visual Identity License v1" width="1280" height="1280" />
          </div><div class="card-body">
            <span class="card-tag">License</span>
            <h3 class="card-title">Visual Identity License v1</h3>
            <p class="card-text">A license for protecting brand identity in open-source projects — keep your visual identity yours while your code stays free.</p>
          </div></a>
        <a class="card" href="/posts/one-of-my-poems/" data-category="poem" data-title="One of my poems" data-desc="The Source of Me — a poem about time, boredom, and the quiet cost of losing both."><div class="card-img-wrap">
            <img src="/assets/Blog_banners/source_of_me.jpeg" alt="One of my poems" width="1280" height="1280" loading="lazy" />
          </div><div class="card-body">
            <span class="card-tag">Poem</span>
            <h3 class="card-title">One of my poems</h3>
            <p class="card-text">The Source of Me — a poem about time, boredom, and the quiet cost of losing both.</p>
          </div></a>
        <a class="card" href="/posts/everyday-another-chance/" data-category="essay" data-title="Everyday Another Chance" data-desc="A simple sentence. A core principle. On difficulty, hope, and what it means to try again."><div class="card-img-wrap">
            <img src="/assets/Blog_banners/Everyday_another_chance.jpeg" alt="Everyday Another Chance" width="1250" height="1250" loading="lazy" />
          </div><div class="card-body">
            <span class="card-tag">Essay</span>
            <h3 class="card-title">Everyday Another Chance</h3>
            <p class="card-text">A simple sentence. A core principle. On difficulty, hope, and what it means to try again.</p>
          </div></a>
        <a class="card" href="/posts/literature-is-not-data/" data-category="essay" data-title="Literature is not just Data!" data-desc="An essay on human narrative, abstraction, and the fundamental role of literature beyond just being data."><div class="card-img-wrap">
            <img src="/assets/Blog_banners/Literature-is-not-data.jpg" alt="Literature is not just Data!" width="900" height="900" loading="lazy" />
          </div><div class="card-body">
            <span class="card-tag">Essay</span>
            <h3 class="card-title">Literature is not just Data!</h3>
            <p class="card-text">An essay on human narrative, abstraction, and the fundamental role of literature beyond just being data.</p>
          </div></a>
        <a class="card" href="/posts/the-legend-of-gob-goblet/" data-category="essay" data-title="The Legend of Gob Goblet" data-desc="The origin story of a strange digital creature that protects files, and the pact humanity made with it."><div class="card-img-wrap">
            <img src="/assets/Blog_banners/gob-icon.jpeg" alt="The Legend of Gob Goblet" width="1280" height="1280" loading="lazy" />
          </div><div class="card-body">
            <span class="card-tag">Essay</span>
            <h3 class="card-title">The Legend of Gob Goblet</h3>
            <p class="card-text">The origin story of a strange digital creature that protects files, and the pact humanity made with it.</p>
          </div></a>
      </div>
      <p class="posts-empty" id="posts-empty" hidden={true}>No posts match your search.</p>
    </main>
  </>
));
