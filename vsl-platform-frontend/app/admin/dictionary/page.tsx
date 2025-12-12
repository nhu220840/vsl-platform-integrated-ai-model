"use client";

import styles from "../../../styles/admin-dictionary.module.css";

export default function AdminDictionaryPage() {
  const words = [
    {
      id: 1,
      word: "Xin chào",
      category: "Greeting",
      difficulty: "Easy",
      views: 1234,
      videoUrl: "#",
      status: "PUBLISHED",
    },
    {
      id: 2,
      word: "Cảm ơn",
      category: "Greeting",
      difficulty: "Easy",
      views: 956,
      videoUrl: "#",
      status: "PUBLISHED",
    },
    {
      id: 3,
      word: "Xin lỗi",
      category: "Greeting",
      difficulty: "Easy",
      views: 782,
      videoUrl: "#",
      status: "DRAFT",
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
          <li className={`${styles["menu-item"]} ${styles.active}`}>
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
        <h1 className={styles["page-title"]}>QUẢN LÝ TỪ ĐIỂN</h1>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="🔍 Tìm kiếm từ vựng..."
          />
          <button className={styles.btn}>➕ Thêm từ mới</button>
          <button className={styles.btn}>📤 Import CSV</button>
        </div>

        <div className={styles["data-table"]}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>TỪ VỰNG</th>
                <th>DANH MỤC</th>
                <th>ĐỘ KHÓ</th>
                <th>LƯỢT XEM</th>
                <th>VIDEO</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id}>
                  <td>{word.id}</td>
                  <td>{word.word}</td>
                  <td>{word.category}</td>
                  <td>{word.difficulty}</td>
                  <td>{word.views}</td>
                  <td>
                    <a
                      href={word.videoUrl}
                      className={styles["video-link"]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🎥 Xem video
                    </a>
                  </td>
                  <td>
                    <span
                      className={`${styles["status-badge"]} ${
                        word.status === "PUBLISHED"
                          ? styles["status-published"]
                          : styles["status-draft"]
                      }`}
                    >
                      {word.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles["action-buttons"]}>
                      <button className={styles["btn-small"]}>✏ Sửa</button>
                      <button
                        className={`${styles["btn-small"]} ${styles["btn-danger"]}`}
                      >
                        🗑 Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
