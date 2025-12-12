"use client";

import { useState } from "react";
import styles from "../../styles/login.module.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.matrixBg} />
      <div className={styles.scanline} />

      <a href="/" className={styles.backLink}>
        ← Quay lại
      </a>

      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <div className={styles.loginTitle}>ĐĂNG NHẬP</div>
          <div className={styles.loginSubtitle}>Access VSL Platform</div>
        </div>

        <form>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.formInput}
              placeholder="Nhập tên đăng nhập"
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
                placeholder="Nhập mật khẩu"
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

          <div className={styles.rememberForgot}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="remember" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className={styles.forgotLink}>
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className={styles.loginButton}>
            Đăng nhập
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>HOẶC</span>
        </div>

        <div className={styles.registerLink}>
          Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  );
}
