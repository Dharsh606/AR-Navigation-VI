/**
 * Advanced voice navigation with turn-by-turn directions and landmarks
 */

import * as Location from 'expo-location';
import { voiceEngine } from './voiceEngine';

class AdvancedNavigation {
  constructor() {
    this.currentRoute = null;
    this.currentStep = 0;
    this.isNavigating = false;
    this.landmarks = [];
    this.watchSubscription = null;
  }

  async startNavigation(destination) {
    try {
      this.isNavigating = true;
      this.currentStep = 0;
      
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      
      // Calculate route (simplified - in real app would use Google Maps API)
      this.currentRoute = await this.calculateRoute(
        currentLocation.coords,
        destination
      );
      
      // Start location tracking
      this.startLocationTracking();
      
      voiceEngine.speak('Navigation started. Follow my instructions.');
      this.announceNextStep();
      
    } catch (error) {
      voiceEngine.speak('Navigation failed. Please try again.');
      console.error('Navigation error:', error);
    }
  }

  async calculateRoute(currentCoords, destination) {
    // Simplified route calculation - in production would use routing API
    const route = {
      steps: [
        {
          instruction: 'Head north on Main Street',
          distance: 100,
          direction: 'straight',
          landmark: 'Near the red building'
        },
        {
          instruction: 'Turn right at the traffic light',
          distance: 50,
          direction: 'right',
          landmark: 'After the traffic light'
        },
        {
          instruction: 'Walk straight for 200 meters',
          distance: 200,
          direction: 'straight',
          landmark: 'Pass the park'
        },
        {
          instruction: 'Turn left toward your destination',
          distance: 30,
          direction: 'left',
          landmark: 'Before the blue gate'
        },
        {
          instruction: 'You have arrived at your destination',
          distance: 0,
          direction: 'arrived',
          landmark: 'Destination reached'
        }
      ]
    };
    
    return route;
  }

  startLocationTracking() {
    this.watchSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2
      },
      (location) => {
        this.updateNavigation(location);
      }
    );
  }

  updateNavigation(location) {
    if (!this.isNavigating || !this.currentRoute) return;
    
    // Check if user reached current step destination
    if (this.shouldAnnounceNextStep()) {
      this.currentStep++;
      if (this.currentStep < this.currentRoute.steps.length) {
        this.announceNextStep();
      } else {
        this.arriveAtDestination();
      }
    }
  }

  shouldAnnounceNextStep() {
    // Simplified logic - in real app would calculate actual distance
    return Math.random() > 0.95; // Simulate reaching waypoints
  }

  announceNextStep() {
    if (!this.currentRoute || this.currentStep >= this.currentRoute.steps.length) return;
    
    const step = this.currentRoute.steps[this.currentStep];
    const message = this.generateNavigationMessage(step);
    
    voiceEngine.speak(message);
  }

  generateNavigationMessage(step) {
    let message = '';
    
    if (step.direction === 'arrived') {
      return 'You have arrived at your destination';
    }
    
    // Add distance
    if (step.distance < 50) {
      message += 'In 50 meters, ';
    } else if (step.distance < 100) {
      message += 'In 100 meters, ';
    } else {
      message += 'Shortly, ';
    }
    
    // Add direction
    switch (step.direction) {
      case 'left':
        message += 'turn left';
        break;
      case 'right':
        message += 'turn right';
        break;
      case 'straight':
        message += 'continue straight';
        break;
      default:
        message += 'follow the path';
    }
    
    // Add landmark
    if (step.landmark) {
      message += `. ${step.landmark}`;
    }
    
    return message;
  }

  async addLandmark(name, location, description) {
    this.landmarks.push({
      name,
      location,
      description,
      timestamp: Date.now()
    });
    
    voiceEngine.speak(`Landmark saved: ${name}`);
  }

  async getNearbyLandmarks(currentLocation) {
    return this.landmarks.filter(landmark => {
      const distance = this.calculateDistance(
        currentLocation,
        landmark.location
      );
      return distance < 500; // Within 500 meters
    });
  }

  calculateDistance(loc1, loc2) {
    // Simple distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  stopNavigation() {
    this.isNavigating = false;
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    voiceEngine.speak('Navigation stopped');
  }

  arriveAtDestination() {
    this.stopNavigation();
    voiceEngine.speak('You have arrived at your destination. Have a safe journey.');
  }

  getCurrentStep() {
    if (!this.currentRoute || this.currentStep >= this.currentRoute.steps.length) {
      return null;
    }
    return this.currentRoute.steps[this.currentStep];
  }

  repeatInstruction() {
    const currentStep = this.getCurrentStep();
    if (currentStep) {
      const message = this.generateNavigationMessage(currentStep);
      voiceEngine.speak(message);
    } else {
      voiceEngine.speak('No active navigation');
    }
  }
}

export default new AdvancedNavigation();
