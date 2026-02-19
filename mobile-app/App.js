import React, { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import CameraScreen from "./src/screens/CameraScreen";

export default function App() {
  const [screen, setScreen] = useState("home");

  if (screen === "camera") {
    return <CameraScreen onGoBack={() => setScreen("home")} />;
  }

  return <HomeScreen onOpenCamera={() => setScreen("camera")} />;
}
