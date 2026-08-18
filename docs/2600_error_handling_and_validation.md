# Error Handling and Input Validation

> Defensive programming across the full stack.

## 1. Backend Input Validation

### Middleware

`server/src/middleware/validate.js` exports four validation chains using `express-validator`:

| Middleware | Validates | Returns |
|-----------|-----------|---------|
| `handleValidation` | Checks `validationResult(req)` | 400 with error message |
| `validateIdParam` | `param("id")` — non-empty trimmed string | 400 if invalid |
| `validateTargetIdParam` | `param("id")` + `param("targetId")` | 400 if either invalid |
| `validateVersionIdQuery` | Optional `query("versionId")` | 400 if provided but empty |

### Route-Level Validation

All `:id` parameters are validated before reaching the controller:

```js
router.get("/:id", validateIdParam, controller.getApiById);
router.get("/:id/blast-radius", validateIdParam, validateVersionIdQuery, controller.getBlastRadius);
router.get("/:id/paths/:targetId", validateIdParam, validateTargetIdParam, controller.getDependencyPath);
```

Invalid IDs return `400 Bad Request` with a descriptive error message.

## 2. Backend Error Handling

### Controller Pattern

Every controller function follows the same pattern:

```js
async function getApiById(req, res) {
  try {
    const api = await apiService.getApiById(req.params.id);
    if (!api) return res.status(404).json({ error: "API not found" });
    res.json(api);
  } catch (err) {
    handleError(res, err, "getApiById");
  }
}
```

### Error Response Format

All errors return JSON:

```json
{
  "error": "Descriptive error message"
}
```

| Status Code | When |
|------------|------|
| 400 | Invalid input (validation middleware) |
| 404 | Entity not found |
| 500 | Database error or unexpected failure |

### Global Error Handler

`server/src/index.js` registers a catch-all error handler:

```js
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});
```

### Database Error Handling

The service layer catches CogODB connection errors and query failures:

```js
async function runQuery(cypher, params = {}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}
```

Sessions are always closed in `finally` blocks to prevent connection leaks.

## 3. Frontend Error Handling

### Component Pattern

Every data-fetching page follows the same pattern:

```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetchData()
    .then(result => { if (!cancelled) setData(result); })
    .catch(err => { if (!cancelled) setError(err.message); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, []);
```

The `cancelled` flag prevents state updates after unmount.

### Three States per Page

Every page with data fetching renders one of three states:

1. **Loading:** `<LoadingSpinner />` — centered spinner with "Loading..." text
2. **Error:** `<ErrorBanner message={error} />` — red-tinted banner with error message
3. **Content:** The actual page content

### API Client Error Handling

`client/src/api.js` uses Axios with a 10-second timeout:

```js
const api = axios.create({ baseURL: "/api", timeout: 10000 });
```

The dashboard page catches 404 specifically:

```js
.catch(err => {
  setError(err.response?.status === 404
    ? "API or version not found"
    : "Failed to load data. Is the server running?");
});
```

### Empty States

Every list page handles the empty case:

| Page | Empty State |
|------|------------|
| APIs List | "No APIs found." / "No APIs match your search." |
| Services List | "No services found." |
| Teams List | "No teams found." |
| Blast Radius (no deps) | "No downstream dependencies found for [API] v[X]." |
| Service Detail (no deps) | "This service has no direct dependencies." |

## 4. Graceful Shutdown

The server handles `SIGINT` and `SIGTERM` for clean shutdown:

```js
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await server.close();
  await closeDriver();
  process.exit(0);
});
```

## 5. Database Warm-Up

CogODB's Bolt driver connects lazily — the TCP connection only establishes on the first query. This caused ~17-second delays on the first frontend request. The fix runs a warm-up query during server startup:

```js
const session = driver.session();
await session.run("RETURN 1");
await session.close();
console.log("cognodb connected");
```

This ensures the connection pool is ready before the server accepts requests.
