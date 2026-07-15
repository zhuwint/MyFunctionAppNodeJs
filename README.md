# MyFunctionApp (Node.js)

A demo project showing how to refactor an Azure Functions project into a cross-platform containerized HTTP server.

---

## Project Structure

```
MyFunctionAppNodeJs/
├── src/
│   ├── FunctionApp/       # Azure Functions (Node.js v4)
│   │   ├── host.json      # Functions runtime config
│   │   ├── local.settings.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js           # HTTP trigger entry point
│   │       ├── index.html         # Interactive UI page
│   │       └── services/
│   │           ├── greetingService.js
│   │           └── greetingTemplate.js
│   └── WebApp/            # Express.js (container-ready)
│       ├── Dockerfile
│       ├── .dockerignore
│       ├── package.json
│       └── src/
│           ├── index.js           # Express server entry point
│           ├── index.html         # Interactive UI page
│           └── services/
│               ├── greetingService.js
│               └── greetingTemplate.js
├── k8s/                   # Kubernetes manifests
├── docs/                  # Documentation
├── .github/workflows/     # CI/CD pipeline
├── deploy.sh              # One-click build + push + K8s deploy
└── README.md
```

---

## Design Philosophy

Both projects share identical UI (`index.html`) and business logic (`GreetingService`) while using different framework stacks, achieving **complete decoupling of business code from framework code**.

### Layered Architecture

```
┌─────────────────────────────────────────┐
│            Framework Layer               │
│  FunctionApp: Azure Functions v4         │
│  WebApp:     Express.js                  │
├─────────────────────────────────────────┤
│            Presentation Layer            │
│           index.html                    │
├─────────────────────────────────────────┤
│           Business Layer                 │
│         GreetingService                 │
└─────────────────────────────────────────┘
```

### Each Project Uses Shared Files

| Layer | File | Shared? |
|---|---|---|
| Framework | `index.js` | No — framework-specific |
| Presentation | `index.html` | Yes — byte-for-byte identical |
| Business | `greetingService.js` | Yes — byte-for-byte identical |
| Template | `greetingTemplate.js` | Yes — byte-for-byte identical |

---

## src/FunctionApp — Azure Functions

### Tech Stack

| Component | Choice |
|---|---|
| Runtime | Node.js 22 |
| Functions Version | v4 |
| Trigger | HTTP Trigger |
| Auth | Anonymous |
| npm Packages | `@azure/functions` |

### Key Files

| File | Responsibility |
|---|---|
| `package.json` | Project config, `"main": "src/index.js"`, declares `@azure/functions` |
| `host.json` | Functions runtime config (`routePrefix: ""` for clean routes) |
| `local.settings.json` | Local dev settings |
| `src/index.js` | HTTP trigger — delegates to GreetingService + GreetingTemplate |
| `src/index.html` | Interactive HTML page (dark theme, particle canvas, neon UI) |
| `src/services/greetingService.js` | Business logic (plain class, no framework imports) |
| `src/services/greetingTemplate.js` | HTML page generator |

### Request/Response

```
GET/POST https://myfunctionappnodejs.azurewebsites.net/api/satdemofunc/{username}
Response: text/html — interactive page with particle animation + neon glow + confetti
```

### Run Locally

```bash
cd src/FunctionApp
npm install
func start
```

→ `http://localhost:7071/api/satdemofunc/world`

### Deploy

```bash
# 1. Create storage account (first-time only)
az storage account create \
  --name myfuncnodejssto \
  --resource-group DefaultResourceGroup-EA \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2

# 2. Create Function App (first-time only)
az functionapp create \
  --resource-group DefaultResourceGroup-EA \
  --consumption-plan-location eastasia \
  --runtime node \
  --runtime-version 22 \
  --functions-version 4 \
  --name MyFunctionAppNodeJs \
  --storage-account myfuncnodejssto \
  --os-type Linux

# 3. Configure app settings
STORE_CONN=$(az storage account show-connection-string \
  --name myfuncnodejssto \
  --resource-group DefaultResourceGroup-EA \
  --query connectionString -o tsv)

az functionapp config appsettings set \
  --name MyFunctionAppNodeJs \
  --resource-group DefaultResourceGroup-EA \
  --settings \
    "AzureWebJobsStorage=$STORE_CONN" \
    "FUNCTIONS_WORKER_RUNTIME=node" \
    "AzureWebJobsFeatureFlags=EnableWorkerIndexing"

# 4. Publish
cd src/FunctionApp
func azure functionapp publish MyFunctionAppNodeJs
```

---

## src/WebApp — Express.js HTTP Server

### Tech Stack

| Component | Choice |
|---|---|
| Runtime | Node.js 20 Alpine |
| Framework | Express.js |
| Container | Docker (single-stage build) |
| Port | 8080 |
| npm Packages | `express` |

### Key Files

| File | Responsibility |
|---|---|
| `package.json` | Project config, `"main": "src/index.js"`, declares `express` |
| `Dockerfile` | Docker image build (node:20-alpine) |
| `.dockerignore` | Docker ignore rules |
| `src/index.js` | Express server — home page, API route, health probes |
| `src/index.html` | Interactive HTML page (identical to FunctionApp) |
| `src/services/greetingService.js` | Business logic (identical to FunctionApp) |
| `src/services/greetingTemplate.js` | HTML page generator (identical to FunctionApp) |

### Request/Response

```
GET/POST http://localhost:8080/api/satdemofunc/{username}
Response: text/html — interactive page with particle animation + neon glow + confetti
```

### Run Locally

```bash
cd src/WebApp
npm install
npm start
```

→ `http://localhost:8080`

### Docker Build & Run

```bash
cd src/WebApp
docker build -t myfunctionappnodejs-web .
docker run -p 8080:8080 myfunctionappnodejs-web
```

### Kubernetes Deploy

```bash
# One-click
./deploy.sh

# Or step-by-step
kubectl apply -k k8s/
kubectl -n myfunctionapp port-forward svc/myfunctionapp-web 8080:80
```

See [docs/deploy.md](docs/deploy.md) for full K8s deployment details.

---

## Migrating from FunctionApp to WebApp

### Migration Steps

#### 1. package.json — Switch Dependencies

```diff
- "dependencies": {
-   "@azure/functions": "^4.0.0"
- }

+ "dependencies": {
+   "express": "^4.21.0"
+ }
```

Remove `@azure/functions`, add `express`.

#### 2. Entry Point — Switch Hosting Model

```diff
- const { app } = require('@azure/functions');
- const { GreetingService } = require('../services/greetingService');
- 
- const greetingService = new GreetingService((msg) => console.log(msg));
- 
- app.http('SATDemoFunc', {
-   methods: ['GET', 'POST'],
-   authLevel: 'anonymous',
-   route: 'api/satdemofunc/{username}',
-   handler: async (request, context) => {
-     const result = greetingService.handle(request.params.username);
-     return {
-       status: 200,
-       headers: { 'Content-Type': 'text/html; charset=utf-8' },
-       body: html,
-     };
-   },
- });

+ const express = require('express');
+ const { GreetingService } = require('./services/greetingService');
+ 
+ const app = express();
+ const greetingService = new GreetingService((msg) => console.log(msg));
+ 
+ app.all('/api/satdemofunc/:username', (req, res) => {
+   const result = greetingService.handle(req.params.username);
+   res.set('Content-Type', 'text/html; charset=utf-8');
+   res.send(html);
+ });
+ 
+ app.listen(process.env.PORT || 8080);
```

Replace `app.http()` DSL with Express `app.all()`. Replace `return { status, body }` with `res.send()`.

#### 3. Route Syntax — `{param}` → `:param`

```diff
- route: 'api/satdemofunc/{username}',
+ app.all('/api/satdemofunc/:username', ...)
```

#### 4. Request/Response — Functions → Express

| Azure Functions v4 | Express.js |
|---|---|
| `request.params.username` | `req.params.username` |
| `return { status, headers, body }` | `res.status(200).set(...).send(body)` |
| `context.log(...)` | `console.log(...)` |
| Port managed by host (7071) | `app.listen(8080)` |

#### 5. Business Code — No Changes Needed

`greetingService.js`, `greetingTemplate.js`, and `index.html` remain identical. Just copy them over.

#### 6. Remove Functions-Specific Files

```
Remove: host.json, local.settings.json
```

#### 7. Add Container & Orchestration Support

```
Add: Dockerfile, .dockerignore, k8s/ (namespace + deployment + service + ingress + hpa)
```

---

### Migration Checklist

- [ ] `package.json`: remove `@azure/functions`, add `express`
- [ ] Entry point: `app.http()` → `app.all()`
- [ ] Routes: `{param}` → `:param`
- [ ] Response: `return { status, body }` → `res.send()`
- [ ] Add `app.listen(PORT)` for explicit port binding
- [ ] Add health probes: `/healthz`, `/readyz`
- [ ] Remove: `host.json`, `local.settings.json`
- [ ] Add: `Dockerfile`, `.dockerignore`
- [ ] Add: K8s manifests (`deployment.yaml`, `service.yaml`, `ingress.yaml`, `hpa.yaml`)
- [ ] Business code: **no changes needed**