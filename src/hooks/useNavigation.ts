import { useState, useEffect, useCallback, useRef } from 'react';
import { haptics } from '@/lib/haptics';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

interface NavigationStep {
  instruction: string;
  distance: number; // meters
  direction: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn';
  streetName?: string;
}

interface NavigationState {
  isNavigating: boolean;
  currentPosition: Position | null;
  destination: string | null;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  remainingDistance: number; // meters
  remainingTime: number; // seconds
  error: string | null;
}

interface UseNavigationOptions {
  onStepChange?: (step: NavigationStep) => void;
  onArrival?: () => void;
  onPositionUpdate?: (position: Position) => void;
}

interface UseNavigationReturn extends NavigationState {
  startNavigation: (destination: string) => Promise<void>;
  stopNavigation: () => void;
  requestPosition: () => void;
  isSupported: boolean;
}

// Mock navigation steps for demo (in production, use real maps API)
const mockSteps: NavigationStep[] = [
  { instruction: 'Walk straight for 50 meters', distance: 50, direction: 'straight', streetName: 'Main Street' },
  { instruction: 'Turn left onto Oak Avenue', distance: 0, direction: 'left', streetName: 'Oak Avenue' },
  { instruction: 'Continue for 100 meters', distance: 100, direction: 'straight' },
  { instruction: 'Turn right onto Park Road', distance: 0, direction: 'right', streetName: 'Park Road' },
  { instruction: 'Your destination is on the left', distance: 25, direction: 'slight-left' },
];

export function useNavigation(options: UseNavigationOptions = {}): UseNavigationReturn {
  const { onStepChange, onArrival, onPositionUpdate } = options;

  const [state, setState] = useState<NavigationState>({
    isNavigating: false,
    currentPosition: null,
    destination: null,
    currentStep: null,
    nextStep: null,
    remainingDistance: 0,
    remainingTime: 0,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newPosition: Position = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
    };

    setState(prev => ({
      ...prev,
      currentPosition: newPosition,
    }));

    onPositionUpdate?.(newPosition);

    // Simulate step progression based on movement
    if (state.isNavigating && newPosition.speed && newPosition.speed > 0.5) {
      // Simulate advancing through steps
      const currentStep = mockSteps[stepIndexRef.current];
      if (currentStep) {
        // Check if we should advance to next step
        const distanceTraveled = (newPosition.speed || 0) * 5; // Assume 5 second intervals
        
        if (distanceTraveled >= currentStep.distance * 0.8) {
          stepIndexRef.current++;
          const nextStep = mockSteps[stepIndexRef.current];
          
          if (nextStep) {
            setState(prev => ({
              ...prev,
              currentStep: nextStep,
              nextStep: mockSteps[stepIndexRef.current + 1] || null,
              remainingDistance: mockSteps.slice(stepIndexRef.current).reduce((acc, s) => acc + s.distance, 0),
            }));
            
            onStepChange?.(nextStep);

            // Haptic feedback for turns
            if (nextStep.direction === 'left' || nextStep.direction === 'slight-left') {
              haptics.vibrate([100, 50, 100]); // Left pattern
            } else if (nextStep.direction === 'right' || nextStep.direction === 'slight-right') {
              haptics.vibrate([100, 50, 100, 50, 100]); // Right pattern
            }
          } else {
            // Arrived!
            setState(prev => ({
              ...prev,
              isNavigating: false,
              currentStep: null,
              nextStep: null,
              remainingDistance: 0,
            }));
            onArrival?.();
            haptics.vibrate([200, 100, 200, 100, 200]); // Arrival pattern
          }
        }
      }
    }
  }, [state.isNavigating, onPositionUpdate, onStepChange, onArrival]);

  const startNavigation = useCallback(async (destination: string) => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    try {
      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          setState(prev => ({ ...prev, error: error.message }));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );

      // Initialize with first step
      stepIndexRef.current = 0;
      const totalDistance = mockSteps.reduce((acc, s) => acc + s.distance, 0);

      setState(prev => ({
        ...prev,
        isNavigating: true,
        destination,
        currentStep: mockSteps[0],
        nextStep: mockSteps[1] || null,
        remainingDistance: totalDistance,
        remainingTime: Math.round(totalDistance / 1.2), // Assume 1.2 m/s walking speed
        error: null,
      }));

      onStepChange?.(mockSteps[0]);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start navigation' 
      }));
    }
  }, [isSupported, handlePositionUpdate, onStepChange]);

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    stepIndexRef.current = 0;
    setState(prev => ({
      ...prev,
      isNavigating: false,
      destination: null,
      currentStep: null,
      nextStep: null,
      remainingDistance: 0,
      remainingTime: 0,
    }));
  }, []);

  const requestPosition = useCallback(() => {
    if (!isSupported) return;

    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      (error) => {
        setState(prev => ({ ...prev, error: error.message }));
      },
      { enableHighAccuracy: true }
    );
  }, [isSupported, handlePositionUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startNavigation,
    stopNavigation,
    requestPosition,
    isSupported,
  };
}
