#!/bin/bash

# HaleyOS Frontend - Cloud Run Deployment Script
# This script deploys the frontend to Google Cloud Run

set -e  # Exit on any error

echo "🚀 HaleyOS Frontend Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="haley-front-end"
REGION="us-central1"
SERVICE_NAME="haley-frontend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Step 2: Set project
echo "🔧 Setting GCP project..."
gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✅ Project set to ${PROJECT_ID}${NC}"
echo ""

# Step 3: Choose deployment method
echo "Choose deployment method:"
echo "1) Cloud Build (Recommended - builds in cloud)"
echo "2) Local Docker Build + Deploy"
echo "3) Quick deploy (use existing image)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Deploying via Cloud Build..."
        gcloud builds submit --config=cloudbuild.yaml .
        ;;
    2)
        echo ""
        echo "🐋 Building Docker image locally..."
        
        # Clean build
        echo "Cleaning previous build artifacts..."
        rm -rf node_modules .next package-lock.json
        
        # Build image
        docker build \
            -f Dockerfile.cloudrun \
            -t ${IMAGE_NAME}:latest \
            --build-arg NEXT_PUBLIC_BACKEND_URL=https://logic-engine-core2-409495160162.us-central1.run.app \
            --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAOnz3gs5iUYfVZrGjGNC-QfsBujvMYBQ4 \
            --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=haley-front-end.firebaseapp.com \
            --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=haley-front-end \
            --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=haley-front-end.firebasestorage.app \
            --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415166601162 \
            --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=1:415166601162:web:2964033f8f8567b0e92133 \
            .
        
        echo -e "${GREEN}✅ Docker image built${NC}"
        echo ""
        
        # Test locally
        read -p "Test locally first? (y/n): " test_local
        if [ "$test_local" = "y" ]; then
            echo "Starting local test server on http://localhost:3000"
            echo "Press Ctrl+C to stop and continue deployment"
            docker run -p 3000:3000 ${IMAGE_NAME}:latest
        fi
        
        echo ""
        echo "📤 Pushing image to GCR..."
        docker push ${IMAGE_NAME}:latest
        echo -e "${GREEN}✅ Image pushed${NC}"
        echo ""
        
        echo "🚀 Deploying to Cloud Run..."
        gcloud run deploy ${SERVICE_NAME} \
            --image ${IMAGE_NAME}:latest \
            --platform managed \
            --region ${REGION} \
            --allow-unauthenticated \
            --port 3000 \
            --memory 512Mi \
            --cpu 1 \
            --max-instances 4 \
            --min-instances 0
        ;;
    3)
        echo ""
        echo "⚡ Quick deploy using latest image..."
        gcloud run deploy ${SERVICE_NAME} \
            --image ${IMAGE_NAME}:latest \
            --platform managed \
            --region ${REGION} \
            --allow-unauthenticated
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}======================================"
echo "✅ Deployment Complete!"
echo "======================================${NC}"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📊 View logs:"
echo "   gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "🔍 Check status:"
echo "   gcloud run services describe ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "✨ Test the application:"
echo "   curl ${SERVICE_URL}"
echo "   or visit ${SERVICE_URL} in your browser"
echo ""
