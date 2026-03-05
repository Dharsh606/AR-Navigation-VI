/**
 * Obstacle detection warning – vibration patterns by direction and risk.
 * Strong, clear patterns so the user feels direction (left/right/center) and urgency.
 */

import { Vibration } from "react-native";
import * as Haptics from "expo-haptics";

/** High risk: long, repeated pattern */
const HIGH_RISK_PATTERN = [0, 500, 200, 500, 200, 500];
/** Medium risk: double pulse */
const MEDIUM_RISK_PATTERN = [0, 300, 150, 300];
/** Left: short pulse, pause, long pulse (L) */
const LEFT_PATTERN = [0, 150, 100, 400];
/** Right: long pulse, pause, short pulse (R) */
const RIGHT_PATTERN = [0, 400, 100, 150];
/** Center: two equal pulses */
const CENTER_PATTERN = [0, 350, 100, 350];

export function obstacleVibration(direction, riskLevel) {
  const isHigh = riskLevel === "high";
  let pattern;

  if (direction === "left") {
    pattern = isHigh ? [0, 400, 150, 400, 150, 400] : LEFT_PATTERN;
  } else if (direction === "right") {
    pattern = isHigh ? [0, 400, 150, 400, 150, 400] : RIGHT_PATTERN;
  } else {
    pattern = isHigh ? HIGH_RISK_PATTERN : CENTER_PATTERN;
  }

  Vibration.vibrate(pattern);
  Haptics.notificationAsync(
    isHigh ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Warning
  );
}

export default obstacleVibration;
