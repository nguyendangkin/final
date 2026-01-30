#!/bin/bash
# ==============================================
# iCheck Auto Deployment Script
# Domain: 4gach.com | API: api.4gach.com
# Usage: chmod +x deploy.sh && ./deploy.sh
# ==============================================

set -e

echo "🚀 iCheck Deployment Starting..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env not found. Creating from template...${NC}"
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo -e "${RED}❌ Please edit .env with your secrets, then run this script again.${NC}"
        echo "   nano .env"
        exit 1
    else
        echo -e "${RED}❌ .env.production template not found!${NC}"
        exit 1
    fi
fi

# Step 1: Check DNS
echo ""
echo "📡 Step 1: Checking DNS..."
VPS_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short 4gach.com | head -1)
API_IP=$(dig +short api.4gach.com | head -1)

echo "   VPS IP: $VPS_IP"
echo "   4gach.com: $DOMAIN_IP"
echo "   api.4gach.com: $API_IP"

if [ "$VPS_IP" != "$DOMAIN_IP" ] || [ "$VPS_IP" != "$API_IP" ]; then
    echo -e "${RED}❌ DNS not pointing to this VPS! Please fix DNS first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ DNS OK${NC}"

# Step 2: Create directories
echo ""
echo "📁 Step 2: Creating directories..."
mkdir -p certbot/www certbot/conf
echo -e "${GREEN}✅ Directories created${NC}"

# Step 3: Restore nginx HTTPS config
echo ""
echo "🔧 Step 3: Restoring nginx config..."
git checkout nginx/conf.d/default.conf 2>/dev/null || echo "   Using existing config"
echo -e "${GREEN}✅ Nginx config ready${NC}"

# Step 4: Build Docker images
echo ""
echo "🔨 Step 4: Building Docker images (this may take a few minutes)..."
docker compose build --no-cache
echo -e "${GREEN}✅ Images built${NC}"

# Step 5: Get SSL Certificate
echo ""
echo "🔐 Step 5: Getting SSL Certificate..."
docker compose down 2>/dev/null || true

# Check if certificate already exists
if [ -d "certbot/conf/live/4gach.com" ]; then
    echo "   Certificate already exists, skipping..."
else
    echo "   Requesting certificate from Let's Encrypt..."
    docker compose run --rm -p 80:80 --entrypoint "certbot" certbot certonly \
        --standalone \
        --email nguyenchin0077@gmail.com \
        --agree-tos \
        --no-eff-email \
        -d 4gach.com \
        -d api.4gach.com
fi
echo -e "${GREEN}✅ SSL Certificate ready${NC}"

# Step 6: Start all services
echo ""
echo "🚀 Step 6: Starting all services..."
docker compose up -d
echo -e "${GREEN}✅ Services started${NC}"

# Step 7: Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Step 8: Health check
echo ""
echo "🏥 Step 8: Health check..."
docker compose ps

echo ""
echo "Testing endpoints..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://4gach.com || echo "000")
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.4gach.com/health || echo "000")

echo "   Frontend (https://4gach.com): $HTTP_STATUS"
echo "   Backend (https://api.4gach.com/health): $API_STATUS"

if [ "$HTTP_STATUS" == "200" ] && [ "$API_STATUS" == "200" ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "   🌐 Frontend: https://4gach.com"
    echo "   🔌 API: https://api.4gach.com"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Some services may not be ready yet.${NC}"
    echo "   Check logs: docker compose logs -f"
fi
