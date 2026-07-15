# Refactor Guide: FunctionApp → WebApp

A step-by-step walkthrough of migrating an Azure Functions HTTP trigger to a general-purpose Express.js web server.

---

## Overview

The core principle is **framework-agnostic business logic** — all domain code lives in plain Node.js modules that know nothing about Azure Functions or Express. The framework-specific entry points are thin wrappers that delegate to these shared modules.

---

## Comparison at a Glance

| Layer | FunctionApp | WebApp | Same? |
|---|---|---|---|
| **Business Logic** | `greetingService.js` | `greetingService.js` | Identical |
| **HTML Template** | `greetingTemplate.js` | `greetingTemplate.js` | Identical |
| **UI Page** | `index.html` | `public/index.html` | Identical |
| **Entry Point** | `SATDemoFunc.js` (HTTP trigger) | `index.js` (Express) | Different |
| **Host Config** | `host.json` | None | Different |
| **Container** | None (PaaS) | `Dockerfile` | Different |

---

## Step-by-Step Refactor

### 1. Extract Business Logic (Shared Layer)

Before refactoring, business logic must be **completely independent** of any framework.

```js
// ✅ Good — plain class, no framework imports
class GreetingService {
  constructor(log) {
    this._log = log || (() => {});
  }

  handle(username) {
    this._log(`HTTP request processed, username: ${username}`);
    return { message: `hello ${username}` };
  }
}

module.exports = { GreetingService };
```

```js
// ❌ Bad — imports framework types
const { HttpRequest, HttpResponse } = require('@azure/functions');

class GreetingService {
  handle(req) { ... }
}
```

The service takes a generic `log` function — no special DI container needed.

### 2. FunctionApp Entry Point (Before)

```js
// src/FunctionApp/src/functions/SATDemoFunc.js
const { app } = require('@azure/functions');
const { GreetingService } = require('../services/greetingService');

const greetingService = new GreetingService((msg) => console.log(msg));

app.http('SATDemoFunc', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/satdemofunc/{username}',
  handler: async (request, context) => {
    const result = greetingService.handle(request.params.username);
    return {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    };
  },
});
```

Key points:
- Uses `app.http()` DSL for route registration
- Route parameter: `{username}` (Azure Functions syntax)
- Handler receives `(request, context)` — framework-specific types
- Return signature: `{ status, headers, body }` — Azure Functions v4 format

### 3. WebApp Entry Point (After)

```js
// src/WebApp/src/index.js
const express = require('express');
const { GreetingService } = require('./services/greetingService');

const app = express();
const port = process.env.PORT || 8080;
const greetingService = new GreetingService((msg) => console.log(msg));

app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get('/readyz', (req, res) => res.status(200).send('ready'));

app.all('/api/satdemofunc/:username', (req, res) => {
  const result = greetingService.handle(req.params.username);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

Key points:
- Uses Express `app.all()` for route registration
- Route parameter: `:username` (Express syntax, same meaning)
- Handler receives `(req, res)` — Express-specific types
- Response via `res.set()` + `res.send()` — Express format
- Extra: health/readiness probes (`/healthz`, `/readyz`) for K8s
- Extra: explicit port binding via `app.listen()`

### 4. Framework Mapping

| Concept | Azure Functions v4 | Express.js |
|---|---|---|
| Route syntax | `{param}` | `:param` |
| Access param | `request.params.username` | `req.params.username` |
| HTTP methods | `methods: ['GET', 'POST']` | `app.all(...)` or `app.get(...).post(...)` |
| Set content-type | `headers: { 'Content-Type': '...' }` | `res.set('Content-Type', '...')` |
| Send response | `return { status, body }` | `res.status(200).send(body)` |
| Error handling | Return error status | `next(err)` middleware |
| Port | Managed by host (7071) | `app.listen(8080)` |
| Startup | `func start` | `node src/index.js` |
| Deployment | `func azure functionapp publish` | `docker build` + `kubectl apply` |

### 5. Add Container Support (Dockerfile)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 8080
ENV PORT=8080
CMD ["node", "src/index.js"]
```

This is the critical addition — Functions don't need a Dockerfile (they run on PaaS), but a general web server does.

### 6. Add Kubernetes Support

Once containerized, the WebApp can run on any orchestrator:

```
k8s/
├── namespace.yaml      # myfunctionapp namespace
├── deployment.yaml     # 3 replicas, RollingUpdate, resource limits, probes
├── service.yaml        # ClusterIP 80 → 8080
├── ingress.yaml        # nginx ingress + TLS (cert-manager)
├── hpa.yaml            # CPU 70% / Memory 80%, 2–10 replicas
└── kustomization.yaml  # One-click apply
```

### 7. Migration Checklist

When refactoring your own FunctionApp:

| # | Step | Check |
|---|---|---|
| 1 | Extract all business logic into plain classes (no framework imports) | ☐ |
| 2 | `package.json`: replace `@azure/functions` → `express` | ☐ |
| 3 | Entry point: `app.http()` → `app.all()` | ☐ |
| 4 | Routes: `{param}` → `:param` | ☐ |
| 5 | Response: `return { status, body }` → `res.send()` | ☐ |
| 6 | Add `app.listen(PORT)` | ☐ |
| 7 | Add `/healthz` and `/readyz` probes | ☐ |
| 8 | Write `Dockerfile` and `.dockerignore` | ☐ |
| 9 | Write K8s manifests (deployment + service + ingress) | ☐ |
| 10 | Add HPA for auto-scaling | ☐ |

---

## Key Differences Summary

### What Changes

| Concern | Before | After |
|---|---|---|
| Framework | `@azure/functions` | `express` |
| Entry point | `SATDemoFunc.js` | `index.js` |
| Route syntax | `{username}` | `:username` |
| Response API | `return { status, body }` | `res.status(200).send()` |
| Port | Dynamic (7071) | Explicit (8080) |
| Deployment | `func publish` | `docker build` + `kubectl apply` |

### What Stays the Same

- `greetingService.js` — byte-for-byte identical
- `greetingTemplate.js` — byte-for-byte identical
- `index.html` — byte-for-byte identical
- Response format — `text/html; charset=utf-8`
- Endpoint signature — `username` as path parameter
