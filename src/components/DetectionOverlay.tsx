import { ProcessedDetection } from '@/lib/detection-utils';

interface DetectionOverlayProps {
  detections: ProcessedDetection[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export function DetectionOverlay({
  detections,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
}: DetectionOverlayProps) {
  if (!videoWidth || !videoHeight) return null;

  // Calculate scale factors
  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  const getPriorityColor = (priority: ProcessedDetection['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-destructive bg-destructive/20 text-destructive';
      case 'high':
        return 'border-warning bg-warning/20 text-warning';
      case 'normal':
        return 'border-primary bg-primary/20 text-primary';
      case 'low':
        return 'border-muted-foreground bg-muted/20 text-muted-foreground';
      default:
        return 'border-foreground bg-background/20 text-foreground';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Detection boxes would go here if we had bbox data */}
      {/* For accessibility app, visual feedback is less important */}
      
      {/* Simple indicator for active detections */}
      {detections.length > 0 && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
          {detections.slice(0, 5).map((detection, index) => (
            <div
              key={`${detection.object}-${index}`}
              className={`px-3 py-1 rounded-full text-sm font-bold ${getPriorityColor(detection.priority)}`}
            >
              {detection.object} • {detection.distanceMeters}m {detection.direction}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
