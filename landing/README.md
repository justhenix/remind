# remindy landing + docs

Marketing landing page and documentation site for [remindy](https://github.com/justhenix/remindy), built with Astro and Starlight. Live at [remindy.henix.my.id](https://remindy.henix.my.id).

## Structure

- `src/pages/index.astro`: the marketing landing (full-viewport scroll-snap sections, anime.js reveals)
- `src/content/docs/docs/`: Starlight documentation, served at `/docs`
- `src/styles/`: `global.css` (landing) and `docs.css` (docs theme)
- `astro.config.mjs`: Starlight integration, sidebar, and site URL

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build the static site to `./dist/` |
| `npm run preview` | Preview the production build |

## Deploy

Auto-deploys to Vercel on push to `main` (see `.github/workflows/deploy-docs.yml`). Custom domain: `remindy.henix.my.id`.
