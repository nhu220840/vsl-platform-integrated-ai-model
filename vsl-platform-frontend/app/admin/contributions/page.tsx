"use client";

import styles from "../../../styles/admin-contributions.module.css";

export default function AdminContributionsPage() {
  const contributions = [
    {
      id: 1,
      word: "Học tập",
      user: "user123",
      category: "Education",
      difficulty: "Medium",
      submitDate: "12/11/2024",
      status: "PENDING",
    },
    {
      id: 2,
      word: "Gia đình",
      user: "testuser",
      category: "Family",
      difficulty: "Easy",
      submitDate: "10/11/2024",
      status: "PENDING",
    },
    {
      id: 3,
      word: "Công việc",
      user: "user456",
      category: "Work",
      difficulty: "Medium",
      submitDate: "08/11/2024",
      status: "APPROVED",
    },
  ];

  return (
    <div className={styles["admin-container"]}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles["sidebar-title"]}>ADMIN PANEL</div>
        <ul className={styles["sidebar-menu"]}>
          <li className={styles["menu-item"]}>
            <a
              href="/admin"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              🏠 Tổng quan
            </a>
          </li>
          <li className={styles["menu-item"]}>
            <a
              href="/admin/users"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              👥 Người dùng
            </a>
          </li>
          <li className={styles["menu-item"]}>
            <a
              href="/admin/dictionary"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              📖 Từ điển
            </a>
          </li>
          <li className={`${styles["menu-item"]} ${styles.active}`}>
            <a
              href="/admin/contributions"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              📤 Đóng góp
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        <h1 className={styles["page-title"]}>DUYỆT ĐÓNG GÓP</h1>

        <div className={styles["filter-bar"]}>
          <select className={styles["filter-select"]}>
            <option>Tất cả trạng thái</option>
            <option>Chờ duyệt</option>
            <option>Đã duyệt</option>
            <option>Từ chối</option>
          </select>
          <select className={styles["filter-select"]}>
            <option>Tất cả danh mục</option>
            <option>Greeting</option>
            <option>Emotion</option>
            <option>Family</option>
            <option>Education</option>
          </select>
        </div>

        <div className={styles["contributions-grid"]}>
          {contributions.map((contrib) => (
            <div key={contrib.id} className={styles["contribution-card"]}>
              <div className={styles["card-header"]}>
                <span className={styles["card-id"]}>#{contrib.id}</span>
                <span className={styles["status-badge"]}>{contrib.status}</span>
              </div>

              <div className={styles["card-word"]}>{contrib.word}</div>

              <div className={styles["card-info"]}>
                👤 Người gửi: {contrib.user}
              </div>
              <div className={styles["card-info"]}>
                📁 Danh mục: {contrib.category}
              </div>
              <div className={styles["card-info"]}>
                🎯 Độ khó: {contrib.difficulty}
              </div>
              <div className={styles["card-info"]}>
                📅 Ngày gửi: {contrib.submitDate}
              </div>

              <div className={styles["video-placeholder"]}>
                🎥 Video Preview
              </div>

              <div className={styles["card-actions"]}>
                <button className={styles.btn}>✅ Duyệt</button>
                <button className={`${styles.btn} ${styles["btn-reject"]}`}>
                  ❌ Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
