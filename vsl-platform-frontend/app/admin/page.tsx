"use client";

import { useState } from "react";
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
  Server
} from "lucide-react";
import styles from "../../styles/admin.module.css";

export default function AdminDashboard() {
  const pathname = usePathname();

  // Menu Configuration
  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER_MANAGER]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY_DB]", href: "/admin/dictionary", icon: BookOpen },
  ];

  // Mock Stats Data (Đã thêm totalUsers)
  const stats = {
    totalUsers: 1024,
    totalWords: 5300,
    pendingContributions: 12,
    uptime: "99.9%"
  };

  return (
    <div className={styles["admin-container"]}>
      
      {/* --- STATUS BAR --- */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
                <span className={styles["status-indicator"]}></span>
                <span>SYSTEM: ONLINE</span>
            </div>
            <div className={styles["status-item"]}>
                <span>DATABASE: CONNECTED</span>
            </div>
        </div>
        <div className={styles["status-item"]}>
            <span>SECURE_MODE</span>
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
          
          {/* Card 1: Total Users (MỚI THÊM) */}
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}>
              <Users size={32} />
            </div>
            <div className={styles["stat-label"]}>TOTAL USERS</div>
            <div className={styles["stat-value"]}>{stats.totalUsers.toLocaleString()}</div>
            <div className={styles["stat-unit"]}>registered accounts</div>
          </div>

          {/* Card 2: Total Words */}
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}>
              <BookOpen size={32} />
            </div>
            <div className={styles["stat-label"]}>TOTAL WORDS</div>
            <div className={styles["stat-value"]}>{stats.totalWords.toLocaleString()}</div>
            <div className={styles["stat-unit"]}>in database</div>
          </div>

          {/* Card 3: Pending Contributions (Alert Style) */}
          <div className={`${styles["stat-card"]} ${styles["stat-card-alert"]}`}>
            <div className={styles["stat-icon"]}>
              <AlertCircle size={32} />
            </div>
            <div className={styles["stat-label"]}>PENDING CONTRIBUTIONS</div>
            <div className={styles["stat-value"]}>{stats.pendingContributions}</div>
            <div className={styles["stat-unit"]}>awaiting review</div>
          </div>

          {/* Card 4: System Uptime */}
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