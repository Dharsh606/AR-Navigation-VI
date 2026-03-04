# AR-NAV-VI – Architecture & Module Map

**Augmented Reality Navigation System for Visually Impaired Persons**  
AI-powered, voice-first, AR assistive navigation with smart environment integration.

---

## Module Overview

| Layer | Module | Path | Purpose |
|-------|--------|------|---------|
| UI | HomeScreen | `src/screens/HomeScreen.js` | 3 large buttons (Navigation, AR Scan, Emergency) + voice-first |
| UI | ARScreen | `src/screens/ARScreen.js` | Live navigation + obstacle alerts + voice guidance |
| UI | CameraScreen | `src/screens/CameraScreen.js` | Camera feed + detection overlay + directional haptics |
| Voice | voiceEngine | `src/services/voiceEngine.js` | TTS confirmations, announcements |
| Voice | voiceListener | `src/services/voiceListener.js` | Command parsing, smart home, navigation triggers |
| AR | detectionAdapter | `src/services/detectionAdapter.js` | Object detection (simulated; plug in TF.js/COCO-SSD here) |
| Risk | riskAnalyzer | `src/services/riskAnalyzer.js` | Risk score from distance, type, movement |
| Nav | navigationEngine | `src/services/navigationEngine.js` | GPS, watch position, turn-by-turn voice |
| Safety | emergencyModule | `src/services/emergencyModule.js` | SOS, GPS share, backend alert |
| Smart | bluetoothManager | `src/services/bluetoothManager.js` | Smart bulbs/locks (stub; add react-native-ble-plx for real BLE) |
| Backend | api | `src/services/api.js` | Sessions, heatmap, emergency, analytics |

---

## Voice Commands (voiceListener)

- **Start navigation** → ARScreen  
- **Scan surroundings / Open camera** → CameraScreen  
- **Emergency help / SOS** → Emergency flow  
- **Where am I?** → Speaks current GPS  
- **Turn on/off [living room light, bedroom light]** → Bluetooth manager (simulated)  
- **Lock / Unlock main door** → Bluetooth manager (simulated)  
- **Repeat / Stop** → TTS feedback  

---

## Detection & Risk (Academic Depth)

- **detectionAdapter**: Currently returns simulated detections (labels, bbox, distance, direction). Replace with TensorFlow.js COCO-SSD or TFLite when using Expo dev client for real camera-frame inference.  
- **riskAnalyzer**: `computeRisk(detection)` uses object type weight, distance bands (near/medium/far), and optional speed to output `{ score, level, message }` for voice and haptics.  

---

## Backend (Optional)

- **Location**: Create `backend/` with `server.js` (Express) and `package.json` (express, cors).  
- **Endpoints**: `POST /api/sessions`, `POST /api/heatmap`, `POST /api/emergency`, `GET /api/routes/frequent`, `GET /api/risk-zones`, `GET /api/analytics/summary`.  
- **App**: Set `EXPO_PUBLIC_API_URL` (e.g. `http://YOUR_IP:3000`) so the app can reach the backend from device.  

---

## Plugins (app.json)

If not already present, add under `expo.plugins`:

- `["expo-camera", { "cameraPermission": "AR Nav VI needs camera for obstacle detection." }]`  
- `["expo-speech-recognition", {}]`  

---

## Demo Flow (Presentation)

1. Open app → hear welcome + “Voice listening”.  
2. Say **“Scan surroundings”** → Camera screen, bounding boxes + voice/haptics for obstacles.  
3. Say **“Start navigation”** → AR screen, periodic directions + obstacle alerts.  
4. Trigger **Emergency** (button or voice) → confirm message + backend log (if server running).  
5. Say **“Turn on living room light”** → simulated smart home confirmation.  
6. Show backend analytics (sessions, heatmap, emergencies) if running.  

---

## Academic Angles for Documentation

- Human–Computer Interaction for accessibility (blind-first, voice-first).  
- Edge AI / on-device object detection (TF.js / TFLite).  
- Real-time risk computation model (distance, type, movement).  
- Spatial awareness from monocular camera.  
- Privacy and data security (local-first, optional backend).  
