#!/bin/bash

# Frontend Deployment Script
# Usage: ./deploy.sh [vercel|railway|docker|build]

set -e

DEPLOY_TYPE=${1:-vercel}
PROJECT_NAME="school-management-front-end"

echo "🚀 Starting deployment for $PROJECT_NAME..."

case $DEPLOY_TYPE in
  vercel)
    echo "📦 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
      echo "❌ Vercel CLI not found. Installing..."
      npm install -g vercel
    fi
    
    # Check if logged in
    if ! vercel whoami &> /dev/null; then
      echo "🔐 Please login to Vercel..."
      vercel login
    fi
    
    # Deploy
    echo "🚢 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployment complete!"
    ;;
    
  railway)
    echo "📦 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
      echo "❌ Railway CLI not found. Installing..."
      npm install -g @railway/cli
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
      echo "🔐 Please login to Railway..."
      railway login
    fi
    
    # Link to project if not already linked
    if [ ! -f .railway/project.json ]; then
      echo "🔗 Linking to Railway project..."
      railway link
    fi
    
    # Deploy
    echo "🚢 Deploying to Railway..."
    railway up
    
    echo "✅ Deployment complete!"
    ;;
    
  docker)
    echo "🐳 Building Docker image..."
    
    # Get API URL from environment or prompt
    if [ -z "$NEXT_PUBLIC_API_URL" ]; then
      read -p "Enter backend API URL (e.g., http://localhost:3001/api): " API_URL
      export NEXT_PUBLIC_API_URL=${API_URL:-http://localhost:3001/api}
    fi
    
    docker build --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL -t $PROJECT_NAME:latest .
    
    echo "✅ Docker image built: $PROJECT_NAME:latest"
    echo "📝 Run with: docker run -p 3000:3000 $PROJECT_NAME:latest"
    ;;
    
  build)
    echo "🔨 Building application..."
    npm install
    npm run build
    echo "✅ Build complete!"
    ;;
    
  *)
    echo "❌ Unknown deployment type: $DEPLOY_TYPE"
    echo "Usage: ./deploy.sh [vercel|railway|docker|build]"
    exit 1
    ;;
esac

