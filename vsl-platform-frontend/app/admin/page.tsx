"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/admin.module.css";

interface DashboardStats {
  totalUsers: number;
  totalWords: number;
  pendingContributions: number;
  systemUptime: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1024,
    totalWords: 5300,
    pendingContributions: 12,
    systemUptime: 99.9,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalUsers: data.data?.totalUsers || 1024,
            totalWords: data.data?.totalWords || 5300,
            pendingContributions: data.data?.pendingContributions || 12,
            systemUptime: 99.9,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navigateTo = (page: string) => {
    router.push(`/admin/${page}`);
  };

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className={styles.adminBody}>
      {/* Top Status Bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusText}>
          <i className="fas fa-terminal"></i> SYSTEM: ADMIN_ACCESS_GRANTED |
          USER: ADMIN_01
        </span>
        <div className={styles.statusIndicator}>
          <span className={styles.indicatorDot}></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <i className="fas fa-lock"></i> VSL_ADMIN
          <br />
          CORE
        </div>
        <ul className={styles.sidebarMenu}>
          <li
            className={`${styles.menuItem} ${styles.active}`}
            onClick={() => navigateTo("dashboard")}
          >
            <i className="fas fa-chart-line"></i>
            <span>[DASHBOARD]</span>
          </li>
          <li className={styles.menuItem} onClick={() => navigateTo("users")}>
            <i className="fas fa-users"></i>
            <span>[USER_MANAGER]</span>
          </li>
          <li
            className={styles.menuItem}
            onClick={() => navigateTo("contributions")}
          >
            <i className="fas fa-file-upload"></i>
            <span>[CONTRIBUTIONS]</span>
          </li>
          <li
            className={styles.menuItem}
            onClick={() => navigateTo("dictionary")}
          >
            <i className="fas fa-book"></i>
            <span>[DICTIONARY_DB]</span>
          </li>
          <li className={styles.menuItem} onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>[LOGOUT]</span>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <h1 className={styles.pageTitle}>&gt; DASHBOARD_OVERVIEW</h1>

        <div className={styles.statsGrid}>
          {/* Total Users Card */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div className={styles.statLabel}>TOTAL USERS</div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.totalUsers.toLocaleString()}
            </div>
            <div className={styles.statUnit}>active accounts</div>
          </div>

          {/* Total Words Card */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-book"></i>
            </div>
            <div className={styles.statLabel}>TOTAL WORDS</div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.totalWords.toLocaleString()}
            </div>
            <div className={styles.statUnit}>in database</div>
          </div>

          {/* Pending Contributions Card (with alert) */}
          <div className={`${styles.statCard} ${styles.alert}`}>
            <div className={styles.statIcon}>
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className={styles.statLabel}>PENDING CONTRIBUTIONS</div>
            <div className={styles.statValue}>
              {loading ? "..." : stats.pendingContributions}
            </div>
            <div className={styles.statUnit}>awaiting review</div>
          </div>

          {/* System Uptime Card */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className={styles.statLabel}>SYSTEM UPTIME</div>
            <div className={styles.statValue}>
              {loading ? "..." : `${stats.systemUptime}%`}
            </div>
            <div className={styles.statUnit}>operational status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
