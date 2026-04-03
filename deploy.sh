#!/bin/bash
set -e

# ═══════════════════════════════════════════
#  Dropzy Admin Dashboard — Manual Deploy
#  Run this on EC2: bash deploy.sh
# ═══════════════════════════════════════════

EC2_IP="18.60.129.43"
API_URL="http://${EC2_IP}:8080/api/v1"
ADMIN_DIR="/home/ubuntu/dropzy-admin"

echo "╔═══════════════════════════════════════════╗"
echo "║  Deploying Dropzy Admin Dashboard         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ─── Step 1: Ensure project files are on EC2 ───
echo "📁 Setting up project directory..."
mkdir -p "$ADMIN_DIR"
cd "$ADMIN_DIR"

# If running from repo, copy files; otherwise expect git clone
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found. Clone the repo first:"
  echo "   git clone <your-repo-url> $ADMIN_DIR"
  exit 1
fi

# ─── Step 2: Build Docker image ───
echo ""
echo "🔨 Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  -t dropzy-admin:latest \
  .

# ─── Step 3: Stop old container ───
echo ""
echo "🛑 Stopping old containers..."
docker stop dropzy-admin 2>/dev/null || true
docker rm dropzy-admin 2>/dev/null || true

# ─── Step 4: Run new container ───
echo ""
echo "🚀 Starting admin dashboard..."
docker run -d \
  --name dropzy-admin \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL="$API_URL" \
  dropzy-admin:latest

# ─── Step 5: Setup Nginx (first time) ───
if ! docker ps -q -f name=dropzy-nginx | grep -q .; then
  echo ""
  echo "🌐 Setting up Nginx reverse proxy..."

  mkdir -p /home/ubuntu/nginx
  cat > /home/ubuntu/nginx/default.conf << 'EOF'
upstream nextjs {
    server 127.0.0.1:3000;
}
upstream gobackend {
    server 127.0.0.1:8080;
}
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://gobackend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /_next/static/ {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml text/javascript image/svg+xml;
    client_max_body_size 20M;
}
EOF

  docker run -d \
    --name dropzy-nginx \
    --restart unless-stopped \
    --network host \
    -v /home/ubuntu/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
    nginx:alpine

  echo "✅ Nginx started on port 80"
else
  echo ""
  echo "🔄 Reloading Nginx..."
  docker exec dropzy-nginx nginx -s reload
fi

# ─── Step 6: Health checks ───
echo ""
echo "⏳ Waiting for startup..."
sleep 8

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  Health Check Results                     ║"
echo "╚═══════════════════════════════════════════╝"

ADMIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://localhost:3000/" || echo "000")
API_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://localhost:8080/api/v1/health" || echo "000")
NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://localhost:80/" || echo "000")

echo "  Admin  (3000) : $ADMIN_HTTP"
echo "  API    (8080) : $API_HTTP"
echo "  Nginx  (80)   : $NGINX_HTTP"
echo ""

if [ "$ADMIN_HTTP" = "200" ] && [ "$NGINX_HTTP" = "200" ]; then
  echo "✅ Deployment successful!"
  echo ""
  echo "  🌐 Admin Dashboard : http://${EC2_IP}"
  echo "  🔌 API Backend     : http://${EC2_IP}:8080/api/v1"
  echo "  🏥 API Health      : http://${EC2_IP}:8080/api/v1/health"
else
  echo "⚠️  Something may be off. Check logs:"
  echo "  docker logs dropzy-admin --tail 20"
  echo "  docker logs dropzy-nginx --tail 20"
fi

# Cleanup
docker image prune -f 2>/dev/null || true
echo ""
echo "Done! 🎉"
