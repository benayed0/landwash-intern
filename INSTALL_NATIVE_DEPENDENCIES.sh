#!/bin/bash

# 📱 Landwash Native App - Dependency Installation Script
# This script installs all required Capacitor plugins and dependencies

echo "📱 Installing Capacitor and Native Plugins for Landwash App"
echo "==========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install Capacitor Core
echo -e "${BLUE}Step 1: Installing Capacitor Core...${NC}"
npm install @capacitor/core @capacitor/cli

# Step 2: Initialize Capacitor (you'll be prompted for app details)
echo -e "${BLUE}Step 2: Initializing Capacitor...${NC}"
echo -e "${YELLOW}When prompted:${NC}"
echo "  - App name: Landwash"
echo "  - App ID: com.landwash.app (or your preferred bundle ID)"
echo "  - Web asset directory: dist/landwash-intern/browser"
echo ""
npx cap init

# Step 3: Add iOS and Android platforms
echo -e "${BLUE}Step 3: Adding iOS and Android platforms...${NC}"
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# Step 4: Install all native plugins
echo -e "${BLUE}Step 4: Installing native plugins...${NC}"

# Push Notifications
echo "  → Installing Push Notifications plugin..."
npm install @capacitor/push-notifications

# Camera
echo "  → Installing Camera plugin..."
npm install @capacitor/camera

# Geolocation
echo "  → Installing Geolocation plugin..."
npm install @capacitor/geolocation

# Local Notifications
echo "  → Installing Local Notifications plugin..."
npm install @capacitor/local-notifications

# Share
echo "  → Installing Share plugin..."
npm install @capacitor/share

# App
echo "  → Installing App plugin..."
npm install @capacitor/app

# Haptics
echo "  → Installing Haptics plugin..."
npm install @capacitor/haptics

# Status Bar
echo "  → Installing Status Bar plugin..."
npm install @capacitor/status-bar

# Splash Screen
echo "  → Installing Splash Screen plugin..."
npm install @capacitor/splash-screen

# Network
echo "  → Installing Network plugin..."
npm install @capacitor/network

# Step 5: Install Angular CDK (if not already installed)
echo -e "${BLUE}Step 5: Checking Angular CDK (required for Platform detection)...${NC}"
npm install @angular/cdk

echo ""
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Build your Angular app: ${BLUE}npm run build${NC}"
echo "2. Sync to native platforms: ${BLUE}npx cap sync${NC}"
echo "3. Open iOS in Xcode: ${BLUE}npx cap open ios${NC}"
echo "4. Open Android in Android Studio: ${BLUE}npx cap open android${NC}"
echo ""
echo "For detailed setup instructions, see:"
echo "  - MOBILE_SETUP.md"
echo "  - IMPLEMENTATION_GUIDE.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
