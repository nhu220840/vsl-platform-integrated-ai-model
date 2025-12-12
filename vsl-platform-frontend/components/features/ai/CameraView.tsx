"use client";
import React, { useRef, useEffect } from "react";

// ============================================
// Props Interface
// ============================================
interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCapturing: boolean;
  isReady: boolean;
}

// ============================================
// CameraView Component
// ============================================
export default function CameraView({
  videoRef,
  canvasRef,
  isCapturing,
  isReady,
}: CameraViewProps) {
  // Sync canvas dimensions with video dimensions
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const updateCanvasSize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener("loadedmetadata", updateCanvasSize);

    return () => {
      videoElement.removeEventListener("loadedmetadata", updateCanvasSize);
    };
  }, [videoRef, canvasRef]);

  return (
    <div className="relative w-full h-full">
      {/* Video Element: Display webcam stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* Canvas Element: Draw landmarks/skeleton on top of video */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          pointerEvents: "none", // Allow click-through
        }}
      />

      {/* Status Overlay */}
      {!isCapturing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <div className="text-6xl mb-4">📹</div>
          <div className="text-xl text-white font-bold tracking-wider">
            {isReady ? "CAMERA CHƯA ĐƯỢC KÍCH HOẠT" : "ĐANG TẢI MEDIAPIPE..."}
          </div>
          <div className="mt-4 text-sm text-white/50">
            {isReady
              ? 'Nhấn "Bắt đầu ghi" để khởi động camera'
              : "Vui lòng đợi..."}
          </div>
        </div>
      )}
    </div>
  );
}
