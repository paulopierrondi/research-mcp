# Deployment Guide

## ✅ Currently Deployed

**Production URL:** https://research-mcp-production-f34c.up.railway.app

Server is **always running** on Railway. Use this URL to add to Claude personal.

---

## Local Development

### Option 1: Systemd (Linux/macOS)

```bash
./scripts/start-systemd.sh
# Auto-restarts on reboot
```

### Option 2: PM2 (Any platform)

```bash
./scripts/setup-pm2.sh
# Auto-restarts on reboot
```

### Option 3: Manual

```bash
npm start
# Ctrl+C to stop
```

## Railway Deployment (Recommended)

### 1. Push to GitHub

```bash
git remote add origin https://github.com/your-user/research-mcp.git
git push -u origin main
```

### 2. Connect to Railway

1. Go to https://railway.app/new
2. Select "Deploy from GitHub"
3. Select your `research-mcp` repo
4. Railway auto-detects Node.js + Dockerfile

### 3. Set Environment Variables

In Railway dashboard:
- `OPENAI_API_KEY`: Your OpenAI API key
- `GOOGLE_API_KEY`: Your Google API key
- `PORT`: 3000 (auto-set)

### 4. Deploy

Click "Deploy" — Railway builds and starts your server.

### 5. Get Public URL

In Deployments → Environment → URL (e.g., `https://research-mcp-prod.up.railway.app`)

### 6. Update Claude Settings

In Claude personal:
- Settings → MCP Servers → Add
- URL: `https://research-mcp-prod.up.railway.app/mcp`
- No auth required

## Monitoring

### Systemd
```bash
journalctl --user -u research-mcp -f
```

### PM2
```bash
pm2 logs research-mcp
```

### Railway
Dashboard shows logs, resource usage, restart history
