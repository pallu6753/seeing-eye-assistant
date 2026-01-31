import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface CameraPreviewProps {
  isStreaming: boolean;
  error: string | null;
  children?: React.ReactNode;
  className?: string;
}

export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ isStreaming, error, children, className }, ref) => {
    return (
      <div className={cn(
        'relative w-full h-full rounded-2xl overflow-hidden',
        'bg-card border-2 border-border',
        className
      )}>
        {/* Video element */}
        <video
          ref={ref}
          className={cn(
            'w-full h-full object-cover',
            !isStreaming && 'hidden'
          )}
          playsInline
          muted
          autoPlay
          aria-label="Camera feed"
        />

        {/* Overlay for children (detection boxes, etc.) */}
        {isStreaming && children}

        {/* Loading state */}
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
            <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground font-medium">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 p-4">
            <CameraOff className="w-12 h-12 text-destructive" />
            <p className="text-destructive font-medium text-center">{error}</p>
            <p className="text-sm text-muted-foreground text-center">
              Please check camera permissions
            </p>
          </div>
        )}

        {/* Camera frame corners for visual feedback */}
        {isStreaming && (
          <>
            <div className="absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
          </>
        )}
      </div>
    );
  }
);

CameraPreview.displayName = 'CameraPreview';
