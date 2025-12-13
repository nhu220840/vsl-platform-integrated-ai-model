# VSL Platform - Docker Deployment Guide

## 📋 Tổng quan

Hệ thống VSL Platform bao gồm **5 services** chạy trong Docker containers:

| Service           | Port        | Mô tả                                          |
| ----------------- | ----------- | ---------------------------------------------- |
| **postgres**      | 5433 → 5432 | PostgreSQL 16 database                         |
| **elasticsearch** | 9200, 9300  | Elasticsearch 8.11.1 (tìm kiếm từ điển)        |
| **ai-service**    | 5000        | Python Flask (nhận diện cử chỉ + phục hồi dấu) |
| **backend**       | 8081 → 8080 | Spring Boot 3.3 (Java 21) API gateway          |
| **frontend**      | 3000        | Next.js 16 (React 19.2) web UI                 |

## 🚀 Khởi động hệ thống

### Bước 1: Di chuyển đến thư mục backend

```bash
cd vsl-platform-backend
```

### Bước 2: Build và khởi động tất cả services

```bash
docker-compose up -d --build
```

**Lưu ý**:

- `--build`: Build lại images (bắt buộc lần đầu tiên hoặc khi có thay đổi code)
- `-d`: Chạy ở chế độ background (detached mode)

### Bước 3: Kiểm tra trạng thái

```bash
# Xem tất cả containers
docker-compose ps

# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

### Bước 4: Chờ services khởi động hoàn tất

Thứ tự khởi động (với health checks):

1. **postgres** (10-20s)
2. **elasticsearch** (30-60s)
3. **ai-service** (20-40s)
4. **backend** (40-60s - chờ DB + ES + AI)
5. **frontend** (40-60s - chờ backend)

**Tổng thời gian**: ~2-3 phút cho lần đầu tiên.

## 🌐 Truy cập ứng dụng

| Service           | URL                                   | Mô tả                |
| ----------------- | ------------------------------------- | -------------------- |
| **Frontend**      | http://localhost:3000                 | Giao diện người dùng |
| **Backend API**   | http://localhost:8081/api             | REST API endpoints   |
| **Swagger UI**    | http://localhost:8081/swagger-ui.html | API documentation    |
| **Elasticsearch** | http://localhost:9200                 | ES cluster info      |
| **AI Service**    | http://localhost:5000/health          | Health check         |

## 🔧 Quản lý services

### Dừng tất cả services

```bash
docker-compose down
```

### Dừng và xóa volumes (⚠️ MẤT DỮ LIỆU)

```bash
docker-compose down -v
```

### Khởi động lại một service cụ thể

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild một service cụ thể

```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Xem resource usage

```bash
docker stats
```

## 🐛 Troubleshooting

### 1. Port conflicts

**Lỗi**: `Bind for 0.0.0.0:XXXX failed: port is already allocated`

**Giải pháp**: Dừng process đang dùng port hoặc đổi port trong `docker-compose.yml`

```bash
# Tìm process đang dùng port (ví dụ: 3000)
lsof -i :3000

# Hoặc
netstat -tulpn | grep 3000
```

### 2. Frontend không kết nối được Backend

**Kiểm tra**:

1. Backend đã khởi động chưa: `docker-compose logs backend | grep "Started"`
2. Health check: `curl http://localhost:8081/api/auth/login`
3. CORS config: Kiểm tra `CorsConfig.java`

**Lưu ý**: Frontend trong Docker dùng `http://backend:8080/api` (container-to-container), nhưng browser dùng `http://localhost:8081/api` (host-to-container).

### 3. AI Service không nhận diện được cử chỉ

**Kiểm tra**:

1. Models đã có trong `vsl-platform-ai-model/models/` chưa:
   - `scaler.pkl`
   - `model_mlp.pkl`
2. Health check: `curl http://localhost:5000/health`
3. Logs: `docker-compose logs ai-service`

### 4. Elasticsearch không khởi động

**Triệu chứng**: Backend báo lỗi "Connection refused" đến ES

**Giải pháp**:

```bash
# Xóa data cũ (⚠️ MẤT DỮ LIỆU)
sudo rm -rf elasticsearch-data/*

# Khởi động lại
docker-compose up -d elasticsearch
```

### 5. Database migration failed

**Triệu chứng**: Backend crash với lỗi "relation does not exist"

**Giải pháp**:

```bash
# Option 1: Xóa database và tạo lại (⚠️ MẤT DỮ LIỆU)
docker-compose down -v
docker-compose up -d postgres
docker-compose up -d backend

# Option 2: Chạy migration manually
docker exec -it vsl-backend java -jar app.jar --spring.jpa.hibernate.ddl-auto=create
```

### 6. Frontend build failed

**Lỗi**: `npm ERR!` hoặc `ENOENT` errors

**Giải pháp**:

```bash
# Xóa node_modules và build cache
cd vsl-platform-frontend
rm -rf node_modules .next

# Rebuild container
cd ../vsl-platform-backend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 📊 Kiểm tra Health Status

```bash
# Backend
curl http://localhost:8081/api/auth/login

# AI Service
curl http://localhost:5000/health

# Elasticsearch
curl http://localhost:9200/_cluster/health

# PostgreSQL
docker exec -it vsl-postgres psql -U postgres -d vsl_db -c "SELECT 1;"
```

## 🔐 Environment Variables

### Backend (`docker-compose.yml` → backend service)

```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/vsl_db
AI_SERVICE_URL: http://ai-service:5000/predict
SPRING_ELASTICSEARCH_URIS: http://elasticsearch:9200
JWT_SECRET: <your-secret-key>
```

### Frontend (`docker-compose.yml` → frontend service)

```yaml
NEXT_PUBLIC_API_URL: http://backend:8080/api # Container network
# Browser sẽ dùng: http://localhost:8081/api (CORS configured)
```

## 📝 Development vs Production

### Development (local)

```bash
# Backend (local dev - không dùng Docker backend)
cd vsl-platform-backend
./mvnw spring-boot:run

# Frontend (local dev - không dùng Docker frontend)
cd vsl-platform-frontend
npm run dev

# Chỉ khởi động infrastructure services
docker-compose up -d postgres elasticsearch ai-service
```

### Production (Docker)

```bash
# Tất cả services trong Docker
cd vsl-platform-backend
docker-compose up -d --build
```

## 🧹 Cleanup Commands

```bash
# Dừng và xóa containers
docker-compose down

# Xóa cả volumes (database + elasticsearch data)
docker-compose down -v

# Xóa cả images
docker-compose down --rmi all

# Xóa toàn bộ (containers + volumes + images + orphans)
docker-compose down -v --rmi all --remove-orphans

# Dọn dẹp Docker system-wide
docker system prune -a --volumes
```

## 📦 Backup & Restore

### Backup Database

```bash
# Backup PostgreSQL
docker exec vsl-postgres pg_dump -U postgres vsl_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup Elasticsearch indices
curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}'
```

### Restore Database

```bash
# Restore PostgreSQL
docker exec -i vsl-postgres psql -U postgres vsl_db < backup_20241213_120000.sql
```

## 🚦 Service Dependencies (Startup Order)

```
postgres (1) ──┐
               ├──> backend (4) ──> frontend (5)
elasticsearch (2) ─┤
                   │
ai-service (3) ────┘
```

**Health checks đảm bảo**:

- Backend chỉ start khi Postgres, Elasticsearch, AI Service đã healthy
- Frontend chỉ start khi Backend đã healthy

## 🎯 Quick Start (TL;DR)

```bash
cd vsl-platform-backend
docker-compose up -d --build
docker-compose logs -f

# Đợi ~2-3 phút
# Truy cập: http://localhost:3000
```

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. **Logs**: `docker-compose logs -f [service-name]`
2. **Health**: `docker-compose ps`
3. **Resources**: `docker stats`
4. **Network**: `docker network inspect vsl-platform_vsl-network`

---

**Last Updated**: December 13, 2025
