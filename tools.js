import { z } from 'zod';
import { queryBoth } from './apis.js';
import { saveSearch } from './storage.js';
import { randomBytes } from 'crypto';

// Input validation schema
const SearchInputSchema = z.object({
  topic: z.string().min(3).max(500),
  context: z.string().max(1000).optional()
});

// Format responses as markdown
export function formatMarkdown(topic, responses, timestamp) {
  const { chatgpt, gemini } = responses;

  const header = `# Perspectivas: ${topic}

**Timestamp:** ${timestamp}

`;

  let body = '';

  if (chatgpt && gemini) {
    // Both succeeded
    body = `## ChatGPT (OpenAI)

${chatgpt}

---

## Google Gemini

${gemini}

---

## Síntese & Comparação

**Análise de perspectivas:**

As duas abordagens diferem em foco e profundidade. Use esta síntese para informar sua decisão.
`;
  } else if (chatgpt) {
    // Only ChatGPT succeeded
    body = `**Status: Partial** — Google Gemini unavailable

## ChatGPT (OpenAI)

${chatgpt}

---

⚠️ Síntese indisponível — apenas uma perspectiva disponível.
`;
  } else if (gemini) {
    // Only Gemini succeeded
    body = `**Status: Partial** — ChatGPT unavailable

## Google Gemini

${gemini}

---

⚠️ Síntese indisponível — apenas uma perspectiva disponível.
`;
  } else {
    // Both failed
    body = `**Status: Failed**

⚠️ Ambas as APIs falharam. Verifique suas chaves e tente novamente.
`;
  }

  return header + body;
}

// Main search tool
export async function executeSearch(topic, context) {
  // Validate input
  const validated = SearchInputSchema.parse({ topic, context });

  // Query both APIs in parallel
  const responses = await queryBoth(validated.topic, validated.context);

  // Format markdown
  const timestamp = new Date().toISOString();
  const formatted = formatMarkdown(validated.topic, responses, timestamp);

  // Determine status
  const status = (responses.chatgpt && !responses.chatgpt.includes('Error')) &&
                 (responses.gemini && !responses.gemini.includes('Error'))
    ? 'success'
    : 'partial';

  // Save to history
  const searchId = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  await saveSearch({
    id: searchId,
    timestamp,
    topic: validated.topic,
    context: validated.context || '',
    responses,
    formatted,
    status
  });

  return formatted;
}

// Register tool with MCP server
export function registerTools(server) {
  server.tool('search',
    'Search ChatGPT and Google Gemini in parallel for research perspectives.',
    {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic to research (min 3, max 500 chars)'
        },
        context: {
          type: 'string',
          description: 'Optional context for better responses (max 1000 chars)'
        }
      },
      required: ['topic']
    },
    async (params) => {
      try {
        const result = await executeSearch(params.topic, params.context);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}
