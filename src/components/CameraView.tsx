import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CameraViewProps {
  isStreaming: boolean;
  error: string | null;
  children?: React.ReactNode;
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ isStreaming, error, children }, ref) => {
    return (
      <div className="camera-view relative">
        <video
          ref={ref}
          className={cn(
            "w-full h-full object-cover",
            !isStreaming && "hidden"
          )}
          playsInline
          muted
          autoPlay
          aria-hidden="true"
        />
        
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-muted-foreground border-t-primary animate-spin" />
              <p className="text-lg text-muted-foreground">
                Starting camera...
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
              <p className="text-lg text-destructive font-bold">
                Camera Error
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Overlay for detection boxes */}
        {isStreaming && children}
      </div>
    );
  }
);

CameraView.displayName = 'CameraView';
