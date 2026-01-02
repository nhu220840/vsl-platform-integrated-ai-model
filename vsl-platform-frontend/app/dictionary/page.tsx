"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { getVideoInfo } from "@/lib/video-utils";
import { ApiResponse, DictionaryDTO } from "@/types/api";
import styles from "../../styles/dictionary.module.css";

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<DictionaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load latest dictionary entries on mount
   * Shows 10 most recent entries as suggestions
   */
  useEffect(() => {
    const loadLatestWords = async () => {
      try {
        console.log("[Dictionary] Loading latest 10 words...");
        const response = await apiClient.get<ApiResponse<DictionaryDTO[]>>(
          "/dictionary/latest",
          { params: { limit: 10 } }
        );

        console.log(`[Dictionary] Latest words response:`, response.data);

        if (response.data.code === 200 && response.data.data) {
          const latestWords = response.data.data;
          console.log(`[Dictionary] Loaded ${latestWords.length} latest words`);
          setResults(latestWords);
        }
      } catch (err: any) {
        console.error("[Dictionary] Failed to load latest words:", err);
        // Don't show error for initial load, just show empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestWords();
  }, []);

  /**
   * searchDictionary - Gọi API tìm kiếm từ điển
   *
   * Flow:
   * 1. Validate query không rỗng
   * 2. Gọi GET /dictionary/search?query={query}
   * 3. Parse response.data.data (DictionaryDTO[])
   * 4. Update results state để hiển thị
   *
   * API Contract:
   * - Endpoint: GET /api/dictionary/search
   * - Query Params: query (string)
   * - Response: ApiResponse<DictionaryDTO[]>
   * - Rate Limit: Không giới hạn (public endpoint)
   * - Search: Elasticsearch first, fallback to PostgreSQL
   */
  const searchDictionary = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      console.log("[Dictionary] Query is empty, reloading latest words");
      setError("");
      setIsLoading(true);
      try {
        const response = await apiClient.get<ApiResponse<DictionaryDTO[]>>(
          "/dictionary/latest",
          { params: { limit: 10 } }
        );
        if (response.data.code === 200 && response.data.data) {
          setResults(response.data.data);
        }
      } catch (err) {
        console.error("[Dictionary] Error loading latest words:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    console.log(`[Dictionary] Searching for: "${trimmedQuery}"`);

    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.get<ApiResponse<DictionaryDTO[]>>(
        "/dictionary/search",
        { params: { query: trimmedQuery } }
      );

      console.log(`[Dictionary] API Response:`, response.data);

      if (response.data.code === 200 && response.data.data) {
        const foundResults = response.data.data;
        console.log(
          `[Dictionary] Success: Found ${foundResults.length} results`
        );
        setResults(foundResults);
      } else {
        const errorMsg = response.data.message || "No results found";
        console.warn(`[Dictionary] No results or error:`, errorMsg);
        setError(errorMsg);
        setResults([]);
      }
    } catch (err: any) {
      console.error("[Dictionary] Search error:", err);
      setError(
        err.response?.data?.message || "Error searching. Please try again."
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Debounced search effect (300ms delay)
   *
   * Purpose: Prevent API calls on every keystroke
   * - Wait 300ms after user stops typing
   * - Cancel previous timeout if user continues typing
   * - Only trigger search when typing pauses
   */
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`[Dictionary] Debounce completed, triggering search`);
      searchDictionary(searchQuery);
    }, 300);

    // Cleanup on unmount or query change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDictionary]);

  return (
    <div className={styles["dictionary-container"]}>
      <Link href="/dashboard" className={styles["back-link"]}>
        ← BACK
      </Link>

      {/* Hero Section */}
      <div className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>VSL DICTIONARY</h1>
        <p className={styles["hero-subtitle"]}>
          Explore the Vietnamese Sign Language library
        </p>

        <div className={styles["search-zone"]}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="🔍 Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className={styles["content-section"]}>
        <div className={styles["section-header"]}>
          <h2 className={styles["section-title"]}>
            {searchQuery ? "SEARCH RESULTS" : "LATEST WORDS"}
          </h2>
          <div className={styles["result-count"]}>
            {isLoading
              ? "Loading..."
              : `Found ${results.length} results`}
          </div>
        </div>

        {error && (
          <div
            style={{ color: "#ff4444", textAlign: "center", padding: "20px" }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && results.length === 0 && searchQuery && (
          <div style={{ textAlign: "center", padding: "40px", opacity: 0.7 }}>
            No vocabulary found matching &quot;{searchQuery}&quot;
          </div>
        )}

        {!searchQuery && results.length === 0 && !isLoading && (
          <div style={{ textAlign: "center", padding: "40px", opacity: 0.7 }}>
            Enter keywords to search vocabulary
          </div>
        )}

        <div className={styles["word-grid"]}>
          {results.map((word) => (
            <div key={word.id} className={styles["word-card"]}>
              <div className={styles["word-video-placeholder"]}>
                {word.videoUrl ? (
                  (() => {
                    const videoInfo = getVideoInfo(word.videoUrl);
                    
                    if (videoInfo.type === 'youtube') {
                      return (
                        <iframe
                          src={videoInfo.embedUrl}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                    
                    if (videoInfo.type === 'vimeo') {
                      return (
                        <iframe
                          src={videoInfo.embedUrl}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                          }}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                    
                    return (
                      <video
                        src={word.videoUrl}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        controls
                      />
                    );
                  })()
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontSize: "48px",
                    opacity: 0.5
                  }}>
                    🎬
                  </div>
                )}
              </div>
              <h3 className={styles["word-title"]}>{word.word}</h3>
              {word.definition && (
                <p className={styles["word-description"]}>
                  {word.definition.slice(0, 100)}
                  {word.definition.length > 100 ? "..." : ""}
                </p>
              )}
              <Link href={`/dictionary/${word.id}`}>
                <button className={styles["view-detail"]}>
                  View details →
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
