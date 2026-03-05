# Manual Release Instructions for AR Navigation VI

## 🚀 Creating GitHub Release Manually

Since GitHub Actions needs to run first, here's how to create the release manually:

### Option 1: Using GitHub Web Interface (Recommended)

1. **Go to GitHub**: https://github.com/Dharsh606/AR-Navigation-VI
2. **Click "Releases"** tab on the right
3. **Click "Create a new release"**
4. **Fill in the details**:
   - **Tag version**: v2.0
   - **Release title**: AR Navigation VI v2.0 - Enhanced Accessibility App
   - **Description**: 
     ```
     🚀 AR Navigation VI v2.0 - Enhanced Accessibility App
     
     ✨ New Features:
     - 🎯 AI-powered obstacle detection with voice alerts
     - 🗺️ Advanced turn-by-turn navigation with landmarks  
     - 🏠 Complete smart home integration
     - 🚨 Enhanced emergency system (medical, police, fire, lost)
     - ♿ Full accessibility enhancements
     
     📱 Installation:
     1. Download the APK file below
     2. Enable "Install from unknown sources" on Android
     3. Install and grant permissions
     4. Enjoy enhanced accessibility features!
     ```
5. **Attach files**: 
   - Drag and drop `AR-Navigation-VI-v2.0-Enhanced.apk` from your project root
   - Or build fresh APK: `cd android && ./gradlew assembleRelease`
6. **Click "Publish release"**

### Option 2: Using GitHub CLI

```bash
# Install GitHub CLI (if not installed)
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: sudo apt install gh

# Login to GitHub
gh auth login

# Create release
gh release create v2.0 \
  --title "AR Navigation VI v2.0 - Enhanced Accessibility App" \
  --notes "🚀 Enhanced AR Navigation with AI obstacle detection, advanced navigation, smart home control, and emergency features" \
  "android/app/build/outputs/apk/release/app-release.apk"
```

### Option 3: Quick Manual Upload

1. **Build APK locally**:
   ```bash
   cd android
   ./gradlew clean assembleRelease
   ```

2. **Find APK**: `android/app/build/outputs/apk/release/app-release.apk`

3. **Upload to GitHub**:
   - Go to Releases page
   - Click "Create a new release"
   - Tag as v2.0
   - Upload the APK file
   - Publish release

## 📱 Current APK Location

The built APK is located at:
```
j:\AR-Nav-VI\android\app\build\outputs\apk\release\app-release.apk
```

Or the copy we made:
```
j:\AR-Nav-VI\AR-Navigation-VI-v2.0-Enhanced.apk
```

## 🎯 After Release

Once the release is created:
1. **Users can download** from: https://github.com/Dharsh606/AR-Navigation-VI/releases
2. **Direct link** will be: https://github.com/Dharsh606/AR-Navigation-VI/releases/latest
3. **QR code** can be generated for easy sharing
4. **README will show** download button automatically

## ⚡ Quick Fix

The GitHub Actions workflow will automatically create releases for future pushes. 
This manual setup is only needed for the first release.
