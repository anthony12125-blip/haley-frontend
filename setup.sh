#!/bin/bash

# HaleyOS Frontend Setup Script
# This script helps set up and deploy the HaleyOS frontend

set -e

echo "=================================================="
echo "  HaleyOS Frontend v1.0 - Setup Script"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm found: $(npm --version)"

echo ""
print_info "Starting setup process..."
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Check for .env.local file
if [ ! -f .env.local ]; then
    print_info ".env.local not found. Creating from template..."
    cp .env.example .env.local
    print_success "Created .env.local from template"
    echo ""
    print_info "⚠️  IMPORTANT: Please edit .env.local and add your Firebase credentials"
    echo ""
    echo "You need to set the following variables:"
    echo "  - NEXT_PUBLIC_FIREBASE_API_KEY"
    echo "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    echo "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    echo "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    echo "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    echo "  - NEXT_PUBLIC_FIREBASE_APP_ID"
    echo "  - NEXT_PUBLIC_BACKEND_URL"
    echo ""
    read -p "Press Enter to continue after editing .env.local..."
else
    print_success ".env.local already exists"
fi

echo ""

# Step 3: Verify wallpaper exists
if [ ! -f public/wallpaper.png ]; then
    print_error "Wallpaper image not found at public/wallpaper.png"
    print_info "Please ensure the Milky Way wallpaper is placed at public/wallpaper.png"
    exit 1
fi

print_success "Wallpaper image found"

echo ""

# Step 4: Build the project
echo "Step 4: Building the project..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

echo ""
echo "=================================================="
print_success "Setup completed successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Development mode:"
echo "     npm run dev"
echo ""
echo "  2. Production mode:"
echo "     npm start"
echo ""
echo "  3. Deploy to Vercel:"
echo "     vercel deploy"
echo ""
echo "  4. Deploy to Firebase:"
echo "     firebase deploy"
echo ""
print_info "The application will be available at http://localhost:3000"
echo ""
