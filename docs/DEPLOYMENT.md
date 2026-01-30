# Hướng Dẫn Triển Khai iCheck

## Thông Tin Deployment
- **Domain**: `4gach.com`
- **API**: `api.4gach.com`
- **Stack**: Docker + Nginx + Let's Encrypt

---

## 📋 Yêu Cầu VPS

| Yêu cầu | Tối thiểu |
|---------|-----------|
| RAM | 2GB |
| Storage | 20GB SSD |
| OS | Ubuntu 22.04+ |
| Docker | 24.0+ |
| Docker Compose | 2.20+ |

---

## 🚀 Các Bước Triển Khai

### Bước 1: Cài Đặt Docker (nếu chưa có)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Bước 2: Cấu Hình DNS

Trỏ DNS về IP của VPS:
```
4gach.com       → A Record → [VPS_IP]
api.4gach.com   → A Record → [VPS_IP]
```

⏳ Đợi DNS propagate (5-30 phút)

### Bước 3: Clone Project

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/iCheck.git
cd iCheck

# Set permissions
sudo chown -R $USER:$USER /opt/iCheck
```

### Bước 4: Cấu Hình Environment

```bash
# Copy template
cp .env.production .env

# Edit với giá trị thật
nano .env
```

**⚠️ Thay đổi các giá trị sau:**
```env
DATABASE_PASSWORD=<mật-khẩu-mạnh>
JWT_SECRET=<secret-ngẫu-nhiên>
GOOGLE_CLIENT_ID=<client-id-từ-google>
GOOGLE_CLIENT_SECRET=<client-secret-từ-google>
```

**Tạo mật khẩu mạnh:**
```bash
# Database password
openssl rand -base64 32

# JWT Secret
node -e "console.log(require('crypto').randomUUID())"
```

### Bước 5: Cấu Hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Chọn OAuth 2.0 Client → Web Application
3. Thêm **Authorized redirect URI**:
   ```
   https://api.4gach.com/auth/google/callback
   ```
4. Thêm **Authorized JavaScript origins**:
   ```
   https://4gach.com
   https://api.4gach.com
   ```

### Bước 6: Lấy SSL Certificate

```bash
# Tạo thư mục cần thiết
mkdir -p certbot/www certbot/conf

# Dùng config initial (không có SSL)
cp nginx/conf.d/default.conf.initial nginx/conf.d/default.conf

# Khởi động nginx với HTTP
docker compose up -d nginx

# Lấy SSL certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d 4gach.com \
  -d api.4gach.com

# Kiểm tra certificate
ls certbot/conf/live/4gach.com/
```

### Bước 7: Chuyển Sang HTTPS Config

```bash
# Backup initial config
mv nginx/conf.d/default.conf nginx/conf.d/default.conf.backup

# Restore full SSL config
cp nginx/conf.d/default.conf.initial.backup nginx/conf.d/default.conf
# Hoặc tạo lại từ template gốc
```

**Quan trọng**: File `nginx/conf.d/default.conf` trong repo đã có config HTTPS đầy đủ. Chỉ cần khôi phục nó:

```bash
# Khôi phục config HTTPS
git checkout nginx/conf.d/default.conf
```

### Bước 8: Build & Start Services

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Bước 9: Verify Deployment

```bash
# Health check backend
curl -s https://api.4gach.com/health | jq

# Check frontend
curl -I https://4gach.com

# Check SSL certificate
openssl s_client -connect 4gach.com:443 -servername 4gach.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔧 Các Lệnh Hữu Ích

```bash
# Restart all services
docker compose restart

# Stop all services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Rebuild single service
docker compose build backend
docker compose up -d backend

# Enter container shell
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d icheck

# SSL Certificate Renewal (auto via certbot service)
docker compose run --rm certbot renew
```

---

## ⚠️ Troubleshooting

### 1. SSL Certificate Failed
```bash
# Check DNS
nslookup 4gach.com
nslookup api.4gach.com

# Check port 80 is open
sudo ufw allow 80
sudo ufw allow 443
```

### 2. Database Connection Failed
```bash
# Check postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Manual connection test
docker compose exec postgres psql -U postgres -d icheck -c "SELECT 1"
```

### 3. Google OAuth Failed
- Kiểm tra callback URL khớp với config
- Kiểm tra origin URL trong Google Console
- Clear browser cache và thử lại

### 4. 502 Bad Gateway
```bash
# Check backend is running
docker compose ps backend
docker compose logs backend

# Rebuild if needed
docker compose build backend
docker compose up -d backend
```

---

## 📊 Monitoring

### Health Check Endpoints
- Backend: `https://api.4gach.com/health`
- Frontend: `https://4gach.com`

### Resource Usage
```bash
docker stats
```

### Disk Space
```bash
# Check Docker disk usage
docker system df

# Cleanup unused images
docker system prune -a
```

---

## 🔄 SSL Auto-Renewal

Certbot service tự động renew certificate mỗi 12 giờ. Kiểm tra:

```bash
# Check certbot container
docker compose logs certbot

# Manual renew test
docker compose run --rm certbot renew --dry-run
```

---

## 📁 File Structure

```
/opt/iCheck/
├── .env                    # Production secrets
├── docker-compose.yml      # Docker orchestration
├── backend/
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── nginx/
│   └── conf.d/
│       ├── default.conf         # HTTPS config
│       └── default.conf.initial # Initial HTTP config
└── certbot/
    ├── www/                # ACME challenge files
    └── conf/               # SSL certificates
```
