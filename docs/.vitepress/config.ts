import { defineConfig } from 'vitepress';

const SITE_URL = 'https://github.com/selfagency/teamdynamix-mcp';

export default defineConfig({
  title: 'teamdynamix-mcp',
  description: 'A TeamDynamix ITSM Model Context Protocol server with safety-gated write operations',
  lang: 'en-US',
  base: '/',

  sitemap: {
    hostname: SITE_URL,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'teamdynamix-mcp' }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'A TeamDynamix ITSM Model Context Protocol server with safety-gated write operations',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'How-to', link: '/how-to/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Explanation', link: '/explanation/' },
      { text: 'Developer', link: '/development/architecture' },
      {
        text: 'Repository',
        items: [
          { text: 'GitHub', link: 'https://github.com/selfagency/teamdynamix-mcp' },
          { text: 'Changelog', link: 'https://github.com/selfagency/teamdynamix-mcp/releases' },
          { text: 'Contributing', link: '/development/contributing' },
        ],
      },
    ],

    sidebar: {
      '/tutorials/': [
        {
          text: 'Tutorials',
          items: [
            { text: 'Overview', link: '/tutorials/' },
            { text: 'Getting Started', link: '/tutorials/getting-started' },
            { text: 'First Ticket Workflow', link: '/tutorials/first-ticket-workflow' },
            { text: 'First KB Workflow', link: '/tutorials/first-kb-workflow' },
          ],
        },
      ],
      '/how-to/': [
        {
          text: 'How-to Guides',
          items: [
            { text: 'Overview', link: '/how-to/' },
            { text: 'Create and Update Tickets', link: '/how-to/tickets' },
            { text: 'Ticket Tasks, Contacts, Assets', link: '/how-to/ticket-relationships' },
            { text: 'KB Authoring', link: '/how-to/knowledge-base' },
            { text: 'Search Assets, CIs, Services, Projects', link: '/how-to/discovery-and-search' },
            { text: 'Troubleshooting Errors', link: '/how-to/troubleshooting' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Tool Catalog', link: '/reference/tools' },
            { text: 'Safety', link: '/reference/safety' },
            { text: 'Resources', link: '/reference/resources' },
            { text: 'Errors', link: '/reference/errors' },
            { text: 'Skill and Agent Definitions', link: '/reference/skill-and-agent-definitions' },
          ],
        },
      ],
      '/explanation/': [
        {
          text: 'Explanation',
          items: [
            { text: 'Overview', link: '/explanation/' },
            { text: 'Architecture', link: '/explanation/architecture' },
            { text: 'Auth and Safety Model', link: '/explanation/auth-and-safety' },
            { text: 'Domain and Data Model', link: '/explanation/domain-model' },
            { text: 'Rate Limiting and Retries', link: '/explanation/rate-limits-and-retries' },
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

    socialLinks: [{ icon: 'github', link: 'https://github.com/selfagency/teamdynamix-mcp' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Daniel Sieradski',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/selfagency/teamdynamix-mcp/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
