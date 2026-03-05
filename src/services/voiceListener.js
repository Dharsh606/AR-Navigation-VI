/**
 * Voice Listener - continuous speech recognition and command parsing.
 * Welcome, help, go back, and smart home (lights, fan, door) by voice.
 */

import ve from "./voiceEngine";
import { bluetoothManager } from "./bluetoothManager";
import { navigationEngine } from "./navigationEngine";
import { triggerEmergency, startLiveTracking, stopLiveTracking } from "./emergencyModule";
import { saveCurrentPlace, navigateToPlace } from "./savedPlaces";
import { batteryService } from "./batteryService";
import { speechRecognitionService } from "./speechRecognitionService";
import advancedNavigation from "./advancedNavigation";
import smartHomeManager from "./smartHomeManager";
import emergencyManager from "./emergencyManager";
import accessibilityManager from "./accessibilityManager";

let recognitionActive = false;
let onCommandCallback = null;

const COMMANDS = {
  welcome: ["welcome", "hello", "hi", "start"],
  help: ["what can i say", "commands", "help"],
  start_navigation: ["start navigation", "navigate", "navigation"],
  advanced_navigation: ["advanced navigation", "turn by turn", "detailed navigation"],
  scan_surroundings: ["scan surroundings", "scan", "open camera"],
  dashboard: ["open devices", "bluetooth dashboard", "devices"],
  emergency: ["emergency", "emergency help", "sos", "help me"],
  cancel_sos: ["cancel sos", "stop sos", "end emergency"],
  where_am_i: ["where am i", "my location", "location"],
  read_sign: ["read the sign", "read sign", "read text"],
  battery_status: ["battery status", "battery level"],
  stop_navigation: ["stop navigation", "end navigation", "cancel navigation"],
  save_home: ["save home", "set home"],
  save_work: ["save work", "set work"],
  goto_home: ["go home", "navigate to home"],
  goto_work: ["go to work", "navigate to work"],
  go_back: ["go back", "back", "exit", "close", "return"],
  stop: ["stop", "cancel"],
  repeat: ["repeat", "say again"],
  
  // Smart Home Commands
  light_on: ["turn on light", "lights on", "switch on light"],
  light_off: ["turn off light", "lights off", "switch off light"],
  fan_on: ["turn on fan", "fan on"],
  fan_off: ["turn off fan", "fan off"],
  door_lock: ["lock door", "door lock"],
  door_unlock: ["unlock door", "door unlock"],
  
  // Accessibility Commands
  high_contrast: ["high contrast", "contrast mode"],
  large_text: ["large text", "big text"],
  accessibility_guide: ["accessibility guide", "help guide"],
  
  // Device Control
  device_status: ["device status", "check devices"],
  energy_usage: ["energy usage", "power usage"],
  
  // Emergency Specific
  medical_emergency: ["medical emergency", "need doctor"],
  police_emergency: ["police emergency", "need police"],
  fire_emergency: ["fire emergency", "fire"],
  lost_emergency: ["im lost", "lost help"],
};

function normalizeTranscript(t) {
  return (t || "").toLowerCase().trim();
}

function matchCommand(transcript) {
  const t = normalizeTranscript(transcript);
  for (const [cmd, phrases] of Object.entries(COMMANDS)) {
    if (phrases.some((p) => t.includes(p))) return cmd;
  }
  const smartHome = bluetoothManager.parseSmartHomeCommand(transcript);
  if (smartHome) return { type: "smart_home", ...smartHome };
  return null;
}

/**
 * Handle raw transcript: welcome, help, navigation, emergency, smart home, go back.
 */
export function handleTranscript(transcript, navigation) {
  if (!transcript) return;
  const cmd = matchCommand(transcript);
  if (!cmd) return;

  if (typeof cmd === "object" && cmd.type === "smart_home") {
    if (cmd.action === "on") bluetoothManager.turnOnDevice(cmd.target);
    else if (cmd.action === "off") bluetoothManager.turnOffDevice(cmd.target);
    else if (cmd.action === "lock") bluetoothManager.setLock(cmd.target, true);
    else if (cmd.action === "unlock") bluetoothManager.setLock(cmd.target, false);
    return;
  }

  switch (cmd) {
    case "wake":
      ve.welcomeShort();
      break;
    case "welcome":
      ve.welcomeShort();
      break;
    case "help":
      ve.help();
      break;
    case "start_navigation":
      ve.confirmAction("Starting navigation.");
      navigation?.navigate?.("AR");
      break;
    case "advanced_navigation":
      ve.confirmAction("Starting advanced navigation.");
      advancedNavigation.startNavigation("home"); // Default destination
      break;
    case "scan_surroundings":
      ve.confirmAction("Opening scan mode.");
      navigation?.navigate?.("Camera");
      break;
    case "dashboard":
      ve.confirmAction("Opening Bluetooth dashboard.");
      navigation?.navigate?.("Dashboard");
      break;
    case "emergency":
      emergencyManager.triggerEmergency("general");
      break;
    case "cancel_sos":
      emergencyManager.cancelEmergency();
      break;
    case "medical_emergency":
      emergencyManager.triggerEmergency("medical");
      break;
    case "police_emergency":
      emergencyManager.triggerEmergency("police");
      break;
    case "fire_emergency":
      emergencyManager.triggerEmergency("fire");
      break;
    case "lost_emergency":
      emergencyManager.triggerEmergency("lost");
      break;
    case "light_on":
      smartHomeManager.controlDevice("living room light", "on");
      break;
    case "light_off":
      smartHomeManager.controlDevice("living room light", "off");
      break;
    case "fan_on":
      smartHomeManager.controlDevice("ceiling fan", "on");
      break;
    case "fan_off":
      smartHomeManager.controlDevice("ceiling fan", "off");
      break;
    case "door_lock":
      smartHomeManager.controlDevice("main door", "lock");
      break;
    case "door_unlock":
      smartHomeManager.controlDevice("main door", "unlock");
      break;
    case "device_status":
      smartHomeManager.getAllDevicesStatus();
      break;
    case "energy_usage":
      smartHomeManager.getEnergyUsage();
      break;
    case "high_contrast":
      accessibilityManager.toggleHighContrast();
      break;
    case "large_text":
      accessibilityManager.toggleLargeText();
      break;
    case "accessibility_guide":
      accessibilityManager.announceAccessibilityGuide();
      break;
    case "where_am_i":
      navigationEngine.getCurrentPosition().then((c) => {
        if (c) ve.sayLocation(c.latitude, c.longitude);
        else ve.speak("Location not available.");
      });
      break;
    case "battery_status":
      batteryService.getStatus().then((info) => {
        if (info?.level != null) ve.speak(`Battery ${Math.round(info.level * 100)} percent.`);
        else ve.speak("Battery status not available.");
      });
      break;
    case "read_sign":
      navigation?.navigate?.("Camera", { readSignOnce: true });
      break;
    case "stop_navigation":
      ve.speak("Stopping navigation.");
      navigation?.goBack?.();
      break;
    case "set_lang_en":
      ve.setLanguage("en-US");
      speechRecognitionService.updateLanguage("en-US");
      break;
    case "set_lang_hi":
      ve.setLanguage("hi-IN");
      speechRecognitionService.updateLanguage("hi-IN");
      break;
    case "set_lang_ta":
      ve.setLanguage("ta-IN");
      speechRecognitionService.updateLanguage("ta-IN");
      break;
    case "set_lang_te":
      ve.setLanguage("te-IN");
      speechRecognitionService.updateLanguage("te-IN");
      break;
    case "set_lang_kn":
      ve.setLanguage("kn-IN");
      speechRecognitionService.updateLanguage("kn-IN");
      break;
    case "set_lang_ml":
      ve.setLanguage("ml-IN");
      speechRecognitionService.updateLanguage("ml-IN");
      break;
    case "speak_slower":
      ve.setRate(0.8);
      break;
    case "speak_faster":
      ve.setRate(1.05);
      break;
    case "save_home":
      saveCurrentPlace("Home");
      break;
    case "save_work":
      saveCurrentPlace("Work");
      break;
    case "goto_home":
      navigateToPlace("Home", navigation);
      break;
    case "goto_work":
      navigateToPlace("Work", navigation);
      break;
    case "open_analytics":
      navigation?.navigate?.("Analytics");
      break;
    case "go_back":
      ve.speak("Going back.");
      navigation?.goBack?.();
      break;
    case "stop":
      ve.speak("Stopped.");
      break;
    case "repeat":
      ve.repeatLast();
      break;
    default:
      break;
  }
  onCommandCallback?.(cmd, transcript);
}

export function setOnCommandCallback(fn) {
  onCommandCallback = fn;
}

export function isListening() {
  return recognitionActive;
}

export function setListening(active) {
  recognitionActive = active;
}

export const voiceListener = {
  handleTranscript,
  setOnCommandCallback,
  isListening,
  setListening,
  COMMANDS,
};
export default voiceListener;
