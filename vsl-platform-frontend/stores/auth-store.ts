import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserDTO {
    id: string;
    email: string;
    name: string;
}

interface AuthResponse {
    token: string;
    user: UserDTO;
}

interface AuthStore {
    user: UserDTO | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (data: AuthResponse) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (data: AuthResponse) => {
                set({
                    token: data.token,
                    user: data.user,
                    isAuthenticated: true,
                });
            },
            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);