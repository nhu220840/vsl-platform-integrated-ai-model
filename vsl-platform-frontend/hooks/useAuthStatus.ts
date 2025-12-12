import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export type UserRole = "ADMIN" | "USER" | "GUEST";

interface AuthStatus {
  isLoggedIn: boolean;
  userRole: UserRole;
  username: string | null;
}

/**
 * Custom hook to check authentication status
 * Returns: { isLoggedIn, userRole, username }
 */
export function useAuthStatus(): AuthStatus {
  const { isAuthenticated, role, username } = useAuthStore();
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isLoggedIn: false,
    userRole: "GUEST",
    username: null,
  });

  useEffect(() => {
    // Check if user is authenticated and has valid role
    if (isAuthenticated && role) {
      setAuthStatus({
        isLoggedIn: true,
        userRole: (role === "ADMIN" ? "ADMIN" : "USER") as UserRole,
        username: username,
      });
    } else {
      setAuthStatus({
        isLoggedIn: false,
        userRole: "GUEST",
        username: null,
      });
    }
  }, [isAuthenticated, role, username]);

  return authStatus;
}
