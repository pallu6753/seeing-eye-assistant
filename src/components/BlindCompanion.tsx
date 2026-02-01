import { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import { useOCR } from '@/hooks/useOCR';
import { useFallDetection } from '@/hooks/useFallDetection';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useNavigation } from '@/hooks/useNavigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useGestureControls } from '@/hooks/useGestureControls';
import { useContinuousFeedback } from '@/hooks/useContinuousFeedback';
import { useSpeakOnTap } from '@/hooks/useSpeakOnTap';
import { speak, stopSpeech } from '@/lib/speech';
import { haptics } from '@/lib/haptics';
import { modeManager, MODE_CONFIGS, type AppMode } from '@/lib/mode-manager';
import { CameraPreview } from '@/components/CameraPreview';
import { StatusHeader } from '@/components/StatusHeader';
import { ModeButton } from '@/components/ModeButton';
import { NavigationPanel } from '@/components/NavigationPanel';
import { FindObjectPanel } from '@/components/FindObjectPanel';
import { EmergencyOverlay } from '@/components/EmergencyOverlay';
import { SettingsPanel } from '@/components/SettingsPanel';
import { DetectionOverlay } from '@/components/DetectionOverlay';
import { Settings, Download, MapPin } from 'lucide-react';
import type { ProcessedDetection } from '@/lib/detection-utils';

interface AppSettings {
  voiceSpeed: number;
  voiceVolume: number;
  vibrationStrength: 'off' | 'low' | 'medium' | 'high';
  language: string;
  darkMode: boolean;
}

const defaultSettings: AppSettings = {
  voiceSpeed: 1.1,
  voiceVolume: 1,
  vibrationStrength: 'medium',
  language: 'en-US',
  darkMode: true,
};

export function BlindCompanion() {
  // App state
  const [mode, setMode] = useState<AppMode>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [targetObject, setTargetObject] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const announcementCooldownRef = useRef<Map<string, number>>(new Map());

  // Speak on tap hook
  const { createTapHandler } = useSpeakOnTap();

  // Hooks
  const { 
    videoRef, 
    canvasRef, 
    isStreaming, 
    error: cameraError, 
    startCamera, 
    stopCamera 
  } = useCamera({ facingMode: 'environment' });

  const {
    isModelLoaded,
    isDetecting,
    detections,
    mostImportant,
    error: detectionError,
    loadModel,
    startContinuousDetection,
    stopContinuousDetection,
  } = useObjectDetection({ minConfidence: 0.5, detectionInterval: 400 });

  const {
    isProcessing: isOCRProcessing,
    text: ocrText,
    recognizeText,
    clearText,
  } = useOCR();

  const { 
    fallDetected, 
    startMonitoring: startFallDetection,
    stopMonitoring: stopFallDetection,
    resetFall,
    isMonitoring: isFallDetectionActive,
  } = useFallDetection({
    onFallDetected: () => {
      speak('Fall detected! Are you okay? Emergency will activate in 10 seconds.', 'critical');
      haptics.fallAlert();
      // Auto-trigger emergency after delay if not cancelled
      setTimeout(() => {
        if (fallDetected) {
          handleEmergency();
        }
      }, 10000);
    },
  });

  const {
    isListening,
    isAwake,
    startListening: startWakeWord,
    stopListening: stopWakeWord,
    isSupported: wakeWordSupported,
  } = useWakeWord({
    wakeWord: 'hey assist',
    onWakeWord: () => {
      speak('I\'m listening.', 'high');
      haptics.modeChanged();
    },
    onCommand: handleVoiceCommand,
  });

  const navigation = useNavigation({
    onStepChange: (step) => {
      speak(step.instruction, 'high');
      haptics.navigateDirection(step.direction);
    },
    onArrival: () => {
      speak('You have arrived at your destination.', 'high');
      haptics.navigationArrival();
      setMode('idle');
    },
  });

  const { isInstallable, promptInstall } = usePWAInstall();

  // Gesture controls
  useGestureControls({
    enabled: isInitialized && mode !== 'emergency',
    onSwipeLeft: () => handleDetect(),
    onSwipeRight: () => handleRead(),
    onSwipeUp: () => handleSafeWalk(),
    onSwipeDown: () => handleEmergency(),
  });

  // Continuous voice feedback during Safe Walk
  useContinuousFeedback({
    enabled: mode === 'safe-walk',
    detections,
    intervalMs: 5000,
    isNavigating: navigation.isNavigating,
    currentNavigationStep: navigation.currentStep?.instruction || null,
  });

  // Apply haptics settings
  useEffect(() => {
    haptics.setStrength(settings.vibrationStrength);
  }, [settings.vibrationStrength]);

  // Measure container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      speak('Loading Safe Walk. Please wait.', 'normal');
      
      try {
        await loadModel();
        await startCamera();
        startWakeWord();
        startFallDetection();
        setIsInitialized(true);
        speak('Safe Walk ready. Say "Hey Assist" or swipe to control.', 'normal');
      } catch (err) {
        console.error('Initialization error:', err);
        speak('Failed to initialize. Please check camera permissions.', 'high');
      }
    };

    init();

    return () => {
      stopCamera();
      stopContinuousDetection();
      stopWakeWord();
      stopFallDetection();
    };
  }, []);

  // Subscribe to mode changes
  useEffect(() => {
    const unsubscribe = modeManager.subscribe((newMode, config) => {
      setMode(newMode);
      speak(config.announcement, 'normal');
      haptics.modeChanged();
    });
    return unsubscribe;
  }, []);

  // Voice command handler
  function handleVoiceCommand(command: string) {
    const cmd = command.toLowerCase().trim();
    console.log('Voice command:', cmd);

    // Check for mode-specific commands
    const targetMode = modeManager.getModeForCommand(cmd);
    if (targetMode) {
      if (targetMode === 'idle') {
        handleStop();
      } else if (targetMode === 'emergency') {
        handleEmergency();
      } else if (targetMode === 'detecting') {
        handleDetect();
      } else if (targetMode === 'reading') {
        handleRead();
      } else if (targetMode === 'safe-walk') {
        handleSafeWalk();
      } else if (targetMode === 'find-object') {
        handleFindObject();
      } else if (targetMode === 'navigation') {
        speak('Where would you like to go?', 'normal');
        // Wait for destination
      }
      return;
    }

    // Utility commands
    if (cmd.includes('repeat') || cmd.includes('again')) {
      if (lastAnnouncement) {
        speak(lastAnnouncement, 'normal');
      } else {
        speak('Nothing to repeat.', 'low');
      }
      return;
    }

    if (cmd.includes('settings') || cmd.includes('options')) {
      setShowSettings(true);
      speak('Settings opened.', 'normal');
      return;
    }

    // Find object target
    if (mode === 'find-object' && cmd) {
      // Extract object name
      const objectMatch = cmd.match(/find\s+(?:my\s+)?(\w+)/i);
      if (objectMatch) {
        setTargetObject(objectMatch[1].toLowerCase());
        speak(`Looking for ${objectMatch[1]}.`, 'normal');
      }
    }
  }

  // Handle detection announcements
  useEffect(() => {
    const isDetectingMode = mode === 'detecting' || mode === 'safe-walk';
    if (!isDetectingMode || !mostImportant) return;

    const now = Date.now();
    const cooldownKey = `${mostImportant.object}-${mostImportant.direction}`;
    const lastTime = announcementCooldownRef.current.get(cooldownKey) || 0;

    const cooldowns = {
      critical: 1500,
      high: 2500,
      normal: 4000,
      low: 6000,
    };
    const cooldown = cooldowns[mostImportant.priority];

    if (now - lastTime > cooldown) {
      speak(mostImportant.announcement, mostImportant.priority);
      setLastAnnouncement(mostImportant.announcement);

      if (mostImportant.priority === 'critical') {
        haptics.dangerDetected();
      } else if (mostImportant.priority === 'high') {
        haptics.personDetected();
      } else {
        haptics.objectDetected();
      }

      announcementCooldownRef.current.set(cooldownKey, now);
    }
  }, [mostImportant, mode]);

  // Find object mode
  useEffect(() => {
    if (mode === 'find-object' && targetObject && detections.length > 0) {
      const found = detections.find(d => 
        d.object.toLowerCase().includes(targetObject.toLowerCase())
      );
      
      if (found) {
        speak(`Found ${targetObject} ${found.announcement}`, 'high');
        haptics.objectFound();
        setTargetObject(null);
        setMode('idle');
      }
    }
  }, [mode, targetObject, detections]);

  // OCR result handling
  useEffect(() => {
    if (ocrText && mode === 'reading') {
      if (ocrText.length > 5) {
        speak(`Reading: ${ocrText}`, 'normal');
        setLastAnnouncement(ocrText);
        haptics.textFound();
      } else {
        speak('No readable text found.', 'low');
      }
      setMode('idle');
    }
  }, [ocrText, mode]);

  // Action handlers
  const handleDetect = useCallback(() => {
    if (mode === 'detecting') {
      stopContinuousDetection();
      modeManager.setMode('idle');
    } else {
      if (videoRef.current && isModelLoaded) {
        startContinuousDetection(videoRef.current);
        modeManager.setMode('detecting');
      } else {
        speak('Detection not ready. Please wait.', 'high');
      }
    }
  }, [mode, isModelLoaded, videoRef, startContinuousDetection, stopContinuousDetection]);

  const handleRead = useCallback(async () => {
    if (mode === 'reading' || isOCRProcessing) return;

    modeManager.setMode('reading');

    try {
      if (videoRef.current) {
        await recognizeText(videoRef.current);
      }
    } catch (err) {
      speak('Failed to read text.', 'high');
      modeManager.setMode('idle');
    }
  }, [mode, isOCRProcessing, videoRef, recognizeText]);

  const handleSafeWalk = useCallback(() => {
    if (mode === 'safe-walk') {
      stopContinuousDetection();
      navigation.stopNavigation();
      modeManager.setMode('idle');
    } else {
      if (videoRef.current && isModelLoaded) {
        startContinuousDetection(videoRef.current);
        modeManager.setMode('safe-walk');
      }
    }
  }, [mode, isModelLoaded, videoRef, startContinuousDetection, stopContinuousDetection, navigation]);

  const handleFindObject = useCallback(() => {
    if (mode === 'find-object') {
      stopContinuousDetection();
      setTargetObject(null);
      modeManager.setMode('idle');
    } else {
      if (videoRef.current && isModelLoaded) {
        startContinuousDetection(videoRef.current);
        modeManager.setMode('find-object');
      }
    }
  }, [mode, isModelLoaded, videoRef, startContinuousDetection, stopContinuousDetection]);

  const handleStop = useCallback(() => {
    stopContinuousDetection();
    navigation.stopNavigation();
    stopSpeech();
    clearText();
    setTargetObject(null);
    modeManager.setMode('idle');
    speak('Stopped.', 'normal');
  }, [stopContinuousDetection, navigation, clearText]);

  const handleEmergency = useCallback(() => {
    if (mode === 'emergency') {
      modeManager.setMode('idle');
      resetFall();
      speak('Emergency cancelled.', 'high');
    } else {
      modeManager.setMode('emergency');
      haptics.emergencyActivated();
    }
  }, [mode, resetFall]);

  const handleHelp = useCallback(() => {
    speak('Help mode. You can share your camera with a caregiver. This feature requires internet connection.', 'normal');
    // Remote help would require backend - show info for now
  }, []);

  const handleTryLocation = useCallback(() => {
    speak('Try demo location. Starting navigation to Majestic Bus Station.', 'high');
    // Start safe walk with navigation
    if (videoRef.current && isModelLoaded) {
      startContinuousDetection(videoRef.current);
      modeManager.setMode('safe-walk');
    }
    navigation.startDemoNavigation();
  }, [videoRef, isModelLoaded, startContinuousDetection, navigation]);

  const config = MODE_CONFIGS[mode];
  const foundObjects = detections.map(d => d.object);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Emergency Overlay */}
      <EmergencyOverlay 
        isActive={mode === 'emergency'} 
        onCancel={handleEmergency}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Main UI */}
      <StatusHeader
        mode={mode}
        config={config}
        isListening={isListening}
        isAwake={isAwake}
        fallDetectionActive={isFallDetectionActive}
      />

      {/* Camera + Detection - 35% height */}
      <main className="flex-1 px-4 py-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <div ref={containerRef} className="h-[35vh] min-h-[200px] flex-shrink-0">
          <CameraPreview
            ref={videoRef}
            isStreaming={isStreaming}
            error={cameraError || detectionError}
          >
            {isStreaming && isDetecting && (
              <DetectionOverlay
                detections={detections}
                videoWidth={videoRef.current?.videoWidth || 0}
                videoHeight={videoRef.current?.videoHeight || 0}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            )}
          </CameraPreview>
        </div>

        {/* Navigation Panel */}
        {navigation.isNavigating && (
          <NavigationPanel
            isActive={navigation.isNavigating}
            currentStep={navigation.currentStep}
            nextStep={navigation.nextStep}
            remainingDistance={navigation.remainingDistance}
            remainingTime={navigation.remainingTime}
            destination={navigation.destination}
            onStop={navigation.stopNavigation}
          />
        )}

        {/* Find Object Panel */}
        {mode === 'find-object' && (
          <FindObjectPanel
            isActive={mode === 'find-object'}
            targetObject={targetObject}
            isSearching={isDetecting}
            foundObjects={foundObjects}
            onSetTarget={setTargetObject}
            onClearTarget={() => setTargetObject(null)}
            onVoiceInput={() => speak('Say the name of the object to find.', 'normal')}
          />
        )}

        {/* Main Action Grid - 2x2 + Try Location */}
        <nav className="grid grid-cols-2 gap-3" aria-label="Main actions">
          <ModeButton
            variant="detect"
            isActive={mode === 'detecting'}
            disabled={!isModelLoaded}
            onClick={createTapHandler('detect', handleDetect, false)}
            size="large"
          >
            {mode === 'detecting' ? 'Stop' : 'Detect'}
          </ModeButton>

          <ModeButton
            variant="read"
            isActive={mode === 'reading'}
            isLoading={isOCRProcessing}
            disabled={!isStreaming}
            onClick={createTapHandler('read', handleRead, false)}
            size="large"
          >
            Read Text
          </ModeButton>

          <ModeButton
            variant="safe-walk"
            isActive={mode === 'safe-walk'}
            disabled={!isModelLoaded}
            onClick={createTapHandler('safe-walk', handleSafeWalk, false)}
            size="large"
          >
            {mode === 'safe-walk' ? 'Stop Walk' : 'Safe Walk'}
          </ModeButton>

          <ModeButton
            variant="navigate"
            isActive={navigation.isNavigating}
            disabled={!navigation.isSupported}
            onClick={createTapHandler('navigate', () => {
              if (navigation.isNavigating) {
                navigation.stopNavigation();
              } else {
                speak('Use Try Location button below for demo navigation.', 'normal');
              }
            }, false)}
            size="large"
          >
            Navigate
          </ModeButton>
        </nav>

        {/* Try This Location Button */}
        <button
          onClick={createTapHandler('try-location', handleTryLocation, false)}
          className="flex items-center justify-center gap-3 w-full h-16 min-h-[64px] rounded-2xl border-2 
                     bg-accent text-accent-foreground border-accent font-bold text-lg
                     transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-ring"
          aria-label="Try demo location navigation"
        >
          <MapPin className="w-6 h-6" aria-hidden="true" />
          <span>📍 Try This Location</span>
        </button>

        {/* Emergency Button */}
        <ModeButton
          variant="emergency"
          isActive={mode === 'emergency'}
          onClick={createTapHandler('emergency', handleEmergency, false)}
          size="full"
        >
          {mode === 'emergency' ? 'Cancel Emergency' : '🚨 Emergency'}
        </ModeButton>
      </main>

      {/* Footer Actions */}
      <footer className="flex-shrink-0 p-4 border-t border-border bg-card flex items-center justify-between">
        <button
          onClick={createTapHandler('settings', () => setShowSettings(true), true)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 min-h-[48px]"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>

        {isInstallable && (
          <button
            onClick={createTapHandler('install', promptInstall, true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 min-h-[48px]"
          >
            <Download className="w-5 h-5" />
            <span>Install App</span>
          </button>
        )}

        <p className="text-sm text-muted-foreground max-w-[120px] text-center leading-tight">
          Swipe to control
        </p>
      </footer>
    </div>
  );
}
