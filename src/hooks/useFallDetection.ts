import { useState, useEffect, useCallback, useRef } from 'react';

interface FallDetectionState {
  isMonitoring: boolean;
  lastAcceleration: { x: number; y: number; z: number } | null;
  fallDetected: boolean;
  isSupported: boolean;
}

interface UseFallDetectionOptions {
  threshold?: number; // G-force threshold for fall detection
  fallDuration?: number; // Duration of low motion after impact to confirm fall
  onFallDetected?: () => void;
}

interface UseFallDetectionReturn extends FallDetectionState {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetFall: () => void;
}

export function useFallDetection(options: UseFallDetectionOptions = {}): UseFallDetectionReturn {
  const { 
    threshold = 2.5, // 2.5G impact
    fallDuration = 2000, // 2 seconds of low motion
    onFallDetected 
  } = options;

  const [state, setState] = useState<FallDetectionState>({
    isMonitoring: false,
    lastAcceleration: null,
    fallDetected: false,
    isSupported: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
  });

  const impactTimeRef = useRef<number | null>(null);
  const lowMotionStartRef = useRef<number | null>(null);
  const accelerationHistoryRef = useRef<number[]>([]);

  const calculateMagnitude = (x: number, y: number, z: number): number => {
    return Math.sqrt(x * x + y * y + z * z) / 9.81; // Convert to G-force
  };

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const { x, y, z } = acc;
    const magnitude = calculateMagnitude(x, y, z);
    
    // Update state
    setState(prev => ({
      ...prev,
      lastAcceleration: { x, y, z },
    }));

    // Keep history for pattern analysis
    accelerationHistoryRef.current.push(magnitude);
    if (accelerationHistoryRef.current.length > 50) {
      accelerationHistoryRef.current.shift();
    }

    const now = Date.now();

    // Phase 1: Detect high impact
    if (magnitude > threshold && !impactTimeRef.current) {
      console.log('Fall: High impact detected', magnitude);
      impactTimeRef.current = now;
      lowMotionStartRef.current = null;
    }

    // Phase 2: After impact, detect low motion (person lying still)
    if (impactTimeRef.current) {
      const timeSinceImpact = now - impactTimeRef.current;
      
      // Only check for stillness within 5 seconds of impact
      if (timeSinceImpact < 5000) {
        // Check for low motion (near 1G, indicating lying flat)
        if (Math.abs(magnitude - 1) < 0.3) { // Near 1G (gravity only)
          if (!lowMotionStartRef.current) {
            lowMotionStartRef.current = now;
          } else if (now - lowMotionStartRef.current > fallDuration) {
            // Fall confirmed!
            console.log('Fall confirmed!');
            setState(prev => ({ ...prev, fallDetected: true }));
            impactTimeRef.current = null;
            lowMotionStartRef.current = null;
            onFallDetected?.();
          }
        } else {
          // Motion detected, reset low motion timer
          lowMotionStartRef.current = null;
        }
      } else {
        // Too much time passed since impact, reset
        impactTimeRef.current = null;
        lowMotionStartRef.current = null;
      }
    }
  }, [threshold, fallDuration, onFallDetected]);

  const startMonitoring = useCallback(() => {
    if (!state.isSupported) {
      console.warn('DeviceMotion not supported');
      return;
    }

    // Request permission on iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            setState(prev => ({ ...prev, isMonitoring: true }));
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
      setState(prev => ({ ...prev, isMonitoring: true }));
    }
  }, [state.isSupported, handleMotion]);

  const stopMonitoring = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setState(prev => ({ ...prev, isMonitoring: false }));
    impactTimeRef.current = null;
    lowMotionStartRef.current = null;
  }, [handleMotion]);

  const resetFall = useCallback(() => {
    setState(prev => ({ ...prev, fallDetected: false }));
    impactTimeRef.current = null;
    lowMotionStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    resetFall,
  };
}
