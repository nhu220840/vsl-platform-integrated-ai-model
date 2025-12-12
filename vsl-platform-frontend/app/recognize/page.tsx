"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useHandTracking } from "@/hooks/useHandTracking";
import CameraView from "@/components/features/ai/CameraView";
import apiClient from "@/lib/api-client";
import { ApiResponse, GestureInputDTO } from "@/types/api";
import styles from "../../styles/recognize.module.css";

/**
 * RECOGNITION_BATCH_SIZE: Ngưỡng số frames để trigger API call
 *
 * - 20 frames = ~0.67 giây ở 30 FPS
 * - Cân bằng giữa độ phản hồi nhanh và rate limit (10 req/sec)
 * - Đảm bảo đủ dữ liệu cho model AI xử lý chính xác
 */
const RECOGNITION_BATCH_SIZE = 20;

export default function GestureRecognitionPage() {
  // Hook: MediaPipe HandTracking
  const {
    videoRef,
    canvasRef,
    startCapture,
    stopCapture,
    currentBatch,
    setFrameBatch,
    isReady,
    isCapturing,
  } = useHandTracking();

  // State: Recognition Results
  const [currentSentence, setCurrentSentence] = useState("");
  const [confidence, setConfidence] = useState(0);

  // State: API Processing Status
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [gesturesPerSecond, setGesturesPerSecond] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureCountRef = useRef(0);
  const lastRecognitionTimeRef = useRef<number>(0);

  // Timer for elapsed time
  useEffect(() => {
    if (isCapturing) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          setElapsedTime(elapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      startTimeRef.current = null;
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCapturing]);

  /**
   * sendRecognitionBatch - Gửi landmarks batch đến API backend
   *
   * Flow:
   * 1. Validate: Kiểm tra batch không rỗng và không đang xử lý
   * 2. Throttle: Đảm bảo delay tối thiểu giữa các calls (rate limit)
   * 3. Prepare: Đóng gói GestureInputDTO với frames và currentText
   * 4. API Call: POST /vsl/recognize
   * 5. Process Response: Cập nhật sentence, stats, confidence
   * 6. Reset: Xóa batch để chuẩn bị cho cử chỉ tiếp theo
   * 7. Error Handling: Log và hiển thị thông báo lỗi
   */
  const sendRecognitionBatch = useCallback(async () => {
    // Guard 1: Validate batch
    if (currentBatch.length === 0) {
      console.log("[Recognition] Batch empty, skipping");
      return;
    }

    // Guard 2: Prevent concurrent API calls
    if (isRecognizing) {
      console.log("[Recognition] Already processing, skipping");
      return;
    }

    // Guard 3: Rate limiting - ensure minimum 100ms between calls
    const now = Date.now();
    const timeSinceLastCall = now - lastRecognitionTimeRef.current;
    if (timeSinceLastCall < 100) {
      console.log(`[Recognition] Throttled, wait ${100 - timeSinceLastCall}ms`);
      return;
    }

    // Start recognition
    setIsRecognizing(true);
    setRecognitionError(null);
    lastRecognitionTimeRef.current = now;

    console.log(
      `[Recognition] Sending batch: ${currentBatch.length} frames, current text: "${currentSentence}"`
    );

    try {
      // Prepare payload: ONLY landmarks and current text, NO video stream
      const payload: GestureInputDTO = {
        frames: currentBatch,
        currentText: currentSentence || "", // Provide context for accent restoration
      };

      // API Call: POST /vsl/recognize
      const response = await apiClient.post<ApiResponse<string>>(
        "/vsl/recognize",
        payload
      );

      // Validate response
      if (response.data.code === 200 && response.data.data) {
        const newSentence = response.data.data;

        console.log(`[Recognition] Success: "${newSentence}"`);

        // Update sentence
        setCurrentSentence(newSentence);

        // Update word count
        const words = newSentence
          .trim()
          .split(/\s+/)
          .filter((w: string) => w.length > 0);
        setWordCount(words.length);

        // Update gesture count and rate
        gestureCountRef.current += 1;
        if (elapsedTime > 0) {
          const rate = gestureCountRef.current / elapsedTime;
          setGesturesPerSecond(parseFloat(rate.toFixed(1)));
        }

        // Update confidence (default 85% until backend provides actual value)
        setConfidence(85);

        // Reset batch after successful recognition
        setFrameBatch([]);
      } else {
        // API returned non-200 code or empty data
        const errorMsg =
          response.data.message || "API trả về dữ liệu không hợp lệ";
        console.error("[Recognition] API error:", errorMsg);
        setRecognitionError(errorMsg);

        // Keep batch for retry
      }
    } catch (error: unknown) {
      // Network error or API unreachable
      console.error("[Recognition] Network error:", error);

      let errorMessage = "Không thể kết nối đến server";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setRecognitionError(errorMessage);

      // Don't reset batch - will retry on next cycle
      console.log("[Recognition] Keeping batch for retry");
    } finally {
      setIsRecognizing(false);
    }
  }, [
    currentBatch,
    currentSentence,
    elapsedTime,
    isRecognizing,
    setFrameBatch,
  ]);

  /**
   * Batch Monitor - Tự động trigger API khi đủ frames
   *
   * Điều kiện:
   * - currentBatch.length >= RECOGNITION_BATCH_SIZE (20 frames)
   * - !isRecognizing (không đang xử lý API call khác)
   *
   * Note: sendRecognitionBatch có guard riêng để prevent concurrent calls
   */
  useEffect(() => {
    if (currentBatch.length >= RECOGNITION_BATCH_SIZE && !isRecognizing) {
      console.log(
        `[Recognition] Batch threshold reached: ${currentBatch.length}/${RECOGNITION_BATCH_SIZE}`
      );
      sendRecognitionBatch();
    }
  }, [currentBatch, isRecognizing, sendRecognitionBatch]);

  // Handle start/stop recording
  const toggleRecording = () => {
    if (isCapturing) {
      stopCapture();
      gestureCountRef.current = 0;
      setGesturesPerSecond(0);
    } else {
      startCapture();
    }
  };

  // Clear text
  const clearText = () => {
    setCurrentSentence("");
    setWordCount(0);
    gestureCountRef.current = 0;
    setGesturesPerSecond(0);
  };

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
          <Link
            href="/"
            style={{
              color: "#00ff41",
              textDecoration: "none",
              letterSpacing: "2px",
              fontSize: "12px",
            }}
          >
            ← THOÁT
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles["sidebar-title"]}>KẾT QUẢ NHẬN DẠNG</div>

          <div className={styles["output-text"]}>
            {currentSentence || "Bắt đầu ghi để nhận dạng cử chỉ..."}
            {isRecognizing && (
              <span style={{ color: "#FFD700", marginLeft: "10px" }}>
                ⏳ Đang xử lý...
              </span>
            )}
          </div>

          {/* Error Display */}
          {recognitionError && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                marginTop: "10px",
                padding: "10px",
                background: "rgba(255, 68, 68, 0.1)",
                borderRadius: "4px",
                border: "1px solid #ff4444",
              }}
            >
              ⚠️ {recognitionError}
            </div>
          )}

          <div className={styles["confidence-meter"]}>
            <div className={styles["meter-label"]}>
              <span>ĐỘ TIN CẬY</span>
              <span>{confidence}%</span>
            </div>
            <div className={styles["meter-bar"]}>
              <div
                className={styles["meter-fill"]}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <div className={styles["control-buttons"]}>
            <button
              className={`${styles.btn} ${
                isCapturing ? styles["btn-danger"] : styles["btn-primary"]
              }`}
              onClick={toggleRecording}
              disabled={!isReady}
            >
              {isCapturing ? "⏹ Dừng ghi" : "⏺ Bắt đầu ghi"}
            </button>
            <button className={styles.btn} onClick={clearText}>
              🗑 Xóa văn bản
            </button>
            <button
              className={styles.btn}
              onClick={() => {
                if (currentSentence) {
                  navigator.clipboard.writeText(currentSentence);
                }
              }}
            >
              📋 Sao chép
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className={styles["viewport-container"]}>
          <div className={styles["viewport-wrapper"]}>
            {/* CameraView Component - handles video + canvas rendering */}
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCapturing={isCapturing}
              isReady={isReady}
            />
            <div className={styles["tracking-overlay"]} />
          </div>

          {/* Stats Grid */}
          <div className={styles["stats-grid"]}>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Tổng từ</div>
              <div className={styles["stat-value"]}>{wordCount}</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Cử chỉ/giây</div>
              <div className={styles["stat-value"]}>{gesturesPerSecond}</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Thời gian</div>
              <div className={styles["stat-value"]}>
                {formatTime(elapsedTime)}
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Trạng thái</div>
              <div
                className={styles["stat-value"]}
                style={{ fontSize: "16px" }}
              >
                {isCapturing
                  ? isRecognizing
                    ? "XỬ LÝ"
                    : "ĐANG GHI"
                  : "CHƯA BẮT ĐẦU"}
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-label"]}>Batch</div>
              <div className={styles["stat-value"]}>
                {currentBatch.length}/{RECOGNITION_BATCH_SIZE}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
