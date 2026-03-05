import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class EmergencyService {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.vibrationInterval = null;
    this.sirenLoaded = false;
  }

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // Set maximum volume for emergency
        volume: 1.0,
      });
      
      // Try to load siren file
      await this.loadSiren();
      
      console.log('Emergency audio service initialized');
    } catch (error) {
      console.log('Audio initialization error:', error);
    }
  }

  async loadSiren() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }
      
      // Try to load the siren file from assets
      const sirenFile = require('../../assets/audio/siren.mp3');
      
      const { sound } = await Audio.Sound.createAsync(
        sirenFile,
        { 
          shouldPlay: false, 
          isLooping: true,
          volume: 1.0, // Maximum volume (100%)
        }
      );
      
      this.sound = sound;
      this.sirenLoaded = true;
      
      // Set volume to maximum and make it fixed
      await this.sound.setVolumeAsync(1.0);
      
      console.log('✅ Siren audio loaded successfully at maximum volume');
    } catch (error) {
      console.log('⚠️  Siren file not found, using vibration only');
      this.sirenLoaded = false;
    }
  }

  async startSiren() {
    try {
      if (this.sound && !this.isPlaying && this.sirenLoaded) {
        // Ensure maximum volume is set before playing
        await this.sound.setVolumeAsync(1.0);
        await this.sound.playAsync();
        this.isPlaying = true;
        console.log('🚨 Siren started at maximum volume');
      } else if (!this.sirenLoaded) {
        console.log('📳 No siren file - using vibration only');
      }
    } catch (error) {
      console.log('Error starting siren:', error);
    }
  }

  async stopSiren() {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.stopAsync();
        this.isPlaying = false;
        console.log('🛑 Siren stopped');
      }
    } catch (error) {
      console.log('Error stopping siren:', error);
    }
  }

  startVibration() {
    // Vibrate pattern: strong vibration every 2 seconds
    const vibratePattern = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };
    
    vibratePattern(); // Immediate vibration
    this.vibrationInterval = setInterval(vibratePattern, 2000);
    console.log('📳 Emergency vibration started');
  }

  stopVibration() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
      console.log('📳 Emergency vibration stopped');
    }
  }

  async startEmergency() {
    try {
      // Initialize audio if not already done
      await this.initialize();
      
      // Override system volume for emergency
      await this.overrideSystemVolume();
      
      // Start both siren and vibration
      await this.startSiren();
      this.startVibration();
      
      // Initial strong haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      console.log('🚨 Emergency mode activated with maximum volume');
    } catch (error) {
      console.log('Error starting emergency:', error);
    }
  }

  async overrideSystemVolume() {
    try {
      // Set audio mode to ignore system volume
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // Don't duck for other apps
        playThroughEarpieceAndroid: false,
        volume: 1.0, // Force maximum volume
      });
      
      // If siren is loaded, ensure it's at maximum volume
      if (this.sound && this.sirenLoaded) {
        await this.sound.setVolumeAsync(1.0);
      }
      
      console.log('🔊 System volume overridden for emergency');
    } catch (error) {
      console.log('Error overriding system volume:', error);
    }
  }

  async stopEmergency() {
    try {
      await this.stopSiren();
      this.stopVibration();
      console.log('🛑 Emergency mode deactivated');
    } catch (error) {
      console.log('Error stopping emergency:', error);
    }
  }

  async cleanup() {
    try {
      await this.stopEmergency();
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.log('Error cleaning up emergency service:', error);
    }
  }

  // Method to check if siren is available
  isSirenAvailable() {
    return this.sirenLoaded;
  }
}

export default new EmergencyService();
