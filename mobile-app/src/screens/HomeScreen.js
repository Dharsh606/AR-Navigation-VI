import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { voiceEngine } from "../services/voiceEngine";
import voiceListener from "../services/voiceListener";
import VoiceInputModal from "../components/VoiceInputModal";

// Speech recognition is loaded only when available (dev build). Expo Go has no native module.
function getSpeechRecognition() {
  try {
    return require("expo-speech-recognition");
  } catch {
    return null;
  }a
// Advanced high-contrast theme
const BG = "#050508";
const PRIMARY = "#22d3ee";
const ON_BG = "#0c1222";
const TEXT = "#e2e8f0";
const BORDER = "#1e293b";

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const navigationRef = useRef(navigation);

  navigationRef.current = navigation;

  const requestPermissions = useCallback(async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== "granted") {
      voiceEngine.speak("Location permission denied. Navigation may be limited.");
    } else {
      await Location.getCurrentPositionAsync({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    requestPermissions();
    voiceEngine.welcome();
    return () => {
      voiceEngine.stop();
    };
  }, [requestPermissions]);

  const onPress = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case "navigation":
        voiceEngine.confirmAction("Starting navigation.");
        navigation.navigate("AR");
        break;
      case "scan":
        voiceEngine.confirmAction("Opening scan mode.");
        navigation.navigate("Camera");
        break;
      case "emergency":
        voiceEngine.confirmEmergency();
        require("../services/emergencyModule").triggerEmergency();
        break;
      case "dashboard":
        voiceEngine.confirmAction("Opening Bluetooth dashboard.");
        navigation.navigate("Dashboard");
        break;
      default:
        break;
    }
  };

  const openVoiceFallback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    voiceEngine.speak("Opening voice fallback. Listening.");
    setShowVoiceModal(true);
  };

  const handleVoiceResult = (transcript) => {
    voiceListener.handleTranscript(transcript, navigationRef.current);
  };

  return (
    <View style={styles.container}>
      <VoiceInputModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onResult={handleVoiceResult}
      />
      <View style={styles.headerStrip} />
      <Text style={styles.title} accessibilityRole="header">
        AR-NAV-VI
      </Text>
      <Text style={styles.subtitle}>
        Voice-first navigation for the visually impaired
      </Text>

      {loading && (
        <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.buttonNav]}
          onPress={() => onPress("navigation")}
          accessibilityLabel="Start navigation"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Navigation</Text>
          <Text style={styles.buttonHint}>Start navigation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonScan]}
          onPress={() => onPress("scan")}
          accessibilityLabel="Scan surroundings"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>AR Scan</Text>
          <Text style={styles.buttonHint}>Scan surroundings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonEmergency]}
          onPress={() => onPress("emergency")}
          accessibilityLabel="Emergency help"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Emergency</Text>
          <Text style={styles.buttonHint}>Emergency help</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDashboard]}
          onPress={() => onPress("dashboard")}
          accessibilityLabel="Bluetooth dashboard, devices"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Devices</Text>
          <Text style={styles.buttonHint}>Bluetooth dashboard</Text>
        </TouchableOpacity>
      </View>

      {voiceListener.isListening() ? (
        <Text style={styles.voiceStatus}>Voice listening</Text>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.button, styles.fallbackButton]}
            onPress={openVoiceFallback}
            accessibilityLabel="Open fallback voice input"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Fallback voice</Text>
            <Text style={styles.buttonHint}>Open voice input</Text>
          </TouchableOpacity>
          <Text style={styles.voiceStatusHint}>Voice listening unavailable. Use fallback voice or the buttons.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 48 : 24,
  },
  headerStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: PRIMARY,
    opacity: 0.6,
  },
  title: {
    color: PRIMARY,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 2,
  },
  subtitle: {
    color: TEXT,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.85,
  },
  loader: {
    marginVertical: 16,
  },
  buttons: {
    gap: 14,
  },
  button: {
    backgroundColor: ON_BG,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
    minHeight: 84,
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  buttonNav: {
    borderColor: PRIMARY,
  },
  buttonScan: {
    borderColor: "#a78bfa",
  },
  buttonEmergency: {
    borderColor: "#f87171",
  },
  buttonDashboard: {
    borderColor: "#34d399",
  },
  fallbackButton: {
    borderColor: PRIMARY,
    marginTop: 16,
  },
  buttonText: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "bold",
  },
  buttonHint: {
    color: TEXT,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  voiceStatus: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    color: PRIMARY,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    opacity: 0.9,
  },
  voiceStatusHint: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    color: PRIMARY,
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 12,
    opacity: 0.9,
  },
  tapToSpeakArea: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tapHint: {
    color: PRIMARY,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
    opacity: 0.9,
  },
});
