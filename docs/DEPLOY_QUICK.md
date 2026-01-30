# iCheck Deployment - Hướng Dẫn Nhanh

## Quick Start (5 bước)

```bash
# 1. Clone & Setup
cd /opt && sudo git clone <repo> iCheck && cd iCheck
cp .env.production .env && nano .env

# 2. SSL Certificate  
mkdir -p certbot/{www,conf}
cp nginx/conf.d/default.conf.initial nginx/conf.d/default.conf
docker compose up -d nginx
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d 4gach.com -d api.4gach.com --email your@email.com --agree-tos

# 3. Enable HTTPS
git checkout nginx/conf.d/default.conf

# 4. Deploy
docker compose build && docker compose up -d

# 5. Verify
curl https://api.4gach.com/health
```

📖 Chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md)
