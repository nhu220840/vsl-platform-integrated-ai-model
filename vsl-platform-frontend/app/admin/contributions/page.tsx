"use client";

import { useState, useEffect } from "react"; // 1. Thêm useEffect
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
  CheckCircle,
  XCircle,
  User // 2. Thêm icon User
} from "lucide-react";
import styles from "../../../styles/admin-contributions.module.css";

interface Contribution {
  id: number;
  word: string;
  user: string;
  category: string;
  difficulty: string;
  submitDate: string;
  status: string;
  definition: string;
  videoUrl?: string;
}

export default function AdminContributionsPage() {
  const pathname = usePathname();
  
  // 3. Logic đồng hồ và tên Admin
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const adminName = "SHERRY";

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

  // Menu Config
  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER_MANAGEMENT]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY_DB]", href: "/admin/dictionary", icon: BookOpen },
  ];

  const [contributions, setContributions] = useState<Contribution[]>([
    {
      id: 1,
      word: "Học tập",
      user: "user123",
      category: "Education",
      difficulty: "Medium",
      submitDate: "12/11/2024",
      status: "PENDING",
      definition: "Quá trình tiếp thu kiến thức, kỹ năng, kinh nghiệm mới thông qua việc học, nghiên cứu hoặc giảng dạy.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
    },
    {
      id: 2,
      word: "Gia đình",
      user: "testuser",
      category: "Family",
      difficulty: "Easy",
      submitDate: "10/11/2024",
      status: "PENDING",
      definition: "Tập hợp những người gắn bó với nhau do hôn nhân, quan hệ huyết thống hoặc quan hệ nuôi dưỡng.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
        id: 3,
        word: "Cảm ơn",
        user: "user456",
        category: "Communication",
        difficulty: "Easy",
        submitDate: "08/11/2024",
        status: "PENDING",
        definition: "Lời nói biểu thị sự biết ơn đối với người khác khi nhận được sự giúp đỡ.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
  ]);

  const handleApprove = (id: number) => {
    alert(`Contribution #${id} approved!`);
    setContributions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: number) => {
    alert(`Contribution #${id} rejected!`);
    setContributions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={styles["admin-container"]}>
      
      {/* 4. STATUS BAR MỚI */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
                <span className={styles["status-indicator"]}></span>
                <span>SYSTEM: ONLINE</span>
            </div>
            <div className={styles["status-item"]}>
                <User size={14} />
                <span style={{textTransform: 'uppercase'}}>ADMIN: {adminName}</span>
            </div>
        </div>
        <div className={styles["status-item"]}>
            <span>{currentDateTime}</span>
        </div>
      </div>

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

      <main className={styles["main-content"]}>
        <h1 className={styles["page-title"]}>{">"} PENDING_REQUESTS</h1>

        {contributions.length > 0 ? (
          <div className={styles["review-list"]}>
            {contributions.map((contrib) => (
              <div key={contrib.id} className={styles["review-card"]}>
                <div className={styles["review-card-content"]}>
                  <div className={styles["card-info"]}>
                    <div className={styles["card-word"]}>{contrib.word}</div>
                    <div className={styles["card-submitted"]}>
                      SUBMITTED BY: <span>{contrib.user}</span>
                    </div>
                    <div className={styles["card-definition"]}>
                      <div className={styles["card-definition-label"]}>DEFINITION:</div>
                      <div>{contrib.definition}</div>
                      <div className="mt-2 text-xs text-gray-500">
                         Category: {contrib.category} | Difficulty: {contrib.difficulty}
                      </div>
                    </div>
                  </div>
                  <div className={styles["video-preview"]}>
                    <iframe 
                        src={contrib.videoUrl} 
                        title={`Video for ${contrib.word}`}
                        allowFullScreen 
                    />
                  </div>
                  <div className={styles["card-actions"]}>
                    <button 
                        className={`${styles["btn"]} ${styles["btn-approve"]}`}
                        onClick={() => handleApprove(contrib.id)}
                    >
                       <span className="flex items-center justify-center gap-2">
                         APPROVE
                       </span>
                    </button>
                    <button 
                        className={`${styles["btn"]} ${styles["btn-reject"]}`}
                        onClick={() => handleReject(contrib.id)}
                    >
                        <span className="flex items-center justify-center gap-2">
                            REJECT
                        </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles["empty-state"]}>
             <div className={styles["empty-state-icon"]}>
                <CheckCircle size={64} />
             </div>
             <div>{">"} SYSTEM: ALL_DATA_PROCESSED. QUEUE_EMPTY.</div>
          </div>
        )}
      </main>
    </div>
  );
}