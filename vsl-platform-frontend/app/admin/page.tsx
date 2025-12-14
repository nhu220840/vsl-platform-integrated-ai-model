"use client";

import { useState, useEffect } from "react"; // 1. Import useEffect
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Terminal, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut, 
  Lock, 
  AlertCircle,
  Activity,
  User
} from "lucide-react";
import styles from "../../styles/admin.module.css";

export default function AdminDashboard() {
  const pathname = usePathname();
  
  // 2. State cho đồng hồ
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const adminName = "SHERRY"; // Tên Admin (sau này có thể lấy từ context/API)

  // 3. Effect cập nhật thời gian mỗi giây
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: DD/MM/YYYY | HH:mm:ss
      const dateStr = now.toLocaleDateString('en-GB'); 
      const timeStr = now.toLocaleTimeString('en-GB');
      setCurrentDateTime(`${dateStr} - ${timeStr}`);
    };

    updateTime(); // Chạy ngay lập tức
    const timer = setInterval(updateTime, 1000); // Cập nhật mỗi giây

    return () => clearInterval(timer); // Dọn dẹp khi unmount
  }, []);

  // Menu Configuration
  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER_MANAGEMENT]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY_DB]", href: "/admin/dictionary", icon: BookOpen },
  ];

  // Mock Stats Data
  const stats = {
    totalUsers: 1024,
    totalWords: 5300,
    pendingContributions: 12,
    uptime: "99.9%"
  };

  return (
    <div className={styles["admin-container"]}>
      
      {/* --- STATUS BAR (Đã cập nhật) --- */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
                <span className={styles["status-indicator"]}></span>
                <span>SYSTEM: ONLINE</span>
            </div>
            
            {/* Phần hiển thị tên Admin */}
            <div className={styles["status-item"]}>
                <User size={14} /> {/* Thêm icon user cho đẹp */}
                <span style={{textTransform: 'uppercase'}}>ADMIN: {adminName}</span>
            </div>
        </div>

        {/* Phần hiển thị Ngày & Giờ bên phải */}
        <div className={styles["status-item"]}>
            <span>{currentDateTime}</span>
        </div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
           <div className="flex items-center gap-2">
             <Lock size={16}/> VSL_ADMIN
           </div>
           CORE
        </div>
        
        <ul className={styles["sidebar-menu"]}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`${styles["menu-item"]} ${isActive ? styles["menu-item-active"] : ""}`}
                >
                  <span className={styles["icon-wrapper"]}><Icon size={16}/></span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}

          <li>
            <div className={styles["menu-item"]} style={{cursor: 'pointer'}}>
               <span className={styles["icon-wrapper"]}><LogOut size={16}/></span>
               <span>[LOGOUT]</span>
            </div>
          </li>
        </ul>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles["main-content"]}>
        
        <h1 className={styles["page-title"]}>
          <Terminal size={28} />
          SYSTEM OVERVIEW
        </h1>

        <div className={styles["stats-grid"]}>
          
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}>
              <Users size={32} />
            </div>
            <div className={styles["stat-label"]}>TOTAL USERS</div>
            <div className={styles["stat-value"]}>{stats.totalUsers.toLocaleString()}</div>
            <div className={styles["stat-unit"]}>registered accounts</div>
          </div>

          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}>
              <BookOpen size={32} />
            </div>
            <div className={styles["stat-label"]}>TOTAL WORDS</div>
            <div className={styles["stat-value"]}>{stats.totalWords.toLocaleString()}</div>
            <div className={styles["stat-unit"]}>in database</div>
          </div>

          <div className={`${styles["stat-card"]} ${styles["stat-card-alert"]}`}>
            <div className={styles["stat-icon"]}>
              <AlertCircle size={32} />
            </div>
            <div className={styles["stat-label"]}>PENDING CONTRIBUTIONS</div>
            <div className={styles["stat-value"]}>{stats.pendingContributions}</div>
            <div className={styles["stat-unit"]}>awaiting review</div>
          </div>

          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}>
              <Activity size={32} />
            </div>
            <div className={styles["stat-label"]}>SYSTEM UPTIME</div>
            <div className={styles["stat-value"]}>{stats.uptime}</div>
            <div className={styles["stat-unit"]}>operational status</div>
          </div>

        </div>

      </main>
    </div>
  );
}