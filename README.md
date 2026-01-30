# Vision Assistant - Accessibility AI

A voice-first accessibility assistant for blind and visually impaired users. Uses real-time camera-based object detection and OCR to help users navigate their environment safely.

## Features

### Core Functionality

- **Continuous Object Detection**: Uses TensorFlow.js with COCO-SSD to detect objects in real-time
- **Direction & Distance**: Estimates relative position (left/center/right) and approximate distance
- **Text Reading (OCR)**: Uses Tesseract.js to recognize and read text aloud
- **Voice Commands**: Control the app hands-free with voice
- **Priority System**: Dangerous objects (vehicles) interrupt and take priority
- **Emergency Mode**: One-button emergency alert with alarm sound

### Accessibility Features

- **High Contrast UI**: Pure black background with bright text
- **Large Touch Targets**: 60px+ buttons for easy interaction
- **Haptic Feedback**: Vibration patterns for different events
- **No Visual Dependency**: All information announced via speech
- **Voice Control**: Full hands-free operation

## Voice Commands

- **"Detect"** or **"Start"**: Begin object detection
- **"Read"** or **"Read text"**: Scan for and read text
- **"Stop"**: Stop all operations
- **"Repeat"**: Repeat last announcement
- **"Emergency"** or **"Help"**: Activate emergency mode

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Object Detection**: TensorFlow.js + COCO-SSD
- **OCR**: Tesseract.js
- **Speech**: Web Speech API (synthesis + recognition)
- **Camera**: MediaDevices API
- **Haptics**: Vibration API

## Object Detection

Detects and announces:
- **Critical**: Vehicles (car, truck, bus, motorcycle, bicycle)
- **High Priority**: People, animals
- **Normal**: Doors, stairs, traffic signs
- **Low Priority**: Furniture, bottles, plants

## Distance Estimation

Estimates distance based on object bounding box size:
- **Close**: < 1 meter
- **Medium**: 1-3 meters  
- **Far**: > 3 meters

## Direction Detection

Determines position based on bounding box center:
- **Left**: Object in left third of frame
- **Center**: Object in middle third
- **Right**: Object in right third

## Browser Requirements

- Modern browser with camera access
- WebGL support (for TensorFlow.js)
- Web Speech API support (for voice)
- HTTPS required for camera access on mobile

## Usage

1. Grant camera permission when prompted
2. Wait for "Assistant ready" announcement
3. Press "Start Detection" or say "detect"
4. Point camera at environment
5. Listen to object announcements
6. Say "read text" to read visible text
7. Press "Emergency" if help needed

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Permissions Required

- Camera access (for object/text detection)
- Microphone access (for voice commands)
- Notifications (optional, for alerts)

## Safety Notes

This is an assistive tool, not a replacement for mobility training or aids. Always use in conjunction with other navigation methods.

## License

MIT
