// Haptic feedback utilities using Vibration API

type HapticPattern = 'light' | 'medium' | 'heavy' | 'danger' | 'success' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 50,
  medium: 100,
  heavy: 200,
  danger: [100, 50, 100, 50, 200], // Rapid pattern for danger
  success: [50, 100, 50],
  warning: [100, 100, 100],
};

class HapticsManager {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  vibrate(pattern: HapticPattern | number | number[]): boolean {
    if (!this.isSupported) return false;

    const vibrationPattern = typeof pattern === 'string' 
      ? patterns[pattern] 
      : pattern;

    try {
      return navigator.vibrate(vibrationPattern);
    } catch (e) {
      console.error('Vibration failed:', e);
      return false;
    }
  }

  stop(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  // Object detected - light feedback
  objectDetected(): void {
    this.vibrate('light');
  }

  // Person detected - medium feedback
  personDetected(): void {
    this.vibrate('medium');
  }

  // Danger detected (vehicle, obstacle close) - rapid vibration
  dangerDetected(): void {
    this.vibrate('danger');
  }

  // Emergency activated
  emergencyActivated(): void {
    // Continuous rapid vibration
    this.vibrate([200, 100, 200, 100, 200, 100, 200]);
  }

  // Text found
  textFound(): void {
    this.vibrate('success');
  }

  // Mode changed
  modeChanged(): void {
    this.vibrate('medium');
  }

  get supported(): boolean {
    return this.isSupported;
  }
}

export const haptics = new HapticsManager();
