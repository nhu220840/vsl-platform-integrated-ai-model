"use client";

import { useParams } from "next/navigation";
import styles from "../../../styles/word-detail.module.css";

export default function WordDetailPage() {
  const params = useParams();
  const wordId = params.wordId as string;

  return (
    <div className={styles["word-detail-container"]}>
      {/* Header */}
      <div className={styles["detail-header"]}>
        <a href="/dictionary" className={styles["back-button"]}>
          ← Quay lại từ điển
        </a>
        <div className={styles["word-title"]}>XIN CHÀO</div>
      </div>

      <div className={styles["detail-content"]}>
        {/* Video Section */}
        <div className={styles["main-section"]}>
          <div className={styles["video-section"]}>
            <div className={styles["video-title"]}>VIDEO HƯỚNG DẪN</div>
            <div className={styles["video-container"]}>
              <div className={styles["video-placeholder"]}>
                🎥 Video Player Placeholder
              </div>
            </div>

            <div className={styles["video-controls"]}>
              <button className={styles.btn}>▶ Phát</button>
              <button className={styles.btn}>🔄 Lặp lại</button>
              <button className={styles.btn}>⏱ Chậm</button>
            </div>
          </div>

          {/* Metadata Section */}
          <div className={styles["metadata-section"]}>
            <div className={styles["metadata-title"]}>THÔNG TIN</div>

            <div className={styles["metadata-item"]}>
              <div className={styles["metadata-label"]}>ID</div>
              <div className={styles["metadata-value"]}>{wordId}</div>
            </div>

            <div className={styles["metadata-item"]}>
              <div className={styles["metadata-label"]}>Độ khó</div>
              <div className={styles["metadata-value"]}>⭐ Cơ bản</div>
            </div>

            <div className={styles["metadata-item"]}>
              <div className={styles["metadata-label"]}>Lượt xem</div>
              <div className={styles["metadata-value"]}>1,234 lượt</div>
            </div>

            <div className={styles["metadata-item"]}>
              <div className={styles["metadata-label"]}>Đã thêm</div>
              <div className={styles["metadata-value"]}>15/11/2024</div>
            </div>

            <div className={styles["action-buttons"]}>
              <button className={styles.btn}>⭐ Yêu thích</button>
              <button className={styles.btn}>📥 Tải xuống</button>
              <button className={styles.btn}>🔗 Chia sẻ</button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className={styles["description-section"]}>
          <div className={styles["section-title"]}>MÔ TẢ</div>
          <p className={styles["description-text"]}>
            &quot;Xin chào&quot; là cụm từ chào hỏi phổ biến trong ngôn ngữ ký
            hiệu Việt Nam. Cử chỉ này được thực hiện bằng cách giơ tay lên ngang
            vai với lòng bàn tay hướng ra ngoài, sau đó vẫy tay nhẹ nhàng từ 2-3
            lần. Đây là một trong những cử chỉ cơ bản nhất mà người học VSL
            thường được dạy đầu tiên.
          </p>
        </div>

        {/* Related Words */}
        <div className={styles["related-words"]}>
          <div className={styles["section-title"]}>TỪ LIÊN QUAN</div>
          <div className={styles["related-grid"]}>
            <div className={styles["related-card"]}>
              <div className={styles["related-icon"]}>👋</div>
              <div className={styles["related-name"]}>Tạm biệt</div>
            </div>
            <div className={styles["related-card"]}>
              <div className={styles["related-icon"]}>🙏</div>
              <div className={styles["related-name"]}>Cảm ơn</div>
            </div>
            <div className={styles["related-card"]}>
              <div className={styles["related-icon"]}>😊</div>
              <div className={styles["related-name"]}>Vui vẻ</div>
            </div>
            <div className={styles["related-card"]}>
              <div className={styles["related-icon"]}>🤝</div>
              <div className={styles["related-name"]}>Gặp gỡ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
