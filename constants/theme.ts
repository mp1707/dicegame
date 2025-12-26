/**
 * Theme constants for Roguelike Yahtzee
 * Based on CRT Arcade UI Direction
 */

import { Platform } from "react-native";

// Color Palette - Bright Felt + Warm Casino Neon (Balatro-inspired)
export const COLORS = {
  // Base - Mid-bright felt, not near-black
  bg: "#1E8A63", // saturated felt green (shadow)
  bg2: "#2FB67A", // primary felt green (bright)
  surface: "#2A2242", // panels - warm eggplant
  surface2: "#352B58", // tiles - panel highlight
  border: "#4A3D7A", // outlines - brighter for visibility
  slotBg: "#2A2242", // alias for slot backgrounds

  // Text - high contrast on warm backgrounds
  text: "rgba(255,255,255,0.92)",
  textMuted: "rgba(255,255,255,0.68)",

  // Accent Trio (intentional usage)
  cyan: "#38E8FF", // info/interactive
  magenta: "#FF3CF2", // selected / jackpot (kept for special moments)
  purple: "#7B5CFF", // secondary glow, separators
  coral: "#FF5A7A", // error/locked/strike (replaces some red usage)
  red: "#FF5A7A", // alias for coral
  green: "#6CFFB8", // mint - success/confirm
  feltGreen: "#2FB67A", // casino table top - bright!
  amber: "#FFC857", // gold - progress/goal/reward

  // Glow Helpers (Transparent) - used sparingly
  cyanGlow: "rgba(56, 232, 255, 0.4)",
  magentaGlow: "rgba(255, 60, 242, 0.28)",
  purpleGlow: "rgba(123, 92, 255, 0.25)",

  // Legacy mappings for compatibility
  background: "#1E8A63",
  backgroundDark: "#2FB67A",
  gold: "#FFC857",
  goldDark: "#D9A830",
  textWhite: "rgba(255,255,255,0.92)",
  textBlack: "#1E8A63",
} as const;

// Typography
export const TYPOGRAPHY = {
  // Headlines / Buttons (Retro pixel appeal)
  // Fallback to PressStart2P since Silkscreen is not available
  largeScore: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 22,
    color: COLORS.text,
  },
  mediumScore: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 16,
    color: COLORS.text,
  },

  // Numbers / Scores (Clean, stable digits)
  // Using Roboto Mono as requested
  scoreValue: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 18,
    fontWeight: "500" as const,
    color: COLORS.text,
  },

  // Labels (Tile labels)
  label: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Body / Meta
  body: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Legacy
  tinyScore: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: COLORS.text,
  },
  metaInfo: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 12,
    color: COLORS.textMuted,
  },
} as const;

// Spacing
export const SPACING = {
  screenPadding: 8,
  sectionGap: 12,
  slotGapHorizontal: 6,
  slotGapVertical: 6,
  containerPaddingHorizontal: 16,
  containerPaddingVertical: 12,
  buttonPaddingVertical: 14,
} as const;

// Dimensions
export const DIMENSIONS = {
  headerHeight: 60,
  rollButtonHeight: 56, // Slightly taller for prominence
  borderRadius: 14, // Softer, Balatro-style rounded corners
  progressBarHeight: 18,
  borderWidth: 2,
} as const;

// Responsive Helper
export const calculateDiceTrayHeight = (screenHeight: number): number => {
  return Math.round(screenHeight * 0.35); // Slightly larger for CRT screen effect
};

// Slot Visual States - Punchy, minimal glow (Balatro-inspired)
// Glow is RARE - only on selected/primary action
export const SLOT_STATES = {
  empty: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 2,
    shadowColor: "transparent",
  },
  possible: {
    // NO GLOW - just highlighted border
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.cyan,
    borderWidth: 2,
    shadowColor: "transparent", // Removed glow!
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  scratch: {
    // NO GLOW - just red border
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.coral,
    borderWidth: 2,
    shadowColor: "transparent", // Removed glow!
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  selected: {
    // ONLY selected gets glow - feel special
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.cyan,
    borderWidth: 3,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  filled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 2,
    shadowColor: "transparent",
  },
} as const;
