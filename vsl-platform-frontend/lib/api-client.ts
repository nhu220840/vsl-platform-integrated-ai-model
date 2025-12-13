import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
});

// Request interceptor: attach Bearer token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers = config.headers ?? {};
          (config.headers as Record<string, string>)[
            "Authorization"
          ] = `Bearer ${token}`;
        }
      } catch (err) {
        // LocalStorage read failed (e.g., private mode) — continue without token
        console.warn("Unable to read token from localStorage", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and 429
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      // Redirect user to login on unauthorized
      window.location.href = "/login";
    } else if (status === 429) {
      console.warn("API rate limit exceeded (429).");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
