"use client";

import { useState } from "react";
import styles from "../../styles/recognize.module.css";

export default function GestureRecognitionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [confidence, setConfidence] = useState(85);

  return (
    <div className={styles["hud-container"]}>
      <div className={styles.scanline} />

      {/* Status Bar */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-left"]}>
          <div className={styles["status-item"]}>
            <div className={styles["status-indicator"]} />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className={styles["status-item"]}>
            <span>FPS: 30</span>
          </div>
          <div className={styles["status-item"]}>
            <span>MODEL: MLP v2.1</span>
          </div>
        </div>
        <div className={styles["status-right"]}>
          <a
            href="/"
            style={{
              color: "#00ff41",
              textDecoration: "none",
              letterSpacing: "2px",
              fontSize: "12px",
            }}
          >
            ← THOÁT
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles["sidebar-title"]}>KẾT QUẢ NHẬN DẠNG</div>

          <div className={styles["output-text"]}>
            Xin chào, tôi đang học ngôn ngữ ký hiệu...
          </div>

          <div className={styles["confidence-meter"]}>
            <div className={styles["meter-label"]}>
              <span>ĐỘ TIN CẬY</span>
              <span>{confidence}%</span>
            </div>
            <div className={styles["meter-bar"]}>
              <div className={styles["meter-fill"]} style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className={styles["control-buttons"]}>
            <button
              className={`${styles.btn} ${isRecording ? styles["btn-danger"] : styles["btn-primary"]}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? "⏹ Dừng ghi" : "⏺ Bắt đầu ghi"}
            </button>
            <button className={styles.btn}>🗑 Xóa văn bản</button>
            <button className={styles.btn}>💾 Lưu kết quả</button>
            <button className={styles.btn}>📋 Sao chép</button>
          </div>
        </div>

        {/* Viewport */}
        <div className={styles["viewport-container"]}>
          <div className={styles["viewport-wrapper"]}>
            <div className={styles["camera-placeholder"]}>
              <div className={styles["camera-icon"]}>📹</div>
              <div className={styles["camera-text"]}>CAMERA CHƯA ĐƯỢC KÍCH HOẠT</div>
              <div
                style={{ marginTop: "20px", fontSize: "14px", opacity: 0.5 }}
              >
                Nhấn &quot;Bắt đầu ghi&quot; để khởi động camera
              </div>
            </div>
            <div className={styles["tracking-overlay"]} />
          </div>

          {/* Stats Grid */}
          <div className={styles["stats-grid"]}>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Tổng từ</div>
              <div className={styles["stat-value"]}>12</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Cử chỉ/giây</div>
              <div className={styles["stat-value"]}>2.4</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Thời gian</div>
              <div className={styles["stat-value"]}>00:45</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Trạng thái</div>
              <div className={styles["stat-value"]} style={{ fontSize: "16px" }}>
                {isRecording ? "ĐANG GHI" : "CHƯA BẮT ĐẦU"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
