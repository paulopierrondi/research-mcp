#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="research-mcp"
SERVICE_FILE="$HOME/.config/systemd/user/$SERVICE_NAME.service"

echo "Setting up systemd service for Research MCP..."

# Create service file
mkdir -p "$HOME/.config/systemd/user"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Research MCP Server (ChatGPT + Gemini)
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node --env-file=$PROJECT_DIR/.env $PROJECT_DIR/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

# Reload systemd
systemctl --user daemon-reload

# Enable and start
systemctl --user enable "$SERVICE_NAME"
systemctl --user start "$SERVICE_NAME"

echo "✓ Service installed and started"
echo "  Check status: systemctl --user status $SERVICE_NAME"
echo "  View logs: journalctl --user -u $SERVICE_NAME -f"
echo "  Stop: systemctl --user stop $SERVICE_NAME"
