import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { GestureInputDTO } from '@/types/api';

const BUFFER_SIZE = 30;
const BUFFER_TIMEOUT_MS = 500;
const API_ENDPOINT = '/api/vsl/recognize';

interface HandLandmark {
    x: number;
    y: number;
    z: number;
}

export const useHandTracking = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const landmarkBufferRef = useRef<HandLandmark[][]>([]);
    const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [prediction, setPrediction] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize HandLandmarker
    useEffect(() => {
        const initializeHandLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker.task',
                    },
                    runningMode: 'VIDEO',
                    numHands: 1,
                });
                handLandmarkerRef.current = landmarker;
            } catch (error) {
                console.error('Failed to initialize HandLandmarker:', error);
            }
        };

        initializeHandLandmarker();

        return () => {
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
            }
        };
    }, []);

    // Send buffered landmarks to API
    const sendLandmarksToAPI = useCallback(async (landmarks: HandLandmark[][]) => {
        if (landmarks.length === 0) return;

        setIsLoading(true);
        try {
            const payload: GestureInputDTO = {
                landmarks: landmarks,
                frames: []
            };
            const response = await axios.post(API_ENDPOINT, payload);
            setPrediction(response.data.prediction || '');
        } catch (error) {
            console.error('Failed to send landmarks to API:', error);
            setPrediction('Error processing gesture');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Flush buffer with timeout
    const scheduleBufferFlush = useCallback(() => {
        if (bufferTimeoutRef.current) {
            clearTimeout(bufferTimeoutRef.current);
        }
        bufferTimeoutRef.current = setTimeout(() => {
            if (landmarkBufferRef.current.length > 0) {
                sendLandmarksToAPI([...landmarkBufferRef.current]);
                landmarkBufferRef.current = [];
            }
        }, BUFFER_TIMEOUT_MS);
    }, [sendLandmarksToAPI]);

    // Process video frames
    const processFrame = useCallback(async () => {
        if (!videoRef.current || !handLandmarkerRef.current) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
        }

        try {
            const results = handLandmarkerRef.current.detectForVideo(
                videoRef.current,
                performance.now()
            );

            // Extract landmarks from first hand
            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks: HandLandmark[] = results.landmarks[0].map((point) => ({
                    x: point.x,
                    y: point.y,
                    z: point.z,
                }));

                landmarkBufferRef.current.push(landmarks);

                // Send when buffer reaches size limit
                if (landmarkBufferRef.current.length >= BUFFER_SIZE) {
                    sendLandmarksToAPI([...landmarkBufferRef.current]);
                    landmarkBufferRef.current = [];
                    if (bufferTimeoutRef.current) {
                        clearTimeout(bufferTimeoutRef.current);
                    }
                } else {
                    scheduleBufferFlush();
                }

                // Draw landmarks on canvas
                drawLandmarks(landmarks);
            }
        } catch (error) {
            console.error('Error processing frame:', error);
        }

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [sendLandmarksToAPI, scheduleBufferFlush]);

    // Draw landmarks on canvas
    const drawLandmarks = (landmarks: HandLandmark[]) => {
        if (!canvasRef.current || !videoRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#00FF00';
        ctx.strokeStyle = '#00FF00';

        landmarks.forEach((point) => {
            const x = point.x * canvasRef.current!.width;
            const y = point.y * canvasRef.current!.height;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

    // Start webcam and frame processing
    useEffect(() => {
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        animationFrameRef.current = requestAnimationFrame(processFrame);
                    };
                }
            } catch (error) {
                console.error('Failed to access webcam:', error);
            }
        };

        startWebcam();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (bufferTimeoutRef.current) {
                clearTimeout(bufferTimeoutRef.current);
            }
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, [processFrame]);

    return {
        videoRef,
        canvasRef,
        prediction,
        isLoading,
    };
};