# Blind Companion - AI Accessibility Assistant

A production-grade, voice-first AI assistant designed for blind and visually impaired users. Provides real-time object detection, text reading, navigation assistance, and safety features.

## Features

### Core (MVP)
- **Voice OS**: Wake word "Hey Assist" + voice commands
- **Continuous Object Detection**: TensorFlow.js COCO-SSD at 400ms intervals
- **Direction + Distance**: Left/center/right estimation with meters
- **OCR Text Reading**: Tesseract.js for documents, signs, medicine labels
- **Emergency Mode**: Full-screen alert with alarm sound
- **Haptic Feedback**: Directional vibration patterns

### Modes
- **Detect Mode**: Continuous object announcements with priority system
- **Read Mode**: OCR text scanning and reading
- **Safe Walk Mode**: Combined detection + navigation for walking
- **Find Object Mode**: Search for specific items (keys, phone, etc.)

### Safety Features
- **Fall Detection**: Accelerometer-based with auto-emergency trigger
- **Priority System**: Vehicles/people interrupt other announcements
- **Danger Alerts**: Rapid vibration + immediate voice warning

### Accessibility
- **High Contrast UI**: Pure black background, bright yellow/white text
- **Large Touch Targets**: 64px+ buttons for easy interaction
- **No Visual Dependency**: All actions announced via speech
- **Wake Word Control**: Hands-free operation
- **Multi-language**: English, Hindi, Kannada, Tamil support

## Voice Commands

| Command | Action |
|---------|--------|
| "Hey Assist" | Wake up the assistant |
| "Detect" / "Start" | Begin object detection |
| "Read" / "Read text" | Scan and read text |
| "Safe walk" | Start safe walking mode |
| "Find [object]" | Search for specific object |
| "Stop" / "Cancel" | Stop current operation |
| "Repeat" | Repeat last announcement |
| "Emergency" / "Help" | Activate emergency mode |
| "Settings" | Open settings panel |

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + Semantic tokens |
| Object Detection | TensorFlow.js + COCO-SSD |
| OCR | Tesseract.js |
| Speech | Web Speech API |
| Camera | MediaDevices API |
| Haptics | Vibration API |
| Sensors | DeviceMotion API |
| PWA | vite-plugin-pwa + Workbox |

## Object Detection Priority

| Priority | Objects | Behavior |
|----------|---------|----------|
| Critical | car, truck, bus, motorcycle | Immediate interrupt + rapid vibration |
| High | person, dog, cat | Interrupt normal speech |
| Normal | door, stairs, traffic light | Standard announcement |
| Low | chair, couch, bottle | Announce when idle |

## Distance Estimation

Based on bounding box size relative to frame:
- **Close**: < 1 meter (large bounding box)
- **Medium**: 1-3 meters
- **Far**: > 3 meters (small bounding box)

## Settings

- **Voice Speed**: 0.5x - 2x
- **Voice Volume**: 0% - 100%
- **Vibration Strength**: Off / Low / Medium / High
- **Language**: EN, HI, KN, TA, ES
- **Dark Mode**: Always on for accessibility

## PWA Installation

The app can be installed on any device:
1. Visit the app in a modern browser
2. Click "Install App" button or use browser menu
3. App will work offline with cached AI models

## Browser Requirements

- Modern browser with camera access
- WebGL support (for TensorFlow.js)
- Web Speech API support
- Vibration API support (mobile)
- HTTPS required for camera on mobile

## Project Structure

```
src/
├── components/
│   ├── BlindCompanion.tsx      # Main app component
│   ├── CameraPreview.tsx       # Camera feed display
│   ├── StatusHeader.tsx        # Mode + status display
│   ├── ModeButton.tsx          # Action buttons
│   ├── NavigationPanel.tsx     # GPS navigation UI
│   ├── FindObjectPanel.tsx     # Object search UI
│   ├── EmergencyOverlay.tsx    # Emergency screen
│   ├── SettingsPanel.tsx       # Settings UI
│   └── DetectionOverlay.tsx    # Detection boxes
├── hooks/
│   ├── useCamera.ts            # Camera access
│   ├── useObjectDetection.ts   # TensorFlow detection
│   ├── useOCR.ts               # Tesseract OCR
│   ├── useFallDetection.ts     # Accelerometer monitoring
│   ├── useWakeWord.ts          # Voice wake word
│   ├── useNavigation.ts        # GPS navigation
│   └── usePWAInstall.ts        # PWA install prompt
├── lib/
│   ├── mode-manager.ts         # App mode state
│   ├── speech.ts               # TTS + recognition
│   ├── haptics.ts              # Vibration patterns
│   └── detection-utils.ts      # Detection processing
└── pages/
    └── Index.tsx               # Entry point
```

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Future Roadmap

### Phase 2 (Intermediate)
- [ ] Real GPS navigation with Mapbox
- [ ] Remote help with live camera sharing
- [ ] Medicine label verification
- [ ] Barcode/price scanning
- [ ] Landmark memory

### Phase 3 (Advanced)
- [ ] AI scene understanding (Lovable AI)
- [ ] Crowd density detection
- [ ] Traffic light recognition
- [ ] Daily briefings
- [ ] Caregiver dashboard

## Safety Notes

This is an assistive tool, **not a replacement** for mobility training, guide dogs, or white canes. Always use in conjunction with other navigation methods.

## License

MIT
