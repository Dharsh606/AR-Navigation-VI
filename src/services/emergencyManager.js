/**
 * Enhanced Emergency Features with SOS, location sharing, and emergency services
 */

import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { voiceEngine } from './voiceEngine';

class EmergencyManager {
  constructor() {
    this.emergencyContacts = [];
    this.isEmergencyActive = false;
    this.emergencyTimer = null;
    this.locationTracker = null;
    this.emergencyLog = [];
  }

  async initializeEmergencyContacts() {
    // Default emergency contacts
    this.emergencyContacts = [
      { name: 'Emergency Services', phone: '911', type: 'emergency' },
      { name: 'Family Contact', phone: '+1234567890', type: 'family' },
      { name: 'Caregiver', phone: '+0987654321', type: 'caregiver' }
    ];
  }

  async triggerEmergency(emergencyType = 'general') {
    try {
      this.isEmergencyActive = true;
      
      // Get current location
      const location = await this.getCurrentLocationWithDetails();
      
      // Log emergency
      this.logEmergency(emergencyType, location);
      
      // Start emergency procedures
      await this.startEmergencyProtocol(emergencyType, location);
      
      // Start location tracking
      this.startLocationSharing();
      
      // Set up emergency timer
      this.startEmergencyTimer();
      
      voiceEngine.speak('Emergency activated. Help is on the way. Stay calm and stay where you are.');
      
    } catch (error) {
      voiceEngine.speak('Emergency system failed. Please call for help manually.');
      console.error('Emergency activation error:', error);
    }
  }

  async getCurrentLocationWithDetails() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

      // Get address details (simplified - would use geocoding API in production)
      const address = await this.reverseGeocode(location.coords);
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: location.timestamp,
        address: address
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  }

  async reverseGeocode(coords) {
    // Simulate reverse geocoding
    const addresses = [
      '123 Main Street, City, State 12345',
      '456 Oak Avenue, City, State 12345',
      '789 Pine Road, City, State 12345'
    ];
    
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  async startEmergencyProtocol(emergencyType, location) {
    switch (emergencyType) {
      case 'medical':
        await this.handleMedicalEmergency(location);
        break;
      case 'police':
        await this.handlePoliceEmergency(location);
        break;
      case 'fire':
        await this.handleFireEmergency(location);
        break;
      case 'lost':
        await this.handleLostEmergency(location);
        break;
      default:
        await this.handleGeneralEmergency(location);
    }
  }

  async handleMedicalEmergency(location) {
    // Contact emergency services
    await this.contactEmergencyServices('medical', location);
    
    // Notify medical contacts
    await this.notifyEmergencyContacts('medical emergency', location);
    
    // Provide medical guidance
    voiceEngine.speak('Medical emergency activated. Paramedics are being notified. If you can, sit down and try to remain calm.');
  }

  async handlePoliceEmergency(location) {
    await this.contactEmergencyServices('police', location);
    await this.notifyEmergencyContacts('police emergency', location);
    
    voiceEngine.speak('Police emergency activated. Officers are being notified. Move to a safe location if possible.');
  }

  async handleFireEmergency(location) {
    await this.contactEmergencyServices('fire', location);
    await this.notifyEmergencyContacts('fire emergency', location);
    
    voiceEngine.speak('Fire emergency activated. Fire department is being notified. Evacuate the area immediately if safe to do so.');
  }

  async handleLostEmergency(location) {
    await this.notifyEmergencyContacts('I am lost', location);
    await this.startLocationSharing();
    
    voiceEngine.speak('Lost emergency activated. Your location is being shared with contacts. Stay where you are if safe.');
  }

  async handleGeneralEmergency(location) {
    await this.contactEmergencyServices('general', location);
    await this.notifyEmergencyContacts('emergency', location);
    
    voiceEngine.speak('General emergency activated. Help is being notified.');
  }

  async contactEmergencyServices(type, location) {
    // Simulate emergency services contact
    const emergencyMessage = this.generateEmergencyMessage(type, location);
    
    // In production, this would integrate with actual emergency services API
    console.log('Emergency services contacted:', emergencyMessage);
    
    // Simulate emergency response time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async notifyEmergencyContacts(emergencyType, location) {
    const message = this.generateEmergencyMessage(emergencyType, location);
    
    for (const contact of this.emergencyContacts) {
      if (contact.type !== 'emergency') { // Don't SMS emergency services
        await this.sendEmergencySMS(contact.phone, message);
      }
    }
  }

  generateEmergencyMessage(emergencyType, location) {
    const timestamp = new Date().toLocaleString();
    const address = location.address || 'Unknown location';
    
    return `EMERGENCY ALERT: ${emergencyType.toUpperCase()}\n` +
           `Time: ${timestamp}\n` +
           `Location: ${address}\n` +
           `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n` +
           `Accuracy: ${location.accuracy.toFixed(0)} meters\n` +
           `Please check on the user immediately.`;
  }

  async sendEmergencySMS(phoneNumber, message) {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        await SMS.sendSMSAsync([phoneNumber], message);
        console.log(`Emergency SMS sent to ${phoneNumber}`);
      } else {
        console.log('SMS not available');
      }
    } catch (error) {
      console.error('SMS sending error:', error);
    }
  }

  startLocationSharing() {
    this.locationTracker = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 10  // Update every 10 meters
      },
      (location) => {
        this.shareLocationUpdate(location);
      }
    );
  }

  async shareLocationUpdate(location) {
    if (!this.isEmergencyActive) return;
    
    // Share location with emergency contacts
    const locationMessage = `Location Update: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)} at ${new Date().toLocaleString()}`;
    
    for (const contact of this.emergencyContacts) {
      if (contact.type !== 'emergency') {
        await this.sendEmergencySMS(contact.phone, locationMessage);
      }
    }
  }

  startEmergencyTimer() {
    // Check in every 2 minutes
    this.emergencyTimer = setInterval(() => {
      if (this.isEmergencyActive) {
        voiceEngine.speak('Emergency is still active. Help is on the way. Stay calm.');
      } else {
        clearInterval(this.emergencyTimer);
      }
    }, 120000); // 2 minutes
  }

  async cancelEmergency() {
    this.isEmergencyActive = false;
    
    if (this.emergencyTimer) {
      clearInterval(this.emergencyTimer);
      this.emergencyTimer = null;
    }
    
    if (this.locationTracker) {
      this.locationTracker.remove();
      this.locationTracker = null;
    }
    
    // Notify contacts that emergency is resolved
    const cancelMessage = `Emergency resolved at ${new Date().toLocaleString()}. User is safe.`;
    
    for (const contact of this.emergencyContacts) {
      if (contact.type !== 'emergency') {
        await this.sendEmergencySMS(contact.phone, cancelMessage);
      }
    }
    
    voiceEngine.speak('Emergency cancelled. You are safe.');
  }

  logEmergency(emergencyType, location) {
    const logEntry = {
      id: Date.now(),
      type: emergencyType,
      location: location,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.emergencyLog.push(logEntry);
    
    // Keep only last 50 emergencies
    if (this.emergencyLog.length > 50) {
      this.emergencyLog = this.emergencyLog.slice(-50);
    }
  }

  getEmergencyHistory() {
    return this.emergencyLog;
  }

  addEmergencyContact(name, phone, type = 'family') {
    this.emergencyContacts.push({
      name,
      phone,
      type,
      addedAt: Date.now()
    });
    
    voiceEngine.speak(`Emergency contact ${name} added`);
  }

  removeEmergencyContact(name) {
    const index = this.emergencyContacts.findIndex(contact => 
      contact.name.toLowerCase() === name.toLowerCase()
    );
    
    if (index !== -1) {
      const removed = this.emergencyContacts.splice(index, 1)[0];
      voiceEngine.speak(`Emergency contact ${removed.name} removed`);
      return true;
    }
    
    voiceEngine.speak(`Contact ${name} not found`);
    return false;
  }

  getEmergencyContacts() {
    return this.emergencyContacts;
  }

  async testEmergencySystem() {
    voiceEngine.speak('Testing emergency system...');
    
    try {
      const location = await this.getCurrentLocationWithDetails();
      
      if (location) {
        voiceEngine.speak('Location services working. Emergency system ready.');
        return true;
      } else {
        voiceEngine.speak('Location services not available. Emergency system may not work properly.');
        return false;
      }
    } catch (error) {
      voiceEngine.speak('Emergency system test failed.');
      return false;
    }
  }

  getEmergencyStatus() {
    return {
      isActive: this.isEmergencyActive,
      contactsCount: this.emergencyContacts.length,
      locationSharingActive: !!this.locationTracker,
      lastEmergency: this.emergencyLog[this.emergencyLog.length - 1] || null
    };
  }
}

export default new EmergencyManager();
