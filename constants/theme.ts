/**
 * Theme constants for Roguelike Yahtzee
 * Based on CRT Arcade UI Direction
 */

import { Platform } from "react-native";

// Color Palette
export const COLORS = {
  // Neutrals
  bg: "#070612", // deep violet-black
  bg2: "#0B0A1D", // slightly lighter for gradients
  surface: "#12102A", // panels
  surface2: "#19163A", // tiles
  border: "#2A2457", // outlines
  slotBg: "#19163A", // alias for slot backgrounds

  // Text
  text: "#F2F4FF",
  textMuted: "#A6A8C9",

  // Neon Accents
  cyan: "#20E7FF", // possible / active
  magenta: "#FF3CF2", // selected / jackpot
  purple: "#7B5CFF", // secondary glow, separators
  red: "#FF3B4D", // delete/strike only
  green: "#00FF99", // success / shop
  amber: "#FFC857", // money/goal/progress (warm contrast)

  // Glow Helpers (Transparent)
  cyanGlow: "rgba(32, 231, 255, 0.35)",
  magentaGlow: "rgba(255, 60, 242, 0.28)",
  purpleGlow: "rgba(123, 92, 255, 0.25)",

  // Legacy mappings for compatibility (will refactor gradually)
  background: "#070612",
  backgroundDark: "#0B0A1D", // Mapping to bg2
  gold: "#FFC857", // Mapping to amber
  goldDark: "#D9A830",
  textWhite: "#F2F4FF",
  textBlack: "#070612",
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
  headerHeight: 60, // Reduced for cleaner look
  rollButtonHeight: 52,
  borderRadius: 4, // More squared off for arcade feel
  progressBarHeight: 18,
  borderWidth: 2,
} as const;

// Responsive Helper
export const calculateDiceTrayHeight = (screenHeight: number): number => {
  return Math.round(screenHeight * 0.35); // Slightly larger for CRT screen effect
};

// Slot Visual States (Arcade Glass Style)
export const SLOT_STATES = {
  empty: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.border,
    borderWidth: 2,
    shadowColor: "transparent",
  },
  possible: {
    backgroundColor: COLORS.surface2, // Base
    borderColor: COLORS.cyan,
    borderWidth: 2,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4, // Android glow approximation
  },
  scratch: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.red,
    borderWidth: 2,
    shadowColor: COLORS.red,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  selected: {
    backgroundColor: "#1F1A45", // surface2 + touch of purple
    borderColor: COLORS.magenta,
    borderWidth: 3, // Thicker
    shadowColor: COLORS.magenta,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  filled: {
    backgroundColor: COLORS.surface, // Darker
    borderColor: COLORS.border, // Reset border
    borderWidth: 2,
    shadowColor: "transparent",
  },
} as const;
