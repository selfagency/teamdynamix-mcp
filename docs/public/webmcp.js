(() => {
  if (typeof navigator === 'undefined' || !('modelContext' in navigator)) {
    return;
  }

  const context = navigator.modelContext;
  const abortController = new AbortController();

  const siteTools = [
    {
      name: 'open_api_catalog',
      description: 'Return the API catalog URL for this site.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async () => ({ url: '/.well-known/api-catalog' }),
    },
    {
      name: 'open_mcp_server_card',
      description: 'Return the MCP server card URL for this site.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async () => ({ url: '/.well-known/mcp/server-card.json' }),
    },
    {
      name: 'search_docs',
      description: 'Build a documentation search URL for the TeamDynamix MCP docs site.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1 },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async input => {
        const query = typeof input?.query === 'string' ? input.query : '';
        return { url: `/?q=${encodeURIComponent(query)}` };
      },
    },
  ];

  for (const tool of siteTools) {
    try {
      context.registerTool(tool, { signal: abortController.signal });
    } catch {
      // Tool registration should never break page load.
    }
  }
})();
