import { component$ } from '@builder.io/qwik';

export const PostsVisualIdentityLicenseV1Content = component$(() => (
  <>
    <main class="article-page">
      <article class="article-content">
        <div class="vil-banner">
          <img src="/assets/Blog_banners/VIL_V1.jpeg" alt="Visual Identity License v1" width="1280" height="1280" />
        </div>
        <h1 class="article-title">Visual Identity License v1</h1>
        <div class="article-meta">Sen · License</div>
        <div class="article-divider"></div>
        <div class="article-body">
          <p>Developed during the Secure Smart Sync project, the Visual Identity License (VIL) addresses a gap that standard open-source licenses don’t cover: protecting the brand and visual identity of a project while keeping its code freely available.</p>
          <p>Most open-source licenses like MIT or Apache are concerned with software. They say nothing about logos, icons, color palettes, or the visual system that gives a project its identity. This means anyone can fork your code, keep your branding intact, and redistribute it in a way that implies affiliation or endorsement — something VIL explicitly prevents.</p>
          <p>The license operates independently of whatever software license governs the codebase. If VIL-protected assets are bundled inside an MIT-licensed repository, the MIT license does not extend to those assets. Forks must strip and replace all protected visuals before public distribution.</p>
        </div>
        <div class="article-divider"></div>
        <div class="vil-license-block">
          <div class="vil-license-sheet">
            <div class="vil-license-header">
              <span class="vil-license-label">VIL Version 1.0 — License Text</span>
              <button class="vil-license-copy" id="vil-copy-btn" aria-label="Copy license text">Copy</button>
            </div>
            <div class="vil-license-document" id="vil-license-document">
              <div class="vil-document-title">
                <h2>Visual Identity License (VIL)</h2>
                <p>Version 1.0</p>
              </div>
              <p class="vil-copyright">Copyright © [Year] [Owner Name/Entity]</p>
              <section>
                <h3>1. Definitions</h3>
                <p>“Assets” shall mean all visual, branding, and design materials distributed under this License. This includes, but is not limited to, logos, logotypes, icons, color palettes, visual identity systems, marketing graphics, banners, illustrations, embedded scalable vector graphics (SVGs), and specific user interface (UI) design materials.</p>
              </section>
              <section>
                <h3>2. Grant of License (Permitted Use)</h3>
                <p>Subject to the terms and conditions of this License, the Owner hereby grants you a worldwide, non-exclusive, royalty-free license to reproduce and display the Assets solely for informational, educational, editorial, and community documentation purposes.</p>
                <p>Permitted uses include viewing, referencing, and linking to the Assets in the context of discussing, reviewing, teaching, documenting, or referencing the original project.</p>
              </section>
              <section>
                <h3>3. Restrictions</h3>
                <p>Except as expressly permitted in Section 2, you shall not:</p>
                <ul>
                  <li>Modify, alter, adapt, or create derivative works of the Assets for redistribution.</li>
                  <li>Redistribute or use the Assets as your own branding or visual identity.</li>
                  <li>Sell, sublicense, rent, lease, or otherwise commercialize the Assets.</li>
                  <li>Use the Assets in any manner that falsely implies official affiliation, endorsement, sponsorship, partnership, or ownership without prior explicit written consent from the Owner.</li>
                </ul>
              </section>
              <section>
                <h3>4. Interaction with Software Licenses (Forks and Derivative Projects)</h3>
                <p>This License governs a project’s visual identity independently from its underlying software codebase.</p>
                <p>If the Assets are bundled, distributed, embedded, or contained within software source code licensed under a separate open-source or source-available license (including MIT, Apache, GPL, or similar licenses), those software licenses do not apply to the Assets.</p>
                <p>Any forks, redistributions, or derivative software projects must remove and replace all protected Assets prior to public distribution, deployment, or commercial release unless prior written permission is granted by the Owner.</p>
              </section>
              <section>
                <h3>5. Reservation of Rights</h3>
                <p>All rights, title, and interest in and to the Assets, including all associated copyrights, trademarks, and other intellectual property rights, remain the sole and exclusive property of the Owner.</p>
                <p>This License does not grant trademark rights, implied licenses, ownership claims, or exclusive rights to any user.</p>
              </section>
              <section>
                <h3>6. Disclaimer of Warranty and Limitation of Liability</h3>
                <p class="vil-disclaimer">THE ASSETS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.</p>
                <p class="vil-disclaimer">IN NO EVENT SHALL THE OWNER OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF, OR IN CONNECTION WITH THE ASSETS OR THE USE OR OTHER DEALINGS IN THE ASSETS.</p>
              </section>
            </div>
            <pre class="vil-pre" id="vil-license-text" hidden={true}>Visual Identity License (VIL) Version 1.0

Copyright (c) [Year] [Owner Name/Entity]

1. Definitions

"Assets" shall mean all visual, branding, and design materials distributed
under this License. This includes, but is not limited to, logos, logotypes,
icons, color palettes, visual identity systems, marketing graphics, banners,
illustrations, embedded scalable vector graphics (SVGs), and specific user
interface (UI) design materials.

2. Grant of License (Permitted Use)

Subject to the terms and conditions of this License, the Owner hereby grants
you a worldwide, non-exclusive, royalty-free license to reproduce and display
the Assets solely for informational, educational, editorial, and community
documentation purposes.

Permitted uses include viewing, referencing, and linking to the Assets in the
context of discussing, reviewing, teaching, documenting, or referencing the
original project.

3. Restrictions

Except as expressly permitted in Section 2, you shall not:

Modify, alter, adapt, or create derivative works of the Assets for
redistribution.

Redistribute or use the Assets as your own branding or visual identity.

Sell, sublicense, rent, lease, or otherwise commercialize the Assets.

Use the Assets in any manner that falsely implies official affiliation,
endorsement, sponsorship, partnership, or ownership without prior explicit
written consent from the Owner.

4. Interaction with Software Licenses (Forks and Derivative Projects)

This License governs the visual identity of a project independently from its
underlying software codebase.

If the Assets are bundled, distributed, embedded, or contained within software
source code licensed under a separate open-source or source-available license
(including but not limited to MIT, Apache, GPL, or similar licenses), those
software licenses do not apply to the Assets.

Any forks, redistributions, or derivative software projects must remove and
replace all protected Assets prior to public distribution, deployment, or
commercial release unless prior written permission is granted by the Owner.

5. Reservation of Rights

All rights, title, and interest in and to the Assets, including all associated
copyrights, trademarks, and other intellectual property rights, remain the sole
and exclusive property of the Owner.

This License does not grant trademark rights, implied licenses, ownership
claims, or exclusive rights to any user.

6. Disclaimer of Warranty and Limitation of Liability

THE ASSETS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.

IN NO EVENT SHALL THE OWNER OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR
OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE ASSETS OR THE USE
OR OTHER DEALINGS IN THE ASSETS.</pre>
          </div>
        </div>
      </article>
    </main>
  </>
));
