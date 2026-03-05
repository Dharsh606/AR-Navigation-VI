/**
 * Emergency & Safety Module.
 * Voice trigger "Emergency help" → GPS to contact, call, SMS, siren, incident log.
 */

import { Linking } from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { voiceEngine } from "./voiceEngine";

// In production: replace with real emergency contact and backend API
const EMERGENCY_NUMBER = "112";
const FALLBACK_MESSAGE = "AR Nav VI user needs help. Location: ";

let emergencyContactPhone = null;
let incidentLog = [];
let trackingSub = null;
let trackingActive = false;
let alarmInterval = null;

export async function triggerEmergency() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    voiceEngine.confirmEmergency();

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const locationText = `${coords.latitude},${coords.longitude}`;
    const logEntry = {
      time: new Date().toISOString(),
      lat: coords.latitude,
      lon: coords.longitude,
      message: "Emergency triggered by user",
    };
    incidentLog.push(logEntry);

    // Send to backend (when available)
    await sendEmergencyToBackend(logEntry);

    // Optional: open phone dialer for emergency number
    const url = `tel:${EMERGENCY_NUMBER}`;
    Linking.canOpenURL(url).then((ok) => ok && Linking.openURL(url));
    sendSms(`Emergency at ${locationText}`);
    startAlarm();

    return { sent: true, coords, logEntry };
  } catch (e) {
    voiceEngine.speak("Emergency alert could not be sent. Please call emergency services.");
    return { sent: false, error: e.message };
  }
}

async function sendEmergencyToBackend(entry) {
  try {
    const base = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    await fetch(`${base}/api/emergency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (_) {
    // Offline or no backend
  }
}

export function setEmergencyContact(phone) {
  emergencyContactPhone = phone;
}

export function getIncidentLog() {
  return [...incidentLog];
}

export async function startLiveTracking() {
  if (trackingActive) return;
  trackingActive = true;
  voiceEngine.speak("Emergency tracking on. Sending your location continuously.");
  trackingSub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 5000 },
    async (loc) => {
      const entry = {
        time: new Date().toISOString(),
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        message: "Emergency live tracking",
      };
      incidentLog.push(entry);
      await sendEmergencyToBackend(entry);
    }
  );
}

export async function stopLiveTracking() {
  if (!trackingActive) return;
  try {
    trackingSub && (await trackingSub.remove());
  } catch (_) {}
  trackingSub = null;
  trackingActive = false;
  voiceEngine.speak("Emergency tracking stopped.");
  stopAlarm();
}

export const emergencyModule = {
  triggerEmergency,
  setEmergencyContact,
  getIncidentLog,
  startLiveTracking,
  stopLiveTracking,
};
export default emergencyModule;

async function sendSms(message) {
  try {
    const url = `sms:${emergencyContactPhone || ""}?body=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then((ok) => ok && Linking.openURL(url));
  } catch (_) {}
}

function startAlarm() {
  try {
    if (alarmInterval) return;
    voiceEngine.speak("Emergency alarm active.");
    alarmInterval = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 1200);
  } catch (_) {}
}

function stopAlarm() {
  try {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
    voiceEngine.speak("Alarm stopped.");
  } catch (_) {}
}
