#!/bin/bash
set -euo pipefail

# ============================================================
# MyFunctionApp Web — Kubernetes Deploy Script
# ============================================================

NAMESPACE="myfunctionapp"
IMAGE_NAME="myfunctionappnodejs-web"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"  # e.g. "myregistry.azurecr.io/" (include trailing slash)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── 1. Build Docker Image ──────────────────────────────────
echo "==> Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"

docker build \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  -f "${ROOT_DIR}/src/WebApp/Dockerfile" \
  "${ROOT_DIR}/src/WebApp"

# ── 2. Push to Registry (if REGISTRY is set) ───────────────
if [ -n "$REGISTRY" ]; then
  REMOTE="${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
  echo "==> Tagging & pushing: ${REMOTE}"
  docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${REMOTE}"
  docker push "${REMOTE}"
fi

# ── 3. Deploy to Kubernetes ────────────────────────────────
echo "==> Deploying to Kubernetes (namespace: ${NAMESPACE})"

kubectl apply -k "${SCRIPT_DIR}/k8s"

# ── 4. Wait for rollout ────────────────────────────────────
echo "==> Waiting for rollout..."

kubectl -n "${NAMESPACE}" rollout status deployment/myfunctionapp-web --timeout=120s

# ── 5. Show status ─────────────────────────────────────────
echo ""
echo "Done. Status:"
kubectl -n "${NAMESPACE}" get all,ingress,hpa

echo ""
echo "Port-forward to test locally:"
echo "  kubectl -n ${NAMESPACE} port-forward svc/myfunctionapp-web 8080:80"
echo "  → http://localhost:8080"
