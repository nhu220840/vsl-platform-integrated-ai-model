"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useHandTracking } from "@/hooks/useHandTracking";
import styles from "../../styles/recognize.module.css";
import { recognitionApi } from "@/lib/api-client"; // Import API

// CẤU HÌNH NHẬN DIỆN
const RECOGNITION_BATCH_SIZE = 20; // Số frame cần để model AI hiểu (khớp với lúc train model)
const CONFIDENCE_THRESHOLD = 0.70; // Chỉ hiện kết quả nếu độ tin cậy > 70%

export default function GestureRecognitionPage() {
  // 1. Hook MediaPipe
  const {
    videoRef,
    canvasRef,
    currentBatch,
    setFrameBatch,
    startCapture,
    stopCapture,
    isCapturing,
    isReady
  } = useHandTracking();

  // 2. State quản lý kết quả
  const [currentResult, setCurrentResult] = useState("Waiting...");
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyLog, setHistoryLog] = useState<string[]>([]); // Lưu lịch sử nhận diện

  // State thống kê (cho đẹp giao diện)
  const [totalGestures, setTotalGestures] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --- LOGIC 1: Tự động bật camera khi vào trang ---
  useEffect(() => {
    if (isReady) {
      startCapture();
    }
    return () => stopCapture();
  }, [isReady, startCapture, stopCapture]);

  // --- LOGIC 2: Gửi dữ liệu lên AI Model ---
  useEffect(() => {
    const processBatch = async () => {
      // Điều kiện kích hoạt: Đủ frame VÀ không đang bận xử lý VÀ đang bật camera
      if (currentBatch.length >= RECOGNITION_BATCH_SIZE && !isProcessing && isCapturing) {
        setIsProcessing(true); // Khóa lại để không gửi trùng

        try {
          // Chuẩn bị dữ liệu: Chuyển đổi từ HandFrame[] sang Landmark[][]
          // Backend cần mảng 2 chiều: [Frame1[21 points], Frame2[21 points]...]
          const framesPayload = currentBatch.map(frame => frame.landmarks);

          console.log(`[Recognition] Sending ${framesPayload.length} frames to backend...`);

          // Gọi API
          const response = await recognitionApi.predictGesture({ 
            frames: framesPayload 
          });

          console.log(`[Recognition] Backend response:`, response);

          // Xử lý kết quả trả về
          if (response && response.predictedWord) {
            const letter = response.predictedWord.toUpperCase();
            
            setCurrentResult(letter);
            setConfidence(response.confidence || 0.85);
            setTotalGestures(prev => prev + 1);
            
            // Thêm vào log bên phải
            setHistoryLog(prev => [`[${new Date().toLocaleTimeString()}] DETECTED: ${letter} (${((response.confidence || 0.85) * 100).toFixed(0)}%)`, ...prev.slice(0, 9)]);
          } else {
             console.warn("[Recognition] No result from backend");
             setCurrentResult("...");
          }

        } catch (error: any) {
          console.error("AI Error:", error);
          const errorMsg = error?.response?.status === 401 
            ? "⚠️ HẠNG SỬ" 
            : error?.response?.status === 503
            ? "⚠️ AI Service Down"
            : "ERR";
          setCurrentResult(errorMsg);
          setHistoryLog(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${error?.message || 'Unknown error'}`, ...prev.slice(0, 9)]);
        } finally {
          // Quan trọng: Reset batch và mở khóa để nhận diện tiếp
          setFrameBatch([]); 
          setIsProcessing(false);
        }
      }
    };

    processBatch();
  }, [currentBatch, isProcessing, isCapturing, setFrameBatch]);

  // --- LOGIC 3: Đồng hồ đếm giờ ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCapturing) {
      timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCapturing]);

  // Format thời gian
  const formatTime = (s: number) => new Date(s * 1000).toISOString().substr(14, 5);

  return (
    <div className={styles.container}>
      {/* --- HUD HEADER --- */}
      <div className={styles["hud-header"]}>
        <div className={styles["logo-area"]}>
          <i className="fas fa-eye"></i> VSL SYSTEM <span style={{ fontSize: "12px", opacity: 0.7 }}>AI-CORE</span>
        </div>
        <div className={styles["system-status"]}>
          <div className={styles["status-item"]}>
            <div className={`${styles["status-dot"]} ${isCapturing ? styles.blink : ''}`} 
                 style={{background: isCapturing ? '#00ff41' : 'red'}}></div>
            <span>CAMERA: {isCapturing ? "ONLINE" : "OFFLINE"}</span>
          </div>
          <div className={styles["status-item"]}>
             {/* Đèn vàng khi đang xử lý AI */}
            <div className={styles["status-dot"]} 
                 style={{background: isProcessing ? 'yellow' : '#004d00'}}></div>
            <span>AI STATUS: {isProcessing ? "ANALYZING..." : "READY"}</span>
          </div>
          <div className={styles["status-item"]}>
            <span>TIME: {formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className={styles["main-content"]}>
        
        {/* VIDEO CONTAINER */}
        <div className={styles["video-container"]}>
          <div className={styles["overlay-grid"]}></div>
          <div className={styles["scan-line"]}></div>

          <div className={styles["video-feed"]}>
             <video ref={videoRef} className={styles["input-video"]} autoPlay playsInline muted />
             <canvas ref={canvasRef} className={styles["output-canvas"]} />
          </div>
          
          <div className={styles["target-reticle"]}>
            <div className={styles["corner-top-right"]}></div>
            <div className={styles["corner-bottom-left"]}></div>
          </div>

          {/* KẾT QUẢ HIỆN TO GIỮA MÀN HÌNH - SMOOTH ANIMATION */}
          <div className={styles["result-display"]}>
              <div className={styles["result-text"]} 
                   style={{
                     opacity: currentResult && currentResult !== "Waiting..." ? 1 : 0.3,
                     transition: 'all 0.3s ease-in-out',
                     transform: currentResult && currentResult !== "Waiting..." ? 'scale(1)' : 'scale(0.9)',
                     textShadow: '0 0 20px rgba(0, 255, 0, 0.8)'
                   }}>
                {currentResult}
              </div>
              <div className={styles["result-confidence"]} 
                   style={{ 
                     color: confidence > 0.8 ? 'var(--neon-green)' : confidence > 0.6 ? '#ffaa00' : '#ff6666',
                     opacity: currentResult && currentResult !== "Waiting..." ? 1 : 0.3,
                     transition: 'all 0.3s ease-in-out'
                   }}>
                CONFIDENCE: {(confidence * 100).toFixed(1)}%
              </div>
          </div>

          <div className={styles["info-panel"]}>
            <div className={styles["info-title"]}>📊 BUFFER STATUS</div>
            <div className={styles["info-subtitle"]}>
                COLLECTING: {currentBatch.length} / {RECOGNITION_BATCH_SIZE} FRAMES
                <div style={{
                    width: '100%', height: '6px', background: '#1a3a1a', marginTop: '8px',
                    position: 'relative', borderRadius: '3px', overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${(currentBatch.length / RECOGNITION_BATCH_SIZE) * 100}%`,
                        height: '100%', background: 'linear-gradient(90deg, #00ff00, #00cc00)',
                        transition: 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.6)'
                    }}></div>
                </div>
                <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7, color: '#00ff00' }}>
                  Status: {currentBatch.length >= RECOGNITION_BATCH_SIZE ? '✓ READY TO PROCESS' : '⏳ BUFFERING...'}
                </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR LOGS */}
        <div className={styles["terminal-sidebar"]}>
          <div className={styles["terminal-header"]}>
            {">"} SYSTEM_LOGS
          </div>
          <div className={styles["terminal-content"]}>
            <div className={styles["log-entry"]}>
              <strong>&gt; SESSION_INIT</strong><br />
              Target: Alphabet Recognition
            </div>
            
            {historyLog.map((log, i) => (
                <div key={i} className={`${styles["log-entry"]} ${i===0 ? styles["log-entry-active"] : ""}`}>
                    {log}
                </div>
            ))}
            
            <div style={{marginTop: '20px', borderTop: '1px dashed #004d00', paddingTop: '10px'}}>
                <strong>&gt; STATISTICS</strong><br/>
                Total Detected: {totalGestures}<br/>
                Model: MLP (Multi-Layer Perceptron)<br/>
                Status: {isCapturing ? '🟢 Running' : '⚪ Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className={styles["control-panel"]}>
        <Link href="/dashboard" className={styles["tactical-btn"]}>
          <i className="fas fa-arrow-left"></i> EXIT
        </Link>
        <button className={styles["tactical-btn"]} onClick={() => {
            setCurrentResult("Waiting...");
            setTotalGestures(0);
            setHistoryLog([]);
            setFrameBatch([]);
        }}>
          <i className="fas fa-sync"></i> RESET
        </button>
      </div>
    </div>
  );
}