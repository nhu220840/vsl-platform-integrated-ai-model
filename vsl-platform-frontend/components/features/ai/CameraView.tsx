import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthResponse, UserDTO } from "@/types/api";

// ============================================
// Store Interface
// ============================================
interface AuthStore {
  // State
  user: UserDTO | null;
  token: string | null;

  // Actions
  login: (response: AuthResponse) => void;
  logout: () => void;
  setUser: (user: UserDTO | null) => void;
  setToken: (token: string | null) => void;
}

// ============================================
// Zustand Store with Persist Middleware
// ============================================
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,

      // Login action - stores user & token
      login: (response: AuthResponse) => {
        const userData: UserDTO = {
          ...response,
          id: 0, // ID will be fetched separately from /me endpoint if needed
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
// ============================================
// AuthResponse - User Authentication Response
// ============================================
export interface AuthResponse {
  token: string;
  type?: string; // "Bearer" by default
  username: string;
  email: string;
  role: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO date string (LocalDate from Java)
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
}

// ============================================
// UserDTO - Extended User Profile (Admin/Self)
// ============================================
export interface UserDTO extends AuthResponse {
  id: number;
  createdAt: string; // ISO datetime string (LocalDateTime)
  updatedAt: string; // ISO datetime string (LocalDateTime)
}

// ============================================
// GestureInputDTO - Gesture Recognition Request
// ============================================
export interface GestureInputDTO {
  frames: HandFrame[];
  currentText?: string; // Defaults to empty string
}

export interface HandFrame {
  landmarks: Landmark[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// ============================================
// DictionaryDTO - Word Dictionary Entry
// ============================================
export interface DictionaryDTO {
  id: number;
  word: string;
  definition: string;
  videoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ApiResponse<T> - Standardized API Wrapper
// ============================================
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

// ============================================
// Common Response Types
// ============================================
export interface AuthApiResponse extends ApiResponse<AuthResponse> {}
export interface UserApiResponse extends ApiResponse<UserDTO> {}
export interface GestureApiResponse extends ApiResponse<string> {}
export interface DictionaryApiResponse extends ApiResponse<DictionaryDTO[]> {}
        set({
          user: userData,
          token: response.token,
        });
      },

      // Logout action - clears state
      logout: () => {
        set({
          user: null,
          token: null,
        });
      },

      // Update user profile
      setUser: (user: UserDTO | null) => {
        set({ user });
      },

      // Update token (for refresh scenarios)
      setToken: (token: string | null) => {
        set({ token });
      },
    }),
    {
      // Persist configuration
      name: "auth-store", // Key in localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
