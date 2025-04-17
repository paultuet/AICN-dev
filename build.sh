#!/bin/bash
set -e

echo "🏗️ Building AICN for deployment..."

# Build frontend
echo "📦 Building frontend..."
cd packages/frontend
pnpm install
pnpm build
cd ../..

# Create resources directory in backend if it doesn't exist
mkdir -p packages/backend/resources/public

# Copy frontend build to backend resources
echo "🔄 Copying frontend assets to backend..."
cp -r packages/frontend/dist/* packages/backend/resources/public/

echo "✅ Build completed successfully!"