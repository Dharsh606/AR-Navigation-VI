import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { Camera } from "expo-camera";
import { voiceEngine } from "../services/voiceEngine";
import { navigationEngine } from "../services/navigationEngine";
import { detectionAdapter } from "../services/detectionAdapter";
import { obstacleVibration } from "../services/hapticAlerts";
import { settingsService } from "../services/settingsService";
import obstacleDetector from "../services/obstacleDetector";
import advancedNavigation from "../services/advancedNavigation";
import smartHomeManager from "../services/smartHomeManager";
import emergencyManager from "../services/emergencyManager";
import accessibilityManager from "../services/accessibilityManager";

const NAV_DIRECTION_INTERVAL_MS = settingsService.navDirectionIntervalMs();
const OBSTACLE_CHECK_INTERVAL_MS = settingsService.obstacleCheckIntervalMs();

export default function ARScreen({ navigation }) {
  const [lastObstacle, setLastObstacle] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [smartHomeStatus, setSmartHomeStatus] = useState(null);
  
  const cameraRef = useRef(null);
  const directionInterval = useRef(null);
  const obstacleInterval = useRef(null);
  const crosswalkAnnouncedRef = useRef(false);
  const emergencyTimerRef = useRef(null);

  const speakDirection = useCallback(() => {
    const directions = [
      "Walk straight.",
      "Turn slightly left.",
      "Continue forward.",
      "Turn right in 5 meters.",
    ];
    const msg = directions[Math.floor(Math.random() * directions.length)];
    voiceEngine.announceDirection(msg);
  }, []);

  const checkObstacles = useCallback(async () => {
    try {
      // Use enhanced obstacle detection
      const obstacles = await obstacleDetector.detectObstacles(cameraRef.current);
      
      if (obstacles.length > 0) {
        const highPriorityObstacles = obstacles.filter(o => o.priority === 'high');
        const mediumPriorityObstacles = obstacles.filter(o => o.priority === 'medium');
        
        if (highPriorityObstacles.length > 0) {
          const obstacle = highPriorityObstacles[0];
          setLastObstacle(obstacle);
          const alert = obstacleDetector.generateVoiceAlert([obstacle]);
          voiceEngine.announceObstacle(alert, 'high');
          obstacleVibration(obstacle.direction || "center", "high");
        } else if (mediumPriorityObstacles.length > 0) {
          const obstacle = mediumPriorityObstacles[0];
          setLastObstacle(obstacle);
          const alert = obstacleDetector.generateVoiceAlert([obstacle]);
          voiceEngine.announceObstacle(alert, 'medium');
          obstacleVibration(obstacle.direction || "center", "medium");
        }
      } else {
        setLastObstacle(null);
      }
      
      // Check for crosswalks (legacy support)
      const detections = await detectionAdapter.detectObjects(null);
      if (detectionAdapter.hasCrosswalk(detections)) {
        if (!crosswalkAnnouncedRef.current) {
          crosswalkAnnouncedRef.current = true;
          voiceEngine.speak("Crosswalk detected ahead. Be careful.");
          obstacleVibration("center", "medium");
        }
      } else {
        crosswalkAnnouncedRef.current = false;
      }
    } catch (error) {
      console.error('Obstacle detection error:', error);
    }
  }, []);

  // Enhanced AR Features
  const startNavigation = useCallback(async (destination) => {
    try {
      setIsNavigating(true);
      await advancedNavigation.startNavigation(destination);
      voiceEngine.speak('Advanced navigation started with turn-by-turn directions');
    } catch (error) {
      voiceEngine.speak('Navigation failed to start');
      console.error('Navigation error:', error);
    }
  }, []);

  const triggerEmergency = useCallback(async () => {
    try {
      setEmergencyMode(true);
      await emergencyManager.triggerEmergency('general');
      
      // Start emergency timer
      emergencyTimerRef.current = setTimeout(() => {
        setEmergencyMode(false);
      }, 30000); // Auto-cancel after 30 seconds
      
    } catch (error) {
      voiceEngine.speak('Emergency system failed');
      console.error('Emergency error:', error);
    }
  }, []);

  const controlSmartHome = useCallback(async (deviceName, action) => {
    try {
      const success = await smartHomeManager.controlDevice(deviceName, action);
      if (success) {
        const status = await smartHomeManager.getDeviceStatus(deviceName);
        setSmartHomeStatus(status);
      }
    } catch (error) {
      voiceEngine.speak('Smart home control failed');
      console.error('Smart home error:', error);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    
    if (status === 'granted') {
      voiceEngine.speak('Camera access granted for obstacle detection');
      // Initialize obstacle detector
      await obstacleDetector.initialize();
    } else {
      voiceEngine.speak('Camera access denied. Obstacle detection may not work properly.');
    }
  }, []);

  useEffect(() => {
    requestCameraPermission();
    voiceEngine.confirmNavigationStarted();
    navigationEngine.startWatching();

    directionInterval.current = setInterval(speakDirection, NAV_DIRECTION_INTERVAL_MS);
    obstacleInterval.current = setInterval(checkObstacles, OBSTACLE_CHECK_INTERVAL_MS);

    return () => {
      if (directionInterval.current) clearInterval(directionInterval.current);
      if (obstacleInterval.current) clearInterval(obstacleInterval.current);
      if (emergencyTimerRef.current) clearTimeout(emergencyTimerRef.current);
      navigationEngine.stopWatching();
      voiceEngine.stop();
    };
  }, [speakDirection, checkObstacles, requestCameraPermission]);

  return (
    <View style={styles.container}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>NAV ACTIVE</Text>
      </View>
      <Text style={styles.title}>Live Navigation</Text>
      <Text style={styles.subtitle}>
        Voice guidance and obstacle alerts are on. Walk carefully.
      </Text>
      {lastObstacle && (
        <View style={[styles.alert, lastObstacle.level === "high" && styles.alertHigh]}>
          <Text style={[styles.alertLabel, lastObstacle.level === "high" && styles.alertLabelHigh]}>
            {lastObstacle.level === "high" ? "⚠ High risk" : "Caution"}
          </Text>
          <Text style={styles.alertText}>{lastObstacle.message}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          voiceEngine.speak("Stopping navigation.");
          navigation.goBack();
        }}
      >
        <Text style={styles.backBtnText}>Stop navigation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050508",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 44,
    alignSelf: "center",
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.5)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22d3ee",
    marginRight: 8,
  },
  liveText: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    color: "#22d3ee",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 28,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  alert: {
    backgroundColor: "rgba(30, 25, 15, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.6)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    width: "100%",
    maxWidth: 340,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  alertHigh: {
    backgroundColor: "rgba(30, 15, 15, 0.95)",
    borderColor: "rgba(248, 113, 113, 0.8)",
  },
  alertLabel: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  alertText: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20,
  },
  alertLabelHigh: {
    color: "#f87171",
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#22d3ee",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    ...Platform.select({
      ios: { shadowColor: "#22d3ee", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  backBtnText: {
    color: "#22d3ee",
    fontWeight: "700",
    fontSize: 16,
  },
});
