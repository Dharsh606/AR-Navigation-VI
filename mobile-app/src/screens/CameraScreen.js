import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraScreen({ onGoBack }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Opening camera...</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is needed.</Text>

        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={onGoBack}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Camera Preview Working ✅</Text>

        <TouchableOpacity style={styles.btn} onPress={onGoBack}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  bottomText: { color: "white", marginBottom: 10, fontSize: 14 },
  btn: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "black", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  text: { marginTop: 10, fontSize: 14, opacity: 0.8, textAlign: "center" },
  link: { marginTop: 12 },
  linkText: { textDecorationLine: "underline", fontSize: 14 },
});
