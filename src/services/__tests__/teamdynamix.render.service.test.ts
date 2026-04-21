import { describe, expect, it } from 'vitest';
import { render } from '../teamdynamix/render.service.js';

describe('teamdynamix.render.service', () => {
  describe('render()', () => {
    describe('JSON format', () => {
      it('returns pretty-printed JSON for objects', () => {
        const data = { id: 1, name: 'Test' };
        expect(render(data, 'json')).toBe(JSON.stringify(data, null, 2));
      });

      it('returns pretty-printed JSON for arrays', () => {
        const data = [{ id: 1 }, { id: 2 }];
        expect(render(data, 'json')).toBe(JSON.stringify(data, null, 2));
      });

      it('returns pretty-printed JSON for primitives', () => {
        expect(render('plain text', 'json')).toBe('"plain text"');
        expect(render(42, 'json')).toBe('42');
        expect(render(null, 'json')).toBe('null');
        expect(render(undefined, 'json')).toBe('undefined');
      });
    });

    describe('markdown format', () => {
      it('returns empty string for empty array', () => {
        expect(render([], 'markdown')).toBe('');
      });

      it('returns empty string for null/undefined', () => {
        expect(render(null, 'markdown')).toBe('');
        expect(render(undefined, 'markdown')).toBe('');
      });

      it('renders single object as key/value markdown', () => {
        const data = { id: 1, name: 'Article' };
        const md = render(data, 'markdown');
        expect(md).toContain('id');
        expect(md).toContain('1');
        expect(md).toContain('name');
        expect(md).toContain('Article');
      });

      it('renders array of objects as markdown table with metadata', () => {
        const data = {
          appId: 42,
          count: 2,
          items: [
            { id: 1, title: 'First', status: 'Open' },
            { id: 2, title: 'Second', status: 'Closed' },
          ],
        };
        const md = render(data, 'markdown');
        expect(md).toContain('appId');
        expect(md).toContain('42');
        expect(md).toContain('count');
        expect(md).toContain('2');
        expect(md).toContain('| id | title | status |');
        expect(md).toContain('| :--- | :---- | :----- |');
        expect(md).toContain('| 1 | First | Open |');
        expect(md).toContain('| 2 | Second | Closed |');
      });

      it('handles common envelope keys (count, items/tickets/statuses)', () => {
        const data = {
          count: 3,
          tickets: [
            { ID: 1, Title: 'Bug' },
            { ID: 2, Title: 'Feature' },
            { ID: 3, Title: 'Task' },
          ],
        };
        const md = render(data, 'markdown');
        expect(md).toContain('count');
        expect(md).toContain('3');
        expect(md).toContain('| ID | Title |');
        expect(md).toContain('| 1 | Bug |');
        expect(md).toContain('| 2 | Feature |');
        expect(md).toContain('| 3 | Task |');
      });

      it('coerces nested objects/arrays into compact strings in cells', () => {
        const data = {
          count: 1,
          items: [{ id: 1, meta: { a: 1, b: 2 }, tags: ['x', 'y'] }],
        };
        const md = render(data, 'markdown');
        expect(md).toContain('| id | meta | tags |');
        expect(md).toMatch(/\| 1 \| \{ a: 1, b: 2 \} \| x,y \|/);
      });

      it('applies CHARACTER_LIMIT truncation with notice', () => {
        // Pass a low characterLimit to force truncation
        const testLimit = 500;
        const long = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
        const data = { count: long.length, items: long };
        const md = render(data, 'markdown', testLimit);
        expect(md.length).toBeLessThanOrEqual(testLimit);
        expect(md).toContain('...');
      });

      it('falls back to compact key/value for non-tabular single objects', () => {
        const data = { status: 'ok', uptime: 99.9 };
        const md = render(data, 'markdown');
        expect(md).toContain('status');
        expect(md).toContain('ok');
        expect(md).toContain('uptime');
        expect(md).toContain('99.9');
      });

      it('handles arrays without metadata envelope', () => {
        const data = [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ];
        const md = render(data, 'markdown');
        expect(md).toContain('| id | name |');
        expect(md).toContain('| 1 | A |');
        expect(md).toContain('| 2 | B |');
      });

      it('preserves scalar metadata keys like appId, ticketId, projectId', () => {
        const data = {
          appId: 100,
          ticketId: 200,
          status: 'Open',
          items: [{ id: 1, title: 'T' }],
        };
        const md = render(data, 'markdown');
        expect(md).toContain('appId');
        expect(md).toContain('100');
        expect(md).toContain('ticketId');
        expect(md).toContain('200');
        expect(md).toContain('status');
        expect(md).toContain('Open');
      });
    });
  });
});
