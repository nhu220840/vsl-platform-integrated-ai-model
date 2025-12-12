"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/contribute.module.css";

export default function ContributePage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    word: "",
    definition: "",
    videoUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log the form data (in a real app, this would be sent to a server)
    console.log("Word Contributed:", {
      word: formData.word,
      definition: formData.definition,
      videoUrl: formData.videoUrl,
      timestamp: new Date().toISOString(),
    });

    // Show success message
    setShowSuccess(true);

    // Clear form
    setFormData({ word: "", definition: "", videoUrl: "" });

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push("/dictionary");
    }, 2000);
  };

  const handleCancel = () => {
    router.push("/dictionary");
  };

  return (
    <div>
      {/* Status Bar */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-item"]}>
          <span className={styles["status-indicator"]}></span>
          <span>&gt; SYSTEM: UPLOAD_PROTOCOL_INITIATED</span>
        </div>
      </div>

      {/* Main Container */}
      <div className={styles.container}>
        {/* Form Container */}
        <div className={styles["form-container"]}>
          <div className={styles["form-title"]}>CONTRIBUTE_NEW_WORD</div>

          <form id="contributeForm" onSubmit={handleSubmit}>
            {/* Word Field */}
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]} htmlFor="wordInput">
                Word (Từ)
              </label>
              <input
                type="text"
                id="wordInput"
                className={styles["form-input"]}
                placeholder="e.g., Xin chào"
                value={formData.word}
                onChange={(e) =>
                  setFormData({ ...formData, word: e.target.value })
                }
                required
              />
            </div>

            {/* Definition Field */}
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]} htmlFor="definitionInput">
                Definition (Định nghĩa)
              </label>
              <textarea
                id="definitionInput"
                className={styles["form-textarea"]}
                placeholder="Enter the meaning of the word..."
                value={formData.definition}
                onChange={(e) =>
                  setFormData({ ...formData, definition: e.target.value })
                }
                required
              ></textarea>
            </div>

            {/* Video URL Field */}
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]} htmlFor="videoInput">
                Video URL (YouTube)
              </label>
              <input
                type="url"
                id="videoInput"
                className={styles["form-input"]}
                placeholder="e.g., https://youtu.be/..."
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
              />
            </div>

            {/* Button Group */}
            <div className={styles["button-group"]}>
              <button type="submit" className={styles.btn}>
                SUBMIT_DATA
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles["btn-secondary"]}`}
                onClick={handleCancel}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className={`${styles["success-message"]} ${styles.active}`}>
          <div style={{ fontSize: "18px", marginBottom: "12px" }}>
            WORD_SUBMITTED_SUCCESSFULLY
          </div>
          <div
            style={{
              fontSize: "12px",
              marginBottom: "24px",
              letterSpacing: "1px",
            }}
          >
            Your contribution has been uploaded to the database.
          </div>
          <button
            className={styles.btn}
            onClick={handleCancel}
            style={{ width: "100%" }}
          >
            RETURN_TO_DICTIONARY
          </button>
        </div>
      )}
    </div>
  );
}
