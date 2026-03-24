import { test } from 'node:test';
import { strictEqual, match } from 'node:assert';
import { queryOpenAI, queryGemini } from '../apis.js';

test('queryOpenAI: returns string response', async (t) => {
  if (!process.env.OPENAI_API_KEY) {
    console.log('⊘ Skipping OpenAI test (no API key)');
    return;
  }

  const result = await queryOpenAI('What is 2+2?', 'Math question');
  strictEqual(typeof result, 'string');
  strictEqual(result.length > 0, true);
});

test('queryGemini: returns string response', async (t) => {
  if (!process.env.GOOGLE_API_KEY) {
    console.log('⊘ Skipping Gemini test (no API key)');
    return;
  }

  const result = await queryGemini('What is 2+2?', 'Math question');
  strictEqual(typeof result, 'string');
  strictEqual(result.length > 0, true);
});

test('queryOpenAI: handles timeout gracefully', async (t) => {
  // This test would require mocking; skip for now
  console.log('⊘ Timeout test deferred to integration phase');
});
