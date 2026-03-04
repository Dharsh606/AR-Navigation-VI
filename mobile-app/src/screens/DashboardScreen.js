import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { voiceEngine } from "../services/voiceEngine";
import { bluetoothManager } from "../services/bluetoothManager";

const BG = "#0a0a0f";
const PRIMARY = "#22d3ee";
const ON_BG = "#0f172a";
const TEXT = "#e2e8f0";
const BORDER = "#334155";
const ON_COLOR = "#4ade80";
const OFF_COLOR = "#94a3b8";

function DeviceRow({ device, onToggle }) {
  const isSwitch = device.type === "bulb" || device.type === "fan" || device.type === "plug";
  const isOn = isSwitch ? device.on : !device.locked;
  const statusText = device.type === "lock"
    ? (device.locked ? "Locked" : "Unlocked")
    : (device.on ? "On" : "Off");

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(device);
  };

  return (
    <TouchableOpacity
      style={[styles.row, isOn && styles.rowActive]}
      onPress={handlePress}
      accessibilityLabel={`${device.name}, ${statusText}. Double tap to toggle.`}
      accessibilityRole="button"
    >
      <Text style={styles.rowName}>{device.name}</Text>
      <Text style={[styles.rowStatus, isOn ? styles.statusOn : styles.statusOff]}>
        {statusText}
      </Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const [devices, setDevices] = useState(() => bluetoothManager.getDevices());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    const list = bluetoothManager.getDevices();
    setDevices([...list]);
    voiceEngine.speak(`${list.length} devices.`);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    voiceEngine.speak(`Bluetooth dashboard. ${devices.length} devices. Tap to toggle, or say go back to return.`);
  }, []);

  const handleToggle = useCallback((device) => {
    if (device.type === "lock") {
      bluetoothManager.setLock(device.id, !device.locked);
    } else if (device.on) {
      bluetoothManager.turnOffDevice(device.name);
    } else {
      bluetoothManager.turnOnDevice(device.name);
    }
    setDevices([...bluetoothManager.getDevices()]);
  }, []);

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    voiceEngine.speak("Closing dashboard.");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Dashboard</Text>
      <Text style={styles.subtitle}>
        Tap a device to turn on or off. Say "Turn on living room light" from home.
      </Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={PRIMARY}
          />
        }
      >
        {devices.map((d) => (
          <DeviceRow key={d.id} device={d} onToggle={handleToggle} />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={goBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 16 : 8,
  },
  title: {
    color: PRIMARY,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: TEXT,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.9,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ON_BG,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowActive: {
    borderColor: PRIMARY,
  },
  rowName: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
  },
  rowStatus: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusOn: {
    color: ON_COLOR,
  },
  statusOff: {
    color: OFF_COLOR,
  },
  backBtn: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  backBtnText: {
    color: PRIMARY,
    fontWeight: "bold",
    fontSize: 16,
  },
});
