/**
 * Theme constants for Roguelike Yahtzee
 * Based on GAME.md design specification
 */

// Functional Colors
export const COLORS = {
  // Cyan - Active states, titles, glows
  cyan: "#00FFFF",
  cyanDark: "#00CCCC",
  cyanGlow: "rgba(0, 255, 255, 0.3)",
  cyanBorder: "rgba(0, 255, 255, 0.6)",

  // Gold - Progress, scores, primary button
  gold: "#FFD700",
  goldDark: "#B8860B",
  mutedGold: "#A08000",

  // Yellow - Selected dice
  selectedDie: "#FFD700",

  // Red - Scratch, zero scores
  red: "#FF4444",
  redDark: "#991B1B",

  // Green - Win state, shop button
  green: "#22C55E",

  // Neutrals
  darkBg: "rgba(20, 20, 25, 0.95)",
  slotBg: "rgba(30, 30, 35, 0.9)",
  filledBg: "rgba(15, 15, 18, 0.95)",
  slotBorder: "#3D3D3D",
  filledBorder: "#2A2A2F",
  textMuted: "rgba(255, 255, 255, 0.3)",
  textLight: "rgba(255, 255, 255, 0.7)",
  textWhite: "#FFFFFF",
  textBlack: "#000000",

  // Backgrounds
  background: "#000000",
  backgroundDark: "#111111",
  backgroundMedium: "#1a1a1a",
} as const;

// Typography scale
export const TYPOGRAPHY = {
  // Press Start 2P equivalents (using system fonts for now)
  largeScore: { fontSize: 24, fontWeight: "900" as const },
  mediumScore: { fontSize: 16, fontWeight: "900" as const },
  smallScore: { fontSize: 12, fontWeight: "900" as const },
  tinyScore: { fontSize: 10, fontWeight: "900" as const },

  // Roboto Mono equivalents
  labels: { fontSize: 13, fontWeight: "500" as const },
  metaInfo: { fontSize: 12, fontWeight: "400" as const },
  microLabels: { fontSize: 8, fontWeight: "400" as const },
} as const;

// Spacing
export const SPACING = {
  screenPadding: 8,
  sectionGap: 8,
  slotGapHorizontal: 6,
  slotGapVertical: 4,
  containerPaddingHorizontal: 16,
  containerPaddingVertical: 12,
  buttonPaddingVertical: 14,
} as const;

// Component dimensions
export const DIMENSIONS = {
  headerHeight: 80,
  diceTrayHeight: 180, // Deprecated: use calculateDiceTrayHeight() for responsive sizing
  upperSlotHeight: 80,
  lowerSlotHeight: 44,
  footerHeight: 70,
  rollButtonHeight: 48,
  borderRadius: 6,
  progressBarHeight: 24,
} as const;

/**
 * Calculate responsive dice tray height based on available screen space
 * @param screenHeight - Total screen height from useWindowDimensions
 * @param minScoringSpace - Minimum space required for scoring UI (default: 250)
 * @returns Calculated dice tray height in pixels
 */
export const calculateDiceTrayHeight = (
  screenHeight: number,
  minScoringSpace: number = 250
): number => {
  // Calculate available space after fixed UI elements
  const fixedUISpace = DIMENSIONS.headerHeight + DIMENSIONS.footerHeight;
  const availableSpace = screenHeight - fixedUISpace;

  // Allocate 45% of available space to dice tray
  const allocatedHeight = Math.floor(availableSpace * 0.45);

  // Ensure minimum dice tray height of 220px for visibility
  const minDiceTrayHeight = 220;
  const clampedHeight = Math.max(allocatedHeight, minDiceTrayHeight);

  // Ensure scoring section gets minimum required space
  if (availableSpace - clampedHeight < minScoringSpace) {
    return Math.max(availableSpace - minScoringSpace, minDiceTrayHeight);
  }

  return clampedHeight;
};

// Slot visual states
export const SLOT_STATES = {
  active: {
    borderColor: COLORS.cyanBorder,
    borderWidth: 2,
    backgroundColor: COLORS.cyanGlow,
    textColor: COLORS.cyan,
    showCheckmark: true,
  },
  filled: {
    borderColor: COLORS.filledBorder,
    borderWidth: 1,
    backgroundColor: COLORS.filledBg,
    textColor: COLORS.mutedGold,
    showCheckmark: false,
  },
  empty: {
    borderColor: COLORS.slotBorder,
    borderWidth: 1,
    backgroundColor: COLORS.slotBg,
    textColor: COLORS.textMuted,
    showCheckmark: false,
  },
} as const;
