/**
 * Voice Listener - continuous speech recognition and command parsing.
 * Welcome, help, go back, and smart home (lights, fan, door) by voice.
 */

import ve from "./voiceEngine";
import { bluetoothManager } from "./bluetoothManager";
import { navigationEngine } from "./navigationEngine";
import { triggerEmergency, startLiveTracking, stopLiveTracking } from "./emergencyModule";
import { saveCurrentPlace, navigateToPlace } from "./savedPlaces";
import { batteryService } from "./batteryService";
import { speechRecognitionService } from "./speechRecognitionService";

let recognitionActive = false;
let onCommandCallback = null;

const COMMANDS = {
  welcome: ["welcome", "hello", "hi", "start", "intro", "hey"],
  wake: ["hey ar nav vi", "hey arnavi", "ar nav vi"],
  help: ["what can i say", "commands", "help me", "voice commands", "help", "list commands"],
  start_navigation: ["start navigation", "begin navigation", "navigate", "start nav", "navigation", "வழிச்செலுத்தலை தொடங்கு", "நாவிகேஷன் தொடங்கு", "பயணம் தொடங்கு", "నావిగేషన్ ప్రారంభించు", "ప్రయాణం ప్రారంభించు", "ನ್ಯಾವಿಗೇಶನ್ ಪ್ರಾರಂಭಿಸಿ", "ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ", "നാവിഗേഷൻ ആരംഭിക്കുക", "യാത്ര ആരംഭിക്കുക"],
  scan_surroundings: ["scan surroundings", "scan", "open camera", "scan environment", "ar scan", "சுற்றுப்புறத்தை ஸ்கேன் செய்", "ஸ்கேன் செய்", "கேமரா திற", "చుట్టుపక్కలను స్కాన్ చేయి", "స్కాన్ చేయి", "కెమెరా ఓపెన్ చెయి", "ಪರಿಸರವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ", "ചുറ്റുപാട് സ്കാൻ ചെയ്യുക", "സ്കാൻ ചെയ്യുക", "ക്യാമറ തുറക്കുക"],
  dashboard: ["open devices", "bluetooth dashboard", "devices", "smart home", "my devices", "dashboard", "சாதனங்களை திற", "ப்ளூடூத் டாஷ்போர்டு", "పరికరాలు తెరవండి", "బ్లూటూథ్ డ్యాష్‌బోర్డ్", "ಸಾಧನಗಳನ್ನು ತೆರೆಯಿರಿ", "ಬ್ಲೂಟೂತ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "ഉപകരണങ്ങൾ തുറക്കുക", "ബ്ലൂടൂത്ത് ഡാഷ്ബോർഡ്"],
  emergency: ["emergency", "emergency help", "sos", "emergency assistance", "அவசர உதவி", "எஸ் ஓ எஸ்", "ఎమర్జెన్సీ సహాయం", "ఎస్ ఓఎస్", "ತುರ್ತು ಸಹಾಯ", "ಎಸ್ಓಎಸ್", "ആപത് സഹായം", "എസ്‌ഒ‌എസ്"],
  cancel_sos: ["cancel sos", "stop sos", "end emergency", "cancel emergency", "எஸ் ஓ எஸ் ரத்து செய்", "அவசரம் நிறுத்து", "ఎస్ ఓ ఎస్ రద్దు చేయి", "ఎమర్జెన్సీ ఆపు", "ಎಸ್ಓಎಸ್ ರದ್ದುಮಾಡಿ", "ತುರ್ತು ಸ್ಥಗಿತಗೊಳಿಸಿ", "എസ്‌ഒ‌എസ് റദ്ദാക്കുക", "ആപത്ത് നിർത്തുക"],
  where_am_i: ["where am i", "my location", "location", "current position", "நான் எங்கே", "என் இருப்பிடம்", "నేను ఎక్కడున్నాను", "నా స్థానం", "ನಾನು ಎಲ್ಲಿದ್ದೇನೆ", "ನನ್ನ ಸ್ಥಳ", "ഞാൻ എവിടെയാണ്", "എന്റെ സ്ഥാനം"],
  read_sign: ["read the sign", "read sign", "read text", "read board", "read notice", "பலகையை வாசி", "உரையை வாசி", "సైన్ చదవు", "టెక్స్ట్ చదవు", "ಬೋರ್ಡ್ ಓದಿ", "ಪಠ್ಯ ಓದಿ", "ബോർഡ് വായിക്കുക", "ടെക്സ്റ്റ് വായിക്കുക"],
  battery_status: ["battery status", "battery level", "how much battery", "பேட்டரி நிலை", "பேட்டரி எவ்வளவு", "బ్యాటరీ స్థాయి", "బ్యాటరీ ఎంత ఉంది", "ಬ್ಯಾಟರಿ ಸ್ಥಿತಿ", "ಬ್ಯಾಟರಿ ಎಷ್ಟು", "ബാറ്ററി നില", "ബാറ്ററി എത്ര"],
  stop_navigation: ["stop navigation", "end navigation", "cancel navigation", "வழிசெலுத்தலை நிறுத்து", "నావిగేషన్ ఆపు", "ನ್ಯಾವಿಗೇಶನ್ ನಿಲ್ಲಿಸಿ", "നാവിഗേഷൻ നിർത്തുക"],
  set_lang_en: ["change language to english", "set language english", "english language"],
  set_lang_hi: ["change language to hindi", "set language hindi", "hindi language"],
  set_lang_ta: ["change language to tamil", "set language tamil", "tamil language"],
  set_lang_te: ["change language to telugu", "set language telugu", "telugu language"],
  set_lang_kn: ["change language to kannada", "set language kannada", "kannada language"],
  set_lang_ml: ["change language to malayalam", "set language malayalam", "malayalam language"],
  speak_slower: ["speak slower", "slow down speech", "reduce speed"],
  speak_faster: ["speak faster", "increase speed", "speed up"],
  save_home: ["save home", "set home", "save this as home"],
  save_work: ["save work", "set work", "save this as work"],
  goto_home: ["go home", "guide me to home", "navigate to home"],
  goto_work: ["go to work", "guide me to work", "navigate to work"],
  open_analytics: ["open analytics", "show analytics", "analytics dashboard", "open dashboard analytics"],
  go_back: ["go back", "back", "exit", "close", "return", "பின்னால் போ", "வெளியேறு", "వెనక్కి వెళ్ళు", "ఎగ్జిట్", "ಹಿಂದಕ್ಕೆ ಹೋಗು", "ನಿರ್ಗಮಿಸಿ", "തിരികെ പോകൂ", "പുറത്ത് പോകൂ"],
  stop: ["stop", "cancel", "நிறுத்து", "ரத்து செய்", "ఆపు", "రద్దు చేయి", "ನಿಲ್ಲಿಸಿ", "ರದ್ದುಮಾಡಿ", "നിർത്തുക", "റദ്ദാക്കുക"],
  repeat: ["repeat", "say again", "what did you say", "மீண்டும் சொல்", "మళ్ళీ చెప్పు", "ಮತ್ತೆ ಹೇಳಿ", "വീണ്ടും പറയൂ"],
};

function normalizeTranscript(t) {
  return (t || "").toLowerCase().trim();
}

function matchCommand(transcript) {
  const t = normalizeTranscript(transcript);
  for (const [cmd, phrases] of Object.entries(COMMANDS)) {
    if (phrases.some((p) => t.includes(p))) return cmd;
  }
  const smartHome = bluetoothManager.parseSmartHomeCommand(transcript);
  if (smartHome) return { type: "smart_home", ...smartHome };
  return null;
}

/**
 * Handle raw transcript: welcome, help, navigation, emergency, smart home, go back.
 */
export function handleTranscript(transcript, navigation) {
  if (!transcript) return;
  const cmd = matchCommand(transcript);
  if (!cmd) return;

  if (typeof cmd === "object" && cmd.type === "smart_home") {
    if (cmd.action === "on") bluetoothManager.turnOnDevice(cmd.target);
    else if (cmd.action === "off") bluetoothManager.turnOffDevice(cmd.target);
    else if (cmd.action === "lock") bluetoothManager.setLock(cmd.target, true);
    else if (cmd.action === "unlock") bluetoothManager.setLock(cmd.target, false);
    return;
  }

  switch (cmd) {
    case "wake":
      ve.welcomeShort();
      break;
    case "welcome":
      ve.welcomeShort();
      break;
    case "help":
      ve.help();
      break;
    case "start_navigation":
      ve.confirmAction("Starting navigation.");
      navigation?.navigate?.("AR");
      break;
    case "scan_surroundings":
      ve.confirmAction("Opening scan mode.");
      navigation?.navigate?.("Camera");
      break;
    case "dashboard":
      ve.confirmAction("Opening Bluetooth dashboard.");
      navigation?.navigate?.("Dashboard");
      break;
    case "emergency":
      triggerEmergency();
      startLiveTracking();
      break;
    case "cancel_sos":
      stopLiveTracking();
      break;
    case "where_am_i":
      navigationEngine.getCurrentPosition().then((c) => {
        if (c) ve.sayLocation(c.latitude, c.longitude);
        else ve.speak("Location not available.");
      });
      break;
    case "battery_status":
      batteryService.getStatus().then((info) => {
        if (info?.level != null) ve.speak(`Battery ${Math.round(info.level * 100)} percent.`);
        else ve.speak("Battery status not available.");
      });
      break;
    case "read_sign":
      navigation?.navigate?.("Camera", { readSignOnce: true });
      break;
    case "stop_navigation":
      ve.speak("Stopping navigation.");
      navigation?.goBack?.();
      break;
    case "set_lang_en":
      ve.setLanguage("en-US");
      speechRecognitionService.updateLanguage("en-US");
      break;
    case "set_lang_hi":
      ve.setLanguage("hi-IN");
      speechRecognitionService.updateLanguage("hi-IN");
      break;
    case "set_lang_ta":
      ve.setLanguage("ta-IN");
      speechRecognitionService.updateLanguage("ta-IN");
      break;
    case "set_lang_te":
      ve.setLanguage("te-IN");
      speechRecognitionService.updateLanguage("te-IN");
      break;
    case "set_lang_kn":
      ve.setLanguage("kn-IN");
      speechRecognitionService.updateLanguage("kn-IN");
      break;
    case "set_lang_ml":
      ve.setLanguage("ml-IN");
      speechRecognitionService.updateLanguage("ml-IN");
      break;
    case "speak_slower":
      ve.setRate(0.8);
      break;
    case "speak_faster":
      ve.setRate(1.05);
      break;
    case "save_home":
      saveCurrentPlace("Home");
      break;
    case "save_work":
      saveCurrentPlace("Work");
      break;
    case "goto_home":
      navigateToPlace("Home", navigation);
      break;
    case "goto_work":
      navigateToPlace("Work", navigation);
      break;
    case "open_analytics":
      navigation?.navigate?.("Analytics");
      break;
    case "go_back":
      ve.speak("Going back.");
      navigation?.goBack?.();
      break;
    case "stop":
      ve.speak("Stopped.");
      break;
    case "repeat":
      ve.repeatLast();
      break;
    default:
      break;
  }
  onCommandCallback?.(cmd, transcript);
}

export function setOnCommandCallback(fn) {
  onCommandCallback = fn;
}

export function isListening() {
  return recognitionActive;
}

export function setListening(active) {
  recognitionActive = active;
}

export const voiceListener = {
  handleTranscript,
  setOnCommandCallback,
  isListening,
  setListening,
  COMMANDS,
};
export default voiceListener;
