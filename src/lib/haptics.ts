// Enhanced haptics with directional feedback for navigation
type HapticPattern = 'light' | 'medium' | 'heavy' | 'danger' | 'success' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 50,
  medium: 100,
  heavy: 200,
  danger: [100, 50, 100, 50, 200],
  success: [50, 100, 50],
  warning: [100, 100, 100],
};

// Navigation direction patterns
const navigationPatterns = {
  left: [200, 100, 200],           // Two pulses for left
  right: [200, 100, 200, 100, 200], // Three pulses for right
  straight: [100],                  // Single short pulse
  'slight-left': [150, 100],        // One and a half for slight left
  'slight-right': [150, 100, 150],  // Short triple for slight right
  'u-turn': [300, 100, 300, 100, 300], // Long pattern for u-turn
  arrival: [200, 100, 200, 100, 400], // Celebration pattern
};

class HapticsManager {
  private isSupported: boolean;
  private strength: 'off' | 'low' | 'medium' | 'high' = 'medium';

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  setStrength(strength: 'off' | 'low' | 'medium' | 'high') {
    this.strength = strength;
  }

  private getMultiplier(): number {
    switch (this.strength) {
      case 'off': return 0;
      case 'low': return 0.5;
      case 'medium': return 1;
      case 'high': return 1.5;
      default: return 1;
    }
  }

  private adjustPattern(pattern: number | number[]): number | number[] {
    const multiplier = this.getMultiplier();
    if (multiplier === 0) return 0;

    if (typeof pattern === 'number') {
      return Math.round(pattern * multiplier);
    }

    return pattern.map(v => Math.round(v * multiplier));
  }

  vibrate(pattern: HapticPattern | number | number[]): boolean {
    if (!this.isSupported || this.strength === 'off') return false;

    const vibrationPattern = typeof pattern === 'string'
      ? patterns[pattern]
      : pattern;

    const adjustedPattern = this.adjustPattern(vibrationPattern);

    try {
      return navigator.vibrate(adjustedPattern);
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

  // Standard feedback
  objectDetected(): void {
    this.vibrate('light');
  }

  personDetected(): void {
    this.vibrate('medium');
  }

  dangerDetected(): void {
    this.vibrate('danger');
  }

  emergencyActivated(): void {
    this.vibrate([200, 100, 200, 100, 200, 100, 200]);
  }

  textFound(): void {
    this.vibrate('success');
  }

  modeChanged(): void {
    this.vibrate('medium');
  }

  // Navigation-specific haptics
  navigateLeft(): void {
    const pattern = this.adjustPattern(navigationPatterns.left);
    navigator.vibrate(pattern);
  }

  navigateRight(): void {
    const pattern = this.adjustPattern(navigationPatterns.right);
    navigator.vibrate(pattern);
  }

  navigateStraight(): void {
    const pattern = this.adjustPattern(navigationPatterns.straight);
    navigator.vibrate(pattern);
  }

  navigateSlightLeft(): void {
    const pattern = this.adjustPattern(navigationPatterns['slight-left']);
    navigator.vibrate(pattern);
  }

  navigateSlightRight(): void {
    const pattern = this.adjustPattern(navigationPatterns['slight-right']);
    navigator.vibrate(pattern);
  }

  navigateUTurn(): void {
    const pattern = this.adjustPattern(navigationPatterns['u-turn']);
    navigator.vibrate(pattern);
  }

  navigationArrival(): void {
    const pattern = this.adjustPattern(navigationPatterns.arrival);
    navigator.vibrate(pattern);
  }

  // Navigation direction based on step
  navigateDirection(direction: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn'): void {
    const pattern = this.adjustPattern(navigationPatterns[direction]);
    navigator.vibrate(pattern);
  }

  // Fall detection alert
  fallAlert(): void {
    // Urgent repeated pattern
    this.vibrate([300, 200, 300, 200, 300, 200, 300]);
  }

  // Object found (for find object mode)
  objectFound(): void {
    this.vibrate([100, 50, 100, 50, 200]);
  }

  get supported(): boolean {
    return this.isSupported;
  }
}

export const haptics = new HapticsManager();
