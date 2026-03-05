export async function getStatus() {
  try {
    if (typeof navigator !== "undefined" && navigator.getBattery) {
      const b = await navigator.getBattery();
      return { level: b.level, charging: b.charging };
    }
  } catch {}
  return {};
}

export const batteryService = { getStatus };
export default batteryService;
