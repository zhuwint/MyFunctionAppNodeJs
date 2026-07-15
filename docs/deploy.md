# Deployment Guide

---

## Deploy the FunctionApp to Azure

### Prerequisites

- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local) v4

### Current Deployment

| Resource | Name | Region |
|---|---|---|
| Function App | `MyFunctionAppNodeJs` | East Asia |
| Resource Group | `DefaultResourceGroup-EA` | East Asia |
| Storage Account | `myfuncnodejssto` | East Asia |
| Plan | Linux Consumption (Dynamic) | East Asia |
| Runtime | Node.js 22 | — |

| Endpoint | URL |
|---|---|
| Greeting API | `https://myfunctionappnodejs.azurewebsites.net/api/satdemofunc/{username}` |

Returns a full interactive HTML page with particle animation, neon-styled glassmorphism card, shimmer greeting text, and confetti effects. The username from the URL path is auto-filled and greeted on load.

### 1. Login

```bash
az login
```

### 2. Create Azure Resources (first-time only)

```bash
# Resource group (skip if using existing)
az group create --name DefaultResourceGroup-EA --location eastasia

# Storage account (name must be globally unique)
az storage account create \
  --name myfuncnodejssto \
  --resource-group DefaultResourceGroup-EA \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2

# Function App — Linux Consumption, Node.js 22
az functionapp create \
  --name MyFunctionAppNodeJs \
  --resource-group DefaultResourceGroup-EA \
  --storage-account myfuncnodejssto \
  --consumption-plan-location eastasia \
  --runtime node \
  --runtime-version 22 \
  --functions-version 4 \
  --os-type Linux

# Configure app settings
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
```

> **Note:** Node.js 20 reached EOL on 2026-04-30. Use version 22 or 24.

### 3. Publish

```bash
cd src/FunctionApp
npm install
func azure functionapp publish MyFunctionAppNodeJs
```

### 4. Verify

```bash
# Interactive HTML page with auto-greet
curl -s https://myfunctionappnodejs.azurewebsites.net/api/satdemofunc/world \
  | grep -o '<title>.*</title>'
# → <title>MyFunctionApp - Node.js</title>
```

### 5. GitHub Actions (CI/CD)

The `.github/workflows/main_function-demo.yml` workflow auto-deploys on push to `main`.

Configure GitHub Secrets for OIDC authentication:

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | Service principal client ID |
| `AZURE_TENANT_ID` | `c42e21ca-5dbb-4777-b47e-b2aabe1cc7fe` |
| `AZURE_SUBSCRIPTION_ID` | `f7f53d90-8eb1-4b5d-8d05-1e8b0d361330` |

---

## Deploy the WebApp (Container)

### Build Docker Image

```bash
cd src/WebApp
docker build -t myfunctionappnodejs-web .
docker run -p 8080:8080 myfunctionappnodejs-web
```

Open `http://localhost:8080` for the interactive UI, or `http://localhost:8080/api/satdemofunc/world` for the API HTML page.

---

## Kubernetes Deployment

### Project Layout

```
k8s/
├── namespace.yaml        # Creates myfunctionapp namespace
├── deployment.yaml       # 3 replicas, RollingUpdate, resource limits, probes
├── service.yaml          # ClusterIP on port 80 → container 8080
├── ingress.yaml          # nginx ingress + TLS (cert-manager)
├── hpa.yaml              # CPU 70% / Memory 80%, 2–10 replicas
├── kustomization.yaml    # Kustomize entry point
deploy.sh                 # One-click build + push + deploy
```

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- A container registry (Docker Hub, ACR, ECR, GCR, etc.)

### Quick Deploy (One Command)

```bash
# Deploy to current kubectl context
./deploy.sh

# With remote registry
REGISTRY=myregistry.azurecr.io/ IMAGE_TAG=v1.0.0 ./deploy.sh
```

### Step-by-Step

```bash
# 1. Build
docker build -t myfunctionappnodejs-web:latest -f src/WebApp/Dockerfile src/WebApp

# 2. Push to registry
docker tag myfunctionappnodejs-web:latest myregistry.azurecr.io/myfunctionappnodejs-web:latest
docker push myregistry.azurecr.io/myfunctionappnodejs-web:latest

# 3. Deploy
kubectl apply -k k8s/

# 4. Wait for rollout
kubectl -n myfunctionapp rollout status deployment/myfunctionapp-web --timeout=120s

# 5. Status
kubectl -n myfunctionapp get all,ingress,hpa
```

### Local Testing (Port-Forward)

```bash
kubectl -n myfunctionapp port-forward svc/myfunctionapp-web 8080:80

# → http://localhost:8080
# → http://localhost:8080/api/satdemofunc/foo
```

### Ingress (Internet Exposure)

Edit `k8s/ingress.yaml` — replace `myfunctionapp.example.com` with your domain:

```yaml
spec:
  tls:
    - hosts:
        - myfunctionapp.example.com   # ← your domain
      secretName: myfunctionapp-tls
  rules:
    - host: myfunctionapp.example.com   # ← your domain
```

For automatic TLS with Let's Encrypt, install cert-manager:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

Then set the ingress annotation: `cert-manager.io/cluster-issuer: letsencrypt-prod`.

### Resource Limits

| Resource | Request | Limit |
|---|---|---|
| CPU | 100m | 500m |
| Memory | 128Mi | 256Mi |

### Auto-Scaling (HPA)

| Metric | Target | Min | Max |
|---|---|---|---|
| CPU | 70% | 2 | 10 |
| Memory | 80% | 2 | 10 |

Scale-down stabilization: 5 min. Scale-up stabilization: 1 min.

### Health Probes

| Probe | Path | Interval | Timeout |
|---|---|---|---|
| Liveness | `/healthz` | 15s | 3s |
| Readiness | `/readyz` | 5s | 2s |

---

## Azure Container Apps (Alternative)

```bash
az containerapp create \
  --name myfunctionappnodejs-web \
  --resource-group DefaultResourceGroup-EA \
  --environment myfunctionapp-env \
  --image myfunctionappnodejs-web:latest \
  --target-port 8080 \
  --ingress external
```

---

## Azure App Service — Container (Alternative)

```bash
az appservice plan create \
  --name myfunctionappnodejs-web-plan \
  --resource-group DefaultResourceGroup-EA \
  --location eastasia \
  --is-linux \
  --sku B1

az webapp create \
  --name myfunctionappnodejs-web \
  --resource-group DefaultResourceGroup-EA \
  --plan myfunctionappnodejs-web-plan \
  --deployment-container-image-name myfunctionappnodejs-web:latest

az webapp config appsettings set \
  --name myfunctionappnodejs-web \
  --resource-group DefaultResourceGroup-EA \
  --settings "PORT=8080"
```
