import { component$ } from '@builder.io/qwik';

export const PostsOneOfMyPoemsContent = component$(() => (
  <>
    <main class="article-page">
      <article class="article-content">
        <div class="vil-banner">
          <img src="/assets/Blog_banners/source_of_me.jpeg" alt="The Source of Me" width="1280" height="1280" />
        </div>
        <h1 class="article-title">One of my poems</h1>
        <div class="article-meta">Sen · Poetry</div>
        <div class="article-divider"></div>
        <div class="article-body">
          <p class="poem-title-line">The Source of Me — Sen</p>
          <div class="poem-body">
            <p>As I’m being stolen away from the time I held precious,<br />
          from the things I also care about,</p>
            <p>I barely missed not realizing the value of time and boredom,<br />
          as wisdom couldn’t get any more out of reach.</p>
            <p>I, at any cost of time, had to get my hands on that<br />
          which could possibly get me the balance I craved.</p>
            <p>As much wealth couldn’t get any superior to abundant time,<br />
          the time which gives me the patience to stay alive,<br />
          and the time which will end when death arrives.</p>
          </div>
        </div>
      </article>
    </main>
  </>
));
