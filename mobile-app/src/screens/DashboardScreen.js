import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Haptics from "expo-haptics";
import { voiceEngine } from "../services/voiceEngine";
import { bluetoothManager } from "../services/bluetoothManager";

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

function DeviceRow({ device, onToggle }) {
  const isSwitch = device.type === "bulb" || device.type === "fan" || device.type === "plug";
  const isOn = isSwitch ? device.on : !device.locked;
  const statusText = device.type === "lock"
    ? (device.locked ? "Locked" : "Unlocked")
    : (device.on ? "On" : "Off");

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(device.id);
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case "bulb": return "💡";
      case "fan": return "🌀";
      case "lock": return "🔒";
      case "plug": return "🔌";
      case "thermostat": return "🌡️";
      default: return "📱";
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.deviceRow, isOn && styles.deviceRowOn]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.deviceIcon}>
        <Text style={styles.deviceIconText}>{getDeviceIcon(device.type)}</Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceType}>{device.type}</Text>
      </View>
      <View style={[styles.statusIndicator, isOn && styles.statusOn]}>
        <Text style={[styles.statusText, isOn && styles.statusTextOn]}>
          {statusText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
  };

  const scanDevices = useCallback(async () => {
    try {
      setIsScanning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // More realistic device states
      const mockDevices = [
        { id: "1", name: "Living Room Light", type: "bulb", on: false },
        { id: "2", name: "Bedroom Fan", type: "fan", on: false },
        { id: "3", name: "Front Door Lock", type: "lock", locked: false },
        { id: "4", name: "Smart Plug", type: "plug", on: false },
        { id: "5", name: "Kitchen Thermostat", type: "thermostat", on: false },
      ];
      
      setTimeout(() => {
        setDevices(mockDevices);
        setConnectedCount(mockDevices.length);
        setIsScanning(false);
        voiceEngine.speak(`Found ${mockDevices.length} smart devices`);
      }, 2000);
    } catch (error) {
      console.log("Scan error:", error);
      setIsScanning(false);
    }
  }, []);

  const toggleDevice = useCallback((deviceId) => {
    setDevices(prevDevices => 
      prevDevices.map(device => {
        if (device.id === deviceId) {
          const updatedDevice = { ...device };
          if (device.type === "lock") {
            updatedDevice.locked = !device.locked;
            voiceEngine.speak(`${device.name} ${updatedDevice.locked ? "locked" : "unlocked"}`);
          } else {
            updatedDevice.on = !device.on;
            voiceEngine.speak(`${device.name} turned ${updatedDevice.on ? "on" : "off"}`);
          }
          return updatedDevice;
        }
        return device;
      })
    );
  }, []);

  useEffect(() => {
    startAnimations();
    scanDevices();
  }, [scanDevices]);

  useEffect(() => {
    // Pulse animation for scanning status
    if (isScanning) {
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
    }
  }, [isScanning]);

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
        <Text style={styles.title}>Smart Home</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Status Cards */}
      <Animated.View 
        style={[
          styles.statusContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusNumber}>{connectedCount}</Text>
          <Text style={styles.statusLabel}>Connected Devices</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusNumber}>{devices.filter(d => d.on || !d.locked).length}</Text>
          <Text style={styles.statusLabel}>Active Now</Text>
        </View>
      </Animated.View>

      {/* Scan Button */}
      <Animated.View 
        style={[
          styles.scanContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={scanDevices}
          disabled={isScanning}
          activeOpacity={0.7}
        >
          <Animated.View 
            style={[
              styles.scanButtonInner,
              { transform: [{ scale: isScanning ? pulseAnim : 1 }] }
            ]}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? "🔍 Scanning..." : "🔍 Scan for Devices"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Device List */}
      <Animated.View 
        style={[
          styles.deviceListContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.deviceListTitle}>Your Devices</Text>
        <ScrollView 
          style={styles.deviceList}
          showsVerticalScrollIndicator={false}
        >
          {devices.map(device => (
            <DeviceRow 
              key={device.id} 
              device={device} 
              onToggle={toggleDevice}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.footerText}>
          Tap devices to control them with voice
        </Text>
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scanContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  scanButtonInner: {
    padding: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  deviceListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deviceListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  deviceList: {
    flex: 1,
  },
  deviceRow: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deviceRowOn: {
    borderColor: COLORS.success,
    backgroundColor: '#1A2F1F',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusIndicator: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  statusOn: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusTextOn: {
    color: COLORS.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
