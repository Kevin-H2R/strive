import { theme } from './theme';

// This file is kept for compatibility with Expo's default setup
// All colors are now derived from the centralized theme

export default {
  light: {
    text: theme.text,
    background: theme.background,
    tint: theme.primary,
    tabIconDefault: theme.tabBarInactive,
    tabIconSelected: theme.tabBarActive,
  },
  dark: {
    text: theme.text,
    background: theme.background,
    tint: theme.primary,
    tabIconDefault: theme.tabBarInactive,
    tabIconSelected: theme.tabBarActive,
  },
};
