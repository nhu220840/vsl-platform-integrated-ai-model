"use client";

import { useState } from "react";
import styles from "../../styles/dictionary.module.css";

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const sampleWords = [
    {
      id: 1,
      word: "Xin chào",
      category: "Giao tiếp",
      difficulty: "Dễ",
    },
    {
      id: 2,
      word: "Cảm ơn",
      category: "Lịch sự",
      difficulty: "Dễ",
    },
    {
      id: 3,
      word: "Tạm biệt",
      category: "Giao tiếp",
      difficulty: "Dễ",
    },
  ];

  return (
    <div className={styles["dictionary-container"]}>
      <a href="/" className={styles["back-link"]}>
        ← QUAY LẠI
      </a>

      {/* Hero Section */}
      <div className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>TỪ ĐIỂN VSL</h1>
        <p className={styles["hero-subtitle"]}>
          Khám phá thư viện ngôn ngữ ký hiệu Việt Nam
        </p>

        <div className={styles["search-zone"]}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="🔍 Tìm kiếm từ vựng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className={styles["content-section"]}>
        <div className={styles["section-header"]}>
          <h2 className={styles["section-title"]}>TẤT CẢ TỪ VỰNG</h2>
          <div className={styles["result-count"]}>
            Tìm thấy {sampleWords.length} kết quả
          </div>
        </div>

        <div className={styles["word-grid"]}>
          {sampleWords.map((word) => (
            <div key={word.id} className={styles["word-card"]}>
              <div className={styles["word-video-placeholder"]}>🎥</div>
              <h3 className={styles["word-title"]}>{word.word}</h3>
              <div className={styles["word-meta"]}>
                <span className={styles["meta-badge"]}>{word.category}</span>
                <span className={styles["meta-badge"]}>{word.difficulty}</span>
              </div>
              <p className={styles["word-description"]}>
                Video minh họa cách thực hiện cử chỉ cho từ &quot;{word.word}&quot;
              </p>
              <button className={styles["view-detail"]}>Xem chi tiết →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
