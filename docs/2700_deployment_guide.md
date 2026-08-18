# Deployment Guide

## What We Need

- Client: static files (HTML/JS/CSS) served from a CDN or static host
- Server: Node.js process running Express on port 3001
- Database: cognodb cloud instance (already hosted, no infra needed)

## Deployment Options

### Option A: Vercel (client) + Render (server)
Best for free-tier hosting. Vercel handles static files with CDN. Render runs the Node.js server.

### Option B: Railway
Single platform for both. Simpler setup, one deployment.

### Option C: Fly.io
More control, Docker-based. Good for production.

### Option D: Docker
Containerize everything. Works anywhere.

## Environment Variables

| Variable | Where | Example |
|----------|-------|---------|
| `COGNODB_URI` | server | `bolt+s://db-xxx.databases.cognodb.com` |
| `COGNODB_USERNAME` | server | `cognodb` |
| `COGNODB_PASSWORD` | server | (secret) |
| `PORT` | server | `3001` |

## Production Build

```bash
cd client && npm run build  # generates client/dist/
cd server && npm start       # serves API + client/dist/
```

The Express server serves `client/dist/` as static files with SPA fallback.

## Errors Encountered

### Vercel couldn't connect to cognodb
**Cause:** Vercel serverless functions don't support persistent TCP/Bolt connections — each invocation creates a new connection.
**Fix:** Moved the server to Render (persistent Node.js process) instead of Vercel serverless. cognodb requires persistent connections.

### CORS blocked requests in production
**Cause:** Frontend on `vercel.app`, server on `render.com` — different origins.
**Fix:** Added CORS configuration: `cors({ origin: process.env.CLIENT_URL || "*" })`.

### Server crashed on cold start
**Cause:** cognodb connection timeout during the warm-up query.
**Fix:** Added retry logic with 3 attempts and exponential backoff on the warm-up query.

## What We Learned

- cognodb (Bolt protocol) needs persistent TCP connections — serverless platforms don't work well
- Static frontend + persistent backend is the natural split for graph database apps
- CORS must be configured for cross-origin deployments — `*` works for demos, restrict in production
- Always test the full deployment chain locally before pushing — environment differences cause most deployment failures
