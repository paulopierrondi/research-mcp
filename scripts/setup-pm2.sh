#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="research-mcp"

echo "Setting up PM2 for Research MCP..."

# Check PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# Stop existing instance
pm2 stop "$APP_NAME" 2>/dev/null || true

# Start with PM2
pm2 start "$PROJECT_DIR/server.js" \
  --name "$APP_NAME" \
  --env "$PROJECT_DIR/.env" \
  --output "$PROJECT_DIR/logs/stdout.log" \
  --error "$PROJECT_DIR/logs/stderr.log" \
  --time

# Save PM2 config for auto-restart on reboot
pm2 startup --user
pm2 save

echo "✓ Research MCP started with PM2"
echo "  Check status: pm2 status"
echo "  View logs: pm2 logs $APP_NAME"
echo "  Stop: pm2 stop $APP_NAME"
