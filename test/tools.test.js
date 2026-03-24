import { test } from 'node:test';
import { strictEqual, match } from 'node:assert';
import { formatMarkdown } from '../tools.js';

test('formatMarkdown: returns markdown with all sections', (t) => {
  const responses = {
    chatgpt: 'ChatGPT says X',
    gemini: 'Gemini says Y'
  };
  const topic = 'Test Topic';
  const timestamp = new Date().toISOString();

  const result = formatMarkdown(topic, responses, timestamp);

  strictEqual(result.includes('# Perspectivas:'), true);
  strictEqual(result.includes('## ChatGPT'), true);
  strictEqual(result.includes('## Google Gemini'), true);
  strictEqual(result.includes('Síntese'), true);
  strictEqual(result.includes(timestamp), true);
});

test('formatMarkdown: handles partial failures', (t) => {
  const responses = {
    chatgpt: 'ChatGPT says X',
    gemini: null // Failure
  };
  const topic = 'Test Topic';
  const timestamp = new Date().toISOString();

  const result = formatMarkdown(topic, responses, timestamp);

  strictEqual(result.includes('Status: Partial'), true);
  strictEqual(result.includes('ChatGPT'), true);
  strictEqual(result.includes('⚠️'), true);
});
