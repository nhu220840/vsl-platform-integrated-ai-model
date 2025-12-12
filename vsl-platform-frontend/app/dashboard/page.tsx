"use client";

import { useRouter } from "next/navigation";
import styles from "../../styles/dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className={styles["dashboard-container"]}>
      <button className={styles["back-button"]} onClick={() => router.back()}>
        ← QUAY LẠI
      </button>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.title}>VSL PLATFORM</div>
          <div className={styles["user-icon"]} onClick={() => router.push("/users")}>
            👤
          </div>
        </div>

        <div className={styles["buttons-grid"]}>
          <button
            className={styles["action-button"]}
            onClick={() => router.push("/recognize")}
          >
            <div className={styles["button-icon"]}>📷</div>
            <div className={styles["button-text"]}>DỊCH CỬ CHỈ</div>
            <div className={styles["button-subtitle"]}>Gesture to Text</div>
          </button>

          <button
            className={styles["action-button"]}
            onClick={() => router.push("/spell")}
          >
            <div className={styles["button-icon"]}>⌨️</div>
            <div className={styles["button-text"]}>ĐÁNH VẦN</div>
            <div className={styles["button-subtitle"]}>Text to Gesture</div>
          </button>

          <button
            className={styles["action-button"]}
            onClick={() => router.push("/dictionary")}
          >
            <div className={styles["button-icon"]}>📖</div>
            <div className={styles["button-text"]}>TỪ ĐIỂN</div>
            <div className={styles["button-subtitle"]}>Dictionary</div>
          </button>
        </div>
      </div>
    </div>
  );
}
