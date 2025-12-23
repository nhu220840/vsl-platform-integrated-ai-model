import axios from "axios";
import { GestureRecognitionRequest, GestureRecognitionResponse } from '@/types/api';

// 1. Định nghĩa URL Backend (VSL Platform Backend chạy trên port 8081)
// - Local development: http://localhost:8081/api
// - Docker: http://host.docker.internal:8081/api (frontend inside container)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

// 2. Tạo instance axios với cấu hình chuẩn
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// 3. Request Interceptor: Tự động gắn Token vào header nếu có
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("Lỗi đọc token từ localStorage", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor: Xử lý lỗi 401 (Hết phiên đăng nhập)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      console.warn("Phiên đăng nhập hết hạn, chuyển hướng về trang login...");
      // Uncomment dòng dưới để tự động redirect khi token hết hạn
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 5. Object API dùng cho tính năng Nhận diện (Gesture Recognition)
export const recognitionApi = {
  predictGesture: async (data: GestureRecognitionRequest) => {
    try {
      console.log("[API] POST /vsl/predict with", data.frames.length, "frames");
      // Transform format: Landmark[][] to HandFrameDTO[] {landmarks: Landmark[]}
      const formattedFrames = data.frames.map(landmarks => ({
        landmarks: landmarks
      }));
      const response = await apiClient.post('/vsl/predict', {
        frames: formattedFrames,
        currentText: ""
      });
      
      console.log("[API] Response:", response.data);
      
      // Backend returns: {code, message, data: "Vietnamese text"}
      // Extract the Vietnamese text from response.data
      const vietnameseText = response.data?.data || response.data?.result || "Không nhận diện được";
      
      // For backward compatibility with UI expecting confidence field
      // We don't have real confidence, so return a simple response
      return {
        predictedWord: vietnameseText,
        confidence: 0.85  // Mock confidence (actual confidence comes from Python service internally)
      };
    } catch (error: any) {
      console.error("[API] Error recognizing gesture:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default apiClient;