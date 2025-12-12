"use client";

import { useRouter } from "next/navigation";
import styles from "../../styles/error.module.css";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className={styles["error-container"]}>
      <div className={styles.container}>
        {/* Glitch error code */}
        <div className={styles["error-code"]}>404</div>

        {/* Subtitle with critical failure message */}
        <div className={styles.subtitle}>&gt; SYSTEM_CRITICAL_FAILURE</div>

        {/* Terminal log box */}
        <div className={styles["terminal-log"]}>
          <div className={`${styles["log-line"]} ${styles.status}`}>
            &gt; CONNECTING_TO_SERVER...{" "}
            <span className={styles["status-indicator"]}>[FAILED]</span>
          </div>
          <div className={`${styles["log-line"]} ${styles.status}`}>
            &gt; SEARCHING_DIRECTORY...{" "}
            <span className={styles["status-indicator"]}>[NULL_POINTER]</span>
          </div>
          <div className={`${styles["log-line"]} ${styles.status}`}>
            &gt; ROUTING_REQUEST...{" "}
            <span className={styles["status-indicator"]}>[INVALID_PATH]</span>
          </div>
          <div className={`${styles["log-line"]} ${styles.error}`}>&gt; ERROR_CODE: PAGE_NOT_FOUND</div>
          <div className={`${styles["log-line"]} ${styles.status}`}>
            &gt; ATTEMPTING_RECOVERY...{" "}
            <span className={styles["status-indicator"]}>[STANDBY]</span>
          </div>
        </div>

        {/* Recovery button */}
        <button className={styles["recovery-btn"]} onClick={() => router.push("/")}>
          [ INITIATE_SYSTEM_RECOVERY ]
        </button>
      </div>
    </div>
  );
}
