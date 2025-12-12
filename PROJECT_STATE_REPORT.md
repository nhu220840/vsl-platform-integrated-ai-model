PROJECT_STATE_REPORT
1. System Architecture & Infrastructure
1.1 Overall Topology
Services (Docker Compose in vsl-platform-backend/docker-compose.yml):
postgres
Image: postgres:16-alpine
Host port → Container port: 5433:5432
DB name: vsl_db
User / Password: postgres / password
Network alias: postgres on vsl-network
elasticsearch
Image: elasticsearch:8.11.1
Host ports: 9200:9200 (HTTP), 9300:9300 (transport)
Network alias: elasticsearch on vsl-network
Notes: Single-node, security disabled (xpack.security.enabled=false).
backend (Spring Boot)
Build: vsl-platform-backend/Dockerfile
Host port → Container port: 8081:8080
Network alias: backend on vsl-network
Depends on: postgres, elasticsearch, ai-service (with health checks).
ai-service (Python Flask)
Build context: ../vsl-platform-ai-model
Host port → Container port: 5000:5000
Network alias: ai-service on vsl-network
Health: GET /health inside container.
1.2 Configuration & Environment Variables
Database (local dev application.properties):
URL: jdbc:postgresql://localhost:5433/vsl_db
User: postgres
Password: password
Database (Docker backend service):
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/vsl_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
Elasticsearch:
Local: spring.elasticsearch.uris=http://localhost:9200
Docker: SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200
AI Service URL:
Local: ai.service.url=http://localhost:5000/predict
Docker: AI_SERVICE_URL=http://ai-service:5000/predict
JWT:
Secret: vsl-platform-secret-key-change-this-in-production-minimum-256-bits-for-hmac-sha256
Expiration: 86400000 ms (24h)
Server port (backend):
Local: server.port=8081
In container: SERVER_PORT=8080 → mapped to host 8081.
2. Backend Deep Dive (Spring Boot)
2.1 Authentication Flow (JWT, Stateless)
Tech: Spring Security 6, stateless JWT, custom JwtAuthenticationFilter.
Login endpoint: POST /api/auth/login
Request JSON (via AuthRequest):
    {
      "username": "string",
      "password": "string"
    }
    ```
  - **Response JSON**: wrapped in `ApiResponse<AuthResponse>`.

    Shape:

    ```json
    {
      "code": 200,
      "message": "Login successful",
      "data": {
        "token": "JWT_TOKEN_STRING",
        "type": "Bearer",
        "username": "user1",
        "email": "user1@example.com",
        "role": "USER"
      }
    }
    ```

- **Register endpoint**: `POST /api/auth/register`
  - Creates a new `User` with role `USER`, then returns the same `AuthResponse` shape (201 status, message `"Registration successful"`).

- **Usage on frontend**:
  - Store `data.token`.
  - Send `Authorization: Bearer <token>` header to any `/api/user/**` or `/api/admin/**` endpoint.

- **Security pipeline**:
  - CSRF disabled, CORS enabled.
  - Session: `STATELESS`.
  - Filters (in order):
    - `RateLimitingFilter` (Bucket4j-based, rate limits key endpoints).
    - `JwtAuthenticationFilter` (decodes JWT, populates `SecurityContext`).
    - `UsernamePasswordAuthenticationFilter` (standard).

#### 2.2 RBAC Rules (GUEST vs USER vs ADMIN)

Defined in `SecurityConfig`:

- **Guest / Public (no token required)**:
  - **Auth**:
    - `POST /api/auth/login`
    - `POST /api/auth/register`
  - **AI / VSL endpoints (public)**:
    - `POST /api/vsl/recognize` (gesture landmarks → text; rate-limited)
    - `GET  /api/vsl/spell?text=...` (text → alphabet gesture images)
  - **Dictionary search/detail**:
    - `GET /api/dictionary/search?query=...`
    - `GET /api/dictionary/detail/**` (if present; not shown, but whitelisted)
  - **Swagger/OpenAPI** (dev only):
    - `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`

- **Authenticated USER / ADMIN (JWT with `role` USER or ADMIN)**:
  - **Favorites**: `/api/user/favorites/**`
    - `POST /api/user/favorites/{wordId}` (toggle favorite)
    - `GET  /api/user/favorites` (paginated list)
    - `GET  /api/user/favorites/check/{wordId}`
  - **Contributions**: `/api/user/contributions/**`
    - `POST /api/user/contributions` (submit word/video for review)
  - **Reports**: `/api/user/reports/**`
    - `POST /api/user/reports` (report problematic dictionary entries)
  - **Profile**: `/api/user/profile/**`
    - `PUT /api/user/profile/password` (change own password, with old-password check and “new must differ” validation)
  - **History**: `/api/user/history/**`
    - `GET /api/user/history` (search history for that user)

- **Admin-only (JWT with `role` ADMIN)**:
  - **User management & RBAC**:
    - `GET  /api/admin/users?page=&size=` (paginated user list)
    - `PUT  /api/admin/users/{userId}/role` (change another user’s role; cannot change own role)
    - `PUT  /api/admin/users/{userId}/reset-password` (force-reset password without old password)
  - **Dictionary management**:
    - `POST /api/dictionary` (create words directly; dual-write to Postgres + Elasticsearch)
    - `PUT/DELETE` dictionary endpoints if later added under `/api/admin/dictionary/**`.
  - **Contribution workflow**:
    - `GET  /api/admin/contributions?status=PENDING|APPROVED|REJECTED`
    - `POST /api/admin/contributions/{id}/approve`
    - `POST /api/admin/contributions/{id}/reject`
  - **Report moderation** (if exposed under `/api/admin/reports/**`, not fully shown).
  - **Dashboard stats**:
    - `GET /api/admin/stats` (counts users, words, pending contributions).

#### 2.3 Database Schema & Relationships (Core Entities)

- **`User`**
  - `id: Long`
  - `username (unique)`, `email (unique)`, `password`, `role: Role`
  - Audit timestamps: `createdAt`, `updatedAt` (simple @PrePersist/@PreUpdate).
  - Relations:
    - `List<Contribution> contributions` (1:N)
    - `List<SearchHistory> searchHistories` (1:N)
    - `List<UserFavorite> favorites` (1:N)

- **`Dictionary` extends `BaseEntity`**
  - Fields: `id`, `word`, `definition`, `videoUrl`, `elasticSynced`
  - Audit via `BaseEntity`:
    - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
  - Relations:
    - `List<SearchHistory> searchHistories` (1:N)
    - `List<UserFavorite> favorites` (1:N)
  - Used as the canonical entry for sign-language words.

- **`UserFavorite`**
  - `id: Long`
  - `user: User` (`ManyToOne`)
  - `dictionary: Dictionary` (`ManyToOne`)
  - `savedAt` mapped to DB column `created_at` (via `@Column(name = "created_at")`)
  - Unique constraint on `(user_id, dictionary_id)` → no duplicate favorites.

- **`Contribution` extends `BaseEntity`**
  - `id: Long`
  - `user: User` (`ManyToOne`)
  - `stagingData: String` (JSON for proposed word/definition/videoUrl)
  - `status: ContributionStatus` (`PENDING`, `APPROVED`, `REJECTED`)
  - Audited via `BaseEntity` (`createdBy`, `updatedBy`, timestamps).
  - Used for user-submitted content that admins review and move to `Dictionary`.

- **`Alphabet`**
  - Primary key is `character: String (length=1)` (e.g., “a”, “b”, “1”).
  - `imageUrl`: URL to gesture image.
  - `type`: `"LETTER"` or `"NUMBER"`.
  - Supports spelling feature (text → gestures).

- **Other entities (not fully detailed here)**:
  - `SearchHistory` (user, dictionary, searchQuery, timestamps).
  - `Report` (reports against dictionary entries).

#### 2.4 API Capabilities (Key Endpoints)

**Auth & Users**

- `POST /api/auth/login` – login, returns JWT + user info.
- `POST /api/auth/register` – register and auto-login.
- `PUT /api/user/profile/password` – change password with:
  - 1) check old password hash matches (`passwordEncoder.matches`).
  - 2) enforce new ≠ old.

**VSL / AI endpoints**

- `POST /api/vsl/recognize`
  - Body: `GestureInputDTO` (see 3.1).
  - Response: `ApiResponse<String>` where `data` is the final sentence with accents.
- `GET /api/vsl/spell?text=...`
  - Response: `ApiResponse<List<String>>`, each string is an image URL for a gesture representing one character.

**Dictionary**

- `GET /api/dictionary/search?query=...`
  - Searches via Elasticsearch, falls back to Postgres.
  - Response: `ApiResponse<List<DictionaryDTO>>`.
- `POST /api/dictionary` (ADMIN)
  - Directly create dictionary entries.

**User features**

- `POST /api/user/favorites/{wordId}` – toggle favorite; response includes `isFavorite`.
- `GET /api/user/favorites?page=&size=` – paginated favorites (DTO includes word, definition, videoUrl, savedAt).
- `GET /api/user/favorites/check/{wordId}` – boolean favorite status.
- `GET /api/user/history` – search history list.
- `POST /api/user/reports` – create report on a dictionary word.
- `POST /api/user/contributions` – submit new word/definition/videoUrl (pending approval).

#### 2.5 Security Features

- **Rate Limiting (Bucket4j)**
  - Implemented via `RateLimitingFilter` + `RateLimitingService`.
  - Rules per IP:
    - **AI recognition**: `POST /api/vsl/recognize` – max **10 requests/second**.
    - **Auth**: `/api/auth/**` – max **5 requests/minute**.
  - On exceed: **HTTP 429** with JSON body:
    ```json
    { "message": "Too many requests. Please slow down." }
    ```

- **CORS**
  - Allowed origins:
    - `http://localhost:3000` (Next.js)
    - `http://localhost:5173` (Vite fallback)
    - `http://localhost:8080` (backend itself)
  - Methods: `GET, POST, PUT, DELETE, OPTIONS`
  - Headers: includes `Authorization`, `Content-Type`, and standard CORS headers.
  - Credentials allowed, `Authorization` exposed to frontend.

- **JPA Auditing**
  - Enabled via `@EnableJpaAuditing(auditorAwareRef = "auditorAware")`.
  - `AuditorAwareImpl` pulls the username from `SecurityContext` (falls back to `"system"` for unauthenticated).
  - `BaseEntity` provides:
    - `createdBy`, `updatedBy`
    - `createdAt`, `updatedAt`
  - Currently used by `Dictionary` and `Contribution`.

---

### 3. AI Service Deep Dive (Python Flask)

#### 3.1 API Contract: `/predict`

- **Route**: `POST /predict`
- **Input JSON** (from docstring and Java integration):

```json
{
  "frames": [
    {
      "landmarks": [
        {"x": 0.1, "y": 0.2, "z": 0.3},
        {"x": 0.2, "y": 0.3, "z": 0.4}
        // ... 21 landmarks total
      ]
    }
    // ... more frames in the batch
  ],
  "current_text": "xin ch"
}
```

- **Output JSON**:

```json
{
  "success": true,
  "final_sentence": "xin chào",
  "confidence": 0.95,
  "raw_char": "a",
  "frames_processed": 15,
  "valid_predictions": 12
}
```

- On error, `success: false` with an `error` field:
  ```json
  {
    "success": false,
    "error": "Some error message"
  }
  ```

#### 3.2 Logic Flow

1. **Model loading (`load_models`)**:
   - Loads `scaler.pkl` and `model_mlp.pkl` from `models/` at startup.
   - Raises if missing; container fails fast.

2. **Per-frame preprocessing (`preprocess_landmarks`)**:
   - Expects **21 landmarks** each with `{x, y, z}`.
   - Uses the wrist (landmark 0) as origin; subtracts wrist coords from all points.
   - Produces flattened array of **63 features** (21 × 3) as shape `(1, 63)`.

3. **Per-frame inference (`predict_gesture`)**:
   - Applies `scaler.transform`.
   - `model.predict` → class (character).
   - `model.predict_proba` → probability vector.
   - Takes max probability; if `< 0.7`, frame is discarded (no prediction).

4. **Voting (`vote_predictions`)**:
   - From all valid `(character, confidence)` pairs, finds the mode (most frequent character).
   - Averages confidence for that character.

5. **Accent restoration (`restore_diacritics`)**:
   - If `raw_char == "SPACE"`: appends a space and restores accents on the whole string.
   - Otherwise appends `raw_char` to `current_text`, lowercases, strips, then calls `restore_diacritics`.

6. **Response**:
   - Returns final sentence with accents + overall confidence, including some diagnostics (`frames_processed`, `valid_predictions`, `raw_char`).

#### 3.3 Deployment & Containerization

- **Dockerfile** (`vsl-platform-ai-model/Dockerfile`):
  - Base: `python:3.10-slim`
  - Installs build tools + `curl`.
  - Installs Python deps from `requirements_docker.txt` as `requirements.txt`.
  - Copies entire project; sets `FLASK_APP=app.py`, `FLASK_ENV=production`.
  - Exposes port `5000`.
  - Runs via Gunicorn:
    ```bash
    gunicorn --bind 0.0.0.0:5000 --workers 2 --threads 2 --timeout 120 app:app
    ```

---

### 4. Integration Points (“Handshake”)

#### 4.1 Java → Python Call (Gesture Recognition)

- **DTOs (Java side)**:
  - `GestureInputDTO`:
    ```json
    {
      "frames": [ /* List<HandFrameDTO> */ ],
      "currentText": "string"    // optional; defaults to ""
    }
    ```
  - `HandFrameDTO`:
    ```json
    {
      "landmarks": [ /* List<LandmarkDTO> */ ]
    }
    ```
  - `LandmarkDTO`:
    ```json
    { "x": 0.0, "y": 0.0, "z": 0.0 }
    ```

- **Controller**: `POST /api/vsl/recognize` (`RecognitionController`)
  - Accepts `GestureInputDTO` from the frontend (camelCase: `currentText`).

- **GestureIntegrationService**:
  - Validates `frames` is non-empty.
  - Transforms to Python’s expected snake_case:
    ```java
    Map.of(
      "frames", input.frames(),
      "current_text", currentText
    )
    ```
  - Uses `RestClient` bean `aiRestClient` whose base URL comes from `ai.service.url` / `AI_SERVICE_URL`.
  - `POST` with `Content-Type: application/json` to the base URL (which already includes `/predict`).

- **Response handling**:
  - Expects body into `AiResponseDTO`:
    - `success`, `final_sentence`, `confidence`, `raw_char`, `frames_processed`, `valid_predictions`, `error`.
  - Validates:
    - Non-null body.
    - `success != false` and `error == null`.
    - `final_sentence` non-empty.
  - On success: returns `finalSentence` (string) to `RecognitionController`, which wraps it in `ApiResponse<String>` for the frontend.

- **Error handling**:
  - **Timeout / connectivity** (`ResourceAccessException`) → `AiServiceUnavailableException` → HTTP 503 with `"AI Service is offline"`.
  - **5xx from Python** (`HttpServerErrorException`) → `ExternalServiceException` with the status code.
  - **Python-side validation errors** (e.g., `success: false`, `error: ...`) → `ExternalServiceException` with message `"AI Service error: ..."` and 500.

---

### 5. Frontend Readiness (What the Frontend MUST Implement)

#### 5.1 Auth & Headers

- For **guest features** (AI recognition, spelling, search), no token is required.
- For any **user-specific features**, the frontend must:
  - First call `POST /api/auth/login` or `/api/auth/register`.
  - Cache `response.data.token`.
  - Send it as:
    ```http
    Authorization: Bearer <token>
    ```
  - This is required for:
    - `/api/user/favorites/**`
    - `/api/user/contributions/**`
    - `/api/user/reports/**`
    - `/api/user/profile/**`
    - `/api/user/history/**`
    - (And `/api/admin/**`, but that’s admin UI).

#### 5.2 Gesture Recognition Request Format

- **Endpoint**: `POST /api/vsl/recognize`
- **Body expected from frontend (camelCase)**:

```json
{
  "frames": [
    {
      "landmarks": [
        { "x": 0.123, "y": 0.456, "z": -0.01 },
        // ... 21 entries per frame
      ]
    }
  ],
  "currentText": "xin ch"
}
```

- Notes:
  - Frontend should:
    - Capture MediaPipe hand landmarks (21 points, x/y/z).
    - Batch multiple frames representing a “hold-to-confirm” gesture (~15–30 frames).
    - Maintain a running `currentText` string that accumulates recognized characters locally, and send it every call.
  - Backend converts to Python’s `current_text` internally; frontend doesn’t worry about snake_case.

- **Response**:

```json
{
  "code": 200,
  "message": "Recognition completed in 123 ms",
  "data": "xin chào"
}
```

- Frontend should update the displayed sentence with `data` and, optionally, keep the local `currentText` in sync with that string.

#### 5.3 Dictionary & Spelling Integration

- **Search**:
  - `GET /api/dictionary/search?query=hello`
  - Response:
    ```json
    {
      "code": 200,
      "message": "Found N result(s)",
      "data": [
        {
          "id": 1,
          "word": "xin chào",
          "definition": "...",
          "videoUrl": "https://..."
        }
      ]
    }
    ```

- **Spelling**:
  - `GET /api/vsl/spell?text=xin chao`
  - Response:
    ```json
    {
      "code": 200,
      "message": "Spelled 'xin chao' into 8 characters",
      "data": [
        "https://.../x.png",
        "https://.../i.png",
        "https://.../n.png",
        "https://.../%20.png",
        ...
      ]
    }
    ```
  - Frontend renders a sequence of gesture images.

#### 5.4 Favorites, History, Contributions, Reports

- **Favorites:**
  - Toggle:
    - `POST /api/user/favorites/{wordId}` (with JWT)
    - Response data:
      ```json
      {
        "wordId": 123,
        "isFavorite": true
      }
      ```
  - List (for “My Favorites” screen):
    - `GET /api/user/favorites?page=0&size=10`
    - Response: `data` is a `Page<FavoriteDTO>` (content + pagination fields) or simple list depending on serialization; you should inspect actual JSON once running, but `FavoriteDTO` fields are:
      - `id`, `dictionaryId`, `word`, `definition`, `videoUrl`, `savedAt`.

- **Search history:**
  - `GET /api/user/history` (JWT)
  - List of entries with fields like `dictionaryId`, `word`, `searchQuery`, `searchedAt`.

- **Contributions:**
  - `POST /api/user/contributions`
  - Body shape from `ContributionRequest`: likely `{ "word": "...", "definition": "...", "videoUrl": "..." }` (check DTO in code before UI binding).
  - Frontend should allow user-submitted suggestions but indicate they are pending admin approval.

- **Reports:**
  - `POST /api/user/reports`
  - Body shape from `ReportRequest`: typically `{ "wordId": 123, "reason": "Wrong video" }`.
  - Use for report modals on dictionary item detail pages.

#### 5.5 Rate Limiting Awareness

- Frontend should:
  - Avoid hammering `POST /api/vsl/recognize`: 10 req/s per IP limit.
    - Implement client-side throttling/debouncing (e.g., send per “hold-to-confirm” batch, not every frame).
  - Avoid brute-forcing login: 5 req/min per IP limit on `/api/auth/**`.
  - Handle HTTP 429 by:
    - Showing a short “You’re sending too many requests; please slow down” toast.
    - Optionally backing off (exponential backoff or timeout before next call).

---

This `PROJECT_STATE_REPORT.md` should be enough for a frontend dev (or another AI) to:

- Understand how to authenticate and which headers to send.
- Know exactly what JSON to send to `/api/vsl/recognize` and what to expect back.
- Use dictionary search, spelling, favorites, contributions, and history correctly.
- Be aware of limits (rate limiting) and infrastructure (ports, services, and URLs) for local vs Docker-based development.
Response JSON: wrapped in ApiResponse<AuthResponse>.
Shape:
    {
      "code": 200,
      "message": "Login successful",
      "data": {
        "token": "JWT_TOKEN_STRING",
        "type": "Bearer",
        "username": "user1",
        "email": "user1@example.com",
        "role": "USER"
      }
    }
Register endpoint: POST /api/auth/register
Creates a new User with role USER, then returns the same AuthResponse shape (201 status, message "Registration successful").
Usage on frontend:
Store data.token.
Send Authorization: Bearer <token> header to any /api/user/** or /api/admin/** endpoint.
Security pipeline:
CSRF disabled, CORS enabled.
Session: STATELESS.
Filters (in order):
RateLimitingFilter (Bucket4j-based, rate limits key endpoints).
JwtAuthenticationFilter (decodes JWT, populates SecurityContext).
UsernamePasswordAuthenticationFilter (standard).
2.2 RBAC Rules (GUEST vs USER vs ADMIN)
Defined in SecurityConfig:
Guest / Public (no token required):
Auth:
POST /api/auth/login
POST /api/auth/register
AI / VSL endpoints (public):
POST /api/vsl/recognize (gesture landmarks → text; rate-limited)
GET /api/vsl/spell?text=... (text → alphabet gesture images)
Dictionary search/detail:
GET /api/dictionary/search?query=...
GET /api/dictionary/detail/** (if present; not shown, but whitelisted)
Swagger/OpenAPI (dev only):
/v3/api-docs/**, /swagger-ui/**, /swagger-ui.html
Authenticated USER / ADMIN (JWT with role USER or ADMIN):
Favorites: /api/user/favorites/**
POST /api/user/favorites/{wordId} (toggle favorite)
GET /api/user/favorites (paginated list)
GET /api/user/favorites/check/{wordId}
Contributions: /api/user/contributions/**
POST /api/user/contributions (submit word/video for review)
Reports: /api/user/reports/**
POST /api/user/reports (report problematic dictionary entries)
Profile: /api/user/profile/**
PUT /api/user/profile/password (change own password, with old-password check and “new must differ” validation)
History: /api/user/history/**
GET /api/user/history (search history for that user)
Admin-only (JWT with role ADMIN):
User management & RBAC:
GET /api/admin/users?page=&size= (paginated user list)
PUT /api/admin/users/{userId}/role (change another user’s role; cannot change own role)
PUT /api/admin/users/{userId}/reset-password (force-reset password without old password)
Dictionary management:
POST /api/dictionary (create words directly; dual-write to Postgres + Elasticsearch)
PUT/DELETE dictionary endpoints if later added under /api/admin/dictionary/**.
Contribution workflow:
GET /api/admin/contributions?status=PENDING|APPROVED|REJECTED
POST /api/admin/contributions/{id}/approve
POST /api/admin/contributions/{id}/reject
Report moderation (if exposed under /api/admin/reports/**, not fully shown).
Dashboard stats:
GET /api/admin/stats (counts users, words, pending contributions).
2.3 Database Schema & Relationships (Core Entities)
User
id: Long
username (unique), email (unique), password, role: Role
Audit timestamps: createdAt, updatedAt (simple @PrePersist/@PreUpdate).
Relations:
List<Contribution> contributions (1:N)
List<SearchHistory> searchHistories (1:N)
List<UserFavorite> favorites (1:N)
Dictionary extends BaseEntity
Fields: id, word, definition, videoUrl, elasticSynced
Audit via BaseEntity:
createdBy, updatedBy, createdAt, updatedAt
Relations:
List<SearchHistory> searchHistories (1:N)
List<UserFavorite> favorites (1:N)
Used as the canonical entry for sign-language words.
UserFavorite
id: Long
user: User (ManyToOne)
dictionary: Dictionary (ManyToOne)
savedAt mapped to DB column created_at (via @Column(name = "created_at"))
Unique constraint on (user_id, dictionary_id) → no duplicate favorites.
Contribution extends BaseEntity
id: Long
user: User (ManyToOne)
stagingData: String (JSON for proposed word/definition/videoUrl)
status: ContributionStatus (PENDING, APPROVED, REJECTED)
Audited via BaseEntity (createdBy, updatedBy, timestamps).
Used for user-submitted content that admins review and move to Dictionary.
Alphabet
Primary key is character: String (length=1) (e.g., “a”, “b”, “1”).
imageUrl: URL to gesture image.
type: "LETTER" or "NUMBER".
Supports spelling feature (text → gestures).
Other entities (not fully detailed here):
SearchHistory (user, dictionary, searchQuery, timestamps).
Report (reports against dictionary entries).
2.4 API Capabilities (Key Endpoints)
Auth & Users
POST /api/auth/login – login, returns JWT + user info.
POST /api/auth/register – register and auto-login.
PUT /api/user/profile/password – change password with:
1) check old password hash matches (passwordEncoder.matches).
2) enforce new ≠ old.
VSL / AI endpoints
POST /api/vsl/recognize
Body: GestureInputDTO (see 3.1).
Response: ApiResponse<String> where data is the final sentence with accents.
GET /api/vsl/spell?text=...
Response: ApiResponse<List<String>>, each string is an image URL for a gesture representing one character.
Dictionary
GET /api/dictionary/search?query=...
Searches via Elasticsearch, falls back to Postgres.
Response: ApiResponse<List<DictionaryDTO>>.
POST /api/dictionary (ADMIN)
Directly create dictionary entries.
User features
POST /api/user/favorites/{wordId} – toggle favorite; response includes isFavorite.
GET /api/user/favorites?page=&size= – paginated favorites (DTO includes word, definition, videoUrl, savedAt).
GET /api/user/favorites/check/{wordId} – boolean favorite status.
GET /api/user/history – search history list.
POST /api/user/reports – create report on a dictionary word.
POST /api/user/contributions – submit new word/definition/videoUrl (pending approval).
2.5 Security Features
Rate Limiting (Bucket4j)
Implemented via RateLimitingFilter + RateLimitingService.
Rules per IP:
AI recognition: POST /api/vsl/recognize – max 10 requests/second.
Auth: /api/auth/** – max 5 requests/minute.
On exceed: HTTP 429 with JSON body:

    { "message": "Too many requests. Please slow down." }

CORS
Allowed origins:
http://localhost:3000 (Next.js)
http://localhost:5173 (Vite fallback)
http://localhost:8080 (backend itself)
Methods: GET, POST, PUT, DELETE, OPTIONS
Headers: includes Authorization, Content-Type, and standard CORS headers.
Credentials allowed, Authorization exposed to frontend.
JPA Auditing
Enabled via @EnableJpaAuditing(auditorAwareRef = "auditorAware").
AuditorAwareImpl pulls the username from SecurityContext (falls back to "system" for unauthenticated).
BaseEntity provides:
createdBy, updatedBy
createdAt, updatedAt
Currently used by Dictionary and Contribution.
3. AI Service Deep Dive (Python Flask)
3.1 API Contract: /predict
Route: POST /predict
Input JSON (from docstring and Java integration):


{
  "frames": [
    {
      "landmarks": [
        {"x": 0.1, "y": 0.2, "z": 0.3},
        {"x": 0.2, "y": 0.3, "z": 0.4}
        // ... 21 landmarks total
      ]
    }
    // ... more frames in the batch
  ],
  "current_text": "xin ch"
}



Output JSON:


{
  "success": true,
  "final_sentence": "xin chào",
  "confidence": 0.95,
  "raw_char": "a",
  "frames_processed": 15,
  "valid_predictions": 12
}



On error, success: false with an error field:

  {
    "success": false

3.2 Logic Flow
Model loading (load_models):
Loads scaler.pkl and model_mlp.pkl from models/ at startup.
Raises if missing; container fails fast.
Per-frame preprocessing (preprocess_landmarks):
Expects 21 landmarks each with {x, y, z}.
Uses the wrist (landmark 0) as origin; subtracts wrist coords from all points.
Produces flattened array of 63 features (21 × 3) as shape (1, 63).
Per-frame inference (predict_gesture):
Applies scaler.transform.
model.predict → class (character).
model.predict_proba → probability vector.
Takes max probability; if < 0.7, frame is discarded (no prediction).
Voting (vote_predictions):
From all valid (character, confidence) pairs, finds the mode (most frequent character).
Averages confidence for that character.
Accent restoration (restore_diacritics):
If raw_char == "SPACE": appends a space and restores accents on the whole string.
Otherwise appends raw_char to current_text, lowercases, strips, then calls restore_diacritics.
Response:
Returns final sentence with accents + overall confidence, including some diagnostics (frames_processed, valid_predictions, raw_char).
3.3 Deployment & Containerization
Dockerfile (vsl-platform-ai-model/Dockerfile):
Base: python:3.10-slim
Installs build tools + curl.
Installs Python deps from requirements_docker.txt as requirements.txt.
Copies entire project; sets FLASK_APP=app.py, FLASK_ENV=production.
Exposes port 5000.
Runs via Gunicorn:

    gunicorn --bind 0.0.0.0:5000 --workers 2 --threads 2 --timeout 120 app:app




4. Integration Points (“Handshake”)
4.1 Java → Python Call (Gesture Recognition)
DTOs (Java side):
GestureInputDTO:

    {
      "frames": [ /* List<HandFrameDTO> */ ],
      "currentText": "string"    // optional; defaults to ""
    }



HandFrameDTO:

    {
      "landmarks": [



LandmarkDTO:

    { "x": 0.0, "y": 0.0, "z": 0.0 }



Controller: POST /api/vsl/recognize (RecognitionController)
Accepts GestureInputDTO from the frontend (camelCase: currentText).
GestureIntegrationService:
Validates frames is non-empty.
Transforms to Python’s expected snake_case:

    Map.of(
      "frames", input.frames(),
      "current_text", currentText
    )



Uses RestClient bean aiRestClient whose base URL comes from ai.service.url / AI_SERVICE_URL.
POST with Content-Type: application/json to the base URL (which already includes /predict).
Response handling:
Expects body into AiResponseDTO:
success, final_sentence, confidence, raw_char, frames_processed, valid_predictions, error.
Validates:
Non-null body.
success != false and error == null.
final_sentence non-empty.
On success: returns finalSentence (string) to RecognitionController, which wraps it in ApiResponse<String> for the frontend.
Error handling:
Timeout / connectivity (ResourceAccessException) → AiServiceUnavailableException → HTTP 503 with "AI Service is offline".
5xx from Python (HttpServerErrorException) → ExternalServiceException with the status code.
Python-side validation errors (e.g., success: false, error: ...) → ExternalServiceException with message "AI Service error: ..." and 500.
5. Frontend Readiness (What the Frontend MUST Implement)
5.1 Auth & Headers
For guest features (AI recognition, spelling, search), no token is required.
For any user-specific features, the frontend must:
First call POST /api/auth/login or /api/auth/register.
Cache response.data.token.
Send it as:

    Authorization



This is required for:
/api/user/favorites/**
/api/user/contributions/**
/api/user/reports/**
/api/user/profile/**
/api/user/history/**
(And /api/admin/**, but that’s admin UI).
5.2 Gesture Recognition Request Format
Endpoint: POST /api/vsl/recognize
Body expected from frontend (camelCase):
{
  "frames": [
    {
      "landmarks": [
        { "x": 0.123, "y": 0.456, "z": -0.01 },
        // ... 21 entries per frame
      ]
    }
  ],
  "currentText": "xin ch"
}
Notes:
Frontend should:
Capture MediaPipe hand landmarks (21 points, x/y/z).
Batch multiple frames representing a “hold-to-confirm” gesture (~15–30 frames).
Maintain a running currentText string that accumulates recognized characters locally, and send it every call.
Backend converts to Python’s current_text internally; frontend doesn’t worry about snake_case.
Response:


{
  "code": 200,
  "message": "Recognition completed in 123 ms",
  "data": "xin chào"
}



Frontend should update the displayed sentence with data and, optionally, keep the local currentText in sync with that string.
5.3 Dictionary & Spelling Integration
Search:
GET /api/dictionary/search?query=hello
Response:

    {
      "code": 200,
      "message": "Found N result(s)",
      "data": [
        {
          "id": 1,
          "word": "xin chào",
          "definition": "...",
          "videoUrl": "https://..."
        }
      ]
    }



Spelling:
GET /api/vsl/spell?text=xin chao
Response:

    {
      "code": 200,
      "message": "Spelled 'xin chao' into 8 characters",
      "data": [
        "https://.../x.png",
        "https://.../i.png",
        "https://.../n.png",
        "https://.../%20.png",
        ...
      ]
    }



Frontend renders a sequence of gesture images.
5.4 Favorites, History, Contributions, Reports
Favorites:
Toggle:
POST /api/user/favorites/{wordId} (with JWT)
Response data:

      {
        "wordId":



List (for “My Favorites” screen):
GET /api/user/favorites?page=0&size=10
Response: data is a Page<FavoriteDTO> (content + pagination fields) or simple list depending on serialization; you should inspect actual JSON once running, but FavoriteDTO fields are:
id, dictionaryId, word, definition, videoUrl, savedAt.
Search history:
GET /api/user/history (JWT)
List of entries with fields like dictionaryId, word, searchQuery, searchedAt.
Contributions:
POST /api/user/contributions
Body shape from ContributionRequest: likely { "word": "...", "definition": "...", "videoUrl": "..." } (check DTO in code before UI binding).
Frontend should allow user-submitted suggestions but indicate they are pending admin approval.
Reports:
POST /api/user/reports
Body shape from ReportRequest: typically { "wordId": 123, "reason": "Wrong video" }.
Use for report modals on dictionary item detail pages.
5.5 Rate Limiting Awareness
Frontend should:
Avoid hammering POST /api/vsl/recognize: 10 req/s per IP limit.
Implement client-side throttling/debouncing (e.g., send per “hold-to-confirm” batch, not every frame).
Avoid brute-forcing login: 5 req/min per IP limit on /api/auth/**.
Handle HTTP 429 by:
Showing a short “You’re sending too many requests; please slow down” toast.
Optionally backing off (exponential backoff or timeout before next call).