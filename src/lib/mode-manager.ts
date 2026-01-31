// Mode-based Voice OS Manager
// Handles app modes, state transitions, and mode-specific behaviors

export type AppMode = 
  | 'idle'
  | 'detecting'
  | 'reading'
  | 'safe-walk'
  | 'find-object'
  | 'medicine'
  | 'shopping'
  | 'navigation'
  | 'emergency';

export interface ModeConfig {
  name: string;
  announcement: string;
  description: string;
  features: string[];
  priority: number; // Higher = more important
}

export const MODE_CONFIGS: Record<AppMode, ModeConfig> = {
  idle: {
    name: 'Standby',
    announcement: 'Standby mode. Say "Hey Assist" or tap a button.',
    description: 'Waiting for commands',
    features: ['voice-commands', 'camera-preview'],
    priority: 0,
  },
  detecting: {
    name: 'Object Detection',
    announcement: 'Detection mode active. I will announce objects around you.',
    description: 'Detecting objects in real-time',
    features: ['object-detection', 'direction', 'distance', 'haptics'],
    priority: 2,
  },
  reading: {
    name: 'Text Reading',
    announcement: 'Reading mode. Point camera at text.',
    description: 'Reading text from camera',
    features: ['ocr', 'text-to-speech'],
    priority: 2,
  },
  'safe-walk': {
    name: 'Safe Walk',
    announcement: 'Safe walk mode. I will guide you safely.',
    description: 'Walking with detection + navigation',
    features: ['object-detection', 'navigation', 'fall-detection', 'haptics'],
    priority: 3,
  },
  'find-object': {
    name: 'Find Object',
    announcement: 'Tell me what to find.',
    description: 'Searching for specific object',
    features: ['object-detection', 'voice-feedback'],
    priority: 2,
  },
  medicine: {
    name: 'Medicine Reader',
    announcement: 'Medicine mode. Point camera at medicine label.',
    description: 'Reading medicine information',
    features: ['ocr', 'medicine-check'],
    priority: 2,
  },
  shopping: {
    name: 'Shopping Assistant',
    announcement: 'Shopping mode. I can scan barcodes and read prices.',
    description: 'Scanning products',
    features: ['ocr', 'barcode', 'price-reading'],
    priority: 2,
  },
  navigation: {
    name: 'Navigation',
    announcement: 'Navigation mode. Tell me where to go.',
    description: 'GPS navigation with voice guidance',
    features: ['gps', 'turn-by-turn', 'haptics'],
    priority: 3,
  },
  emergency: {
    name: 'Emergency',
    announcement: 'Emergency activated! Sending alert!',
    description: 'Emergency mode active',
    features: ['alarm', 'location-share', 'emergency-contact'],
    priority: 10,
  },
};

export interface ModeTransition {
  from: AppMode;
  to: AppMode;
  timestamp: number;
}

class ModeManager {
  private currentMode: AppMode = 'idle';
  private previousMode: AppMode = 'idle';
  private modeHistory: ModeTransition[] = [];
  private listeners: Set<(mode: AppMode, config: ModeConfig) => void> = new Set();

  getCurrentMode(): AppMode {
    return this.currentMode;
  }

  getCurrentConfig(): ModeConfig {
    return MODE_CONFIGS[this.currentMode];
  }

  getPreviousMode(): AppMode {
    return this.previousMode;
  }

  setMode(newMode: AppMode): ModeConfig {
    if (newMode === this.currentMode) {
      return MODE_CONFIGS[newMode];
    }

    // Emergency can always interrupt
    // Other modes can only interrupt lower priority
    const currentConfig = MODE_CONFIGS[this.currentMode];
    const newConfig = MODE_CONFIGS[newMode];

    if (this.currentMode !== 'idle' && newConfig.priority < currentConfig.priority) {
      console.log(`Cannot switch from ${this.currentMode} to ${newMode} (lower priority)`);
      return currentConfig;
    }

    this.modeHistory.push({
      from: this.currentMode,
      to: newMode,
      timestamp: Date.now(),
    });

    this.previousMode = this.currentMode;
    this.currentMode = newMode;

    // Notify listeners
    this.listeners.forEach(listener => listener(newMode, newConfig));

    return newConfig;
  }

  goBack(): AppMode {
    if (this.previousMode !== this.currentMode) {
      this.setMode(this.previousMode);
    } else {
      this.setMode('idle');
    }
    return this.currentMode;
  }

  subscribe(listener: (mode: AppMode, config: ModeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  canTransitionTo(targetMode: AppMode): boolean {
    if (this.currentMode === 'emergency' && targetMode !== 'idle') {
      return false;
    }
    return true;
  }

  getModeForCommand(command: string): AppMode | null {
    const cmd = command.toLowerCase().trim();
    
    // Wake word detection
    if (cmd.includes('hey assist')) {
      return 'idle'; // Ready for next command
    }

    // Mode commands
    if (cmd.includes('safe walk') || cmd.includes('safewalk') || cmd.includes('walk mode')) {
      return 'safe-walk';
    }
    if (cmd.includes('find') || cmd.includes('search') || cmd.includes('locate')) {
      return 'find-object';
    }
    if (cmd.includes('medicine') || cmd.includes('medication') || cmd.includes('pill')) {
      return 'medicine';
    }
    if (cmd.includes('shop') || cmd.includes('barcode') || cmd.includes('price')) {
      return 'shopping';
    }
    if (cmd.includes('navigate') || cmd.includes('directions') || cmd.includes('take me')) {
      return 'navigation';
    }
    if (cmd.includes('detect') || cmd.includes('what') || cmd.includes('see')) {
      return 'detecting';
    }
    if (cmd.includes('read') || cmd.includes('text')) {
      return 'reading';
    }
    if (cmd.includes('emergency') || cmd.includes('help me') || cmd.includes('sos')) {
      return 'emergency';
    }
    if (cmd.includes('stop') || cmd.includes('cancel') || cmd.includes('back')) {
      return 'idle';
    }

    return null;
  }
}

export const modeManager = new ModeManager();
