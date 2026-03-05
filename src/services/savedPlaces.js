import * as Location from "expo-location";
import { voiceEngine } from "./voiceEngine";

const places = {};

export async function saveCurrentPlace(name) {
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  places[name.toLowerCase()] = { lat: loc.coords.latitude, lon: loc.coords.longitude };
  voiceEngine.speak(`${name} saved.`);
  return places[name.toLowerCase()];
}

export function getPlace(name) {
  return places[name.toLowerCase()] || null;
}

export function listPlaces() {
  return Object.keys(places);
}

export async function navigateToPlace(name, navigation) {
  const p = getPlace(name);
  if (!p) {
    voiceEngine.speak(`${name} not saved.`);
    return false;
  }
  voiceEngine.speak(`Guiding to ${name}.`);
  navigation?.navigate?.("AR");
  return true;
}

export const savedPlaces = {
  saveCurrentPlace,
  getPlace,
  listPlaces,
  navigateToPlace,
};
export default savedPlaces;
