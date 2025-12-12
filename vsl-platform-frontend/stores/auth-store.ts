import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthResponse } from "@/types/api";

interface AuthStore {
  token: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      email: null,
      role: null,
      isAuthenticated: false,
      login: (data: AuthResponse) => {
        // Save token to localStorage for apiClient interceptor
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
        }
        set({
          token: data.token,
          username: data.username,
          email: data.email,
          role: data.role,
          isAuthenticated: true,
        });
      },
      logout: () => {
        // Remove token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({
          token: null,
          username: null,
          email: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
