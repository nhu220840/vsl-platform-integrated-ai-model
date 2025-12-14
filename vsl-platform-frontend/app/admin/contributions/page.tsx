"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Lock,
  TrendingUp, 
  Users, 
  Upload, 
  BookOpen, 
  LogOut, 
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
    console.log(`[v0] Approving contribution: ${id}`);
    alert(`Contribution #${id} approved!`);
    setContributions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: number) => {
    console.log(`[v0] Rejecting contribution: ${id}`);
    alert(`Contribution #${id} rejected!`);
    setContributions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={styles["admin-container"]}>
      {/* --- Top Status Bar --- */}
      <div className={styles["status-bar"]}>
        <span className={styles["status-text"]}>
          <span className="flex items-center gap-2">
             <Terminal size={14} /> SYSTEM: REVIEW_MODE_ACTIVE | MODULE: CONTRIBUTIONS
          </span>
        </span>
        <div className={styles["status-indicator"]}>
          <span className={styles["indicator-dot"]}></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* --- Sidebar --- */}
      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
           <div className="flex items-center gap-2">
             <Lock size={16}/> VSL_ADMIN
           </div>
           CORE
        </div>
        
        <ul className={styles["sidebar-menu"]}>
          <li>
            <Link href="/admin" className={styles["menu-item"]}>
              <span className={styles["icon-wrapper"]}><TrendingUp size={16}/></span>
              <span>[DASHBOARD]</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className={styles["menu-item"]}>
              <span className={styles["icon-wrapper"]}><Users size={16}/></span>
              <span>[USER_MANAGER]</span>
            </Link>
          </li>
          <li>
            <div className={`${styles["menu-item"]} ${styles["menu-item-active"]}`}>
              <span className={styles["icon-wrapper"]}><Upload size={16}/></span>
              <span>[CONTRIBUTIONS]</span>
            </div>
          </li>
          <li>
            <Link href="/admin/dictionary" className={styles["menu-item"]}>
               <span className={styles["icon-wrapper"]}><BookOpen size={16}/></span>
               <span>[DICTIONARY_DB]</span>
            </Link>
          </li>
          <li>
            <div className={styles["menu-item"]}>
               <span className={styles["icon-wrapper"]}><LogOut size={16}/></span>
               <span>[LOGOUT]</span>
            </div>
          </li>
        </ul>
      </aside>

      {/* --- Main Content --- */}
      <main className={styles["main-content"]}>
        <h1 className={styles["page-title"]}>{">"} PENDING_REQUESTS</h1>

        {contributions.length > 0 ? (
          <div className={styles["review-list"]}>
            {contributions.map((contrib) => (
              <div key={contrib.id} className={styles["review-card"]}>
                <div className={styles["review-card-content"]}>
                  
                  {/* Cột 1: Thông tin từ */}
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

                  {/* Cột 2: Video Preview */}
                  <div className={styles["video-preview"]}>
                    <iframe 
                        src={contrib.videoUrl} 
                        title={`Video for ${contrib.word}`}
                        allowFullScreen 
                    />
                  </div>

                  {/* Cột 3: Actions (Đã bỏ icon) */}
                  <div className={styles["card-actions"]}>
                    <button 
                        className={`${styles["btn"]} ${styles["btn-approve"]}`}
                        onClick={() => handleApprove(contrib.id)}
                    >
                       APPROVE
                    </button>
                    <button 
                        className={`${styles["btn"]} ${styles["btn-reject"]}`}
                        onClick={() => handleReject(contrib.id)}
                    >
                        REJECT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className={styles["empty-state"]}>
             <div className={styles["empty-state-icon"]}>
                <Terminal size={64} />
             </div>
             <div>{">"} SYSTEM: ALL_DATA_PROCESSED. QUEUE_EMPTY.</div>
          </div>
        )}
      </main>
    </div>
  );
}