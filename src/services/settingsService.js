let batterySaver = false;

export function setBatterySaver(on) {
  batterySaver = !!on;
}

export function isBatterySaver() {
  return batterySaver;
}

export function navDirectionIntervalMs() {
  return batterySaver ? 20000 : 12000;
}

export function obstacleCheckIntervalMs() {
  return batterySaver ? 10000 : 6000;
}

export const settingsService = {
  setBatterySaver,
  isBatterySaver,
  navDirectionIntervalMs,
  obstacleCheckIntervalMs,
};
export default settingsService;
