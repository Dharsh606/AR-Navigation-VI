/**
 * Simple error handler to catch and log errors gracefully
 */

const errorHandler = {
  log(error, context = '') {
    console.error(`[AR-NAV-VI Error] ${context}:`, error);
  },

  handleSpeechError(error) {
    this.log(error, 'Speech Recognition');
    // Don't speak error messages to avoid confusing users
  },

  handleNavigationError(error) {
    this.log(error, 'Navigation');
  },

  handleCameraError(error) {
    this.log(error, 'Camera');
  },

  handleBluetoothError(error) {
    this.log(error, 'Bluetooth');
  }
};

export default errorHandler;
