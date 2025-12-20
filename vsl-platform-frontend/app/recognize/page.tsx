"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useHandTracking } from "@/hooks/useHandTracking";
import styles from "../../styles/recognize.module.css";

const RECOGNITION_BATCH_SIZE = 20;

export default function GestureRecognitionPage() {
  // --- LOGIC GIỮ NGUYÊN TỪ DỰ ÁN CŨ ---
  const {
    videoRef,
    canvasRef,
    currentBatch,
    isCapturing,
    // isReady, // Có thể dùng để hiển thị trạng thái loading nếu cần
  } = useHandTracking();

  // State quản lý kết quả hiển thị
  const [currentSentence, setCurrentSentence] = useState("");
  // const [confidence, setConfidence] = useState(0); // Nếu có logic tính confidence thì uncomment
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [gesturesPerSecond, setGesturesPerSecond] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Giả lập logic update log cho giống giao diện mẫu
  const [logs, setLogs] = useState<Array<{ title: string; desc: string; active?: boolean }>>([
    { title: "SYSTEM_INIT", desc: "Initializing neural interface..." },
    { title: "CAMERA_LINK", desc: "Establishing video uplink..." },
    { title: "MODEL_LOAD", desc: "Loading VSL translation matrix..." },
  ]);

  // Timer logic (từ file cũ)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCapturing) {
      const startTime = Date.now() - elapsedTime * 1000;
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCapturing]);

  // Logic nhận diện giả lập (hoặc thực tế từ API của bạn)
  useEffect(() => {
    if (currentBatch.length > 0 && currentBatch.length % 10 === 0) {
       // Cập nhật log hiển thị hoạt động
       setLogs(prev => [
         { title: "DATA_PACKET", desc: `Batch processing: ${currentBatch.length}/${RECOGNITION_BATCH_SIZE} frames`, active: true },
         ...prev.slice(0, 4)
       ]);
    }
  }, [currentBatch]);

  // Format thời gian
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    // --- GIAO DIỆN MỚI TỪ FILE HTML ---
    <div className={styles.container}>
      {/* HUD Header */}
      <div className={styles["hud-header"]}>
        <div className={styles["logo-area"]}>
          <i className="fas fa-eye"></i> VSL PLATFORM <span style={{ fontSize: "12px", opacity: 0.7 }}>v2.4</span>
        </div>
        <div className={styles["system-status"]}>
          <div className={styles["status-item"]}>
            <div className={`${styles["status-dot"]} ${styles.blink}`}></div>
            <span>SYSTEM_ONLINE</span>
          </div>
          <div className={styles["status-item"]}>
            <div className={styles["status-dot"]}></div>
            <span>REC: {isCapturing ? "ACTIVE" : "STANDBY"}</span>
          </div>
          <div className={styles["status-item"]}>
            <span>FPS: 30</span>
          </div>
          <div className={styles["status-item"]}>
            <span>TIME: {formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        {/* Video Feed Section */}
        <div className={styles["video-container"]}>
          {/* Overlay Grid */}
          <div className={styles["overlay-grid"]}></div>
          <div className={styles["scan-line"]}></div>

          {/* Video & Canvas Elements (Logic React gắn vào đây) */}
          <div className={styles["video-feed"]}>
             <video 
                ref={videoRef} 
                className={styles["input-video"]} 
                autoPlay 
                playsInline 
                muted 
             />
             <canvas 
                ref={canvasRef} 
                className={styles["output-canvas"]} 
             />
          </div>
          
          {/* Central Target Reticle */}
          <div className={styles["target-reticle"]}>
            <div className={styles["corner-top-right"]}></div>
            <div className={styles["corner-bottom-left"]}></div>
          </div>

          {/* Result Display (Hiển thị chữ cái nhận diện được) */}
          {currentSentence && (
            <div className={styles["result-display"]}>
              <div className={styles["result-text"]}>{currentSentence}</div>
              <div className={styles["result-confidence"]}>CONFIDENCE: 98.5%</div>
            </div>
          )}

          {/* Info Panel Overlay */}
          <div className={styles["info-panel"]}>
            <div className={styles["info-title"]}>📍 POSITION YOUR HAND CLEARLY</div>
            <div className={styles["info-subtitle"]}>ENSURE ADEQUATE LIGHTING | STEADY POSITION REQUIRED</div>
          </div>
        </div>

        {/* Sidebar Terminal */}
        <div className={styles["terminal-sidebar"]}>
          <div className={styles["terminal-header"]}>
            {">"} SYSTEM_LOGS / REALTIME_ANALYSIS
          </div>
          <div className={styles["terminal-content"]}>
            {/* Dynamic Logs */}
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`${styles["log-entry"]} ${log.active ? styles["log-entry-active"] : ""}`}
              >
                <strong>&gt; {log.title}</strong><br />
                {log.desc}
              </div>
            ))}

            {/* Static Stats for Demo/Structure match */}
            <div className={styles["log-entry"]}>
              <strong>&gt; STATS</strong><br />
              Word Count: {wordCount} | Speed: {gesturesPerSecond} g/s
            </div>
            <div className={styles["log-entry"]}>
              <strong>&gt; BATCH_STATUS</strong><br />
              Buffer: {currentBatch.length} / {RECOGNITION_BATCH_SIZE}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={styles["control-panel"]}>
        <Link href="/dashboard" className={styles["tactical-btn"]}>
          <i className="fas fa-arrow-left"></i> BACK
        </Link>
        <button className={styles["tactical-btn"]} onClick={() => {
            // Logic switch mode nếu cần
            alert("Mode switching not implemented yet");
        }}>
          <i className="fas fa-exchange-alt"></i> SWITCH MODE
        </button>
      </div>
    </div>
  );
}