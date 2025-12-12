"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandFrame, Landmark } from "@/types/api";

/**
 * BUFFER_SIZE: Number of frames to accumulate before triggering API call
 * 20 frames = ~0.67 seconds at 30 FPS
 * Balances between responsiveness and rate limit (10 req/sec)
 */
const BUFFER_SIZE = 20;

/**
 * useHandTracking Hook
 *
 * Manages MediaPipe HandLandmarker integration for real-time hand gesture recognition.
 *
 * Features:
 * - Camera initialization and management
 * - MediaPipe HandLandmarker setup
 * - Real-time landmark detection (21 points per hand)
 * - Frame batching (20 frames buffer)
 * - Canvas visualization with hand skeleton
 *
 * @returns {Object} Hook API
 * - videoRef: Ref for <video> element
 * - canvasRef: Ref for <canvas> element
 * - startCapture: Function to start camera and processing
 * - stopCapture: Function to stop camera and cleanup
 * - currentBatch: Array of accumulated HandFrame objects
 * - setFrameBatch: Function to reset batch (after API call)
 * - isReady: MediaPipe initialization status
 * - isCapturing: Camera active status
 */
export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frameBatch, setFrameBatch] = useState<HandFrame[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Initialize MediaPipe HandLandmarker
   *
   * Loads MediaPipe models from CDN on component mount.
   * This is done once at startup and reused for all frame processing.
   *
   * Configuration:
   * - WASM runtime: Latest from jsdelivr CDN
   * - Model: hand_landmarker float16 (balance between speed and accuracy)
   * - Running mode: VIDEO (optimized for continuous frames)
   * - Number of hands: 1 (VSL focuses on single hand gestures)
   *
   * Sets isReady = true when initialization completes successfully.
   */
  useEffect(() => {
    const initializeHandLandmarker = async () => {
      try {
        console.log(
          "[useHandTracking] Initializing MediaPipe HandLandmarker..."
        );

        // Load WASM runtime from CDN
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        console.log(
          "[useHandTracking] WASM runtime loaded, creating HandLandmarker..."
        );

        // Create HandLandmarker instance with optimized settings
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU", // Use GPU acceleration if available
          },
          runningMode: "VIDEO", // Optimized for real-time video processing
          numHands: 1, // Single hand detection (sufficient for VSL)
          minHandDetectionConfidence: 0.5, // Lower threshold for better detection
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handLandmarkerRef.current = landmarker;
        setIsReady(true);

        console.log("[useHandTracking] HandLandmarker ready");
      } catch (error) {
        console.error(
          "[useHandTracking] Failed to initialize HandLandmarker:",
          error
        );
        setIsReady(false);
        alert(
          "Không thể khởi tạo MediaPipe.\n\n" +
            "Vui lòng kiểm tra kết nối internet và tải lại trang."
        );
      }
    };

    initializeHandLandmarker();

    // Cleanup on unmount
    return () => {
      if (handLandmarkerRef.current) {
        console.log("[useHandTracking] Cleaning up HandLandmarker");
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  /**
   * drawLandmarks - Visualize Hand Landmarks on Canvas
   *
   * Draws 21 hand landmarks and connecting lines (hand skeleton) on canvas overlay.
   *
   * Landmark Structure (MediaPipe 21-point model):
   * - 0: Wrist
   * - 1-4: Thumb (base to tip)
   * - 5-8: Index finger
   * - 9-12: Middle finger
   * - 13-16: Ring finger
   * - 17-20: Pinky finger
   *
   * Visualization:
   * - Green circles for each landmark point
   * - Green lines connecting landmarks (hand skeleton)
   * - Coordinates normalized [0, 1] → scaled to canvas size
   */
  const drawLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Style configuration
    ctx.fillStyle = "#00FF00"; // Green for points
    ctx.strokeStyle = "#00FF00"; // Green for lines
    ctx.lineWidth = 2;

    // Draw landmark points
    landmarks.forEach((point) => {
      // Convert normalized coordinates [0, 1] to canvas pixels
      const x = point.x * canvasRef.current!.width;
      const y = point.y * canvasRef.current!.height;

      // Draw circle at landmark position
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    /**
     * Hand Skeleton Connections
     * Each connection is [start_index, end_index] for landmarks array
     *
     * Groups:
     * - Thumb: 0→1→2→3→4
     * - Index: 0→5→6→7→8
     * - Middle: 0→9→10→11→12
     * - Ring: 0→13→14→15→16
     * - Pinky: 0→17→18→19→20
     * - Palm: 5→9→13→17 (connects finger bases)
     */
    const connections = [
      // Thumb
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      // Index
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      // Middle
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      // Ring
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      // Pinky
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      // Palm
      [5, 9],
      [9, 13],
      [13, 17],
    ];

    // Draw connections between landmarks
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      // Convert normalized coordinates to canvas pixels
      const x1 = startPoint.x * canvasRef.current!.width;
      const y1 = startPoint.y * canvasRef.current!.height;
      const x2 = endPoint.x * canvasRef.current!.width;
      const y2 = endPoint.y * canvasRef.current!.height;

      // Draw line between points
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }, []);

  /**
   * onResults Callback - MediaPipe Results Processor
   *
   * This is the core callback function that MediaPipe calls after analyzing each frame.
   * It extracts landmarks, adds them to the batch, and triggers visualization.
   *
   * Flow:
   * 1. Receive detection results from HandLandmarker
   * 2. Extract 21 landmarks (x, y, z) from first detected hand
   * 3. Add frame to frameBatch state
   * 4. Draw landmarks + skeleton on canvas
   * 5. When batch reaches BUFFER_SIZE (20), parent component triggers API call
   */
  const processFrameRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    processFrameRef.current = () => {
      // Guard: Ensure all resources are available
      if (!videoRef.current || !handLandmarkerRef.current || !isCapturing) {
        if (isCapturing) {
          // Continue loop even if temporary resources missing
          animationFrameRef.current = requestAnimationFrame(() =>
            processFrameRef.current?.()
          );
        }
        return;
      }

      try {
        // Run MediaPipe detection on current video frame
        const results = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now() // Timestamp for video sync
        );

        // Process results: Extract landmarks from first detected hand
        if (results.landmarks && results.landmarks.length > 0) {
          // Map MediaPipe format to our Landmark interface
          const landmarks: Landmark[] = results.landmarks[0].map((point) => ({
            x: point.x, // Normalized [0, 1]
            y: point.y, // Normalized [0, 1]
            z: point.z, // Depth (relative to wrist)
          }));

          // Add current frame to batch
          setFrameBatch((prev) => {
            const newBatch = [...prev, { landmarks }];

            // Batch is ready when it reaches BUFFER_SIZE
            // Parent component monitors this via useEffect
            if (newBatch.length >= BUFFER_SIZE) {
              console.log(
                `[useHandTracking] Batch ready: ${newBatch.length} frames`
              );
              return newBatch;
            }

            return newBatch;
          });

          // Visualize landmarks on canvas overlay
          drawLandmarks(landmarks);
        }
      } catch (error) {
        console.error("[useHandTracking] Error processing frame:", error);
        // Continue processing on error - don't break the loop
      }

      // Schedule next frame processing
      animationFrameRef.current = requestAnimationFrame(() =>
        processFrameRef.current?.()
      );
    };
  }, [isCapturing, drawLandmarks]);

  /**
   * startCapture - Initialize Camera and Begin Processing
   *
   * Flow:
   * 1. Request camera access via getUserMedia()
   * 2. Attach stream to <video> element
   * 3. Wait for video metadata (width, height) to load
   * 4. Sync canvas dimensions with video
   * 5. Start video playback
   * 6. Set isCapturing = true (triggers processFrame loop)
   *
   * Error Handling:
   * - Camera permission denied → Alert user
   * - No camera available → Alert user
   * - Other errors → Log and alert
   */
  const startCapture = useCallback(async () => {
    try {
      console.log("[useHandTracking] Requesting camera access...");

      // Request camera stream with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front camera for sign language
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }, // 30 FPS for smooth detection
        },
      });

      console.log("[useHandTracking] Camera access granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load before starting
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;

          // Start video playback
          videoRef.current.play().catch((err) => {
            console.error("[useHandTracking] Video play error:", err);
          });

          // Sync canvas dimensions with actual video dimensions
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            console.log(
              `[useHandTracking] Canvas synced: ${canvasRef.current.width}x${canvasRef.current.height}`
            );
          }

          // Activate capturing (triggers processFrame loop)
          setIsCapturing(true);
          console.log("[useHandTracking] Capture started");
        };
      }
    } catch (error: unknown) {
      console.error("[useHandTracking] Failed to access webcam:", error);

      // User-friendly error messages
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert(
            "Quyền truy cập camera bị từ chối.\n\n" +
              "Vui lòng cho phép truy cập camera trong cài đặt trình duyệt."
          );
        } else if (error.name === "NotFoundError") {
          alert(
            "Không tìm thấy camera.\n\n" + "Vui lòng kết nối camera và thử lại."
          );
        } else {
          alert(
            `Lỗi khi truy cập camera: ${error.message}\n\n` +
              "Vui lòng kiểm tra thiết bị và thử lại."
          );
        }
      } else {
        alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      }
    }
  }, []);

  /**
   * stopCapture - Stop Camera and Cleanup Resources
   *
   * Flow:
   * 1. Set isCapturing = false (stops processFrame loop)
   * 2. Cancel pending animation frame
   * 3. Stop all media tracks (releases camera)
   * 4. Clear video srcObject
   *
   * Ensures proper cleanup to avoid:
   * - Camera LED staying on
   * - Memory leaks from video stream
   * - Dangling animation frames
   */
  const stopCapture = useCallback(() => {
    console.log("[useHandTracking] Stopping capture...");

    // Stop processing loop
    setIsCapturing(false);

    // Cancel pending frame processing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Release camera resources
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
        console.log(`[useHandTracking] Stopped track: ${track.kind}`);
      });

      videoRef.current.srcObject = null;
    }

    console.log("[useHandTracking] Capture stopped");
  }, []);

  /**
   * Frame Processing Loop Trigger
   *
   * Starts/stops the requestAnimationFrame loop based on capture state.
   *
   * Conditions:
   * - isCapturing: User started camera (startCapture called)
   * - isReady: MediaPipe models loaded successfully
   * - processFrameRef.current: Callback function is defined
   *
   * When all conditions met → Start continuous frame processing
   * On cleanup → Cancel pending animation frames
   */
  useEffect(() => {
    if (isCapturing && isReady && processFrameRef.current) {
      console.log("[useHandTracking] Starting frame processing loop");
      animationFrameRef.current = requestAnimationFrame(() =>
        processFrameRef.current?.()
      );
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        console.log("[useHandTracking] Frame processing loop stopped");
      }
    };
  }, [isCapturing, isReady]);

  // Export hook API
  return {
    // Refs for video and canvas elements
    videoRef,
    canvasRef,

    // Control functions
    startCapture, // Initialize camera and start processing
    stopCapture, // Stop camera and cleanup

    // State
    currentBatch: frameBatch, // Accumulated HandFrame objects (max 20)
    setFrameBatch, // Reset batch (call after API request)
    isReady, // MediaPipe initialization status
    isCapturing, // Camera active status
  };
};
