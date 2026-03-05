import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { voiceEngine } from "../services/voiceEngine";
import { navigationEngine } from "../services/navigationEngine";
import { detectionAdapter } from "../services/detectionAdapter";
import { obstacleVibration } from "../services/hapticAlerts";
import { settingsService } from "../services/settingsService";

const { width, height } = Dimensions.get("window");

// Modern aesthetic color palette
const COLORS = {
  background: "#0F0F1E",
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#EC4899",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#1A1B3A",
  card: "#252641",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
};

const NAV_DIRECTION_INTERVAL_MS = settingsService.navDirectionIntervalMs();
const OBSTACLE_CHECK_INTERVAL_MS = settingsService.obstacleCheckIntervalMs();

export default function ARScreen({ navigation }) {
  const [detections, setDetections] = useState([]);
  const [analyzed, setAnalyzed] = useState(null);
  const [currentDirection, setCurrentDirection] = useState("North");
  const [isNavigating, setIsNavigating] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastObstacle, setLastObstacle] = useState(null);
  const crosswalkAnnouncedRef = useRef(false);
  const directionInterval = useRef(null);
  const obstacleInterval = useRef(null);

  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const navigationRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const obstacleAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for navigation status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const speakDirection = useCallback(() => {
    const directions = [
      "Walk straight.",
      "Turn slightly left.",
      "Continue forward.",
      "Turn right in 5 meters.",
    ];
    const msg = directions[Math.floor(Math.random() * directions.length)];
    setCurrentDirection(msg);
    voiceEngine.announceDirection(msg);
  }, []);

  const checkObstacles = useCallback(async () => {
    const detections = await detectionAdapter.detectObjects(null);
    if (detectionAdapter.hasCrosswalk(detections)) {
      if (!crosswalkAnnouncedRef.current) {
        crosswalkAnnouncedRef.current = true;
        voiceEngine.speak("Crosswalk detected ahead. Be careful.");
        obstacleVibration("center", "medium");
        animateObstacleWarning();
      }
    } else {
      crosswalkAnnouncedRef.current = false;
    }
    const analyzed = detectionAdapter.analyzeDetections(detections);
    if (analyzed && (analyzed.level === "high" || analyzed.level === "medium")) {
      setLastObstacle(analyzed);
      voiceEngine.announceObstacle(analyzed.message, analyzed.level);
      obstacleVibration(analyzed.direction || "center", analyzed.level);
      animateObstacleWarning();
    } else {
      setLastObstacle(null);
      Animated.timing(obstacleAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const animateObstacleWarning = () => {
    Animated.sequence([
      Animated.timing(obstacleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(obstacleAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startNavigation = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsNavigating(true);
      voiceEngine.speak("Navigation started. Follow voice directions.");
      startAnimations();
    } catch (error) {
      console.log("Navigation start error:", error);
    }
  };

  const stopNavigation = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsNavigating(false);
      voiceEngine.speak("Navigation stopped.");
      if (directionInterval.current) clearInterval(directionInterval.current);
      if (obstacleInterval.current) clearInterval(obstacleInterval.current);
    } catch (error) {
      console.log("Navigation stop error:", error);
    }
  };

  useEffect(() => {
    startNavigation();
    return () => {
      stopNavigation();
    };
  }, []);

  useEffect(() => {
    if (isNavigating) {
      directionInterval.current = setInterval(speakDirection, NAV_DIRECTION_INTERVAL_MS);
      obstacleInterval.current = setInterval(checkObstacles, OBSTACLE_CHECK_INTERVAL_MS);
    }
    return () => {
      if (directionInterval.current) clearInterval(directionInterval.current);
      if (obstacleInterval.current) clearInterval(obstacleInterval.current);
    };
  }, [isNavigating, speakDirection, checkObstacles]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Navigation</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Navigation Status */}
      <Animated.View 
        style={[
          styles.statusContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: isNavigating ? pulseAnim : 1 }]
          }
        ]}
      >
        <View style={[styles.statusIndicator, isNavigating && styles.activeIndicator]} />
        <Text style={styles.statusText}>
          {isNavigating ? "Navigation Active" : "Navigation Inactive"}
        </Text>
        <Text style={styles.directionText}>{currentDirection}</Text>
      </Animated.View>

      {/* Obstacle Warning */}
      <Animated.View 
        style={[
          styles.obstacleContainer,
          { 
            opacity: obstacleAnim,
            transform: [{ scale: 1 + obstacleAnim.value * 0.2 }]
          }
        ]}
      >
        {lastObstacle && (
          <View style={[
            styles.obstacleCard,
            lastObstacle.level === 'high' && styles.highDanger,
            lastObstacle.level === 'medium' && styles.mediumDanger
          ]}>
            <Text style={styles.obstacleIcon}>⚠️</Text>
            <Text style={styles.obstacleTitle}>Obstacle Detected</Text>
            <Text style={styles.obstacleMessage}>{lastObstacle.message}</Text>
          </View>
        )}
      </Animated.View>

      {/* Camera View */}
      <Animated.View 
        style={[
          styles.cameraContainer,
          { opacity: fadeAnim }
        ]}
      >
        {!permission ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Requesting camera access...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera access required for navigation</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mute={true}
          />
        )}
      </Animated.View>

      {/* Control Buttons */}
      <Animated.View 
        style={[
          styles.controlContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={[styles.controlButton, styles.stopButton]} 
          onPress={stopNavigation}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>🛑 Stop Navigation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.scanButton]} 
          onPress={checkObstacles}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>🔍 Scan Area</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: height * 0.08,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textSecondary,
    marginBottom: 8,
  },
  activeIndicator: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  directionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  obstacleContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  obstacleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.warning,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  highDanger: {
    borderColor: COLORS.danger,
    backgroundColor: '#2A0F0F',
  },
  mediumDanger: {
    borderColor: COLORS.warning,
    backgroundColor: '#2A1F0F',
  },
  obstacleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  obstacleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  obstacleMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
  },
  permissionText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  controlContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  controlButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButton: {
    borderColor: COLORS.danger,
    backgroundColor: '#1A0F0F',
  },
  scanButton: {
    borderColor: COLORS.primary,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
