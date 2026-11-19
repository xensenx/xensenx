# xensenx.dev

This site is built with Qwik and Qwik City. Routes, page content, shared UI, and interactions are written in TypeScript/TSX. Page components live in `src/content/views/`; route metadata and static paths are in `src/content/site-pages.ts`.

## Development

Install dependencies with `npm install`, then start the Vite dev server with `npm run dev`.

`npm run build` creates the client bundle and runs Qwik City's static site adapter. The deployable files are written to `dist/` for Cloudflare Pages. Clean routes use trailing slashes; legacy `.html` addresses redirect through `public/_redirects`.

The global stylesheet defines the dark `#0D1117` palette. Qwik handles navigation, post search and filters, work tabs, contact dialogs and submission, license copying, and on-demand word definitions. Images, fonts, dictionary chunks, and other static assets are served from `public/assets/`.
