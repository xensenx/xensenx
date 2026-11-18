# xensenx.dev

This site uses Qwik City for its routes and shared interface. Pages use clean trailing-slash URLs for client-side navigation; legacy `.html` URLs permanently redirect to their matching clean routes. The original page documents live under `src/content/pages/` and are rendered inside Qwik pages.

## Development

Install dependencies with `npm install`, then start the Vite dev server with `npm run dev`.

`npm run build` creates the client bundle and runs Qwik City's static site adapter. The adapter writes the deployable site to `dist/` for `https://xensenx.dev`.

The stylesheet is imported by the Qwik root. Images, fonts, dictionary data, and audio files are served from `public/assets/`. The small scripts under `public/legacy/js/` are retained for canvas and contact animation effects and the dictionary popup; navigation, settings, page routing, post search, work tabs, contact dialogs, and form submission are handled by Qwik components.
