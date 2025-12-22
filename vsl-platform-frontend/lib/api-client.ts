import axios from "axios";
import { GestureRecognitionRequest, GestureRecognitionResponse } from '@/types/api';

// 1. Định nghĩa URL Backend mặc định (nếu không có biến môi trường thì dùng localhost:8080)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// 2. Tạo instance axios với cấu hình chuẩn
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
      // window.location.href = "/login"; // Bỏ comment nếu muốn tự động đá user ra
    }
    return Promise.reject(error);
  }
);

// 5. Object API dùng cho tính năng Nhận diện
export const recognitionApi = {
  predictGesture: async (data: GestureRecognitionRequest): Promise<GestureRecognitionResponse> => {
    try {
      // SỬA QUAN TRỌNG: Dùng 'apiClient.post' thay vì 'axios.post'
      // Không cần điền full URL, chỉ cần endpoint đuôi
      const response = await apiClient.post('/recognition/predict', data);
      return response.data;
    } catch (error) {
      console.error("Lỗi gọi API nhận diện:", error);
      throw error;
    }
  }
};

export default apiClient;