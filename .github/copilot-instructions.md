# VSL Platform - AI Agent Instructions

## Project Overview

Vietnamese Sign Language (VSL) Platform: A full-stack application for gesture-to-text translation with dictionary management. **3-tier architecture**: Next.js frontend, Spring Boot backend (Java 21), and Python AI service (Flask).

**Monorepo Structure**:

- `vsl-platform-frontend/` - Next.js 16 (React 19.2) web UI
- `vsl-platform-backend/` - Spring Boot 3.3 (Java 21) API gateway
- `vsl-platform-ai-model/` - Python Flask AI service (gesture recognition + accent restoration)

**Docker Compose Location**: `vsl-platform-backend/docker-compose.yml` (defines all 5 services)

## Architecture & Data Flow

### Service Communication Pattern

1. **Frontend (Next.js)** → Captures hand landmarks via MediaPipe → Sends to `/api/vsl/recognize`
2. **Backend (Spring Boot)** → Acts as gateway → Proxies to Python AI service → Returns Vietnamese text with diacritics
3. **Python AI Service** → Processes landmarks → Predicts gesture → Restores accents → Returns final text

**Critical**: Backend is a **stateless gateway**. All AI processing (gesture recognition + accent restoration) happens in Python service as a **single unified pipeline**.

### Docker Network Architecture (5 Services)

All services run in `vsl-network` (bridge mode) via docker-compose:

| Service           | Container Name    | Internal Port | Host Port  | Network Alias |
| ----------------- | ----------------- | ------------- | ---------- | ------------- |
| **postgres**      | vsl-postgres      | 5432          | 5433       | postgres      |
| **elasticsearch** | vsl-elasticsearch | 9200, 9300    | 9200, 9300 | elasticsearch |
| **ai-service**    | vsl-ai-service    | 5000          | 5000       | ai-service    |
| **backend**       | vsl-backend       | 8080          | 8081       | backend       |
| **frontend**      | vsl-frontend      | 3000          | 3000       | frontend      |

### Connection Patterns

**Container-to-Container (Internal):**

- Backend → PostgreSQL: `jdbc:postgresql://postgres:5432/vsl_db`
- Backend → Elasticsearch: `http://elasticsearch:9200`
- Backend → AI Service: `http://ai-service:5000/predict`
- Backend Health Check: `http://localhost:8080/api/auth/login` (internal port)

**Browser-to-Container (From Host):**

- Frontend (browser) → Backend: `http://host.docker.internal:8081/api`
  - **Critical**: Frontend uses `host.docker.internal` because client-side code runs in **browser**, not container
  - Set in Dockerfile: `NEXT_PUBLIC_API_URL=http://host.docker.internal:8081/api`
  - Requires `extra_hosts: - "host.docker.internal:host-gateway"` in docker-compose

**Local Development (Non-Docker):**

- Backend: `localhost:8081`
- PostgreSQL: `localhost:5433` (avoids conflicts with system Postgres)
- Frontend: `localhost:3000` → calls `localhost:8081`

## Authentication & Authorization

### JWT Flow

- **Token storage**: Frontend stores in `localStorage`, automatically attached via axios interceptor (`lib/api-client.ts`)
- **Token format**: `Bearer <JWT>` in `Authorization` header
- **Stateless**: No server-side sessions, JWT contains all user context
- **Auditing**: `BaseEntity` tracks `createdBy`/`updatedBy` via `AuditorAwareImpl` pulling username from `SecurityContext`

### RBAC Endpoints

- **Public**: `/api/auth/login`, `/api/auth/register`, `/api/vsl/recognize`, `/api/vsl/spell`, `/api/dictionary/search`
- **USER role**: `/api/user/favorites/**`, `/api/user/contributions/**`, `/api/user/profile/**`
- **ADMIN role**: `/api/admin/users/**`, `/api/admin/contributions/**`, `/api/dictionary` (POST)

**Pattern**: Controllers check roles via `@PreAuthorize("hasRole('ADMIN')")` or SecurityConfig rules. User entity `role` field is enum: `USER`, `ADMIN`.

## Database Patterns

### Dual-Write Pattern (Dictionary)

- **Create**: Write to PostgreSQL JPA → Async sync to Elasticsearch via `ElasticsearchSyncService`
- **Search**: Elasticsearch first (via `DictionaryDocument`), fallback to PostgreSQL if ES unavailable
- **Field**: `Dictionary.elasticSynced` tracks sync status

### Entity Relationships

- `Dictionary` extends `BaseEntity` → Auto-auditing (`createdBy`, `updatedBy`, timestamps)
- `UserFavorite`: Composite unique constraint on `(user_id, dictionary_id)` prevents duplicates
- `Contribution`: JSON field `stagingData` stores proposed changes before admin approval

## Backend Development (Spring Boot)

### Standard Response Wrapper

**Always** wrap responses in `ApiResponse<T>`:

```java
return ResponseEntity.ok(ApiResponse.success("Operation successful", dataObject));
return ResponseEntity.badRequest().body(ApiResponse.error("Error message"));
```

Never return raw POJOs. Frontend expects `{ code, message, data }` structure defined in `ApiResponse<T>`.

### Running Commands

**Docker Deployment (Recommended for Full Stack):**

```bash
# IMPORTANT: docker-compose.yml is in backend directory
cd vsl-platform-backend

# Build and start all 5 services
docker-compose up -d --build

# Service startup sequence (with health checks):
# 1. postgres (10-20s)
# 2. elasticsearch (30-60s)
# 3. ai-service (20-40s)
# 4. backend (40-60s, waits for DB + ES + AI)
# 5. frontend (40-60s, waits for backend)
# Total: ~2-3 minutes for first build

# View logs (real-time)
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f postgres
docker-compose logs -f elasticsearch
docker-compose logs -f frontend

# Check all container status
docker-compose ps

# Stop all services (preserves data)
docker-compose down

# Stop and remove volumes (⚠️ DESTROYS DATA)
docker-compose down -v

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild specific service
docker-compose up -d --build backend

# Check health endpoints
curl http://localhost:8081/api/auth/login      # Backend (host port)
curl http://localhost:9200/_cluster/health     # Elasticsearch
curl http://localhost:5000/health              # AI Service
curl http://localhost:3000                     # Frontend
```

**Local Development (Non-Docker):**

```bash
# Requires: Docker services (DB, ES) running + Python AI service
cd vsl-platform-backend
./mvnw clean install
./mvnw spring-boot:run  # Backend on 8081

# In another terminal
cd vsl-platform-frontend
npm run dev  # Frontend on 3000
```

### Rate Limiting

`RateLimitingFilter` uses Bucket4j (in-memory, per-IP, configured in `SecurityConfig`):

- `/api/vsl/recognize`: 10 req/sec (high-frequency gesture processing)
- `/api/auth/**`: 5 req/min (brute-force protection)
- Returns `429 Too Many Requests` on exceed

**Note**: Rate limits reset per-IP, no distributed cache in current implementation.

## Frontend Development

### State Management

- **Zustand** for auth state (`stores/auth-store.ts`) with `persist` middleware
- **React hooks** for local state
- No Redux (legacy `app/redux/` directory is unused)

### MediaPipe Integration

- `useHandTracking` hook manages HandLandmarker lifecycle
- Buffers 30 frames before sending to backend (see `BUFFER_SIZE` in `useHandTracking.ts`)
- Landmarks format: Array of 21 points, each `{x, y, z}`

### API Client Pattern

All backend calls use `apiClient` from `lib/api-client.ts`:

- Auto-attaches JWT from `localStorage`
- Auto-redirects to `/login` on 401
- Set `NEXT_PUBLIC_API_URL` env var for backend base URL

## Python AI Service

### Model Loading

- Models loaded once at startup in `load_models()` (Flask app.py)
- **Scaler**: `models/scaler.pkl` (StandardScaler for landmark normalization)
- **Classifier**: `models/model_mlp.pkl` (MLPClassifier for gesture prediction)

### Processing Pipeline

1. Validate landmarks (21 points × 3 coords = 63 features)
2. Scale features → Predict gesture → Get confidence
3. If confidence < `CONFIDENCE_THRESHOLD` (0.7), reject
4. Restore Vietnamese accents via `restore_diacritics()` from `src/utils/vn_accent_restore.py`

**Endpoint**: `POST /predict`

```json
{
  "frames": [[{x, y, z}, ...], ...],  // Array of landmark arrays
  "current_text": "chua co dau"      // Optional context for accent restoration
}
```

## Testing & Debugging

### Backend Logs

- **JPA SQL**: Set `spring.jpa.show-sql=true` (already enabled)
- **Service logs**: Use `@Slf4j` (Lombok), log at DEBUG for integrations
- **Check health**: Elasticsearch at `http://localhost:9200/_cluster/health`

### Common Issues

1. **Port conflicts**:

   - PostgreSQL uses host port `5433` to avoid conflicts with system Postgres
   - Check: `lsof -i :8081` or `lsof -i :3000` if ports are busy

2. **Frontend can't reach Backend in Docker**:

   - **Cause**: Frontend client-side code runs in **browser**, not container
   - **Solution**: Must use `http://host.docker.internal:8081/api`
   - **Check**: `docker-compose.yml` has `extra_hosts: - "host.docker.internal:host-gateway"`
   - **Dockerfile**: `NEXT_PUBLIC_API_URL=http://host.docker.internal:8081/api` must be set at build time

3. **Backend health check fails**:

   - **Correct endpoint**: `/api/dictionary/search?keyword=` (GET method, permitAll, returns 200 OK)
   - **Wrong endpoints**: `/api/auth/login` (POST-only, returns 405 for GET), `/actuator/health` (403 Forbidden)
   - Health check uses **internal port** `8080`: `http://localhost:8080/api/dictionary/search?keyword=`
   - External access uses **host port** `8081`: `http://localhost:8081/api/dictionary/search?keyword=`
   - Must install `curl` in backend Dockerfile: `RUN apk add --no-cache curl`

4. **Elasticsearch sync**:

   - Check `Dictionary.elasticSynced` field if search fails
   - Verify ES health: `curl http://localhost:9200/_cluster/health`
   - Data persists in `./elasticsearch-data` directory

5. **AI Service models not found**:

   - Ensure `models/scaler.pkl` and `models/model_mlp.pkl` exist in `vsl-platform-ai-model/models/`
   - Check logs: `docker-compose logs ai-service | grep "Models loaded"`

6. **CORS errors**:

   - Backend CORS configured for `localhost:3000`
   - In Docker, frontend at `localhost:3000` calls backend at `host.docker.internal:8081`

7. **Token expiry**:

   - JWT valid for 24h (`jwt.expiration=86400000`)
   - Frontend handles 401 auto-redirect to `/login`

8. **Service startup order**:
   - Backend waits for postgres, elasticsearch, ai-service (health checks)
   - Frontend waits for backend (health check)
   - Use `docker-compose logs -f` to monitor startup progress

## File Conventions

### Backend

- **Controllers**: Thin layer, delegate to services (e.g., `RecognitionController`, `DictionaryController`)
- **Services**: Business logic, call repositories or integration services (e.g., `DictionaryService`, `UserService`)
- **Integration**: External service clients (e.g., `GestureIntegrationService` for Python AI via `RestClient`)
- **DTOs**: Record types for request/response (e.g., `record GestureInputDTO(List<List<Landmark>> frames)`)
- **Security**: `JwtAuthenticationFilter`, `RateLimitingFilter`, `AuditorAwareImpl` for audit trails

### Frontend

- **Components**: In `components/features/` by domain (e.g., `ai/CameraView.tsx`, `dictionary/SearchBar.tsx`)
- **Types**: Shared types in `types/api.ts` matching backend DTOs
- **Hooks**: Custom hooks in `hooks/` (e.g., `useHandTracking.ts`, `useAuthStatus.ts`)
- **Pages**: App Router in `app/` directory (e.g., `app/recognize/page.tsx`)
- **Stores**: Zustand stores in `stores/` (e.g., `auth-store.ts`)

### Python AI Service

- **app.py**: Main Flask entry point, loads models at startup (`load_models()`)
- **src/utils/vn_accent_restore.py**: Vietnamese diacritics restoration using Hugging Face transformers
- **src/data_processing/**: MediaPipe landmark format conversion
- **models/**: Pre-trained models (`scaler.pkl`, `model_mlp.pkl`) - must exist before running

## Key Dependencies

### Backend (Spring Boot 3.3)

- **JDK**: 21 (LTS)
- **Security**: Spring Security 6 + JWT (io.jsonwebtoken)
- **Rate Limiting**: Bucket4j
- **HTTP Client**: RestClient (Spring 6+) configured in `RestClientConfig` and `AiServiceConfig`
- **Search**: Spring Data Elasticsearch

### Frontend (Next.js 16)

- **React**: 19.2.0 (App Router)
- **MediaPipe**: `@mediapipe/tasks-vision` for hand tracking
- **HTTP**: Axios with interceptors (`lib/api-client.ts`)
- **State**: Zustand with persist middleware

### AI Service

- **Python**: 3.8+ (recommended 3.10-3.12)
- **ML**: scikit-learn (joblib for model persistence)
- **NLP**: transformers (Hugging Face), torch
- **Landmarks**: MediaPipe compatibility (expects 21-point format)

## Migration Notes

**Deprecated**: Legacy Python services at ports `5000`/`5001` (separate models) replaced by unified service. If you see `python.model1.url` in `application.properties`, use `ai.service.url` instead.
