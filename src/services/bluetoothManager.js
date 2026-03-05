/**
 * Bluetooth Smart Integration – control home appliances by voice.
 * Simulated devices: lights, fan, plug, door lock.
 * Real BLE: use react-native-ble-plx in a dev build and replace device control below.
 */

import { voiceEngine } from "./voiceEngine";

const DEVICES = [
  { id: "living_room_light", name: "Living room light", type: "bulb", on: false },
  { id: "bedroom_light", name: "Bedroom light", type: "bulb", on: false },
  { id: "kitchen_light", name: "Kitchen light", type: "bulb", on: false },
  { id: "fan", name: "Fan", type: "fan", on: false },
  { id: "plug", name: "Plug", type: "plug", on: false },
  { id: "main_door", name: "Main door", type: "lock", locked: true },
];

function findDevice(query) {
  const q = (query || "").toLowerCase().trim();
  const byId = q.replace(/\s/g, "_");
  return DEVICES.find(
    (d) =>
      d.id === byId ||
      d.id === q ||
      d.name.toLowerCase().includes(q) ||
      q.includes(d.name.toLowerCase().split(" ")[0])
  );
}

function findDevicesByType(type) {
  return DEVICES.filter((d) => d.type === type);
}

export async function scanDevices() {
  return DEVICES;
}

export function getDevices() {
  return DEVICES;
}

export async function turnOnDevice(deviceIdOrName) {
  const allMatch = /^(all\s+)?(lights?|lights)$/.test(deviceIdOrName.toLowerCase());
  if (allMatch) {
    const bulbs = findDevicesByType("bulb");
    bulbs.forEach((d) => (d.on = true));
    voiceEngine.speak(`All lights are on. ${bulbs.length} lights.`);
    return true;
  }

  const device = findDevice(deviceIdOrName);
  if (device && (device.type === "bulb" || device.type === "fan" || device.type === "plug")) {
    device.on = true;
    voiceEngine.speak(`${device.name} is on.`);
    return true;
  }
  voiceEngine.speak("Device not found. Say living room light, bedroom light, kitchen light, or fan.");
  return false;
}

export async function turnOffDevice(deviceIdOrName) {
  const allMatch = /^(all\s+)?(lights?|lights)$/.test(deviceIdOrName.toLowerCase());
  if (allMatch) {
    const bulbs = findDevicesByType("bulb");
    bulbs.forEach((d) => (d.on = false));
    voiceEngine.speak("All lights are off.");
    return true;
  }

  const device = findDevice(deviceIdOrName);
  if (device && (device.type === "bulb" || device.type === "fan" || device.type === "plug")) {
    device.on = false;
    voiceEngine.speak(`${device.name} is off.`);
    return true;
  }
  voiceEngine.speak("Device not found. Say living room light, bedroom light, kitchen light, or fan.");
  return false;
}

export async function setLock(deviceIdOrName, locked) {
  const device = findDevice(deviceIdOrName) || findDevice("main door");
  if (device && device.type === "lock") {
    device.locked = locked;
    voiceEngine.speak(locked ? "Main door locked." : "Main door unlocked.");
    return true;
  }
  voiceEngine.speak("Lock not found.");
  return false;
}

/** Parse voice command into action + target (e.g. "turn on fan" -> { action: "on", target: "fan" }) */
export function parseSmartHomeCommand(transcript) {
  const t = (transcript || "").toLowerCase().trim();

  // Turn on / switch on / open
  if (/\b(turn on|switch on|open|enable)\s+(.+)/.test(t)) {
    const match = t.match(/\b(turn on|switch on|open|enable)\s+(.+)/);
    return { action: "on", target: match[2].trim() };
  }
  // Turn off / switch off / close
  if (/\b(turn off|switch off|close|disable)\s+(.+)/.test(t)) {
    const match = t.match(/\b(turn off|switch off|close|disable)\s+(.+)/);
    return { action: "off", target: match[2].trim() };
  }
  // Lights
  if (/\b(all\s+)?lights?\s+on\b/.test(t)) return { action: "on", target: "all lights" };
  if (/\b(all\s+)?lights?\s+off\b/.test(t)) return { action: "off", target: "all lights" };
  // Door
  if (/\block\s+(?:the\s+)?(?:main\s+)?door\b/.test(t)) return { action: "lock", target: "main door" };
  if (/\bunlock\s+(?:the\s+)?(?:main\s+)?door\b/.test(t)) return { action: "unlock", target: "main door" };

  return null;
}

export const bluetoothManager = {
  scanDevices,
  getDevices,
  turnOnDevice,
  turnOffDevice,
  setLock,
  parseSmartHomeCommand,
};
export default bluetoothManager;
