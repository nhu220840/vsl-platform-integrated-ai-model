"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Terminal, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  AlertCircle,
  LogOut, 
  Check,
  Trash2,
  User,
  Flag
} from "lucide-react";
import styles from "../../../styles/admin-contributions.module.css";
import { adminApi } from "@/lib/admin-api-client";
import { useAuthStore } from "@/stores/auth-store";

interface Report {
  id: number;
  dictionaryId: number;
  word: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

export default function AdminReportsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { username } = useAuthStore();
  
  // Logic đồng hồ và tên Admin
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const adminName = username?.toUpperCase() || "ADMIN";

  // State cho reports từ API
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "RESOLVED">("OPEN");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB'); 
      const timeStr = now.toLocaleTimeString('en-GB');
      setCurrentDateTime(`${dateStr} - ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load reports từ API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = filterStatus === "OPEN" ? "/admin/reports/open" : "/admin/reports";
        const response = await adminApi.getReports(filterStatus);
        setReports(response);
      } catch (err: any) {
        console.error("Error loading reports:", err);
        setError(err.response?.data?.message || err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [filterStatus]);

  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER MANAGEMENT]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY DATABASE]", href: "/admin/dictionary", icon: BookOpen },
    { label: "[ERROR REPORTS]", href: "/admin/reports", icon: Flag },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleResolve = async (id: number) => {
    if (!confirm("Mark this report as resolved?")) {
      return;
    }

    try {
      await adminApi.resolveReport(id);
      const response = await adminApi.getReports(filterStatus);
      setReports(response);
      alert("Report marked as resolved!");
    } catch (err: any) {
      console.error("Error resolving report:", err);
      alert(err.response?.data?.message || err.message || "Failed to resolve report");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this report?")) {
      return;
    }

    try {
      await adminApi.deleteReport(id);
      const response = await adminApi.getReports(filterStatus);
      setReports(response);
      alert("Report deleted!");
    } catch (err: any) {
      console.error("Error deleting report:", err);
      alert(err.response?.data?.message || err.message || "Failed to delete report");
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus === "ALL") return true;
    return report.status === filterStatus;
  });

  return (
    <div className={styles["admin-page"]}>
      {/* Sidebar */}
      <div className={styles["sidebar"]}>
        <div className={styles["logo-section"]}>
          <Terminal size={24} />
          <h1>VSL ADMIN</h1>
        </div>

        <nav className={styles["nav-menu"]}>
          {menuItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <li className={pathname === item.href ? styles["active"] : ""}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </li>
            </Link>
          ))}
        </nav>

        <button className={styles["logout-btn"]} onClick={handleLogout}>
          <LogOut size={18} />
          [LOGOUT]
        </button>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        {/* Status Bar */}
        <div className={styles["status-bar"]}>
          <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
              <span className={styles["status-indicator"]}></span>
              <span>SYSTEM: ONLINE</span>
            </div>
            <div className={styles["status-item"]}>
              <span>TIME: {currentDateTime}</span>
            </div>
          </div>
          <div className={styles["status-bar-right"]}>
            <span>ADMIN: {adminName}</span>
          </div>
        </div>

        {/* Page Title */}
        <div className={styles["page-title"]}>
          <AlertCircle size={28} />
          <h2>[ERROR REPORTS MANAGEMENT]</h2>
        </div>

        {/* Filter Buttons */}
        <div className={styles["filter-buttons"]}>
          {(["OPEN", "RESOLVED", "ALL"] as const).map((status) => (
            <button
              key={status}
              className={`${styles["filter-btn"]} ${filterStatus === status ? styles["active"] : ""}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles["loading"]}>Loading reports...</div>
        ) : error ? (
          <div className={styles["error"]}>{error}</div>
        ) : filteredReports.length === 0 ? (
          <div className={styles["empty-state"]}>
            <p>No {filterStatus !== "ALL" ? filterStatus.toLowerCase() : ""} reports found</p>
          </div>
        ) : (
          <div className={styles["table-container"]}>
            <table className={styles["data-table"]}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>WORD</th>
                  <th>REASON</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>#{report.id}</td>
                    <td className={styles["word-cell"]}>
                      <Link href={`/dictionary/${report.dictionaryId}`}>
                        <strong>{report.word}</strong>
                      </Link>
                    </td>
                    <td className={styles["reason-cell"]}>{report.reason}</td>
                    <td>
                      <span className={`${styles["status-badge"]} ${styles[report.status.toLowerCase()]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className={styles["actions-cell"]}>
                      {report.status === "OPEN" && (
                        <button
                          className={styles["resolve-btn"]}
                          onClick={() => handleResolve(report.id)}
                          title="Mark as resolved"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className={styles["delete-btn"]}
                        onClick={() => handleDelete(report.id)}
                        title="Delete report"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
