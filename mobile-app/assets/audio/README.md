# Emergency Siren Audio

This folder contains the emergency siren audio file.

## Instructions:

1. **Add your siren audio file** here as `siren.mp3` or `siren.wav`
2. **Supported formats**: MP3, WAV, M4A
3. **Recommended duration**: 3-5 seconds (will loop)
4. **Volume**: Make sure it's loud enough for emergency situations

## File Structure:
```
assets/
└── audio/
    └── siren.mp3  ← Add your siren file here
```

## How to add the siren:
1. Copy your siren audio file to this folder
2. Rename it to `siren.mp3` (or update the import in emergencyService.js)
3. The emergency system will automatically load and play it

## Current Status:
⚠️  No siren file present - using vibration only
📳 Emergency vibration is active
🔊 Audio will work once siren file is added
