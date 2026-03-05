import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import emergencyService from "../services/emergencyService";

// Speech recognition is loaded only when available (dev build). Expo Go has no native module.
function getSpeechRecognition() {
  try {
    return require("expo-speech-recognition");
  } catch {
    return null;
  }
}

// Modern aesthetic color palette
const COLORS = {
  background: "#0F0F1E", // Deep midnight blue
  primary: "#6366F1", // Indigo
  secondary: "#8B5CF6", // Purple
  accent: "#EC4899", // Pink
  success: "#10B981", // Emerald
  warning: "#F59E0B", // Amber
  danger: "#EF4444", // Red
  surface: "#1A1B3A", // Dark surface
  card: "#252641", // Card background
  text: "#F8FAFC", // Light text
  textSecondary: "#94A3B8", // Secondary text
  gradient: ["#6366F1", "#8B5CF6", "#EC4899"], // Gradient colors
};

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(30);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const emergencyInterval = useRef(null);

  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission:", status);
    } catch (error) {
      console.log("Permission error:", error);
    }
    setLoading(false);
    
    // Start animations when loading is complete
    startAnimations();
  }, []);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startEmergency = useCallback(() => {
    try {
      setEmergencyActive(true);
      setEmergencyCountdown(30);
      
      // Start countdown
      emergencyInterval.current = setInterval(() => {
        setEmergencyCountdown(prev => {
          if (prev <= 1) {
            stopEmergency();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start emergency service (vibration + siren)
      emergencyService.startEmergency();
      // TODO: Pass siren audio file when you provide it
      // emergencyService.startEmergency(sirenAudioFile);
      
      console.log("🚨 EMERGENCY ACTIVATED - 30 second countdown started");
      
    } catch (error) {
      console.log("Emergency start error:", error);
    }
  }, []);

  const stopEmergency = useCallback(() => {
    try {
      setEmergencyActive(false);
      setEmergencyCountdown(30);
      
      if (emergencyInterval.current) {
        clearInterval(emergencyInterval.current);
        emergencyInterval.current = null;
      }
      
      // Stop emergency service
      emergencyService.stopEmergency();
      
      console.log("🛑 Emergency stopped");
      
    } catch (error) {
      console.log("Emergency stop error:", error);
    }
  }, []);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    try {
      emergencyService.initialize();
      console.log('Emergency service initialized');
    } catch (error) {
      console.log('Emergency service initialization error:', error);
    }
    
    return () => {
      try {
        emergencyService.cleanup();
        console.log('Emergency service cleaned up');
      } catch (error) {
        console.log('Emergency service cleanup error:', error);
      }
    };
  }, []);

  const onPress = (action) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      switch (action) {
        case "navigation":
          navigation.navigate("AR");
          break;
        case "scan":
          navigation.navigate("Camera");
          break;
        case "dashboard":
          navigation.navigate("Dashboard");
          break;
        case "emergency":
          if (emergencyActive) {
            stopEmergency();
          } else {
            startEmergency();
          }
          break;
      }
    } catch (error) {
      console.log("Button error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Animated.Text 
            style={[styles.loadingText, { opacity: fadeAnim }]}
          >
            Initializing AR Navigation...
          </Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>AR-NAV-VI</Text>
        <Text style={styles.subtitle}>Voice-First Navigation Assistant</Text>
        <View style={styles.underline} />
      </Animated.View>

      {/* Button Grid */}
      <Animated.View 
        style={[
          styles.buttonGrid,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={[styles.button, styles.navigationButton]} 
          onPress={() => onPress("navigation")}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>🧭</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Navigation</Text>
            <Text style={styles.buttonSubtitle}>Start your journey</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.scanButton]} 
          onPress={() => onPress("scan")}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>📷</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Scan</Text>
            <Text style={styles.buttonSubtitle}>Explore surroundings</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dashboardButton]} 
          onPress={() => onPress("dashboard")}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>🏠</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Smart Home</Text>
            <Text style={styles.buttonSubtitle}>Control your devices</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.emergencyButton, emergencyActive && styles.emergencyButtonActive]} 
          onPress={() => onPress("emergency")}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>{emergencyActive ? "🛑" : "🚨"}</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonTitle, styles.emergencyText]}>
              {emergencyActive ? "STOP EMERGENCY" : "Emergency"}
            </Text>
            <Text style={[styles.buttonSubtitle, styles.emergencySubtitle]}>
              {emergencyActive ? `${emergencyCountdown}s remaining` : "Get help now"}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.footerText}>🎤 Voice commands available</Text>
        <Text style={styles.footerSubtext}>Tap buttons or speak naturally</Text>
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
    height: height * 0.6,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.15,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 8,
  },
  buttonGrid: {
    paddingHorizontal: 20,
    gap: 16,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 80,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 16,
  },
  navigationButton: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  scanButton: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 4,
  },
  dashboardButton: {
    borderLeftColor: COLORS.success,
    borderLeftWidth: 4,
  },
  emergencyButton: {
    borderLeftColor: COLORS.danger,
    borderLeftWidth: 4,
    backgroundColor: '#1A0F0F',
  },
  emergencyButtonActive: {
    backgroundColor: COLORS.danger,
    borderLeftColor: '#FFFFFF',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  emergencyText: {
    color: COLORS.danger,
  },
  emergencySubtitle: {
    color: '#FCA5A5',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
});
