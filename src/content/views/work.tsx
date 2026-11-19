import { component$ } from '@builder.io/qwik';

export const WorkContent = component$(() => (
  <>
    <main class="work-page">
      <h1 class="work-page-title">Work</h1>
      <div class="work-tabs" role="tablist" aria-label="Work categories">
        <button id="tab-btn-projects" class="work-tab active" data-tab="projects" role="tab" aria-selected="true" aria-controls="tab-projects">Projects</button>
        <button id="tab-btn-research" class="work-tab" data-tab="research" role="tab" aria-selected="false" aria-controls="tab-research">Research</button>
        <button id="tab-btn-future" class="work-tab" data-tab="future" role="tab" aria-selected="false" aria-controls="tab-future">Future Planned</button>
        <span class="work-tab-indicator" aria-hidden="true"></span>
      </div>
      <div id="tab-projects" class="work-tab-panel" role="tabpanel" aria-labelledby="tab-btn-projects">
        <section class="work-section">
          <h2 class="work-section-label">Notable Projects</h2>
          <div class="projects-list">
            <article class="project-card">
              <div class="project-main">
                <div class="project-top">
                  <span class="project-name">Secure Smart Sync</span>
                  <span class="project-tag active">Current Flagship</span>
                  <span class="project-tag">MIT</span>
                </div>
                <p class="project-desc">
              An Obsidian plugin for seamless multi-device note synchronisation using your own Cloudflare R2 credentials — no third-party servers, no subscriptions. A mature distributed system with graceful merge conflict resolution and thorough edge-case handling. Ships with its own ecosystem: a dedicated website, a token calculator, and relay software for secure credential transfer.
            </p>
                <div class="project-links">
                  <a href="https://github.com/Secure-Smart-Sync/Secure-Smart-Sync" class="project-link" target="_blank" rel="noopener">GitHub →</a>
                </div>
              </div>
            </article>
            <article class="project-card">
              <div class="project-main">
                <div class="project-top">
                  <span class="project-name">Project Quagmire</span>
                  <span class="project-tag">Research</span>
                </div>
                <p class="project-desc">
              A comprehensive literary undertaking — source volume normalisation, standardisation, and deep textual analysis of the Light Novel series <em>Mushoku Tensei: Jobless Reincarnation</em>. A serious, methodical endeavour with detailed findings documented on its own dedicated site.
            </p>
                <div class="project-links">
                  <a href="https://xensenx.github.io/Project_Quagmire/" class="project-link" target="_blank" rel="noopener">Site →</a>
                  <a href="https://github.com/xensenx/Project_Quagmire" class="project-link" target="_blank" rel="noopener">GitHub →</a>
                </div>
              </div>
            </article>
            <article class="project-card">
              <div class="project-main">
                <div class="project-top">
                  <span class="project-name">Gob-Goblet</span>
                  <span class="project-tag">Web Tool</span>
                </div>
                <p class="project-desc">
              A web-based file encryption tool that derives keys server-side and wraps your file in a proprietary <code>.gob</code> container secured by a password. The system natively recognises its own containers regardless of origin — a practical, self-contained tool for quick, secure encryption and backup.
            </p>
                <div class="project-links">
                  <a href="https://gob-goblet.pages.dev/" class="project-link" target="_blank" rel="noopener">Live Tool →</a>
                  <a href="https://github.com/Gob-Goblet" class="project-link" target="_blank" rel="noopener">GitHub →</a>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
      <div id="tab-research" class="work-tab-panel hidden" role="tabpanel" aria-labelledby="tab-btn-research">
        <section class="work-section">
          <h2 class="work-section-label">Research</h2>
          <div class="projects-list">
            <article class="project-card research-card" data-href="/research/vectorquo/" tabIndex={0} role="link" aria-label="Read VectorQuo research note">
              <div class="project-main">
                <div class="project-top">
                  <span class="project-name">VectorQuo</span>
                  <span class="project-tag">Research</span>
                </div>
                <p class="project-desc">
                A focused research initiative into accurate, efficient, and broadly applicable raster-to-vector conversion — from simple logos to complex illustrations, posters, and realistic imagery.
              </p>
                <div class="project-links">
                  <a href="/research/vectorquo/" class="project-link">Read Note →</a>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
      <div id="tab-future" class="work-tab-panel hidden" role="tabpanel" aria-labelledby="tab-btn-future">
        <section class="work-section">
          <h2 class="work-section-label">Future Planned</h2>
          <div class="projects-list">
            <article class="future-card">
              <p class="future-name">OxReader</p>
              <p class="future-desc">An Android tablet-first eBook and comic book reader with folder-based library management and an optional built-in vault system for protected content.</p>
            </article>
            <article class="future-card">
              <p class="future-name">DDR — Digital Document Reconstruction</p>
              <p class="future-desc">A long-term research initiative into effective methods for digitising not just text via OCR, but symbols, objects, and complex document structures — working toward comprehensive reconstruction from any physical source.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  </>
));
