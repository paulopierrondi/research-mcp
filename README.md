# Research MCP

Multi-perspective research server integrating ChatGPT + Google Gemini.

## Features

- **Parallel Queries** — Query both APIs simultaneously
- **Formatted Output** — Markdown responses optimized for Claude
- **Local History** — Store and search past queries
- **Claude Integration** — Works with Claude personal + enterprise
- **Auto-restart** — Systemd, PM2, or Railway deployments

## Quick Start

### 1. Setup

```bash
npm install
cp .env.example .env
# Edit .env with your API keys:
# - OPENAI_API_KEY=sk-...
# - GOOGLE_API_KEY=...
```

### 2. Start Server

```bash
npm start
# Runs on http://localhost:3000
```

### 3. Add to Claude (Production)

In Claude personal Settings → MCP Servers → Add:
- **URL**: `https://research-mcp-production-f34c.up.railway.app/mcp`
- **Name**: `research-mcp`
- Auth: Leave blank

### 4. Use It

In Claude personal:
```
@research search "IA em Compliance Bancário"
```

Claude will call the MCP and return formatted research.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- Systemd auto-restart
- PM2 process manager
- Railway (recommended for always-on)

## Environment Variables

See `.env.example` for all options.

Key variables:
- `OPENAI_API_KEY` — Required: OpenAI API key
- `GOOGLE_API_KEY` — Required: Google API key
- `PORT` — Optional: Server port (default 3000)
- `MCP_HISTORY_DIR` — Optional: History storage location (default ~/.mcp-search-history)

## Architecture

- **server.js** — HTTP server + MCP transport
- **tools.js** — Search tool implementation
- **apis.js** — OpenAI + Google API wrappers
- **storage.js** — History file management

## Testing

```bash
npm test
```

## API

### Tool: `search(topic, context?)`

**Params:**
- `topic` (string, required) — What to research
- `context` (string, optional) — Context (audience, use case, etc)

**Returns:**
- Markdown formatted with ChatGPT + Gemini sections
- Automatically saved to history

**Example:**
```
Topic: IA em Risk Management
Context: Apresentação executiva para bancos, foco em compliance
```

Returns:
```markdown
# Perspectivas: IA em Risk Management

## ChatGPT (OpenAI)
[ChatGPT response...]

## Google Gemini
[Gemini response...]

## Síntese & Comparação
[Comparison and synthesis...]
```

## History

Searches are automatically saved to `~/.mcp-search-history/searches.json`.

Access via:
- `listHistory(limit)` — Get last N searches
- `searchHistory(term)` — Search by topic/context
- `deleteSearch(id)` — Remove a search

## License

MIT
