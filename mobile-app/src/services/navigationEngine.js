/**
 * Smart Navigation & Voice Guidance.
 * GPS tracking, turn-by-turn instructions, distance countdown (real routing can be wired later).
 */

import * as Location from "expo-location";
import { voiceEngine } from "./voiceEngine";

let watchSubscription = null;
let lastCoords = null;

export const navigationEngine = {
  async getCurrentPosition() {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lastCoords = loc.coords;
      return loc.coords;
    } catch (e) {
      return lastCoords;
    }
  },

  startWatching(onUpdate) {
    if (watchSubscription) return;
    watchSubscription = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
      (loc) => {
        lastCoords = loc.coords;
        onUpdate?.(loc.coords);
      }
    );
    return watchSubscription;
  },

  stopWatching() {
    if (watchSubscription) {
      watchSubscription.then((sub) => sub.remove());
      watchSubscription = null;
    }
  },

  /** Voice: turn-by-turn style (simplified; can integrate Maps API later) */
  speakTurnByTurn(instruction) {
    voiceEngine.announceDirection(instruction);
  },

  speakDistanceToNextTurn(meters) {
    if (meters <= 0) voiceEngine.speak("You have arrived.");
    else if (meters < 5) voiceEngine.speak("Turn soon.");
    else voiceEngine.speak(`In about ${Math.round(meters)} meters.`);
  },

  speakRerouting() {
    voiceEngine.speak("Rerouting. Please continue forward until instructed.");
  },
};

export default navigationEngine;
