import { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import { useOCR } from '@/hooks/useOCR';
import { speak, stopSpeech, startVoiceCommands, stopVoiceCommands } from '@/lib/speech';
import { haptics } from '@/lib/haptics';
import { CameraView } from '@/components/CameraView';
import { StatusBar } from '@/components/StatusBar';
import { ActionButton } from '@/components/ActionButton';
import { DetectionOverlay } from '@/components/DetectionOverlay';
import type { ProcessedDetection } from '@/lib/detection-utils';

type AppMode = 'idle' | 'detecting' | 'reading' | 'emergency';

export function AccessibilityAssistant() {
  const [mode, setMode] = useState<AppMode>('idle');
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAnnouncementTimeRef = useRef<number>(0);
  const announcementCooldownRef = useRef<Map<string, number>>(new Map());

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
      speak('Loading accessibility assistant. Please wait.', 'normal');
      
      try {
        await loadModel();
        await startCamera();
        setIsInitialized(true);
        speak('Assistant ready. Camera active. Say "detect" to start object detection.', 'normal');
        setStatusMessage('Ready');
      } catch (err) {
        console.error('Initialization error:', err);
        speak('Failed to initialize. Please check camera permissions.', 'high');
        setStatusMessage('Initialization failed');
      }
    };

    init();

    return () => {
      stopCamera();
      stopContinuousDetection();
      stopVoiceCommands();
    };
  }, []);

  // Voice command handler
  const handleVoiceCommand = useCallback((command: string) => {
    console.log('Processing command:', command);
    
    if (command.includes('detect') || command.includes('start')) {
      handleDetectToggle();
    } else if (command.includes('read') || command.includes('text')) {
      handleReadText();
    } else if (command.includes('stop')) {
      handleStop();
    } else if (command.includes('repeat') || command.includes('again')) {
      if (lastAnnouncement) {
        speak(lastAnnouncement, 'normal');
      } else {
        speak('Nothing to repeat.', 'low');
      }
    } else if (command.includes('emergency') || command.includes('help')) {
      handleEmergency();
    }
  }, [lastAnnouncement]);

  // Start voice commands when initialized
  useEffect(() => {
    if (isInitialized) {
      startVoiceCommands(handleVoiceCommand);
    }
    return () => stopVoiceCommands();
  }, [isInitialized, handleVoiceCommand]);

  // Handle detection announcements
  useEffect(() => {
    if (mode !== 'detecting' || !mostImportant) return;

    const now = Date.now();
    const cooldownKey = `${mostImportant.object}-${mostImportant.direction}`;
    const lastTime = announcementCooldownRef.current.get(cooldownKey) || 0;
    
    // Cooldown based on priority
    const cooldowns = {
      critical: 1500,
      high: 2500,
      normal: 4000,
      low: 6000,
    };
    const cooldown = cooldowns[mostImportant.priority];

    if (now - lastTime > cooldown) {
      // Announce
      speak(mostImportant.announcement, mostImportant.priority);
      setLastAnnouncement(mostImportant.announcement);
      
      // Haptic feedback based on priority
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

  // Handle OCR result
  useEffect(() => {
    if (ocrText && mode === 'reading') {
      if (ocrText.length > 5) {
        speak(`Reading text: ${ocrText}`, 'normal');
        setLastAnnouncement(ocrText);
        haptics.textFound();
      } else {
        speak('No readable text found.', 'low');
      }
      setMode('idle');
      setStatusMessage('Ready');
    }
  }, [ocrText, mode]);

  // Action handlers
  const handleDetectToggle = useCallback(() => {
    if (mode === 'detecting') {
      stopContinuousDetection();
      setMode('idle');
      setStatusMessage('Detection stopped');
      speak('Detection stopped.', 'normal');
      haptics.modeChanged();
    } else {
      if (videoRef.current && isModelLoaded) {
        startContinuousDetection(videoRef.current);
        setMode('detecting');
        setStatusMessage('Detection active');
        speak('Detection mode active. I will announce objects ahead.', 'normal');
        haptics.modeChanged();
      } else {
        speak('Model not ready. Please wait.', 'high');
      }
    }
  }, [mode, isModelLoaded, videoRef, startContinuousDetection, stopContinuousDetection]);

  const handleReadText = useCallback(async () => {
    if (mode === 'reading' || isOCRProcessing) return;

    setMode('reading');
    setStatusMessage('Reading text...');
    speak('Scanning for text.', 'normal');
    haptics.modeChanged();

    try {
      if (videoRef.current) {
        await recognizeText(videoRef.current);
      }
    } catch (err) {
      speak('Failed to read text.', 'high');
      setMode('idle');
      setStatusMessage('Ready');
    }
  }, [mode, isOCRProcessing, videoRef, recognizeText]);

  const handleStop = useCallback(() => {
    stopContinuousDetection();
    stopSpeech();
    clearText();
    setMode('idle');
    setStatusMessage('Stopped');
    speak('All operations stopped.', 'normal');
    haptics.modeChanged();
  }, [stopContinuousDetection, clearText]);

  const handleEmergency = useCallback(() => {
    if (mode === 'emergency') {
      setMode('idle');
      setStatusMessage('Emergency cancelled');
      speak('Emergency cancelled.', 'high');
      return;
    }

    setMode('emergency');
    setStatusMessage('EMERGENCY ACTIVE');
    speak('Emergency activated! Help needed!', 'critical');
    haptics.emergencyActivated();

    // Play alarm using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      oscillator.type = 'square';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Modulate for alarm effect
      let high = true;
      const interval = setInterval(() => {
        oscillator.frequency.value = high ? 880 : 660;
        high = !high;
      }, 250);

      setTimeout(() => {
        clearInterval(interval);
        oscillator.stop();
        audioContext.close();
      }, 3000);
    } catch (e) {
      console.error('Audio error:', e);
    }
  }, [mode]);

  const getStatusType = () => {
    switch (mode) {
      case 'emergency': return 'danger';
      case 'detecting': return 'active';
      case 'reading': return 'warning';
      default: return 'idle';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      
      {/* Header with status */}
      <header className="flex-shrink-0 p-4">
        <h1 className="sr-only">Accessibility Vision Assistant</h1>
        <StatusBar 
          status={getStatusType()} 
          message={statusMessage}
          isListening={isInitialized}
        />
      </header>

      {/* Camera View */}
      <main className="flex-1 px-4 pb-4 flex flex-col gap-4 min-h-0">
        <div ref={containerRef} className="flex-1 min-h-[200px]">
          <CameraView 
            ref={videoRef} 
            isStreaming={isStreaming} 
            error={cameraError || detectionError}
          >
            {isStreaming && (
              <DetectionOverlay
                detections={detections}
                videoWidth={videoRef.current?.videoWidth || 0}
                videoHeight={videoRef.current?.videoHeight || 0}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            )}
          </CameraView>
        </div>

        {/* Action Buttons */}
        <nav className="flex-shrink-0 flex flex-col gap-3" aria-label="Main actions">
          <ActionButton
            variant="detect"
            isActive={mode === 'detecting'}
            disabled={!isModelLoaded}
            onClick={handleDetectToggle}
          >
            {mode === 'detecting' ? 'Stop Detection' : 'Start Detection'}
          </ActionButton>

          <ActionButton
            variant="read"
            isActive={mode === 'reading'}
            isLoading={isOCRProcessing}
            disabled={!isStreaming}
            onClick={handleReadText}
          >
            Read Text
          </ActionButton>

          <ActionButton
            variant="emergency"
            isActive={mode === 'emergency'}
            onClick={handleEmergency}
          >
            {mode === 'emergency' ? 'Cancel Emergency' : 'Emergency'}
          </ActionButton>
        </nav>
      </main>

      {/* Instructions - visible but also announced */}
      <footer className="flex-shrink-0 p-4 bg-card border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Voice commands: "detect", "read text", "stop", "repeat", "emergency"
        </p>
      </footer>
    </div>
  );
}
