/**
 * Voice Interaction Engine - Primary controller for blind-first interaction.
 * Handles TTS confirmations. Audio mode set for louder speaker output.
 */

import { Audio } from "expo-av";
import * as Speech from "expo-speech";

const TTS_OPTIONS = {
  rate: 0.88,
  pitch: 1,
  language: "en-US",
};

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
    Speech.speak(text, { ...TTS_OPTIONS, ...options, onDone: () => { isSpeaking = false; } });
  },

  stop() {
    Speech.stop();
    isSpeaking = false;
  },

  confirmAction(action) {
    this.speak(`Okay. ${action}`);
  },

  confirmNavigationStarted() {
    this.speak("Navigation started. Walk forward carefully. I will guide you.");
  },

  confirmScanStarted() {
    this.speak("Scanning surroundings. Point your phone ahead.");
  },

  confirmEmergency() {
    this.speak("Emergency mode activated. Sending your location and alerting contacts.");
  },

  announceObstacle(message, riskLevel = "medium") {
    this.speak(message, riskLevel === "high" ? { rate: 0.82 } : {});
  },

  announceDirection(instruction) {
    this.speak(instruction);
  },

  sayLocation(lat, lon) {
    this.speak(`Your location: ${lat.toFixed(4)}, ${lon.toFixed(4)}.`);
  },

  repeatLast() {
    if (lastSpoken) this.speak(lastSpoken);
    else this.speak("Say your command again. Say: Start navigation, Scan surroundings, Emergency help, or control devices: turn on living room light, turn off fan.");
  },

  /** Full welcome – app open or user says "Welcome" / "Hello" */
  welcome() {
    this.speak(
      "Welcome to A R Nav V I. Voice first mode. Turn up volume to hear me clearly. " +
      "Say: Start navigation, Scan surroundings, or Emergency help. " +
      "Control your home: turn on or off living room light, bedroom light, kitchen light, fan, or main door lock. " +
      "Say: What can I say, for all commands."
    );
  },

  /** Short welcome for "hello" / "start" */
  welcomeShort() {
    this.speak("A R Nav V I. Say Start navigation, Scan surroundings, Emergency help, or control your lights and fan by voice.");
  },

  /** List all voice commands – user says "Help" or "What can I say" */
  help() {
    this.speak(
      "You can say: Start navigation. Scan surroundings. Emergency help. Cancel SOS. Where am I. Read the sign. " +
      "Save home. Save work. Go home. Go to work. Open devices for Bluetooth dashboard. " +
      "Turn on or turn off: living room light, bedroom light, kitchen light, fan. Lock or unlock main door. " +
      "Say: Go back, to return. Say: Repeat, to hear the last message. Say: Stop, to cancel."
    );
  },
};

export default voiceEngine;
