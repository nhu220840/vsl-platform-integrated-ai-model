"use client";

import { useState } from "react";
import apiClient from "@/lib/api-client";
import type { PasswordChangeRequest, ApiResponse } from "@/types/api";
import styles from "../../styles/profile.module.css";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validation
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Check if new password matches confirm password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    // Check if new password is different from old password
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError("Mật khẩu mới phải khác mật khẩu cũ");
      return;
    }

    // Check password strength (optional but recommended)
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setIsPasswordChanging(true);

    try {
      console.log("[Profile] Changing password...");

      const requestBody: PasswordChangeRequest = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      };

      const response = await apiClient.put<ApiResponse<null>>(
        "/user/profile/password",
        requestBody
      );

      if (response.data.code === 200) {
        console.log("[Profile] Password changed successfully");
        setPasswordSuccess("✓ Đổi mật khẩu thành công!");

        // Clear form
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setPasswordSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to change password");
      }
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Đổi mật khẩu thất bại";
      console.error("[Profile] Password change error:", errorMsg);
      setPasswordError(errorMsg);
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile updated successfully! (This is a demo)");
    setShowEditModal(false);
  };

  return (
    <div className={styles["profile-container"]}>
      {/* Status Bar */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-left"]}>
          <div className={styles["status-item"]}>
            <div className={styles["status-indicator"]}></div>
            <span>&gt; SYSTEM: USER_PROFILE_LOADED</span>
          </div>
        </div>
        <div className={styles["status-right"]}>
          <div className={styles["status-item"]}>
            <span>USER_ID: [ USR_2025_001 ]</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles["user-avatar"]}>👤</div>
          <div className={styles.username}>Alex_Chen</div>
          <div className={styles["nav-tabs"]}>
            <button
              className={`${styles["nav-tab"]} ${
                activeTab === "overview" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              OVERVIEW
            </button>
            <button
              className={`${styles["nav-tab"]} ${
                activeTab === "history" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              HISTORY_LOG
            </button>
            <button
              className={`${styles["nav-tab"]} ${
                activeTab === "favorites" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("favorites")}
            >
              FAVORITE_DATA
            </button>
            <button
              className={`${styles["nav-tab"]} ${
                activeTab === "uploads" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("uploads")}
            >
              MY_UPLOADS
            </button>
            <button
              className={`${styles["nav-tab"]} ${
                activeTab === "settings" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("settings")}
            >
              SETTINGS
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles["main-content"]}>
          {/* Overview Tab */}
          <div
            className={`${styles["tab-content"]} ${
              activeTab === "overview" ? styles.active : ""
            }`}
          >
            <div className={styles["tab-title"]}>&gt; OVERVIEW</div>
            <div className={styles["overview-container"]}>
              <div className={styles["overview-left"]}>
                <div className={styles["overview-avatar"]}>👤</div>
                <div className={styles["overview-fullname"]}>Alex Chen</div>
                <div className={styles["overview-bio"]}>
                  A passionate developer and sign language enthusiast. Always
                  learning and contributing to the VSL community.
                </div>
              </div>

              <div className={styles["overview-right"]}>
                <div className={styles["overview-specs"]}>
                  <div className={styles["spec-item"]}>
                    <div className={styles["spec-label"]}>&gt; EMAIL:</div>
                    <div className={styles["spec-value"]}>
                      alex.chen@example.com
                    </div>
                  </div>
                  <div className={styles["spec-item"]}>
                    <div className={styles["spec-label"]}>&gt; PHONE:</div>
                    <div className={styles["spec-value"]}>+84 901 234 567</div>
                  </div>
                  <div className={styles["spec-item"]}>
                    <div className={styles["spec-label"]}>
                      &gt; DATE_OF_BIRTH:
                    </div>
                    <div className={styles["spec-value"]}>2000-01-15</div>
                  </div>
                  <div className={styles["spec-item"]}>
                    <div className={styles["spec-label"]}>&gt; ADDRESS:</div>
                    <div className={styles["spec-value"]}>Can Tho, Vietnam</div>
                  </div>
                  <div className={styles["spec-item"]}>
                    <div className={styles["spec-label"]}>&gt; ROLE:</div>
                    <div className={styles["spec-value"]}>[ USER_CLASS_1 ]</div>
                  </div>
                </div>
                <button
                  className={styles["edit-button"]}
                  onClick={() => setShowEditModal(true)}
                >
                  [ EDIT_PROFILE ]
                </button>
              </div>
            </div>
          </div>

          {/* History Tab */}
          <div
            className={`${styles["tab-content"]} ${
              activeTab === "history" ? styles.active : ""
            }`}
          >
            <div className={styles["tab-title"]}>&gt; HISTORY_LOG</div>
            <div className={styles["history-list"]}>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 14:32]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Xin chào&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 14:28]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Cảm ơn&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 14:15]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Tôi yêu bạn&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 13:45]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Xin lỗi&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 13:20]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Bao nhiêu tiền&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 12:55]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Tất cả đều ổn&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 12:30]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Đến đây&quot;
                </div>
              </div>
              <div className={styles["history-item"]}>
                <div className={styles["history-timestamp"]}>
                  [2025-11-27 11:45]
                </div>
                <div className={styles["history-text"]}>
                  Searched: &quot;Hôm nay thế nào&quot;
                </div>
              </div>
            </div>
          </div>

          {/* Favorites Tab */}
          <div
            className={`${styles["tab-content"]} ${
              activeTab === "favorites" ? styles.active : ""
            }`}
          >
            <div className={styles["tab-title"]}>&gt; FAVORITE_DATA</div>
            <div className={styles["favorites-grid"]}>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Xin chào</div>
                <div className={styles["word-card-definition"]}>
                  Hello/Goodbye
                </div>
              </div>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Cảm ơn</div>
                <div className={styles["word-card-definition"]}>Thank you</div>
              </div>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Tôi yêu bạn</div>
                <div className={styles["word-card-definition"]}>I love you</div>
              </div>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Xin lỗi</div>
                <div className={styles["word-card-definition"]}>
                  Sorry/Excuse me
                </div>
              </div>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Bao nhiêu</div>
                <div className={styles["word-card-definition"]}>
                  How much/many
                </div>
              </div>
              <div className={styles["word-card"]}>
                <div className={styles["word-card-title"]}>Tất cả ổn</div>
                <div className={styles["word-card-definition"]}>
                  Everything is fine
                </div>
              </div>
            </div>
          </div>

          {/* Uploads Tab */}
          <div
            className={`${styles["tab-content"]} ${
              activeTab === "uploads" ? styles.active : ""
            }`}
          >
            <div className={styles["tab-title"]}>&gt; MY_UPLOADS</div>
            <table className={styles["uploads-table"]}>
              <thead>
                <tr>
                  <th>WORD</th>
                  <th>SUBMISSION_DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Điều tuyệt vời</td>
                  <td>2025-11-26 09:30</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-approved"]}`}
                    >
                      APPROVED
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Bạn khỏe không</td>
                  <td>2025-11-25 14:15</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-approved"]}`}
                    >
                      APPROVED
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Tôi không hiểu</td>
                  <td>2025-11-24 11:20</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-pending"]}`}
                    >
                      PENDING
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Vui lòng giúp tôi</td>
                  <td>2025-11-23 16:45</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-rejected"]}`}
                    >
                      REJECTED
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Nơi này đẹp lắm</td>
                  <td>2025-11-22 10:05</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-approved"]}`}
                    >
                      APPROVED
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Bạn tên gì</td>
                  <td>2025-11-21 13:30</td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${styles["badge-pending"]}`}
                    >
                      PENDING
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Settings Tab */}
          <div
            className={`${styles["tab-content"]} ${
              activeTab === "settings" ? styles.active : ""
            }`}
          >
            <div className={styles["tab-title"]}>&gt; SETTINGS</div>
            <form
              className={styles["settings-form"]}
              onSubmit={handlePasswordChange}
            >
              {passwordError && (
                <div className={styles["error-message"]}>
                  ⚠️ {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className={styles["success-message"]}>
                  {passwordSuccess}
                </div>
              )}

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>OLD_PASSWORD</label>
                <input
                  type="password"
                  className={styles["form-input"]}
                  placeholder="Enter current password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isPasswordChanging}
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>NEW_PASSWORD</label>
                <input
                  type="password"
                  className={styles["form-input"]}
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isPasswordChanging}
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>CONFIRM_PASSWORD</label>
                <input
                  type="password"
                  className={styles["form-input"]}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isPasswordChanging}
                />
              </div>
              <button
                type="submit"
                className={styles["form-button"]}
                disabled={isPasswordChanging}
              >
                {isPasswordChanging ? "CHANGING..." : "CHANGE_PASSWORD"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className={`${styles.modal} ${styles.active}`}>
          <div className={styles["modal-content"]}>
            <button
              className={styles["modal-close-btn"]}
              onClick={() => setShowEditModal(false)}
            >
              ×
            </button>
            <div className={styles["modal-title"]}>&gt; EDIT_PROFILE</div>
            <form className={styles["modal-form"]} onSubmit={handleEditProfile}>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>FULL_NAME</label>
                <input
                  type="text"
                  className={styles["form-input"]}
                  placeholder="Enter full name"
                  defaultValue="Alex Chen"
                  required
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>PHONE_NUMBER</label>
                <input
                  type="tel"
                  className={styles["form-input"]}
                  placeholder="Enter phone number"
                  defaultValue="+84 901 234 567"
                  required
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>DATE_OF_BIRTH</label>
                <input
                  type="date"
                  className={styles["form-input"]}
                  defaultValue="2000-01-15"
                  required
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>ADDRESS</label>
                <input
                  type="text"
                  className={styles["form-input"]}
                  placeholder="Enter address"
                  defaultValue="Can Tho, Vietnam"
                  required
                />
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>BIO</label>
                <textarea
                  className={styles["form-input"]}
                  placeholder="Enter your bio"
                  rows={4}
                  defaultValue="A passionate developer and sign language enthusiast. Always learning and contributing to the VSL community."
                  required
                ></textarea>
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>AVATAR_URL</label>
                <input
                  type="text"
                  className={styles["form-input"]}
                  placeholder="Enter avatar image URL"
                  defaultValue="https://api.example.com/avatar/user123"
                  required
                />
              </div>
              <div className={styles["modal-button-group"]}>
                <button
                  type="button"
                  className={`${styles["modal-button"]} ${styles.cancel}`}
                  onClick={() => setShowEditModal(false)}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles["modal-button"]}>
                  SAVE_CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
