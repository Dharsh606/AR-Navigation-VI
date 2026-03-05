import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

const BG = "#050508";
const PRIMARY = "#22d3ee";
const ON_BG = "#0c1222";
const TEXT = "#e2e8f0";

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission:", status);
    } catch (error) {
      console.log("Permission error:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

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
          console.log("Emergency pressed");
          break;
      }
    } catch (error) {
      console.log("Button error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR-NAV-VI</Text>
        <Text style={styles.subtitle}>Voice-First Navigation</Text>
      </View>

      <View style={styles.buttonGrid}>
        <TouchableOpacity style={styles.button} onPress={() => onPress("navigation")}>
          <Text style={styles.buttonText}>🧭 Navigation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => onPress("scan")}>
          <Text style={styles.buttonText}>📷 Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => onPress("dashboard")}>
          <Text style={styles.buttonText}>🏠 Smart Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.emergencyButton]} onPress={() => onPress("emergency")}>
          <Text style={[styles.buttonText, styles.emergencyText]}>🚨 Emergency</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap buttons or use voice</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PRIMARY,
    textAlign: "center",
  },
  buttonGrid: {
    gap: 16,
  },
  button: {
    backgroundColor: ON_BG,
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emergencyButton: {
    backgroundColor: "#8B0000",
    borderColor: "#FF0000",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: TEXT,
  },
  emergencyText: {
    color: "#FFFFFF",
  },
  loadingText: {
    color: TEXT,
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: TEXT,
    fontSize: 14,
    opacity: 0.7,
  },
});
