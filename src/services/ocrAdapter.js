import { voiceEngine } from "./voiceEngine";

function randomText() {
  const samples = [
    "Entrance",
    "Library",
    "Exit",
    "Reception",
    "Cafeteria",
    "Restroom",
    "Stairs",
  ];
  if (Math.random() < 0.6) return samples[Math.floor(Math.random() * samples.length)];
  return "";
}

export async function readTextFromFrame(frame) {
  await new Promise((r) => setTimeout(r, 400));
  const t = randomText();
  return t;
}

export async function announceText(text) {
  if (text) voiceEngine.speak(`Sign says: ${text}`);
  else voiceEngine.speak("No clear text detected.");
}

export const ocrAdapter = {
  readTextFromFrame,
  announceText,
};
export default ocrAdapter;
