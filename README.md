# MyFunctionApp (Node.js)

Demonstrates refactoring Azure Functions (serverless) into a general-purpose containerized web server, with **zero changes to business logic**.

The same code runs under both:
- **Azure Functions** (serverless HTTP trigger)
- **Express.js** (containerized web server via Docker)

Both serve the same interactive HTML UI at their endpoint, sharing identical `index.html`.

## Live Demo

| Project | URL |
|---|---|
| FunctionApp | https://myfunctionappnodejs.azurewebsites.net/api/satdemofunc/world |

> Opens a dark-themed interactive page with particle animation, neon glow, and confetti. The name in the URL is auto-filled and greeted.

## Project Structure

```
MyFunctionAppNodeJs/
├── src/
│   ├── FunctionApp/                        # Azure Functions project (v4, Node.js)
│   │   ├── package.json
│   │   ├── host.json                       # routePrefix: "" for clean routes
│   │   ├── local.settings.json
│   │   └── src/
│   │       ├── index.html                  # Interactive HTML UI (dark theme)
│   │       ├── functions/
│   │       │   └── SATDemoFunc.js          # Reads index.html, serves at /api/satdemofunc/{username}
│   │       └── services/
│   │           └── greetingService.js      # Business logic (kept as reference)
│   └── WebApp/                             # Express.js container app
│       ├── package.json
│       ├── Dockerfile
│       ├── .dockerignore
│       └── src/
│           ├── index.js                    # Express server entry point
│           ├── public/
│           │   └── index.html              # Interactive HTML UI (dark theme)
│           └── services/
│               ├── greetingService.js      # Business logic
│               └── greetingTemplate.js     # HTML page generator
├── .github/workflows/                      # CI/CD pipeline
├── .vscode/                                # VS Code editor configs
└── docs/
    └── deploy.md                           # Deployment guide
```

## HTTP Endpoints

| Route | Method | Description |
|---|---|---|
| FunctionApp: `/api/satdemofunc/{username}` | GET, POST | Interactive HTML page, username auto-greeted |
| WebApp: `/` | GET | Interactive HTML page (landing page) |
| WebApp: `/api/satdemofunc/:username` | GET, POST | Greeting HTML page |

All endpoints return `text/html; charset=utf-8`.

## Shared Files

| File | FunctionApp | WebApp |
|---|---|---|
| `index.html` | Served directly by SATDemoFunc | Served at `/` via express.static |
| `greetingService.js` | Kept as reference | Used by index.js |

## Local Development

### Prerequisites
- [Node.js 22+](https://nodejs.org/)
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local) v4

### Run the FunctionApp

```bash
cd src/FunctionApp
npm install
func start
```

- **Page:** http://localhost:7071/api/satdemofunc/world

### Run the WebApp

```bash
cd src/WebApp
npm install
npm start
```

- **Landing:** http://localhost:8080
- **API:** http://localhost:8080/api/satdemofunc/world

### Run the WebApp with Docker

```bash
cd src/WebApp
docker build -t myfunctionappnodejs-web .
docker run -p 8080:8080 myfunctionappnodejs-web
```

## Architecture

| Concern | FunctionApp | WebApp |
|---|---|---|
| Framework | Azure Functions v4 | Express.js |
| Entry | 1 function: SATDemoFunc (HTTP trigger) | Express routes |
| HTML UI | Served directly at API endpoint | `/` (landing) + `/api/...` (greeting) |
| Port | Dynamic (default 7071) | 8080 |
| Container | N/A (PaaS) | Dockerfile |
| Response | HTML page | HTML page |

## Deployment

See [docs/deploy.md](docs/deploy.md) for Azure deployment instructions.
