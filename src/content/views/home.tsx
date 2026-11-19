import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { initMindWaves } from '../../animations/mind-waves';

export const HomeContent = component$(() => {
  const artWrap = useSignal<HTMLElement>();
  const artCanvas = useSignal<HTMLCanvasElement>();

  useVisibleTask$(({ cleanup }) => {
    if (!artWrap.value || !artCanvas.value) return;
    cleanup(initMindWaves(artCanvas.value, artWrap.value));
  }, { strategy: 'intersection-observer' });

  return (
    <>
    <main id="main-page" class="">
      <div class="mind-art-wrap" ref={artWrap} aria-hidden="true">
        <canvas id="mind-art-canvas" ref={artCanvas}></canvas>
      </div>
      <div class="section-wrap">
        <section id="mind" class="sticky-section">
          <h1 class="mind-headline">
            <span class="word-enter">Enter</span>
            <span class="word-sens">Sen's</span>
            <span class="word-mind">Mind</span>
          </h1>
          <p class="mind-bio">
          I'm a 19-year-old student of Computer Science, a self-taught graphic
          designer, and a hobbyist writer. I like to build and create meaningful
          stuff that contributes to the mundane, everyday lives of people.
        </p>
          <a href="#about-section" class="scroll-cue" aria-label="Scroll to next section"><span class="scroll-cue-label">scroll</span><span class="scroll-cue-line"></span></a>
        </section>
      </div>
      <div class="section-wrap">
        <section id="about-section" class="sticky-section">
          <a class="about-card" href="/about-me/"><div class="about-card-img-wrap">
              <img src="/assets/icons/aboutme-icon.png" alt="About Me" />
            </div><div class="about-card-text">
              <h2 class="about-card-title">Learn more about me!</h2>
              <span class="about-card-arrow">→</span>
            </div></a>
        </section>
      </div>
      <div class="section-wrap">
        <section id="vlog" class="sticky-section">
          <div class="vlog-inner">
            <p class="vlog-label">Featured Posts</p>
            <div class="cards-grid">
              <a class="card" href="/posts/visual-identity-license-v1/"><div class="card-img-wrap">
                  <img src="/assets/Blog_banners/VIL_V1.jpeg" alt="Visual Identity License v1" width="1280" height="1280" loading="lazy" />
                </div><div class="card-body">
                  <h3 class="card-title">Visual Identity License v1</h3>
                  <p class="card-text">A license for protecting brand identity in open-source projects — keep your visual identity yours while your code stays free.</p>
                </div></a>
              <a class="card" href="/posts/literature-is-not-data/"><div class="card-img-wrap">
                  <img src="/assets/Blog_banners/Literature-is-not-data.jpg" alt="Literature is not just Data!" width="900" height="900" loading="lazy" />
                </div><div class="card-body">
                  <h3 class="card-title">Literature is not just Data!</h3>
                  <p class="card-text">An essay on human narrative, abstraction, and the fundamental role of literature beyond just being data.</p>
                </div></a>
              <a class="card" href="/posts/everyday-another-chance/"><div class="card-img-wrap">
                  <img src="/assets/Blog_banners/Everyday_another_chance.jpeg" alt="Everyday Another Chance" width="1250" height="1250" loading="lazy" />
                </div><div class="card-body">
                  <h3 class="card-title">Everyday Another Chance</h3>
                  <p class="card-text">A simple sentence. A core principle. On difficulty, hope, and what it means to try again.</p>
                </div></a>
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  );
});
