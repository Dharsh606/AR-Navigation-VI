/**
 * Enhanced Accessibility Features for blind users
 * High contrast UI, large touch targets, screen reader optimization
 */

import { StyleSheet, Dimensions } from 'react-native';
import { voiceEngine } from './voiceEngine';

class AccessibilityManager {
  constructor() {
    this.screenReaderEnabled = true;
    this.highContrastMode = true;
    this.largeTextMode = false;
    this.hapticFeedback = true;
    this.currentTheme = 'highContrast';
    
    // Device dimensions for responsive design
    this.screen = Dimensions.get('window');
    
    // Initialize accessibility settings
    this.initializeAccessibility();
  }

  initializeAccessibility() {
    // Set up accessibility listeners
    this.setupAccessibilityListeners();
    
    // Apply initial accessibility settings
    this.applyAccessibilitySettings();
  }

  setupAccessibilityListeners() {
    // Listen for accessibility changes
    Dimensions.addEventListener('change', ({ window }) => {
      this.screen = window;
      this.updateLayoutForAccessibility();
    });
  }

  applyAccessibilitySettings() {
    if (this.screenReaderEnabled) {
      this.enableScreenReaderOptimizations();
    }
    
    if (this.highContrastMode) {
      this.applyHighContrastTheme();
    }
    
    if (this.largeTextMode) {
      this.applyLargeTextMode();
    }
  }

  enableScreenReaderOptimizations() {
    // Configure screen reader optimizations
    this.accessibilityProperties = {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: '',
      accessibilityHint: '',
      accessibilityLiveRegion: 'polite',
      importantForAccessibility: 'auto'
    };
  }

  getHighContrastTheme() {
    return {
      background: '#000000',
      primary: '#FFFFFF',
      secondary: '#FFFF00',
      accent: '#00FF00',
      danger: '#FF0000',
      warning: '#FFA500',
      success: '#00FF00',
      text: '#FFFFFF',
      textSecondary: '#FFFF00',
      border: '#FFFFFF',
      shadow: '#FFFF00',
      overlay: 'rgba(0, 0, 0, 0.8)',
      focus: '#FFFF00'
    };
  }

  getLargeTextSizes() {
    const baseSize = this.screen.width > 600 ? 18 : 16;
    return {
      small: baseSize * 1.2,
      medium: baseSize * 1.4,
      large: baseSize * 1.6,
      xlarge: baseSize * 1.8,
      xxlarge: baseSize * 2.0,
      heading: baseSize * 2.2,
      title: baseSize * 2.5
    };
  }

  getAccessibleButtonStyles() {
    const theme = this.getHighContrastTheme();
    const sizes = this.getLargeTextSizes();
    
    return StyleSheet.create({
      button: {
        backgroundColor: theme.primary,
        borderWidth: 3,
        borderColor: theme.accent,
        borderRadius: 12,
        paddingVertical: 20, // Large touch target
        paddingHorizontal: 24,
        minHeight: 60, // Minimum touch target size
        minWidth: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
        marginHorizontal: 8,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 6
      },
      buttonText: {
        fontSize: sizes.medium,
        fontWeight: 'bold',
        color: theme.background,
        textAlign: 'center',
        textAlignVertical: 'center'
      },
      buttonPressed: {
        backgroundColor: theme.accent,
        transform: [{ scale: 0.95 }]
      },
      emergencyButton: {
        backgroundColor: theme.danger,
        borderColor: theme.warning,
        borderWidth: 4,
        minHeight: 80,
        paddingVertical: 24
      },
      emergencyButtonText: {
        fontSize: sizes.large,
        color: theme.text,
        fontWeight: 'bold'
      }
    });
  }

  getAccessibleContainerStyles() {
    const theme = this.getHighContrastTheme();
    
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.background,
        padding: 16,
        minHeight: this.screen.height
      },
      card: {
        backgroundColor: theme.background,
        borderWidth: 2,
        borderColor: theme.border,
        borderRadius: 12,
        padding: 20,
        marginVertical: 12,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4
      },
      header: {
        fontSize: this.getLargeTextSizes().heading,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: theme.accent,
        borderRadius: 8,
        padding: 12,
        backgroundColor: theme.background
      },
      text: {
        fontSize: this.getLargeTextSizes().medium,
        color: theme.text,
        lineHeight: this.getLargeTextSizes().medium * 1.5,
        marginVertical: 4
      },
      textSecondary: {
        fontSize: this.getLargeTextSizes().small,
        color: theme.textSecondary,
        fontStyle: 'italic'
      }
    });
  }

  createAccessibleComponent(componentType, props) {
    const accessibilityProps = {
      accessible: true,
      accessibilityLabel: props.accessibilityLabel || props.title || 'Button',
      accessibilityHint: props.accessibilityHint || 'Double tap to activate',
      accessibilityRole: componentType,
      importantForAccessibility: 'auto',
      ...this.accessibilityProperties
    };

    return {
      ...props,
      ...accessibilityProps,
      style: [props.style, this.getAccessibleStyles(componentType)]
    };
  }

  getAccessibleStyles(componentType) {
    const styles = {
      button: this.getAccessibleButtonStyles().button,
      text: this.getAccessibleContainerStyles().text,
      container: this.getAccessibleContainerStyles().container,
      card: this.getAccessibleContainerStyles().card
    };
    
    return styles[componentType] || {};
  }

  announceScreenChange(screenName) {
    const message = `Now on ${screenName} screen`;
    voiceEngine.speak(message);
  }

  announceElement(elementDescription) {
    voiceEngine.speak(elementDescription);
  }

  provideHapticFeedback(type = 'light') {
    if (!this.hapticFeedback) return;
    
    // In production, would use expo-haptics
    console.log(`Haptic feedback: ${type}`);
  }

  createAccessibilityLabel(text, context = '') {
    let label = text;
    
    if (context) {
      label = `${text}, ${context}`;
    }
    
    // Add state information for buttons
    if (text.toLowerCase().includes('button')) {
      label += '. Button';
    }
    
    // Add action hints
    if (text.toLowerCase().includes('back')) {
      label += '. Double tap to go back';
    } else if (text.toLowerCase().includes('menu')) {
      label += '. Double tap to open menu';
    } else if (text.toLowerCase().includes('emergency')) {
      label += '. Double tap to activate emergency';
    }
    
    return label;
  }

  validateAccessibility(element) {
    const issues = [];
    
    // Check for accessibility labels
    if (!element.accessibilityLabel) {
      issues.push('Missing accessibility label');
    }
    
    // Check for minimum touch target size
    if (element.style && element.style.minHeight && element.style.minHeight < 44) {
      issues.push('Touch target too small (minimum 44x44 points)');
    }
    
    // Check for sufficient contrast
    if (this.highContrastMode && !this.hasSufficientContrast(element.style)) {
      issues.push('Insufficient color contrast');
    }
    
    return issues;
  }

  hasSufficientContrast(style) {
    // Simplified contrast check
    const backgroundColor = style.backgroundColor || '#000000';
    const textColor = style.color || '#FFFFFF';
    
    // In production, would calculate actual contrast ratio
    return backgroundColor !== textColor;
  }

  updateLayoutForAccessibility() {
    // Reapply styles when screen size changes
    this.applyAccessibilitySettings();
  }

  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    this.applyAccessibilitySettings();
    
    const status = this.highContrastMode ? 'enabled' : 'disabled';
    voiceEngine.speak(`High contrast mode ${status}`);
  }

  toggleLargeText() {
    this.largeTextMode = !this.largeTextMode;
    this.applyAccessibilitySettings();
    
    const status = this.largeTextMode ? 'enabled' : 'disabled';
    voiceEngine.speak(`Large text mode ${status}`);
  }

  toggleHapticFeedback() {
    this.hapticFeedback = !this.hapticFeedback;
    
    const status = this.hapticFeedback ? 'enabled' : 'disabled';
    voiceEngine.speak(`Haptic feedback ${status}`);
  }

  getAccessibilitySettings() {
    return {
      screenReaderEnabled: this.screenReaderEnabled,
      highContrastMode: this.highContrastMode,
      largeTextMode: this.largeTextMode,
      hapticFeedback: this.hapticFeedback,
      currentTheme: this.currentTheme
    };
  }

  createAccessibilityGuide() {
    return {
      navigation: {
        swipeRight: 'Swipe right to move to next item',
        swipeLeft: 'Swipe left to move to previous item',
        doubleTap: 'Double tap to activate button',
        swipeUp: 'Swipe up for more options',
        swipeDown: 'Swipe down to read content'
      },
      gestures: {
        twoFingerTap: 'Two-finger tap to pause speech',
        twoFingerSwipeUp: 'Two-finger swipe up to read from top',
        twoFingerSwipeDown: 'Two-finger swipe down to read all'
      },
      emergency: {
        longPress: 'Long press emergency button for 3 seconds to activate SOS',
        voiceCommand: 'Say "Emergency" or "Help" to activate emergency features'
      }
    };
  }

  announceAccessibilityGuide() {
    const guide = this.createAccessibilityGuide();
    
    voiceEngine.speak('Accessibility guide:');
    voiceEngine.speak('Swipe right to navigate, double tap to activate');
    voiceEngine.speak('For emergency, long press emergency button or say "Emergency"');
  }
}

export default new AccessibilityManager();
