import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Use MCP_HISTORY_DIR env var, or /app/data in containers, or ~/.mcp-search-history locally
const HISTORY_DIR = process.env.MCP_HISTORY_DIR || (
  process.env.RAILWAY_ENVIRONMENT ? '/app/data' : join(homedir(), '.mcp-search-history')
);
const HISTORY_FILE = join(HISTORY_DIR, 'searches.json');

// Ensure history directory exists
async function ensureDir() {
  try {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  } catch (e) {
    // Directory already exists
  }
}

// Load history from file
async function loadHistory() {
  try {
    await ensureDir();
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data).searches || [];
  } catch (e) {
    return [];
  }
}

// Save search to history
export async function saveSearch(search) {
  await ensureDir();
  const history = await loadHistory();
  history.push(search);

  // Keep only last N days (default 365)
  const retentionDays = parseInt(process.env.HISTORY_RETENTION_DAYS || '365', 10);
  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const filtered = history.filter(h => new Date(h.timestamp).getTime() > cutoffDate);

  await fs.writeFile(HISTORY_FILE, JSON.stringify({ searches: filtered }, null, 2));
}

// List last N searches
export async function listHistory(limit = 10) {
  const history = await loadHistory();
  return history.slice(-limit).reverse(); // Most recent first
}

// Search history by term
export async function searchHistory(term) {
  const history = await loadHistory();
  const lowerTerm = term.toLowerCase();
  return history.filter(h =>
    h.topic.toLowerCase().includes(lowerTerm) ||
    (h.context && h.context.toLowerCase().includes(lowerTerm))
  ).reverse();
}

// Delete search by ID
export async function deleteSearch(id) {
  await ensureDir();
  const history = await loadHistory();
  const filtered = history.filter(h => h.id !== id);
  await fs.writeFile(HISTORY_FILE, JSON.stringify({ searches: filtered }, null, 2));
}

// Get total search count
export async function getHistoryStats() {
  const history = await loadHistory();
  return {
    total: history.length,
    dir: HISTORY_DIR,
    file: HISTORY_FILE
  };
}
