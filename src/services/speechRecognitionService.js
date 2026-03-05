import { Platform } from "react-native";
import voiceListener from "./voiceListener";
import voiceEngine from "./voiceEngine";

let nativeSR = null;
let webRecognition = null;
let webStarted = false;
let nativeListener = null;

function getNativeSR() {
  try {
    const SR = require("expo-speech-recognition");
    return SR?.ExpoSpeechRecognitionModule || null;
  } catch {
    return null;
  }
}

export async function startRecognition(onTranscript) {
  if (Platform.OS === "web") {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        voiceListener.setListening(false);
        return;
      }
      webRecognition = new SR();
      webRecognition.lang = voiceEngine.getLanguage?.() || "en-US";
      webRecognition.continuous = true;
      webRecognition.interimResults = true;
      webRecognition.onresult = (e) => {
        const r = e.results[e.results.length - 1];
        const t = r && r[0] && r[0].transcript;
        if (t) onTranscript(t);
      };
      webRecognition.onend = () => {
        if (webStarted) {
          try {
            webRecognition.start();
          } catch {}
        }
      };
      try {
        webRecognition.start();
        webStarted = true;
        voiceListener.setListening(true);
      } catch {
        voiceListener.setListening(false);
        const kickoff = () => {
          if (!webStarted) {
            try {
              webRecognition.start();
              webStarted = true;
              voiceListener.setListening(true);
            } catch {}
          }
          document.removeEventListener("click", kickoff);
          document.removeEventListener("keydown", kickoff);
        };
        document.addEventListener("click", kickoff, { once: true });
        document.addEventListener("keydown", kickoff, { once: true });
      }
      return;
    } catch {
      voiceListener.setListening(false);
      return;
    }
  }
  nativeSR = getNativeSR();
  if (!nativeSR) {
    voiceListener.setListening(false);
    return;
  }
  const perm = await nativeSR.requestPermissionsAsync();
  if (!perm.granted) {
    voiceListener.setListening(false);
    return;
  }
  nativeListener = nativeSR.addListener("result", (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) onTranscript(transcript);
  });
  await nativeSR.start({
    lang: voiceEngine.getLanguage?.() || "en-US",
    interimResults: true,
    continuous: true,
  });
  voiceListener.setListening(true);
}

export async function stopRecognition() {
  if (Platform.OS === "web") {
    try {
      webStarted = false;
      webRecognition && webRecognition.stop();
    } catch {}
    voiceListener.setListening(false);
    return;
  }
  try {
    nativeSR && (await nativeSR.stop());
    nativeListener && nativeListener.remove && nativeListener.remove();
  } catch {}
  nativeListener = null;
  voiceListener.setListening(false);
}

export async function updateLanguage(langCode) {
  try {
    if (Platform.OS === "web") {
      if (webRecognition) webRecognition.lang = langCode;
      return;
    }
    if (nativeSR) {
      await nativeSR.stop();
      await nativeSR.start({ lang: langCode, interimResults: true, continuous: true });
    }
  } catch (_) {}
}

export const speechRecognitionService = {
  startRecognition,
  stopRecognition,
  updateLanguage,
};
export default speechRecognitionService;
