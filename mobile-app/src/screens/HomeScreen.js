import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import * as Speech from "expo-speech";

export default function HomeScreen({ onOpenCamera }) {
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErrorMsg("Location permission denied.");
        setLoading(false);
        return;
      }

      // Speak after permission is granted
      Speech.speak("App started. Checking your location.", { rate: 0.95 });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(
        "Coords:",
        location.coords.latitude,
        location.coords.longitude
      );

      setLocationReady(true);
      setLoading(false);

      // Small delay before speaking again
      setTimeout(() => {
        Speech.speak("Location detected successfully.", { rate: 0.95 });
      }, 800);
    } catch (err) {
      setErrorMsg("Unable to fetch location.");
      setLoading(false);
    }
  };

  const speakTestAlert = () => {
    Speech.speak("Obstacle ahead. Please move slowly.", { rate: 0.95 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Navigation</Text>
      <Text style={styles.sub}>
        Day-2 build: GPS and Voice features enabled.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location Status</Text>

        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.smallText}> Detecting your location...</Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : locationReady ? (
          <>
            <Text style={styles.smallText}>
              Location detected successfully ✅
            </Text>
            <Text style={styles.smallText}>
              You can start camera navigation.
            </Text>
          </>
        ) : null}
      </View>

      <TouchableOpacity style={styles.btn} onPress={onOpenCamera}>
        <Text style={styles.btnText}>Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={speakTestAlert}>
        <Text style={styles.btnOutlineText}>Test Voice Alert</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Next step: Connect AI obstacle detection with camera.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  sub: { fontSize: 14, opacity: 0.8, marginBottom: 16 },

  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  smallText: { fontSize: 13, opacity: 0.85 },
  errorText: { fontSize: 13, color: "crimson" },

  btn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "black",
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },

  btnOutline: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center",
  },
  btnOutlineText: { color: "black", fontSize: 16, fontWeight: "600" },

  note: { marginTop: 14, fontSize: 12, opacity: 0.65 },
});
