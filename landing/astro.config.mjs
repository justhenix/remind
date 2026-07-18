import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, sitemap, and search.
  site: 'https://remindy.henix.my.id',
  integrations: [
    starlight({
      title: 'remindy',
      description:
        'The portable taste & standards layer for AI coding agents. Docs: install, use, and configure.',
      // Docs live under /docs/* (content is nested in src/content/docs/docs/),
      // so the custom marketing homepage keeps ownership of /.
      // No image logo: the site title renders as a typographic wordmark
      // (Stack Sans Notch, styled in docs.css) instead of an icon/PNG.
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/justhenix/remindy' },
      ],
      editLink: {
        baseUrl: 'https://github.com/justhenix/remindy/edit/main/landing/',
      },
      customCss: ['./src/styles/docs.css'],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', slug: 'docs' },
            { label: 'Quickstart', slug: 'docs/quickstart' },
            { label: 'Install & setup', slug: 'docs/install' },
          ],
        },
        {
          label: 'Guide',
          items: [
            { label: 'How it works', slug: 'docs/how-it-works' },
            { label: 'MCP tools', slug: 'docs/mcp-tools' },
            { label: 'Repo inference', slug: 'docs/repo-inference' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'BYOK: bring your own key', slug: 'docs/byok' },
            { label: 'Dashboard', slug: 'docs/dashboard' },
            { label: 'CLI reference', slug: 'docs/cli' },
          ],
        },
        {
          label: 'Help',
          items: [{ label: 'Troubleshooting', slug: 'docs/troubleshooting' }],
        },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
