import { useEffect, useRef, useCallback } from 'react';
import { speak } from '@/lib/speech';
import { haptics } from '@/lib/haptics';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface UseGestureControlsOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  enabled?: boolean;
}

interface SwipeHandlers {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}

const SWIPE_ANNOUNCEMENTS: Record<SwipeDirection, string> = {
  left: 'Object detection.',
  right: 'Text reader.',
  up: 'Navigation.',
  down: 'Emergency mode.',
};

export function useGestureControls(options: UseGestureControlsOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    enabled = true,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const handleSwipe = useCallback((direction: SwipeDirection, handlers: SwipeHandlers) => {
    // Announce the action
    speak(SWIPE_ANNOUNCEMENTS[direction], 'high');
    haptics.modeChanged();

    // Execute the handler
    switch (direction) {
      case 'left':
        handlers.onSwipeLeft?.();
        break;
      case 'right':
        handlers.onSwipeRight?.();
        break;
      case 'up':
        handlers.onSwipeUp?.();
        break;
      case 'down':
        handlers.onSwipeDown?.();
        break;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handlers: SwipeHandlers = {
      onSwipeLeft: onSwipeLeft || (() => {}),
      onSwipeRight: onSwipeRight || (() => {}),
      onSwipeUp: onSwipeUp || (() => {}),
      onSwipeDown: onSwipeDown || (() => {}),
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if it's a valid swipe
      if (Math.max(absX, absY) < minSwipeDistance) {
        touchStartRef.current = null;
        touchEndRef.current = null;
        return;
      }

      // Determine direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handleSwipe('right', handlers);
        } else {
          handleSwipe('left', handlers);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handleSwipe('down', handlers);
        } else {
          handleSwipe('up', handlers);
        }
      }

      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, handleSwipe]);

  return {
    isEnabled: enabled,
  };
}
