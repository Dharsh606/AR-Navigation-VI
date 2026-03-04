import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { voiceEngine } from "../services/voiceEngine";
import { detectionAdapter } from "../services/detectionAdapter";
import { obstacleVibration } from "../services/hapticAlerts";
import { ocrAdapter } from "../services/ocrAdapter";

const { width: SW, height: SH } = Dimensions.get("window");
const SCAN_INTERVAL_MS = 2200;
const CORNER = 48;
const BBOX_GLOW = "rgba(34, 211, 238, 0.9)";
const BBOX_FILL = "rgba(34, 211, 238, 0.08)";

export default function CameraScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState([]);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [analyzed, setAnalyzed] = useState(null);
  const intervalRef = useRef(null);
  const cameraRef = useRef(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const lastAnnouncementRef = useRef("");
  const isCapturingRef = useRef(false);
  lastAnnouncementRef.current = lastAnnouncement;
  isCapturingRef.current = isCapturing;

  const runDetection = useCallback(async () => {
    if (!cameraRef.current || isCapturingRef.current) return;
    try {
      setIsCapturing(true);
      let frame = {};
      if (typeof cameraRef.current?.takePictureAsync === "function") {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
        });
        if (photo?.uri) frame = { uri: photo.uri };
      }
      const results = await detectionAdapter.detectObjects(Object.keys(frame).length ? frame : null);
      setDetections(results);
      const analysis = detectionAdapter.analyzeDetections(results);
      setAnalyzed(analysis);
      if (analysis && analysis.level !== "low") {
        if (analysis.message !== lastAnnouncementRef.current) {
          lastAnnouncementRef.current = analysis.message;
          setLastAnnouncement(analysis.message);
          voiceEngine.announceObstacle(analysis.message, analysis.level);
          obstacleVibration(analysis.direction, analysis.level);
        }
      } else {
        lastAnnouncementRef.current = "";
        setLastAnnouncement("");
      }
    } catch (e) {
      setDetections([]);
      setAnalyzed(null);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  useEffect(() => {
    voiceEngine.confirmScanStarted();
    const id = setInterval(runDetection, SCAN_INTERVAL_MS);
    intervalRef.current = id;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, useNativeDriver: true, duration: 2000 }),
        Animated.timing(scanAnim, { toValue: 0, useNativeDriver: true, duration: 2000 }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(intervalRef.current);
      loop.stop();
      voiceEngine.stop();
    };
  }, [runDetection]);

  useEffect(() => {
    const doRead = async () => {
      if (!cameraRef.current) return;
      try {
        setIsCapturing(true);
        let frame = {};
        if (typeof cameraRef.current?.takePictureAsync === "function") {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.4,
            skipProcessing: true,
          });
          if (photo?.uri) frame = { uri: photo.uri };
        }
        const text = await ocrAdapter.readTextFromFrame(frame);
        await ocrAdapter.announceText(text);
      } finally {
        setIsCapturing(false);
      }
    };
    if (route?.params?.readSignOnce) {
      doRead();
      navigation.setParams({ readSignOnce: false });
    }
  }, [route?.params?.readSignOnce]);

  const scanLineY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SH] });

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.msg}>Requesting camera access...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.msg}>Camera is required for obstacle detection.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* AR overlay: corner brackets */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
      </View>

      {/* Bounding boxes from camera detection */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {detections.map((d, i) => (
          <View
            key={i}
            style={[
              styles.bbox,
              {
                left: d.bbox[0] * SW,
                top: d.bbox[1] * SH,
                width: d.bbox[2] * SW,
                height: d.bbox[3] * SH,
              },
            ]}
          >
            <View style={styles.bboxInner} />
            <Text style={styles.bboxLabel}>{d.label}</Text>
          </View>
        ))}
      </View>

      {/* Top bar: LIVE + status */}
      <View style={styles.topBar}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.statusText}>
          {isCapturing ? "Analyzing frame…" : detections.length > 0 ? `${detections.length} obstacle(s)` : "Camera active"}
        </Text>
      </View>

      {/* Obstacle alert card */}
      {analyzed && analyzed.level !== "low" && (
        <View style={[styles.alertCard, analyzed.level === "high" && styles.alertCardHigh]}>
          <Text style={[styles.alertTitle, { color: analyzed.level === "high" ? "#f87171" : "#facc15" }]}>
            {analyzed.level === "high" ? "⚠ High risk" : "Caution"}
          </Text>
          <Text style={styles.alertMessage}>{analyzed.message}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          Obstacle detection uses your camera. Voice + haptics will alert you.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            voiceEngine.speak("Closing scan.");
            navigation.goBack();
          }}
        >
          <Text style={styles.backBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  msg: {
    color: "#22d3ee",
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  permBtn: {
    backgroundColor: "#22d3ee",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "center",
  },
  permBtnText: {
    color: "#0a0a0f",
    fontWeight: "bold",
  },
  overlay: {
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "rgba(34, 211, 238, 0.85)",
    borderWidth: 3,
  },
  cornerTL: { top: 60, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 60, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 140, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 140, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: "rgba(34, 211, 238, 0.6)",
    ...Platform.select({ ios: { shadowColor: "#22d3ee", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 }, android: {} }),
  },
  bbox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: BBOX_GLOW,
    backgroundColor: BBOX_FILL,
    borderRadius: 6,
    ...Platform.select({ ios: { shadowColor: "#22d3ee", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6 }, android: { elevation: 4 } }),
  },
  bboxInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.4)",
  },
  bboxLabel: {
    position: "absolute",
    bottom: -22,
    left: 0,
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(10, 10, 15, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 44,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 10, 15, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.6)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f87171",
    marginRight: 6,
  },
  liveText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "500",
    backgroundColor: "rgba(10, 10, 15, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 160,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.7)",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 8 } }),
  },
  alertCardHigh: {
    borderColor: "rgba(248, 113, 113, 0.9)",
    backgroundColor: "rgba(30, 15, 15, 0.95)",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  alertMessage: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 10, 15, 0.92)",
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 65, 85, 0.8)",
  },
  footerHint: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  backBtn: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#22d3ee",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
  },
  backBtnText: {
    color: "#22d3ee",
    fontWeight: "700",
    fontSize: 16,
  },
});
