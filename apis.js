import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to avoid errors when API keys are missing
let openai;
let googleAI;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

function getGoogleAI() {
  if (!googleAI) {
    googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return googleAI;
}

const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '6000', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '1', 10);

// Utility: Timeout promise
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// Utility: Retry wrapper
async function withRetry(fn, maxRetries = MAX_RETRIES) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries) throw e;
      // Retry
    }
  }
}

// Query OpenAI GPT-4
export async function queryOpenAI(topic, context) {
  const systemPrompt = context
    ? `You are a research assistant. Context: ${context}`
    : 'You are a research assistant.';

  const userPrompt = `Research and provide detailed information about: ${topic}`;

  const call = () => withTimeout(
    getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }),
    TIMEOUT_MS
  );

  const response = await withRetry(call);
  return response.choices[0].message.content;
}

// Query Google Gemini
export async function queryGemini(topic, context) {
  const systemPrompt = context
    ? `You are a research assistant. Context: ${context}`
    : 'You are a research assistant.';

  const userPrompt = `Research and provide detailed information about: ${topic}`;

  const model = getGoogleAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt
  });

  const call = () => withTimeout(
    model.generateContent(userPrompt),
    TIMEOUT_MS
  );

  const response = await withRetry(call);
  return response.response.text();
}

// Query both in parallel
export async function queryBoth(topic, context) {
  const [chatgptResult, geminiResult] = await Promise.allSettled([
    queryOpenAI(topic, context),
    queryGemini(topic, context)
  ]);

  return {
    chatgpt: chatgptResult.status === 'fulfilled' ? chatgptResult.value : `Error: ${chatgptResult.reason.message}`,
    gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : `Error: ${geminiResult.reason.message}`
  };
}
