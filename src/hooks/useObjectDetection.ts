import { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { DetectedObject as CocoDetection } from '@tensorflow-models/coco-ssd';
import { 
  DetectedObject, 
  ProcessedDetection, 
  processDetection, 
  filterDetections,
  getMostImportantDetection 
} from '@/lib/detection-utils';

interface UseObjectDetectionOptions {
  minConfidence?: number;
  detectionInterval?: number;
}

interface UseObjectDetectionReturn {
  isModelLoaded: boolean;
  isDetecting: boolean;
  detections: ProcessedDetection[];
  mostImportant: ProcessedDetection | null;
  error: string | null;
  loadModel: () => Promise<void>;
  detectObjects: (video: HTMLVideoElement) => Promise<ProcessedDetection[]>;
  startContinuousDetection: (video: HTMLVideoElement) => void;
  stopContinuousDetection: () => void;
}

export function useObjectDetection(
  options: UseObjectDetectionOptions = {}
): UseObjectDetectionReturn {
  const { minConfidence = 0.5, detectionInterval = 400 } = options;

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<ProcessedDetection[]>([]);
  const [mostImportant, setMostImportant] = useState<ProcessedDetection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      console.log('Loading TensorFlow.js...');
      
      // Set backend
      await tf.setBackend('webgl');
      await tf.ready();
      
      console.log('Loading COCO-SSD model...');
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Faster model for mobile
      });
      
      modelRef.current = model;
      setIsModelLoaded(true);
      console.log('Model loaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load detection model';
      setError(message);
      console.error('Model loading error:', err);
    }
  }, []);

  const detectObjects = useCallback(async (
    video: HTMLVideoElement
  ): Promise<ProcessedDetection[]> => {
    if (!modelRef.current || !video || video.readyState < 2) {
      return [];
    }

    try {
      const predictions = await modelRef.current.detect(video);
      
      const rawDetections: DetectedObject[] = predictions.map((p: CocoDetection) => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox as [number, number, number, number],
      }));

      const filtered = filterDetections(rawDetections, minConfidence);
      
      const processed = filtered.map(d => 
        processDetection(d, video.videoWidth, video.videoHeight)
      );

      setDetections(processed);
      
      const important = getMostImportantDetection(processed);
      setMostImportant(important);

      return processed;
    } catch (err) {
      console.error('Detection error:', err);
      return [];
    }
  }, [minConfidence]);

  const startContinuousDetection = useCallback((video: HTMLVideoElement) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsDetecting(true);

    const runDetection = async () => {
      if (video.readyState >= 2) {
        await detectObjects(video);
      }
    };

    // Initial detection
    runDetection();

    // Set up interval
    intervalRef.current = window.setInterval(runDetection, detectionInterval);
  }, [detectObjects, detectionInterval]);

  const stopContinuousDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDetecting(false);
    setDetections([]);
    setMostImportant(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousDetection();
    };
  }, [stopContinuousDetection]);

  return {
    isModelLoaded,
    isDetecting,
    detections,
    mostImportant,
    error,
    loadModel,
    detectObjects,
    startContinuousDetection,
    stopContinuousDetection,
  };
}
