import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";
import ARScreen from "./src/screens/ARScreen";
import CameraScreen from "./src/screens/CameraScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import { initAudioForSpeech } from "./src/services/voiceEngine";
import { speechRecognitionService } from "./src/services/speechRecognitionService";
import { voiceListener } from "./src/services/voiceListener";

const Stack = createNativeStackNavigator();

export default function App() {
  const navRef = useRef(null);
  
  useEffect(() => {
    // Initialize services safely with error handling
    const initializeServices = async () => {
      try {
        // Initialize voice engine
        const { initAudioForSpeech } = await import("./src/services/voiceEngine");
        await initAudioForSpeech();
      } catch (error) {
        console.log("Voice engine initialization failed:", error);
      }
    };

    initializeServices();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
    <NavigationContainer ref={navRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#22d3ee",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "AR-NAV-VI" }}
        />
        <Stack.Screen
          name="AR"
          component={ARScreen}
          options={{ title: "Live Navigation" }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: "Camera View" }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Bluetooth Dashboard" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
