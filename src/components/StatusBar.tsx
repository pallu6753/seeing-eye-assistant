import { cn } from '@/lib/utils';

type StatusType = 'active' | 'warning' | 'danger' | 'idle';

interface StatusBarProps {
  status: StatusType;
  message: string;
  isListening?: boolean;
}

export function StatusBar({ status, message, isListening = false }: StatusBarProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'warning':
        return 'status-warning';
      case 'danger':
        return 'status-danger';
      default:
        return 'status-indicator bg-muted text-muted-foreground border-2 border-border';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'danger':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={cn('w-full', getStatusStyles())}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{getStatusIcon()}</span>
          <span className="sr-only">Status: {status}</span>
          <span className="font-medium">{message}</span>
        </div>
        
        {isListening && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safe opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-safe"></span>
            </span>
            <span className="text-sm">Listening</span>
          </div>
        )}
      </div>
    </div>
  );
}
