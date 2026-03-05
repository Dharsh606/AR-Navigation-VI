/**
 * AR Detection Adapter - camera-based obstacle detection.
 * Uses camera frame (photo URI) when provided; runs detection on each capture.
 * Plug in TensorFlow.js / COCO-SSD later by replacing runDetectionOnFrame.
 */

import { computeRisk } from "./riskAnalyzer";

const SIMULATED_LABELS = [
  "person",
  "car",
  "vehicle",
  "bicycle",
  "motorcycle",
  "pole",
  "stairs",
  "door",
  "wall",
  "traffic_light",
  "crosswalk",
];

/**
 * Run detection on a camera frame.
 * @param {Object} frame - { uri: string } from camera.takePictureAsync()
 * @returns {Promise<Array<{ label, bbox, distance, direction }>>}
 */
async function runDetectionOnFrame(frame) {
  // Frame from camera triggers detection. Replace with TF.js/COCO-SSD on frame.uri when ready.
  const count = Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2;
  const results = [];
  for (let i = 0; i < count; i++) {
    const label = SIMULATED_LABELS[Math.floor(Math.random() * SIMULATED_LABELS.length)];
    const [x, y, w, h] = [
      Math.random() * 0.6 + 0.2,
      Math.random() * 0.6 + 0.2,
      0.1 + Math.random() * 0.2,
      0.1 + Math.random() * 0.2,
    ];
    const direction = x < 0.4 ? "left" : x > 0.6 ? "right" : "center";
    const distance = 2 + Math.random() * 6;
    results.push({ label, bbox: [x, y, w, h], distance, direction });
  }
  return results;
}

/**
 * Detect objects from camera frame (or null for non-camera fallback).
 * @param {Object} frame - { uri } from CameraView.takePictureAsync()
 */
export async function detectObjects(frame) {
  return runDetectionOnFrame(frame || {});
}

/**
 * Run risk analysis on detections and return highest risk + message.
 */
export function analyzeDetections(detections) {
  if (!detections?.length) return null;
  let top = null;
  for (const d of detections) {
    const result = computeRisk({
      label: d.label,
      distance: d.distance,
      direction: d.direction,
    });
    if (!top || result.score > top.score) top = { ...result, ...d };
  }
  return top;
}

export function hasCrosswalk(detections) {
  return !!detections?.some((d) => (d.label || "").toLowerCase() === "crosswalk");
}

export const detectionAdapter = {
  detectObjects,
  analyzeDetections,
  hasCrosswalk,
};
export default detectionAdapter;
