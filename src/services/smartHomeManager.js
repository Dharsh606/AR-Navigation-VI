/**
 * Smart Home Integration with Bluetooth device control
 * Voice commands for lights, doors, appliances with status feedback
 */

import { voiceEngine } from './voiceEngine';

class SmartHomeManager {
  constructor() {
    this.connectedDevices = new Map();
    this.deviceTypes = {
      light: { icon: '💡', actions: ['on', 'off', 'dim', 'brighten'] },
      door: { icon: '🚪', actions: ['lock', 'unlock', 'open', 'close'] },
      fan: { icon: '🌀', actions: ['on', 'off', 'speed'] },
      thermostat: { icon: '🌡️', actions: ['set', 'increase', 'decrease'] },
      camera: { icon: '📹', actions: ['on', 'off', 'record'] },
      speaker: { icon: '🔊', actions: ['on', 'off', 'volume', 'play'] }
    };
  }

  async scanForDevices() {
    try {
      // Simulate device discovery
      const discoveredDevices = [
        { id: 'light_001', name: 'Living Room Light', type: 'light', status: 'off' },
        { id: 'light_002', name: 'Bedroom Light', type: 'light', status: 'off' },
        { id: 'light_003', name: 'Kitchen Light', type: 'light', status: 'on' },
        { id: 'door_001', name: 'Main Door', type: 'door', status: 'locked' },
        { id: 'door_002', name: 'Back Door', type: 'door', status: 'locked' },
        { id: 'fan_001', name: 'Ceiling Fan', type: 'fan', status: 'off' },
        { id: 'thermostat_001', name: 'Thermostat', type: 'thermostat', status: '72°F' },
        { id: 'camera_001', name: 'Security Camera', type: 'camera', status: 'recording' }
      ];

      for (const device of discoveredDevices) {
        this.connectedDevices.set(device.id, device);
      }

      voiceEngine.speak(`Found ${discoveredDevices.length} smart devices`);
      return discoveredDevices;
    } catch (error) {
      voiceEngine.speak('Failed to scan for devices');
      console.error('Device scan error:', error);
      return [];
    }
  }

  async controlDevice(deviceName, action, value = null) {
    const device = this.findDeviceByName(deviceName);
    
    if (!device) {
      voiceEngine.speak(`Device ${deviceName} not found`);
      return false;
    }

    const deviceType = this.deviceTypes[device.type];
    if (!deviceType || !deviceType.actions.includes(action)) {
      voiceEngine.speak(`Action ${action} not supported for ${device.name}`);
      return false;
    }

    try {
      const result = await this.executeDeviceAction(device, action, value);
      
      if (result.success) {
        this.updateDeviceStatus(device.id, result.newStatus);
        this.announceDeviceStatus(device, action, result.newStatus);
        return true;
      } else {
        voiceEngine.speak(`Failed to ${action} ${device.name}`);
        return false;
      }
    } catch (error) {
      voiceEngine.speak(`Error controlling ${device.name}`);
      console.error('Device control error:', error);
      return false;
    }
  }

  findDeviceByName(name) {
    const devices = Array.from(this.connectedDevices.values());
    return devices.find(device => 
      device.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async executeDeviceAction(device, action, value) {
    // Simulate device control with delays
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let newStatus = device.status;
    let success = true;

    switch (device.type) {
      case 'light':
        if (action === 'on') newStatus = 'on';
        else if (action === 'off') newStatus = 'off';
        else if (action === 'dim') newStatus = 'dimmed';
        else if (action === 'brighten') newStatus = 'bright';
        else success = false;
        break;
        
      case 'door':
        if (action === 'lock') newStatus = 'locked';
        else if (action === 'unlock') newStatus = 'unlocked';
        else if (action === 'open') newStatus = 'open';
        else if (action === 'close') newStatus = 'closed';
        else success = false;
        break;
        
      case 'fan':
        if (action === 'on') newStatus = 'on';
        else if (action === 'off') newStatus = 'off';
        else if (action === 'speed') newStatus = value || 'medium';
        else success = false;
        break;
        
      case 'thermostat':
        if (action === 'set') newStatus = `${value}°F`;
        else if (action === 'increase') newStatus = `${parseInt(device.status) + 2}°F`;
        else if (action === 'decrease') newStatus = `${parseInt(device.status) - 2}°F`;
        else success = false;
        break;
        
      case 'camera':
        if (action === 'on') newStatus = 'on';
        else if (action === 'off') newStatus = 'off';
        else if (action === 'record') newStatus = 'recording';
        else success = false;
        break;
        
      case 'speaker':
        if (action === 'on') newStatus = 'on';
        else if (action === 'off') newStatus = 'off';
        else if (action === 'volume') newStatus = `Volume ${value || '50%'}`;
        else if (action === 'play') newStatus = 'playing';
        else success = false;
        break;
        
      default:
        success = false;
    }

    return { success, newStatus };
  }

  updateDeviceStatus(deviceId, newStatus) {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.status = newStatus;
      device.lastUpdated = Date.now();
    }
  }

  announceDeviceStatus(device, action, status) {
    const deviceType = this.deviceTypes[device.type];
    const icon = deviceType ? deviceType.icon : '📱';
    
    let message = `${device.name} is now ${status}`;
    
    // Add specific feedback for certain actions
    if (device.type === 'light' && action === 'on') {
      message += '. Light turned on';
    } else if (device.type === 'door' && action === 'lock') {
      message += '. Door is now secure';
    } else if (device.type === 'thermostat') {
      message += `. Temperature set to ${status}`;
    }
    
    voiceEngine.speak(message);
  }

  async getDeviceStatus(deviceName) {
    const device = this.findDeviceByName(deviceName);
    
    if (!device) {
      voiceEngine.speak(`Device ${deviceName} not found`);
      return null;
    }

    const deviceType = this.deviceTypes[device.type];
    const icon = deviceType ? deviceType.icon : '📱';
    
    const statusMessage = `${device.name} is ${device.status}`;
    voiceEngine.speak(statusMessage);
    
    return device;
  }

  async getAllDevicesStatus() {
    const devices = Array.from(this.connectedDevices.values());
    const statusList = devices.map(device => `${device.name}: ${device.status}`).join('. ');
    
    voiceEngine.speak(`Device status: ${statusList}`);
    return devices;
  }

  async createAutomationRule(ruleName, conditions, actions) {
    // Simulate automation rule creation
    const rule = {
      id: `rule_${Date.now()}`,
      name: ruleName,
      conditions,
      actions,
      enabled: true,
      createdAt: Date.now()
    };

    voiceEngine.speak(`Automation rule ${ruleName} created`);
    return rule;
  }

  async executeAutomationRules() {
    // Simulate rule execution based on conditions
    const rules = []; // Would be stored in database
    
    for (const rule of rules) {
      if (rule.enabled && this.evaluateConditions(rule.conditions)) {
        for (const action of rule.actions) {
          await this.controlDevice(action.device, action.action, action.value);
        }
      }
    }
  }

  evaluateConditions(conditions) {
    // Simplified condition evaluation
    return Math.random() > 0.8; // 20% chance of conditions being met
  }

  async getEnergyUsage() {
    // Simulate energy usage calculation
    const devices = Array.from(this.connectedDevices.values());
    const activeDevices = devices.filter(device => 
      device.status === 'on' || device.status === 'recording' || device.status === 'playing'
    );
    
    const estimatedUsage = activeDevices.length * 50; // 50W per active device
    const message = `Current energy usage: ${estimatedUsage} watts from ${activeDevices.length} active devices`;
    
    voiceEngine.speak(message);
    return { usage: estimatedUsage, activeDevices: activeDevices.length };
  }

  disconnectDevice(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      this.connectedDevices.delete(deviceId);
      voiceEngine.speak(`${device.name} disconnected`);
      return true;
    }
    return false;
  }

  getConnectedDevices() {
    return Array.from(this.connectedDevices.values());
  }
}

export default new SmartHomeManager();
