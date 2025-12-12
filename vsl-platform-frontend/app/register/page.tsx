"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";
import { ApiResponse, AuthResponse } from "@/types/api";
import styles from "../../styles/register.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        { username, email, password }
      );

      if (response.data.code === 200 && response.data.data) {
        const authData = response.data.data;
        // Auto login after successful registration
        login(authData);
        router.push("/dashboard");
      } else {
        setError(response.data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.matrixBg} />
      <div className={styles.scanline} />

      <Link href="/" className={styles.backLink}>
        ← Quay lại
      </Link>

      <div className={styles.registerBox}>
        <div className={styles.registerHeader}>
          <div className={styles.registerTitle}>ĐĂNG KÝ</div>
          <div className={styles.registerSubtitle}>Create VSL Account</div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.formInput}
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.formInput}
              placeholder="Chọn tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Mật khẩu
            </label>
            <div className={styles.inputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={styles.formInput}
                placeholder="Tạo mật khẩu mạnh (ít nhất 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm-password" className={styles.formLabel}>
              Xác nhận mật khẩu
            </label>
            <div className={styles.inputContainer}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                name="confirm-password"
                className={styles.formInput}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          <label className={styles.termsLabel}>
            <input type="checkbox" name="terms" required disabled={isLoading} />
            <span>
              Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{" "}
              <a href="#">Chính sách bảo mật</a>
            </span>
          </label>

          <button
            type="submit"
            className={styles.registerButton}
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>HOẶC</span>
        </div>

        <div className={styles.loginLink}>
          Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
