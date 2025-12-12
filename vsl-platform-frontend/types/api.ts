// --- Generic API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// --- AuthResponse (from backend AuthResponse.java)
export interface AuthResponse {
  token: string;
  type?: string; // "Bearer" by default
  username: string;
  email: string;
  role: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO date string (LocalDate)
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
}

// --- GestureInputDTO and nested types (from backend GestureInputDTO.java, HandFrameDTO.java, LandmarkDTO.java)
// Note: Backend computes landmarks[][] from frames[], so we only send frames and currentText from frontend
export interface GestureInputDTO {
  frames: HandFrame[];
  currentText: string;
}

export interface HandFrame {
  landmarks: Landmark[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// --- UserDTO (from backend UserDTO.java)
export interface UserDTO {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO date string (LocalDate)
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
  role: string;
  createdAt: string; // ISO date-time string (LocalDateTime)
  updatedAt: string; // ISO date-time string (LocalDateTime)
}

// --- DictionaryDTO (from backend DictionaryDTO.java)
export interface DictionaryDTO {
  id: number;
  word: string;
  definition?: string;
  videoUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- FavoriteToggleResponse (from backend - POST /api/user/favorites/{wordId})
export interface FavoriteToggleResponse {
  wordId: number;
  isFavorite: boolean;
}

// --- ReportRequest (for POST /api/user/reports)
export interface ReportRequest {
  wordId: number;
  reason: string;
}

// --- SearchHistoryDTO (from backend - GET /api/user/history)
export interface SearchHistoryDTO {
  dictionaryId: number | null;
  word: string | null;
  searchQuery: string;
  searchedAt: string; // ISO date string
}

// --- FavoriteDTO (from backend - GET /api/user/favorites)
export interface FavoriteDTO {
  id: number;
  dictionaryId: number;
  word: string;
  definition: string;
  videoUrl: string;
  savedAt: string; // ISO date string
}

// --- PasswordChangeRequest (for PUT /api/user/profile/password)
export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

// --- ContributionRequest (for POST /api/user/contributions)
export interface ContributionRequest {
  word: string;
  definition: string;
  videoUrl: string;
}
