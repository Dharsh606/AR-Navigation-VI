/**
 * Intelligent Risk Analysis System.
 * Computes risk score from distance, object type, and movement (academic depth).
 */

const OBJECT_RISK_WEIGHT = {
  person: 0.8,
  car: 1.0,
  bicycle: 0.9,
  motorcycle: 0.95,
  stairs: 0.9,
  pole: 0.5,
  door: 0.4,
  wall: 0.7,
  traffic_light: 0.6,
  crosswalk: 0.3,
  unknown: 0.6,
};

const DISTANCE_THRESHOLDS = { near: 2, medium: 5, far: 10 }; // meters (or units)

/**
 * @param {Object} detection - { label, distance, speed?, direction? }
 * @returns {{ score: number, level: 'low'|'medium'|'high'|'critical', message: string }}
 */
export function computeRisk(detection) {
  const { label = "unknown", distance = 5, speed = 0, direction } = detection;
  const typeWeight = OBJECT_RISK_WEIGHT[label.toLowerCase().replace(/\s/g, "_")] ?? OBJECT_RISK_WEIGHT.unknown;

  let distanceFactor = 1;
  if (distance <= DISTANCE_THRESHOLDS.near) distanceFactor = 1.5;
  else if (distance <= DISTANCE_THRESHOLDS.medium) distanceFactor = 1;
  else if (distance <= DISTANCE_THRESHOLDS.far) distanceFactor = 0.6;
  else distanceFactor = 0.3;

  const movementFactor = 1 + Math.min(speed * 0.2, 0.5);
  const score = Math.min(1, typeWeight * distanceFactor * movementFactor);

  let level = "low";
  if (score >= 0.9) level = "critical";
  else if (score >= 0.7) level = "high";
  else if (score >= 0.4) level = "medium";

  const distLabel = distance <= DISTANCE_THRESHOLDS.near ? "very close" : distance <= DISTANCE_THRESHOLDS.medium ? "ahead" : "in the distance";
  const dir = direction ? ` from the ${direction}` : "";
  const movement = speed > 0.5 ? " approaching" : " static";
  const message =
    level === "critical"
      ? `Critical risk. ${label}${movement}${dir}. ${distLabel}. Stop immediately.`
      : level === "high"
        ? `High risk. ${label}${movement}${dir}. ${distLabel}. Slow down.`
        : level === "medium"
          ? `Caution. ${label}${dir}. ${distLabel}.`
          : `Low risk. ${label}${dir}. ${distLabel}.`;

  return { score, level, message };
}

export const riskAnalyzer = { computeRisk };
export default riskAnalyzer;
