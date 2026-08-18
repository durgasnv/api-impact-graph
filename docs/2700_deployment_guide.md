# Deployment Guide

> How to deploy the API Impact Graph application.

## 1. Architecture

```
Client (React + Vite)  ←─ REST/JSON ──→  Server (Express.js)  ←─ Bolt/Cypher ──→  cognodb (cloud)
```

- **Client:** Static files (HTML, JS, CSS) built by Vite
- **Server:** Node.js process serving the REST API
- **Database:** cognodb cloud instance (no infrastructure to manage)

## 2. Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `COGNODB_URI` | Bolt connection URI | `bolt+s://db-xxx.databases.cognodb.com` |
| `COGNODB_USERNAME` | Database username | `cognodb` |
| `COGNODB_PASSWORD` | Database password | `***` |
| `PORT` | HTTP server port | `3001` |

### Client (`client/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` (proxied in dev) |

The `.env.example` file documents required variables. The `.env` file is gitignored.

## 3. Local Development

### Prerequisites

- Node.js 18+
- npm
- cognodb instance (cloud or local Neo4j)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd api-impact-graph

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your cognodb credentials

# Seed the database
cd ../server && npm run seed

# Start the server (port 3001)
npm run dev

# Start the client (port 5173, proxies /api to 3001)
cd ../client && npm run dev
```

### Vite Dev Proxy

The client dev server proxies `/api` requests to the backend:

```js
// client/vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

## 4. Production Build

```bash
# Build the client
cd client && npm run build
# Output: client/dist/

# The server serves client/dist as static files in production
cd ../server && npm start
```

In production, the Express server:
1. Serves `client/dist/` as static files
2. Handles all `/api/*` routes
3. Falls back to `index.html` for client-side routing (SPA catch-all)

## 5. Deployment Options

### Option A: Vercel (Client) + Render (Server)

**Client on Vercel:**
- Framework: Vite
- Build command: `cd client && npm run build`
- Output directory: `client/dist`
- Environment variables: none needed (uses relative `/api` paths)

**Server on Render:**
- Runtime: Node
- Build command: `cd server && npm install`
- Start command: `cd server && npm start`
- Environment variables: `COGNODB_URI`, `COGNODB_USERNAME`, `COGNODB_PASSWORD`

### Option B: Railway (Full Stack)

Single deployment with both client and server:

```yaml
# railway.json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Option C: Fly.io

```bash
fly launch
fly deploy
```

Set environment variables via `fly secrets set`.

### Option D: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --production
COPY server/ ./server/
COPY client/dist/ ./client/dist/
EXPOSE 3001
CMD ["node", "server/src/index.js"]
```

## 6. Database Setup

### cognodb (Cloud)

1. Create an account at cognodb.com
2. Create a new database instance
3. Copy the Bolt URI, username, and password
4. Add to `server/.env`

### Local Neo4j (Alternative)

```bash
# Using Docker
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5

# Update server/.env
COGNODB_URI=bolt://localhost:7687
COGNODB_USERNAME=neo4j
COGNODB_PASSWORD=password
```

### Seeding

```bash
cd server && npm run seed
```

This wipes all existing data and creates the demonstration dataset.

## 7. Production Considerations

### Security

- CORS should be restricted to the deployed frontend domain
- Rate limiting on the API (e.g., `express-rate-limit`)
- Helmet.js for HTTP security headers
- Never commit `.env` files

### Performance

- cognodb handles connection pooling natively via the Neo4j driver
- The server warm-up query ensures no cold-start latency on first request
- Client build is minified and gzipped (CSS: ~5KB, JS: ~166KB gzipped)

### Monitoring

- Health check endpoint: `GET /api/health` returns `{ status: "ok" }`
- Use with uptime monitoring (UptimeRobot, Betterstack, etc.)
- Server logs connection status and errors to stdout

### Graceful Shutdown

The server handles `SIGINT` and `SIGTERM`:
1. Stops accepting new connections
2. Closes the HTTP server
3. Closes the cognodb driver connection
4. Exits cleanly

## 8. Verification Checklist

After deployment:

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] Dashboard loads with stats and overview graph
- [ ] API list loads all 70+ APIs
- [ ] API detail shows versions and consumers
- [ ] Blast radius visualization works with interactive graph
- [ ] Service detail shows 4 relationship sections
- [ ] Team detail shows owned services
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout works
- [ ] Fullscreen mode works on blast radius page
