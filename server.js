import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerTools } from './tools.js';

const PORT = process.env.PORT || 3000;

// Create MCP server instance
const server = new McpServer({
  name: 'research-mcp',
  version: '1.0.0'
});

// Register search tool
registerTools(server);

// Create HTTP server
const httpServer = http.createServer(async (req, res) => {
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'research-mcp' }));
    return;
  }

  // MCP transport endpoint
  if (req.url === '/mcp') {
    // Use StreamableHTTP transport
    const transport = new StreamableHTTPServerTransport(req, res);
    server.setRequestHandler(transport.request);

    try {
      await transport.start();
    } catch (error) {
      console.error('Transport error:', error);
      res.writeHead(500);
      res.end('Transport error');
    }
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
