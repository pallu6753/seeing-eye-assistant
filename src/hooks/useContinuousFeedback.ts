import { useEffect, useRef, useCallback } from 'react';
import { speak } from '@/lib/speech';
import type { ProcessedDetection } from '@/lib/detection-utils';

interface UseContinuousFeedbackOptions {
  enabled: boolean;
  detections: ProcessedDetection[];
  intervalMs?: number;
  isNavigating?: boolean;
  currentNavigationStep?: string | null;
}

const PATH_STATUS_MESSAGES = [
  'Path clear.',
  'Area looks safe.',
  'No obstacles detected.',
  'Clear ahead.',
  'Way is clear.',
];

export function useContinuousFeedback(options: UseContinuousFeedbackOptions) {
  const {
    enabled,
    detections,
    intervalMs = 5000,
    isNavigating = false,
    currentNavigationStep = null,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFeedbackRef = useRef<number>(0);

  const generateFeedback = useCallback(() => {
    const now = Date.now();
    
    // Prevent feedback too close together
    if (now - lastFeedbackRef.current < 3000) return;
    lastFeedbackRef.current = now;

    // Check for obstacles
    const hasObstacles = detections.length > 0;
    const dangerObjects = detections.filter(d => d.priority === 'critical' || d.priority === 'high');

    if (dangerObjects.length > 0) {
      // Announce most important danger
      const danger = dangerObjects[0];
      speak(`Warning: ${danger.announcement}`, 'high');
    } else if (hasObstacles) {
      // Announce general awareness
      const nearbyCount = detections.length;
      if (nearbyCount === 1) {
        speak(`One object nearby: ${detections[0].object}`, 'low');
      } else {
        speak(`${nearbyCount} objects nearby. Proceed with caution.`, 'low');
      }
    } else {
      // Path is clear - give reassurance
      const randomMessage = PATH_STATUS_MESSAGES[Math.floor(Math.random() * PATH_STATUS_MESSAGES.length)];
      speak(randomMessage, 'low');
    }

    // If navigating, add navigation context
    if (isNavigating && currentNavigationStep) {
      setTimeout(() => {
        speak(currentNavigationStep, 'normal');
      }, 1500);
    }
  }, [detections, isNavigating, currentNavigationStep]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start continuous feedback
    intervalRef.current = setInterval(generateFeedback, intervalMs);

    // Initial feedback after short delay
    const initialTimeout = setTimeout(() => {
      speak('Safe walk mode active. I will guide you.', 'normal');
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialTimeout);
    };
  }, [enabled, intervalMs, generateFeedback]);

  return {
    triggerFeedback: generateFeedback,
  };
}
