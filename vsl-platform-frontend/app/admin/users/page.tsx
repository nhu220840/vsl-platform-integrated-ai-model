"use client";

import styles from "../../../styles/admin-users.module.css";

export default function AdminUsersPage() {
  const users = [
    {
      id: 1,
      username: "admin",
      email: "admin@vsl.vn",
      role: "ADMIN",
      status: "ACTIVE",
      joined: "01/01/2024",
    },
    {
      id: 2,
      username: "user123",
      email: "user@vsl.vn",
      role: "USER",
      status: "ACTIVE",
      joined: "15/03/2024",
    },
    {
      id: 3,
      username: "testuser",
      email: "test@vsl.vn",
      role: "USER",
      status: "ACTIVE",
      joined: "20/05/2024",
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
        <h1 className={styles["page-title"]}>QUẢN LÝ NGƯỜI DÙNG</h1>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="🔍 Tìm kiếm người dùng..."
          />
          <button className={styles.btn}>➕ Thêm mới</button>
        </div>

        <div className={styles["data-table"]}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>TÊN ĐĂNG NHẬP</th>
                <th>EMAIL</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY THAM GIA</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`${styles["role-badge"]} ${
                        user.role === "ADMIN"
                          ? styles["role-admin"]
                          : styles["role-user"]
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className={styles["status-active"]}>{user.status}</td>
                  <td>{user.joined}</td>
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
