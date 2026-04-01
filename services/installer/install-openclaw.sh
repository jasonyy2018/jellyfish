#!/usr/bin/env bash
set -euo pipefail

echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "Pulling OpenClaw..."
docker pull openclaw/openclaw:latest

echo "Installing Playwright..."
docker run --rm openclaw/openclaw:latest npx playwright install

echo "Starting OpenClaw..."
docker run -d --name openclaw -p 3000:3000 openclaw/openclaw:latest

echo "OpenClaw installed."
