"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import styles from "../../styles/spell.module.css";

export default function SpellingPage() {
  const [inputText, setInputText] = useState("");
  const [gestureImageUrls, setGestureImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

  /**
   * handleSpell - Gọi API /vsl/spell để lấy gesture images
   *
   * Flow:
   * 1. Validate input không rỗng
   * 2. Gọi GET /vsl/spell?text={inputText}
   * 3. Parse response.data.data (string[] - array of image URLs)
   * 4. Update gestureImageUrls state để hiển thị
   *
   * API Contract:
   * - Endpoint: GET /api/vsl/spell
   * - Query Params: text (string - có thể có hoặc không có dấu)
   * - Response: ApiResponse<string[]> với data là array of gesture image URLs
   * - Rate Limit: Không giới hạn (public endpoint)
   */
  const handleSpell = useCallback(async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText) {
      setError("Vui lòng nhập văn bản");
      return;
    }

    console.log(
      `[Spelling] Processing text: "${trimmedText}" (${trimmedText.length} characters)`
    );

    setIsLoading(true);
    setError("");
    setGestureImageUrls([]); // Clear previous results

    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        "/vsl/spell",
        {
          params: { text: trimmedText },
        }
      );

      console.log(`[Spelling] API Response:`, response.data);

      if (response.data.code === 200 && response.data.data) {
        const imageUrls = response.data.data;
        console.log(
          `[Spelling] Success: Received ${imageUrls.length} gesture images`
        );
        setGestureImageUrls(imageUrls);
      } else {
        const errorMsg = response.data.message || "Không thể đánh vần văn bản";
        console.warn(
          `[Spelling] API returned non-200 code or empty data:`,
          errorMsg
        );
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error("[Spelling] Error:", err);
      setError(
        err.response?.data?.message || "Lỗi khi đánh vần. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText]); // Dependencies: inputText

  const handleClear = () => {
    setInputText("");
    setGestureImageUrls([]);
    setError("");
  };

  return (
    <div className={styles["spelling-container"]}>
      {/* Status Bar */}
      <div className={styles["status-bar"]}>
        <div style={{ fontSize: "12px", letterSpacing: "2px" }}>
          VSL SPELLING MODULE
        </div>
        <Link href="/dashboard" className={styles["back-link"]}>
          ← QUAY LẠI
        </Link>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        <h1 className={styles["page-title"]}>ĐÁNH VẦN VSL</h1>

        {/* Input Zone */}
        <div className={styles["input-zone"]}>
          <div className={styles["input-label"]}>
            Nhập văn bản cần đánh vần:
          </div>
          <input
            type="text"
            className={styles["text-input"]}
            value={inputText}
            onChange={(e) => setInputText(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === "Enter" && handleSpell()}
            placeholder="Ví dụ: HELLO WORLD"
            disabled={isLoading}
          />

          {error && (
            <div
              style={{ color: "#ff4444", marginTop: "10px", fontSize: "14px" }}
            >
              {error}
            </div>
          )}

          <div className={styles["button-group"]}>
            <button
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={handleSpell}
              disabled={isLoading}
            >
              {isLoading ? "⏳ Đang xử lý..." : "🎯 Đánh vần"}
            </button>
            <button
              className={styles.btn}
              onClick={handleClear}
              disabled={isLoading}
            >
              🗑 Xóa
            </button>
          </div>
        </div>

        {/* Output Grid */}
        {gestureImageUrls.length > 0 && (
          <div className={styles["output-grid"]}>
            {gestureImageUrls.map((imageUrl, index) => (
              <div key={index} className={styles["letter-card"]}>
                <img
                  src={imageUrl}
                  alt={`Gesture ${index}`}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' x='50' text-anchor='middle' dominant-baseline='middle' font-size='40' fill='%2300ff41'%3E🤚%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className={styles["letter-label"]}>
                  {inputText[index]?.toUpperCase() || ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alphabet Reference */}
        <div className={styles["alphabet-section"]}>
          <div className={styles["section-title"]}>Bảng chữ cái VSL</div>
          <div className={styles["alphabet-grid"]}>
            {alphabet.map((letter) => (
              <div
                key={letter}
                className={styles["alphabet-card"]}
                onClick={() => setInputText(inputText + letter)}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
