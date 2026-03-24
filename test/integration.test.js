import { test } from 'node:test';
import { strictEqual } from 'node:assert';

test('Integration: Health check responds', async (t) => {
  const response = await fetch('http://localhost:3000/');
  strictEqual(response.status, 200);
  const data = await response.json();
  strictEqual(data.service, 'research-mcp');
});

test('Integration: 404 on unknown path', async (t) => {
  const response = await fetch('http://localhost:3000/unknown');
  strictEqual(response.status, 404);
});
