import { cn } from '@/lib/utils';
import { Mic, MicOff, Wifi, WifiOff, Battery, BatteryLow, Activity } from 'lucide-react';
import type { AppMode, ModeConfig } from '@/lib/mode-manager';

interface StatusHeaderProps {
  mode: AppMode;
  config: ModeConfig;
  isListening: boolean;
  isAwake: boolean;
  isConnected?: boolean;
  fallDetectionActive?: boolean;
}

const modeColors: Record<AppMode, string> = {
  idle: 'bg-muted text-muted-foreground',
  detecting: 'bg-safe/20 text-safe border-safe',
  reading: 'bg-accent/20 text-accent border-accent',
  'safe-walk': 'bg-safe/20 text-safe border-safe',
  'find-object': 'bg-accent/20 text-accent border-accent',
  medicine: 'bg-primary/20 text-primary border-primary',
  shopping: 'bg-accent/20 text-accent border-accent',
  navigation: 'bg-safe/20 text-safe border-safe',
  emergency: 'bg-destructive/20 text-destructive border-destructive',
};

export function StatusHeader({
  mode,
  config,
  isListening,
  isAwake,
  isConnected = true,
  fallDetectionActive = false,
}: StatusHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-3">
      {/* Top row: System status icons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Voice status */}
          <div className={cn(
            'flex items-center gap-1.5 text-sm',
            isAwake ? 'text-safe' : isListening ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {isListening ? (
              <Mic className={cn('w-4 h-4', isAwake && 'animate-pulse')} />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">
              {isAwake ? 'Listening...' : isListening ? 'Ready' : 'Off'}
            </span>
          </div>

          {/* Connection status */}
          <div className={cn(
            'flex items-center gap-1',
            isConnected ? 'text-safe' : 'text-destructive'
          )}>
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
          </div>

          {/* Fall detection indicator */}
          {fallDetectionActive && (
            <div className="flex items-center gap-1 text-safe">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Fall Watch</span>
            </div>
          )}
        </div>

        {/* Wake word hint */}
        <p className="text-xs text-muted-foreground">
          Say "Hey Assist"
        </p>
      </div>

      {/* Mode indicator */}
      <div className={cn(
        'rounded-xl px-4 py-2 border-2 text-center',
        modeColors[mode]
      )}>
        <p className="font-bold text-lg" role="status" aria-live="polite">
          {config.name}
        </p>
        <p className="text-xs opacity-80">{config.description}</p>
      </div>
    </header>
  );
}
