/**
 * Voice Interaction Engine - Primary controller for blind-first interaction.
 * Handles TTS confirmations. Audio mode set for louder speaker output.
 */

import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let CURRENT_OPTIONS = { rate: 0.88, pitch: 1, language: "en-US" };

let isSpeaking = false;
let lastSpoken = null;

/**
 * Call once at app start so TTS plays through speaker and is not muted.
 */
export async function initAudioForSpeech() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
  } catch (_) {}
}

export const voiceEngine = {
  speak(text, options = {}) {
    if (isSpeaking) Speech.stop();
    isSpeaking = true;
    lastSpoken = text;
    Speech.speak(text, { ...CURRENT_OPTIONS, ...options, onDone: () => { isSpeaking = false; } });
  },

  stop() {
    Speech.stop();
    isSpeaking = false;
  },

  confirmAction(action) {
    this.speak(`${action}`);
  },

  confirmNavigationStarted() {
    this.speak("Navigation started.");
  },

  confirmScanStarted() {
    this.speak("Scanning surroundings.");
  },

  confirmEmergency() {
    this.speak("Emergency activated.");
  },

  announceObstacle(message, riskLevel = "medium") {
    this.speak(message, riskLevel === "high" ? { rate: 0.82 } : {});
  },

  announceDirection(instruction) {
    this.speak(instruction);
  },

  welcome() {
    this.speak("AR Navigation VI ready. Say: Start navigation, Scan surroundings, or Emergency help.");
  },

  help() {
    this.speak("Say: Start navigation, Scan surroundings, Emergency help, or Go back.");
  },

  setLanguage(langCode) {
    CURRENT_OPTIONS = { ...CURRENT_OPTIONS, language: langCode };
  },

  setRate(rate) {
    const r = Math.max(0.6, Math.min(rate, 1.2));
    CURRENT_OPTIONS = { ...CURRENT_OPTIONS, rate: r };
  },

  getLanguage() {
    return CURRENT_OPTIONS.language;
  },
};

export default voiceEngine;
