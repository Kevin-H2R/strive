// Centralized theme configuration
// Change these values to update the entire app's appearance

export const theme = {
  // ===================
  // CORE COLORS
  // ===================

  // Primary accent color (buttons, links, highlights)
  primary: '#fff',
  primaryMuted: 'rgba(255, 255, 255, 0.8)',

  // ===================
  // BACKGROUNDS
  // ===================

  // Main screen background
  background: '#0a0a0a',

  // Card/surface background
  card: '#141414',

  // Slightly elevated surface (inputs, nested elements)
  surface: '#1a1a1a',

  // ===================
  // TEXT
  // ===================

  // Primary text (headings, important content)
  text: '#fff',

  // Secondary text (descriptions, labels)
  textSecondary: '#a0a0a0',

  // Muted text (placeholders, hints)
  textMuted: '#666',

  // ===================
  // BORDERS
  // ===================

  // Default border color
  border: '#2a2a2a',

  // Lighter border (subtle dividers)
  borderLight: '#1f1f1f',

  // ===================
  // STATES
  // ===================

  // Success state
  success: '#22c55e',

  // Error/danger state
  error: '#ef4444',

  // Warning state
  warning: '#eab308',

  // ===================
  // CHARTS
  // ===================

  // Default chart color (when not using muscle colors)
  chart: '#fff',
  chartMuted: 'rgba(255, 255, 255, 0.6)',

  // Chart background lines
  chartGrid: '#2a2a2a',

  // ===================
  // BUTTONS
  // ===================

  // Primary button
  buttonPrimary: '#fff',
  buttonPrimaryText: '#000',

  // Secondary/outline button
  buttonSecondary: 'transparent',
  buttonSecondaryText: '#fff',
  buttonSecondaryBorder: '#2a2a2a',

  // Destructive button
  buttonDestructive: '#ef4444',
  buttonDestructiveText: '#fff',

  // ===================
  // INPUTS
  // ===================

  inputBackground: '#1a1a1a',
  inputBorder: '#2a2a2a',
  inputText: '#fff',
  inputPlaceholder: '#666',

  // ===================
  // TAB BAR
  // ===================

  tabBar: '#0a0a0a',
  tabBarBorder: '#1a1a1a',
  tabBarActive: '#fff',
  tabBarInactive: '#666',

  // ===================
  // OVERLAYS
  // ===================

  overlay: 'rgba(0, 0, 0, 0.7)',
  modal: '#141414',
};

// Helper to create rgba from hex
export const withOpacity = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
