import { AlertTriangle, Phone, MapPin, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface EmergencyOverlayProps {
  isActive: boolean;
  onCancel: () => void;
  locationShared?: boolean;
}

export function EmergencyOverlay({ isActive, onCancel, locationShared = false }: EmergencyOverlayProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (isActive) {
      // Create alarm sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'square';
        gainNode.gain.value = 0.3;

        oscillator.start();
        oscillatorRef.current = oscillator;

        // Modulate for alarm effect
        let high = true;
        const interval = setInterval(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.frequency.value = high ? 880 : 660;
            high = !high;
          }
        }, 250);

        return () => {
          clearInterval(interval);
          oscillator.stop();
          audioContext.close();
        };
      } catch (e) {
        console.error('Audio error:', e);
      }
    } else {
      // Stop alarm
      if (oscillatorRef.current && audioContextRef.current) {
        try {
          oscillatorRef.current.stop();
          audioContextRef.current.close();
        } catch (e) {
          // Already stopped
        }
      }
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-destructive/95 flex flex-col emergency-active">
      {/* Animated warning icon */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative">
          <AlertTriangle className="w-32 h-32 text-destructive-foreground animate-pulse" />
          <div className="absolute inset-0 w-32 h-32 border-4 border-destructive-foreground rounded-full animate-ping opacity-50" />
        </div>

        <h1 className="text-4xl font-black text-destructive-foreground text-center uppercase">
          Emergency Active
        </h1>

        <p className="text-xl text-destructive-foreground/90 text-center">
          Help is being requested
        </p>

        {/* Status indicators */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center gap-3 text-destructive-foreground">
            <Volume2 className="w-6 h-6 animate-pulse" />
            <span className="text-lg">Alarm sounding</span>
          </div>
          
          <div className={cn(
            'flex items-center gap-3',
            locationShared ? 'text-destructive-foreground' : 'text-destructive-foreground/60'
          )}>
            <MapPin className="w-6 h-6" />
            <span className="text-lg">
              {locationShared ? 'Location shared' : 'Sharing location...'}
            </span>
          </div>
        </div>
      </div>

      {/* Cancel button */}
      <div className="p-6 space-y-4">
        <button
          onClick={onCancel}
          className={cn(
            'w-full flex items-center justify-center gap-3',
            'h-20 rounded-2xl text-2xl font-bold',
            'bg-destructive-foreground text-destructive',
            'transition-transform active:scale-95'
          )}
          aria-label="Cancel emergency"
        >
          <X className="w-8 h-8" />
          Cancel Emergency
        </button>

        <p className="text-center text-destructive-foreground/70 text-sm">
          Press and hold if this was accidental
        </p>
      </div>
    </div>
  );
}
