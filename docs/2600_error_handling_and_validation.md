# Error Handling and Input Validation

## What We Built

Full-stack error handling: express-validator middleware on all route parameters, structured error responses (400/404/500), frontend loading/error/empty states on every page, graceful shutdown, and database warm-up.

## Key Decisions

- All `:id` parameters validated server-side with `express-validator` — never trust client input
- Consistent error format: `{ "error": "message" }` across all endpoints
- Frontend uses a `cancelled` flag in useEffect to prevent state updates after unmount
- Graceful shutdown handles SIGINT/SIGTERM — closes HTTP server, then database driver
- Database warm-up query runs at startup to eliminate cold-start latency

## Errors Encountered

### First frontend request took 17 seconds
**Cause:** The Neo4j Bolt driver connects lazily — the TCP connection only establishes on the first `session.run()`. The first user request paid the full connection cost.
**Fix:** Added a warm-up query in `start()`: `await session.run("RETURN 1")` before accepting traffic. Logs "cognodb connected" when ready.

### 500 errors gave no useful information
**Cause:** Generic `catch(err)` blocks returned "Internal server error" without logging the actual error.
**Fix:** Added `handleError(res, err, context)` helper that logs the error with context and returns a safe message. The context string helps trace which query failed.

### Frontend showed stale data after navigating back
**Cause:** React Router reuses component instances — the `useEffect` with `[id]` dependency didn't re-fire when navigating between services.
**Fix:** Added `key={id}` on the route component or ensured the dependency array includes all changing params.

### Session leak under high load
**Cause:** Some service functions didn't close the database session in a `finally` block — if the query threw, the session stayed open.
**Fix:** All `runQuery()` calls now use `try/finally` to guarantee `session.close()`. The driver's connection pool would eventually recover, but under load it exhausted the pool.

## What We Learned

- Lazy database connections are great for startup time but terrible for first-user experience — always warm up
- `try/finally` for session cleanup is non-negotiable with connection-pooled drivers
- Consistent error response formats make frontend error handling much simpler
- The `cancelled` flag pattern in useEffect is essential for preventing React memory leak warnings
- Input validation at the middleware level (not in controllers) keeps route handlers clean
