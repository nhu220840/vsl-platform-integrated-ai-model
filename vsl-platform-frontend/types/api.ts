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
export interface GestureInputDTO {
  landmarks: Landmark[][];
  frames: HandFrame[];
  currentText?: string;
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
