import { cn } from '@/lib/utils';
import { Navigation, MapPin, Clock, ArrowUp, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface NavigationStep {
  instruction: string;
  distance: number;
  direction: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn';
  streetName?: string;
}

interface NavigationPanelProps {
  isActive: boolean;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  remainingDistance: number;
  remainingTime: number;
  destination: string | null;
  onStop: () => void;
}

const directionIcons: Record<NavigationStep['direction'], React.ComponentType<{ className?: string }>> = {
  straight: ArrowUp,
  left: ArrowLeft,
  right: ArrowRight,
  'slight-left': ArrowLeft,
  'slight-right': ArrowRight,
  'u-turn': RotateCcw,
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function NavigationPanel({
  isActive,
  currentStep,
  nextStep,
  remainingDistance,
  remainingTime,
  destination,
  onStop,
}: NavigationPanelProps) {
  if (!isActive || !currentStep) return null;

  const DirectionIcon = directionIcons[currentStep.direction];

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Navigation className="w-5 h-5" />
          <span className="text-sm font-medium">Navigating to</span>
        </div>
        <button
          onClick={onStop}
          className="text-sm text-destructive font-medium hover:underline"
          aria-label="Stop navigation"
        >
          Stop
        </button>
      </div>

      {/* Destination */}
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground truncate">{destination}</span>
      </div>

      {/* Current instruction */}
      <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-4">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0',
          'bg-primary text-primary-foreground'
        )}>
          <DirectionIcon className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-foreground">{currentStep.instruction}</p>
          {currentStep.streetName && (
            <p className="text-sm text-muted-foreground">{currentStep.streetName}</p>
          )}
        </div>
      </div>

      {/* Next step preview */}
      {nextStep && (
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground uppercase">Then</span>
          <span className="text-sm text-foreground">{nextStep.instruction}</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-around pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{formatDistance(remainingDistance)}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{formatTime(remainingTime)}</p>
          </div>
          <p className="text-xs text-muted-foreground">ETA</p>
        </div>
      </div>
    </div>
  );
}
