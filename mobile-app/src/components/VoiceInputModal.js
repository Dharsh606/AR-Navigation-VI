/**
 * Fallback voice input when native speech recognition isn't available (Expo Go).
 * Native "Tap to speak" button triggers WebView's Web Speech API via injected JS.
 */

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { voiceEngine } from "../services/voiceEngine";

// Expose startRecognition() so we can call it from injectJavaScript
const SPEECH_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
</head>
<body>
  <script>
    var recognition = null;
    try {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) recognition = new SpeechRecognition();
    } catch (e) {}
    function send(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
    function startRecognition() {
      if (!recognition) { send({ error: true, message: 'not-supported' }); return; }
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = function(e) {
        var t = (e.results[e.results.length - 1][0].transcript || '').trim();
        if (t) send({ transcript: t });
      };
      recognition.onend = function() { send({ listening: false }); };
      recognition.onerror = function(e) { send({ error: true, message: (e && e.error) || 'unknown' }); };
      recognition.start();
      send({ listening: true });
    }
    window.startRecognition = startRecognition;
  </script>
</body>
</html>
`;

export default function VoiceInputModal({ visible, onClose, onResult }) {
  const webRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (visible) {
      setUnsupported(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      voiceEngine.speak("Listening.");
      setListening(true);
      setTimeout(() => {
        if (webRef.current) {
          webRef.current.injectJavaScript("window.startRecognition && window.startRecognition();");
        } else {
          setListening(false);
        }
      }, 100);
    } else {
      setListening(false);
      setUnsupported(false);
    }
  }, [visible]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.transcript) {
        setListening(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        voiceEngine.speak("Got it.");
        onResult(data.transcript);
        onClose();
      } else if (data.listening === false) {
        setListening(false);
      } else if (data.error) {
        setListening(false);
        setUnsupported(true);
        voiceEngine.speak("Voice input is not supported in this app. Please use the buttons on the home screen.");
      }
    } catch (_) {}
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voiceEngine.speak("Cancelled.");
    setListening(false);
    setUnsupported(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityLabel="Voice input. Say your command."
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Say your command</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            accessibilityLabel="Close"
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.prompt}>
            Say: Start navigation, Scan surroundings, Emergency help, or Open devices.
          </Text>

          <Text style={styles.tapButtonText}>
            {listening ? "Listening…" : "Waiting"}
          </Text>

          {unsupported && (
            <Text style={styles.fallbackText}>
              Voice not available here. Use the buttons on the home screen.
            </Text>
          )}
        </View>

        <WebView
          ref={webRef}
          source={{ html: SPEECH_HTML }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          originWhitelist={["*"]}
          scrollEnabled={false}
          pointerEvents="none"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    paddingTop: Platform.OS === "ios" ? 50 : 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  title: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  closeBtnText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  prompt: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  tapButton: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#22d3ee",
  },
  tapButtonListening: {
    backgroundColor: "rgba(34, 211, 238, 0.3)",
    borderColor: "#22d3ee",
  },
  tapButtonText: {
    color: "#0a0a0f",
    fontSize: 20,
    fontWeight: "700",
  },
  fallbackText: {
    color: "#f87171",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
  webview: {
    width: "100%",
    height: 1,
    opacity: 0,
    pointerEvents: "none",
  },
});
