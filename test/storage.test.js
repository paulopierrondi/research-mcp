import { test } from 'node:test';
import { strictEqual, match } from 'node:assert';
import { promises as fs } from 'fs';
import { saveSearch, listHistory, deleteSearch } from '../storage.js';

test('saveSearch: stores and retrieves search', async (t) => {
  const search = {
    id: 'test-123',
    timestamp: new Date().toISOString(),
    topic: 'IA em Compliance',
    context: 'teste',
    responses: {
      chatgpt: 'ChatGPT response',
      gemini: 'Gemini response'
    },
    formatted: '# Test',
    status: 'success'
  };

  await saveSearch(search);
  const history = await listHistory(10);
  strictEqual(history.some(h => h.id === 'test-123'), true);

  // Cleanup
  await deleteSearch('test-123');
});

test('listHistory: returns last N searches', async (t) => {
  const search1 = {
    id: 'test-1',
    timestamp: new Date().toISOString(),
    topic: 'Topic 1',
    context: 'ctx',
    responses: { chatgpt: 'A', gemini: 'B' },
    formatted: '# Test 1',
    status: 'success'
  };

  await saveSearch(search1);
  const history = await listHistory(5);
  strictEqual(history.length > 0, true);

  // Cleanup
  await deleteSearch('test-1');
});

test('listHistory: handles empty history', async (t) => {
  const history = await listHistory(10);
  strictEqual(Array.isArray(history), true);
});
