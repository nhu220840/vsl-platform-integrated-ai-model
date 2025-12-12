"use client";

import { useState } from "react";
import styles from "../../styles/register.module.css";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className={styles.registerContainer}>
      <div className={styles.matrixBg} />
      <div className={styles.scanline} />

      <a href="/" className={styles.backLink}>
        ← Quay lại
      </a>

      <div className={styles.registerBox}>
        <div className={styles.registerHeader}>
          <div className={styles.registerTitle}>ĐĂNG KÝ</div>
          <div className={styles.registerSubtitle}>Create VSL Account</div>
        </div>

        <form>
          <div className={styles.formGroup}>
            <label htmlFor="fullname" className={styles.formLabel}>
              Họ và tên
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              className={styles.formInput}
              placeholder="Nhập họ và tên đầy đủ"
              required
            />
          </div>

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
              required
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
              required
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
                placeholder="Tạo mật khẩu mạnh"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
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
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          <label className={styles.termsLabel}>
            <input type="checkbox" name="terms" required />
            <span>
              Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{" "}
              <a href="#">Chính sách bảo mật</a>
            </span>
          </label>

          <button type="submit" className={styles.registerButton}>
            Đăng ký
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>HOẶC</span>
        </div>

        <div className={styles.loginLink}>
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  );
}
