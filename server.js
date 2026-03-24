import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';

const PORT = process.env.PORT || 3000;

// Create MCP server instance
const server = new McpServer({
  name: 'research-mcp',
  version: '1.0.0'
});

// Register search tool
registerTools(server);

// Create HTTP server with simple request handler
const httpServer = http.createServer(async (req, res) => {
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // OAuth discovery endpoints (for Claude compatibility)
  if (req.url === '/.well-known/oauth-authorization-server' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      token_endpoint: `https://${req.headers.host}/token`,
      authorization_endpoint: `https://${req.headers.host}/authorize`
    }));
    return;
  }

  if (req.url === '/.well-known/oauth-protected-resource' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ protected_resource: true }));
    return;
  }

  // Health check endpoint
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'research-mcp',
      port: PORT,
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'missing',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'set' : 'missing',
        MCP_HISTORY_DIR: process.env.MCP_HISTORY_DIR || 'default',
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not-railway'
      }
    }));
    return;
  }

  // MCP transport endpoint - handle streaming JSON-RPC
  if (req.url === '/mcp' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    let body = '';
    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
      try {
        const message = JSON.parse(body);
        console.log('MCP Request:', message.method);

        // Basic initialize response
        if (message.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              serverInfo: {
                name: 'research-mcp',
                version: '1.0.0'
              }
            }
          };
          res.write('data: ' + JSON.stringify(response) + '\n\n');
        }
        // Tools list endpoint
        else if (message.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: [
                {
                  name: 'search',
                  description: 'Search ChatGPT and Gemini in parallel',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      topic: { type: 'string', description: 'Topic to research' },
                      context: { type: 'string', description: 'Optional context' }
                    },
                    required: ['topic']
                  }
                }
              ]
            }
          };
          res.write('data: ' + JSON.stringify(response) + '\n\n');
        }
        // Tool call endpoint
        else if (message.method === 'tools/call') {
          const { executeSearch } = await import('./tools.js');
          const result = await executeSearch(message.params.arguments.topic, message.params.arguments.context);
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [{ type: 'text', text: result }]
            }
          };
          res.write('data: ' + JSON.stringify(response) + '\n\n');
        }

        res.end();
      } catch (error) {
        console.error('MCP error:', error.message);
        const response = {
          jsonrpc: '2.0',
          id: body ? JSON.parse(body).id : -1,
          error: { code: -32603, message: error.message }
        };
        res.write('data: ' + JSON.stringify(response) + '\n\n');
        res.end();
      }
    });

    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Research MCP server listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});
