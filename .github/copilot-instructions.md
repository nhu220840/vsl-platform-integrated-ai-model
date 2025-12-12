# VSL Platform - AI Agent Instructions

## Project Overview

Vietnamese Sign Language (VSL) Platform: A full-stack application for gesture-to-text translation with dictionary management. **3-tier architecture**: Next.js frontend, Spring Boot backend (Java 21), and Python AI service (Flask).

## Architecture & Data Flow

### Service Communication Pattern

1. **Frontend (Next.js)** → Captures hand landmarks via MediaPipe → Sends to `/api/vsl/recognize`
2. **Backend (Spring Boot)** → Acts as gateway → Proxies to Python AI service → Returns Vietnamese text with diacritics
3. **Python AI Service** → Processes landmarks → Predicts gesture → Restores accents → Returns final text

**Critical**: Backend is a **stateless gateway**. All AI processing (gesture recognition + accent restoration) happens in Python service as a **single unified pipeline**.

### Port Configuration

- Backend (local): `8081`, (Docker): `8080` → mapped to host `8081`
- AI Service: `5000`
- PostgreSQL (local): `5433` → DB port `5432`
- Elasticsearch: `9200`
- Frontend: `3000`

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

## Backend Development

### Standard Response Wrapper

**Always** wrap responses in `ApiResponse<T>`:

```java
return ResponseEntity.ok(ApiResponse.success("Operation successful", dataObject));
```

Never return raw POJOs. Frontend expects `{ code, message, data }` structure.

### Running Commands

```bash
# Build + run locally (requires Docker services running)
./mvnw clean install
./mvnw spring-boot:run

# Full Docker stack
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

### Rate Limiting

- `RateLimitingFilter` uses Bucket4j (in-memory, per-IP)
- `/api/vsl/recognize`: 10 req/sec (high-frequency gesture processing)
- `/api/auth/**`: 5 req/min (brute-force protection)
- Returns `429 Too Many Requests` on exceed

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

1. **Port conflicts**: Backend uses `5433` for PostgreSQL to avoid conflicts with system Postgres
2. **Elasticsearch sync**: Check `Dictionary.elasticSynced` field if search fails
3. **CORS errors**: Frontend must run on `localhost:3000`, backend CORS configured for this
4. **Token expiry**: JWT valid for 24h (`jwt.expiration=86400000`), frontend handles 401 auto-redirect

## File Conventions

### Backend

- **Controllers**: Thin layer, delegate to services
- **Services**: Business logic, call repositories or integration services
- **Integration**: External service clients (e.g., `GestureIntegrationService` for Python AI)
- **DTOs**: Record types for request/response (e.g., `record GestureInputDTO(...)`)

### Frontend

- **Components**: In `components/features/` by domain (e.g., `ai/CameraView.tsx`)
- **Types**: Shared types in `types/api.ts` matching backend DTOs
- **Hooks**: Custom hooks in `hooks/` (e.g., `useHandTracking.ts`)

## Key Dependencies

### Backend (Spring Boot 3.3)

- **JDK**: 21 (LTS)
- **Security**: Spring Security 6 + JWT (io.jsonwebtoken)
- **Rate Limiting**: Bucket4j
- **HTTP Client**: RestClient (Spring 6+) configured in `RestClientConfig`

### Frontend (Next.js 16)

- **React**: 19.2.0
- **MediaPipe**: `@mediapipe/tasks-vision` for hand tracking
- **HTTP**: Axios with interceptors
- **State**: Zustand with persist

### AI Service

- **Python**: 3.8+ (recommended 3.10-3.12)
- **ML**: scikit-learn (joblib for model persistence)
- **Landmarks**: MediaPipe compatibility (expects 21-point format)

## Migration Notes

**Deprecated**: Legacy Python services at ports `5000`/`5001` (separate models) replaced by unified service. If you see `python.model1.url` in `application.properties`, use `ai.service.url` instead.
