"use client";

import { useState } from "react";
import styles from "../../styles/spell.module.css";

export default function SpellingPage() {
  const [inputText, setInputText] = useState("");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className={styles["spelling-container"]}>
      {/* Status Bar */}
      <div className={styles["status-bar"]}>
        <div style={{ fontSize: "12px", letterSpacing: "2px" }}>
          VSL SPELLING MODULE
        </div>
        <a href="/" className={styles["back-link"]}>
          ← QUAY LẠI
        </a>
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        <h1 className={styles["page-title"]}>ĐÁNH VẦN VSL</h1>

        {/* Input Zone */}
        <div className={styles["input-zone"]}>
          <div className={styles["input-label"]}>Nhập văn bản cần đánh vần:</div>
          <input
            type="text"
            className={styles["text-input"]}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ví dụ: HELLO WORLD"
          />
          <div className={styles["button-group"]}>
            <button className={`${styles.btn} ${styles["btn-primary"]}`}>🎯 Đánh vần</button>
            <button className={styles.btn} onClick={() => setInputText("")}>
              🗑 Xóa
            </button>
            <button className={styles.btn}>💾 Lưu</button>
          </div>
        </div>

        {/* Output Grid */}
        {inputText && (
          <div className={styles["output-grid"]}>
            {inputText.split("").map((char, index) => (
              <div key={index} className={styles["letter-card"]}>
                <div className={styles["letter-icon"]}>🤚</div>
                <div className={styles["letter-label"]}>{char.toUpperCase()}</div>
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
