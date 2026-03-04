/**
 * Voice Listener - continuous speech recognition and command parsing.
 * Welcome, help, go back, and smart home (lights, fan, door) by voice.
 */

import { voiceEngine } from "./voiceEngine";
import { bluetoothManager } from "./bluetoothManager";
import { navigationEngine } from "./navigationEngine";
import { triggerEmergency, startLiveTracking, stopLiveTracking } from "./emergencyModule";
import { saveCurrentPlace, navigateToPlace } from "./savedPlaces";

let recognitionActive = false;
let onCommandCallback = null;

const COMMANDS = {
  welcome: ["welcome", "hello", "hi", "start", "intro", "hey"],
  help: ["what can i say", "commands", "help me", "voice commands", "help", "list commands"],
  start_navigation: ["start navigation", "begin navigation", "navigate", "start nav", "navigation"],
  scan_surroundings: ["scan surroundings", "scan", "open camera", "scan environment", "ar scan"],
  dashboard: ["open devices", "bluetooth dashboard", "devices", "smart home", "my devices", "dashboard"],
  emergency: ["emergency", "emergency help", "sos", "emergency assistance"],
  cancel_sos: ["cancel sos", "stop sos", "end emergency", "cancel emergency"],
  where_am_i: ["where am i", "my location", "location", "current position"],
  read_sign: ["read the sign", "read sign", "read text", "read board", "read notice"],
  save_home: ["save home", "set home", "save this as home"],
  save_work: ["save work", "set work", "save this as work"],
  goto_home: ["go home", "guide me to home", "navigate to home"],
  goto_work: ["go to work", "guide me to work", "navigate to work"],
  go_back: ["go back", "back", "exit", "close", "return"],
  stop: ["stop", "cancel"],
  repeat: ["repeat", "say again", "what did you say"],
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
    case "welcome":
      voiceEngine.welcomeShort();
      break;
    case "help":
      voiceEngine.help();
      break;
    case "start_navigation":
      voiceEngine.confirmAction("Starting navigation.");
      navigation?.navigate?.("AR");
      break;
    case "scan_surroundings":
      voiceEngine.confirmAction("Opening scan mode.");
      navigation?.navigate?.("Camera");
      break;
    case "dashboard":
      voiceEngine.confirmAction("Opening Bluetooth dashboard.");
      navigation?.navigate?.("Dashboard");
      break;
    case "emergency":
      triggerEmergency();
      startLiveTracking();
      break;
    case "cancel_sos":
      stopLiveTracking();
      break;
    case "where_am_i":
      navigationEngine.getCurrentPosition().then((c) => {
        if (c) voiceEngine.sayLocation(c.latitude, c.longitude);
        else voiceEngine.speak("Location not available.");
      });
      break;
    case "read_sign":
      navigation?.navigate?.("Camera", { readSignOnce: true });
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
    case "go_back":
      voiceEngine.speak("Going back.");
      navigation?.goBack?.();
      break;
    case "stop":
      voiceEngine.speak("Stopped.");
      break;
    case "repeat":
      voiceEngine.repeatLast();
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
