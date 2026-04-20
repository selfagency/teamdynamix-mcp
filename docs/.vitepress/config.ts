import { defineConfig } from 'vitepress';

const SITE_URL = 'https://example.com/mcp-server-template';

export default defineConfig({
  title: 'mcp-server-template',
  description: 'A production-grade TypeScript template for building MCP servers',
  lang: 'en-US',
  base: '/',

  sitemap: {
    hostname: SITE_URL,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'mcp-server-template' }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'A production-grade TypeScript template for building MCP servers',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Tools', link: '/tools/' },
      { text: 'Developer', link: '/development/architecture' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/selfagency/mcp-server-template/releases' },
          { text: 'Contributing', link: '/development/contributing' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'MCP Resources', link: '/guide/resources' },
            { text: 'Safety & Permissions', link: '/guide/safety' },
          ],
        },
      ],
      '/tools/': [
        {
          text: 'Tool Reference',
          items: [
            { text: 'Overview', link: '/tools/' },
            { text: 'Utility Tools', link: '/tools/utility' },
          ],
        },
      ],
      '/development/': [
        {
          text: 'Development',
          items: [
            { text: 'Architecture', link: '/development/architecture' },
            { text: 'Contributing', link: '/development/contributing' },
            { text: 'Testing', link: '/development/testing' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/selfagency/mcp-server-template' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Daniel Sieradski',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/selfagency/mcp-server-template/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
