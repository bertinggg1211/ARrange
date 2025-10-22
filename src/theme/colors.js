// Modern Furniture UI Design Theme Colors
const Colors = {
  // Primary Palette - Clean & Modern
  primary: '#1A1A1A',        // Deep Black - Primary actions
  primaryLight: '#2D2D2D',   // Dark Gray - Hover states
  primaryDark: '#000000',    // Pure Black - Active states
  
  // Secondary Palette - Warm Orange Accents
  secondary: '#FF8B47',      // Warm Orange - Price highlights
  secondaryLight: '#FFB380', // Light Orange - Hover states
  secondaryDark: '#E6703D',  // Dark Orange - Active states
  
  // Accent Colors - Soft & Neutral
  accent: '#F8F8F8',         // Light Gray - Card backgrounds
  accentLight: '#FFFFFF',    // Pure White - Surface
  accentDark: '#EEEEEE',     // Medium Gray - Borders
  
  // Background & Surface
  background: '#FFFFFF',     // Pure White - Main background
  surface: '#FFFFFF',        // White - Card surfaces
  surfaceLight: '#FAFAFA',   // Off White - Subtle backgrounds
  overlay: 'rgba(0, 0, 0, 0.03)', // Very subtle overlay
  
  // Status Colors
  success: '#4CAF50',        // Modern Green - Success states
  error: '#F44336',          // Modern Red - Error states
  warning: '#FF9800',        // Modern Orange - Warning
  info: '#2196F3',           // Modern Blue - Information
  
  // Text Colors
  text: '#1A1A1A',           // Almost Black - Primary text
  textSecondary: '#666666',  // Medium Gray - Secondary text
  textMuted: '#999999',      // Light Gray - Muted text
  textInverse: '#FFFFFF',    // White text on dark backgrounds
  
  // Interactive States
  border: '#E0E0E0',         // Light borders
  borderActive: '#FF8B47',   // Orange active borders
  disabled: '#CCCCCC',       // Disabled elements
  shadow: 'rgba(0, 0, 0, 0.08)', // Soft shadows
};

// Additional theme properties
const Theme = {
  borderRadius: {
    small: 8,
    medium: 12,
    large: 20,
    full: 50,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 32,
  },
  
  shadow: {
    small: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export default { Colors, Theme };