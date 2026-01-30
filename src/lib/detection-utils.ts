// Utility functions for object detection

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface ProcessedDetection {
  object: string;
  confidence: number;
  direction: 'left' | 'center' | 'right';
  distance: 'close' | 'medium' | 'far';
  distanceMeters: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  announcement: string;
}

// Danger objects that should interrupt and be prioritized
const DANGER_OBJECTS = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train'];
const HIGH_PRIORITY_OBJECTS = ['person', 'dog', 'cat', 'horse', 'cow'];
const NORMAL_OBJECTS = ['door', 'stairs', 'stop sign', 'traffic light', 'fire hydrant'];
const LOW_PRIORITY_OBJECTS = ['chair', 'couch', 'bed', 'dining table', 'potted plant', 'bottle', 'cup'];

// Reference sizes for distance estimation (approximate real-world heights in pixels at 1 meter)
const REFERENCE_SIZES: Record<string, number> = {
  person: 400,
  car: 300,
  truck: 350,
  bus: 400,
  chair: 150,
  bottle: 80,
  door: 500,
  dog: 100,
  bicycle: 200,
};

export function getDirection(bbox: [number, number, number, number], frameWidth: number): 'left' | 'center' | 'right' {
  const centerX = bbox[0] + bbox[2] / 2;
  const relativeX = centerX / frameWidth;

  if (relativeX < 0.35) return 'left';
  if (relativeX > 0.65) return 'right';
  return 'center';
}

export function getDirectionText(direction: 'left' | 'center' | 'right'): string {
  switch (direction) {
    case 'left': return 'on your left';
    case 'right': return 'on your right';
    case 'center': return 'ahead';
  }
}

export function estimateDistance(
  bbox: [number, number, number, number], 
  objectClass: string,
  frameHeight: number
): { distance: 'close' | 'medium' | 'far'; meters: number } {
  const objectHeight = bbox[3];
  const referenceSize = REFERENCE_SIZES[objectClass] || 200;
  
  // Rough estimation: at 1 meter, object takes up referenceSize pixels
  // Distance inversely proportional to apparent size
  const apparentRatio = objectHeight / frameHeight;
  
  // Estimate meters based on apparent size
  let meters: number;
  if (apparentRatio > 0.5) {
    meters = 0.5;
  } else if (apparentRatio > 0.3) {
    meters = 1;
  } else if (apparentRatio > 0.15) {
    meters = 2;
  } else if (apparentRatio > 0.08) {
    meters = 4;
  } else {
    meters = 6;
  }

  let distance: 'close' | 'medium' | 'far';
  if (meters <= 1) {
    distance = 'close';
  } else if (meters <= 3) {
    distance = 'medium';
  } else {
    distance = 'far';
  }

  return { distance, meters: Math.round(meters * 10) / 10 };
}

export function getPriority(objectClass: string): 'critical' | 'high' | 'normal' | 'low' {
  if (DANGER_OBJECTS.includes(objectClass)) return 'critical';
  if (HIGH_PRIORITY_OBJECTS.includes(objectClass)) return 'high';
  if (NORMAL_OBJECTS.includes(objectClass)) return 'normal';
  if (LOW_PRIORITY_OBJECTS.includes(objectClass)) return 'low';
  return 'normal';
}

export function processDetection(
  detection: DetectedObject,
  frameWidth: number,
  frameHeight: number
): ProcessedDetection {
  const direction = getDirection(detection.bbox, frameWidth);
  const { distance, meters } = estimateDistance(detection.bbox, detection.class, frameHeight);
  const priority = getPriority(detection.class);
  
  // Build announcement
  let announcement: string;
  const objectName = detection.class.charAt(0).toUpperCase() + detection.class.slice(1);
  const directionText = getDirectionText(direction);
  
  if (priority === 'critical') {
    announcement = `Warning! ${objectName} ${meters} meters ${directionText}!`;
  } else if (distance === 'close') {
    announcement = `${objectName} very close ${directionText}.`;
  } else {
    announcement = `${objectName} ${meters} meters ${directionText}.`;
  }

  return {
    object: detection.class,
    confidence: detection.score,
    direction,
    distance,
    distanceMeters: meters,
    priority,
    announcement,
  };
}

// Filter and deduplicate detections
export function filterDetections(
  detections: DetectedObject[],
  minConfidence: number = 0.5
): DetectedObject[] {
  return detections
    .filter(d => d.score >= minConfidence)
    .sort((a, b) => b.score - a.score);
}

// Get the most important detection to announce
export function getMostImportantDetection(
  processed: ProcessedDetection[]
): ProcessedDetection | null {
  if (processed.length === 0) return null;

  // Sort by priority, then by distance (closer = more important)
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  const distanceOrder = { close: 0, medium: 1, far: 2 };

  const sorted = [...processed].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return distanceOrder[a.distance] - distanceOrder[b.distance];
  });

  return sorted[0];
}
