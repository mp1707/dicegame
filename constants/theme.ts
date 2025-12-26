/**
 * Theme constants for Roguelike Yahtzee
 * Based on Balatro Vibe Code (Bright Felt + Warm Casino Neon)
 */

import { Platform, TextStyle } from "react-native";

// Color Palette - Bolder, Warmer, Tactile
export const COLORS = {
  // Backgrounds
  bg: "#2A2242", // Deep warm violet (Eggplant) - Main Background
  bg2: "#3C325B", // Slightly lighter violet for layering

  // Surfaces (Panels/Cards)
  surface: "#352B58", // Primary panel color
  surface2: "#4A3D7A", // Secondary panel / inactive slot
  surfaceHighlight: "#5D4D8F", // Hover/Active state base

  // Borders
  border: "#5D4D8F", // Standard border
  borderHighlight: "#8874C4", // Highlighted border

  // Text
  text: "#FFFFFF", // Primary text (high contrast)
  textMuted: "#AA9ECF", // Secondary text (soft purple-grey)
  textDark: "#1A1528", // Text on bright/neon backgrounds

  // Accent Trio (The "Fun" Layer)
  cyan: "#4DEEEA", // Info / Selection / Neutral interactable
  gold: "#FFC857", // Goals / Progress / Best option / Money
  coral: "#FF5A7A", // Strike / Cancel / Danger / Locked
  mint: "#6CFFB8", // Confirm / Success / Buy

  // Specific usages
  feltGreen: "#2FB67A", // The "Table" felt color (if used)
  shadow: "#1A1528", // Deep purple shadow
  slotBg: "#352B58", // Alias for components using slotBg

  // Legacy mappings for safe-keep
  background: "#2A2242",
  backgroundDark: "#1A1528",
  goldDark: "#D9A830",
  textWhite: "#FFFFFF",
  textBlack: "#1A1528",
  red: "#FF5A7A",
  green: "#6CFFB8",
  purple: "#7B5CFF",
  magenta: "#FF3CF2",
  amber: "#FFC857",
  cyanGlow: "rgba(77, 238, 234, 0.4)",
} as const;

// Typography - Split into Display (Bungee) and UI (Inter)
export const TYPOGRAPHY = {
  // Display - Big numbers, Headers, "WURF"
  displayHuge: {
    fontFamily: "Bungee-Regular",
    fontSize: 44,
    color: COLORS.text,
  },
  displayLarge: {
    fontFamily: "Bungee-Regular",
    fontSize: 32,
    color: COLORS.text,
  },
  displayMedium: {
    fontFamily: "Bungee-Regular",
    fontSize: 24, // Use for "WURF"
    color: COLORS.text,
  },
  displaySmall: {
    fontFamily: "Bungee-Regular",
    fontSize: 16,
    color: COLORS.text,
  },

  // UI - Labels, readable numbers, body
  // Inter supports tabular numbers (tnum) by default features usually, or we ensure mono-look
  scoreValue: {
    fontFamily: "Inter-Bold",
    fontSize: 14, // Slightly bigger
    color: COLORS.text,
    fontVariant: ["tabular-nums"] as any, // Tabular numbers! Cast to any to avoid readonly issues
  },
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  button: {
    fontFamily: "Bungee-Regular",
    fontSize: 18,
    color: COLORS.textDark,
  },
} as const;

// Spacing
export const SPACING = {
  screenPadding: 8,
  sectionGap: 16,
  slotGapHorizontal: 8,
  slotGapVertical: 8,
  containerPaddingHorizontal: 16,
  containerPaddingVertical: 12,
  buttonPaddingVertical: 16,
} as const;

// Dimensions
export const DIMENSIONS = {
  headerHeight: 64,
  rollButtonHeight: 60, // Beefy button
  borderRadius: 12, // Compact radius
  borderRadiusSmall: 8,
  progressBarHeight: 20,
  borderWidth: 2, // Thicker borders for "tactile" feel
} as const;

// Responsive Helper
export const calculateDiceTrayHeight = (screenHeight: number): number => {
  return Math.round(screenHeight * 0.32); // Slightly tighter dice area
};

// Slot Visual States - Solid, Tactile, No excessive glow
// Slot Visual States - Continuous rounded stroke, "Toy" bevels, No brackets
export const SLOT_STATES = {
  empty: {
    backgroundColor: COLORS.surface2,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderStyle: "solid",
    // Bevel effect
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.3)",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  possible: {
    // Same as empty but allows for preview text updates in component
    backgroundColor: COLORS.surface2,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderStyle: "solid",
    // Bevel
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.3)",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  scratch: {
    // Eligible tiles in scratch mode: Coral tint + Border
    backgroundColor: "rgba(255, 90, 122, 0.15)",
    borderColor: COLORS.coral,
    borderWidth: 2,
    borderStyle: "solid",
    // Bevel
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 90, 122, 0.3)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.2)",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  selected: {
    // Selection: Cyan border + Soft Glow, No brackets
    backgroundColor: COLORS.surfaceHighlight, // Slightly brighter
    borderColor: COLORS.cyan,
    borderWidth: 3,
    borderStyle: "solid", // Continuous stroke
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    // Bevel (subtle lift)
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.4)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.4)",
  },
  filled: {
    // Committed: Dim fill, Flat-ish
    backgroundColor: COLORS.bg, // Recessed look
    borderColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderStyle: "solid",
    opacity: 0.8,
    shadowColor: "transparent",
    // Minimal bevel
    borderTopWidth: 0,
    borderTopColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
} as const;
