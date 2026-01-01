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
  goldHighlight: "#FFD985", // Brighter gold for shines
  coral: "#FF5A7A", // Strike / Cancel / Danger / Locked
  mint: "#6CFFB8", // Confirm / Success / Buy

  // Specific usages
  feltGreen: "#2FB67A", // The "Table" felt color (if used)
  shadow: "#1A1528", // Deep purple shadow
  slotBg: "#352B58", // Alias for components using slotBg

  // Tile-specific colors (TileButton only - don't change surface globally)
  tile: "#3A2F5E", // Darker, less saturated than surface
  tilePressed: "#332850", // Slightly darker than tile
  tileDisabled: "#2D2445", // Close to bg but distinct
  tileTextMuted: "#8878B0", // Dimmer than textMuted

  // Legacy mappings for safe-keep
  background: "#2A2242",
  backgroundDark: "#1A1528",
  goldDark: "#d9a93064",
  textWhite: "#FFFFFF",
  textBlack: "#1A1528",
  red: "#FF5A7A",
  green: "#6CFFB8",
  purple: "#7B5CFF",
  magenta: "#FF3CF2",
  amber: "#FFC857",
  cyanGlow: "rgba(77, 238, 234, 0.4)",

  // Overlay colors (for borders, bevels, backgrounds)
  overlays: {
    whiteSubtle: "rgba(255,255,255,0.05)",
    whiteMild: "rgba(255,255,255,0.1)",
    whiteMedium: "rgba(255,255,255,0.15)",
    whiteStrong: "rgba(255,255,255,0.2)",
    blackSubtle: "rgba(0,0,0,0.1)",
    blackMild: "rgba(0,0,0,0.2)",
    blackMedium: "rgba(0,0,0,0.3)",
    blackStrong: "rgba(0,0,0,0.4)",
    backdrop: "rgba(0,0,0,0.7)",
    backdropStrong: "rgba(0,0,0,0.75)",
    cyanSubtle: "rgba(77, 238, 234, 0.1)",
    cyanMild: "rgba(77, 238, 234, 0.15)",
    goldSubtle: "rgba(255, 200, 87, 0.15)",
    goldMild: "rgba(255, 200, 87, 0.3)",
    coralSubtle: "rgba(255, 90, 122, 0.15)",
    coralMild: "rgba(255, 90, 122, 0.3)",
    // Tile-specific overlays
    cyanGlowStrong: "rgba(77, 238, 234, 0.22)", // Active halo effect
    goldStamp: "rgba(255, 200, 87, 0.20)", // Used tile stamp overlay
  },

  // Shadow colors for text glows
  shadows: {
    gold: "rgba(255, 200, 87, 0.3)",
    goldStrong: "rgba(255, 200, 87, 0.5)",
    cyan: "rgba(77, 238, 234, 0.4)",
    black: "rgba(0, 0, 0, 0.6)",
  },

  // Lock outline (screen-space stroke on locked dice)
  lockOutline: {
    outer: "#5a5a5a", // Bright UI-purple
    inner: "#5D4D8F", // Darker purple for separation
    outerAlpha: 0.85,
    innerAlpha: 0.65,
  },
} as const;

// Font family constant
export const FONT_FAMILY = "M6x11-Regular";

// Typography - All M6x1 1 pixel font
export const TYPOGRAPHY = {
  // Display - Big numbers, Headers, "WURF"
  displayHuge: {
    fontFamily: FONT_FAMILY,
    fontSize: 44,
    color: COLORS.text,
  },
  displayLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    color: COLORS.text,
  },
  displayMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    color: COLORS.text,
  },
  displaySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    color: COLORS.text,
  },

  // Scoreboard - retro LED scoreboard numbers
  scoreboardLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    color: COLORS.text,
    fontVariant: ["tabular-nums"] as any,
  },
  scoreboardMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    color: COLORS.text,
    fontVariant: ["tabular-nums"] as any,
  },
  scoreboardSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: COLORS.text,
    fontVariant: ["tabular-nums"] as any,
  },

  // Body text sizes
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: COLORS.text,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: COLORS.text,
  },
  bodySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Labels and captions
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    color: COLORS.textMuted,
  },

  // Button text
  buttonLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    color: COLORS.textDark,
  },
  buttonMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    color: COLORS.textDark,
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: COLORS.textDark,
  },

  // Legacy aliases (for backwards compatibility)
  scoreValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: COLORS.text,
    fontVariant: ["tabular-nums"] as any,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  smallText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: COLORS.textDark,
  },
} as const;

// Spacing - Base scale with semantic aliases
export const SPACING = {
  // Base scale (4px increments)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  // Semantic spacing
  screenPadding: 8,
  sectionGap: 16,
  containerPaddingHorizontal: 16,
  containerPaddingVertical: 12,

  // Grid/Slot spacing
  slotGapHorizontal: 8,
  slotGapVertical: 8,

  // Button spacing
  buttonPaddingVertical: 16,
  buttonPaddingHorizontal: 24,

  // Modal spacing
  modalPadding: 20,
  modalHeaderPadding: 16,

  // Icon gaps
  iconGapSmall: 4,
  iconGapMedium: 6,
  iconGapLarge: 8,
} as const;

// Layout System - Stable game-like proportions (like Balatro)
// All sections defined as percentages of usable screen height
// Reference device: iPhone Air (420×912pt, ~818pt usable)
export const LAYOUT = {
  // Reference dimensions for scaling calculations
  reference: {
    usableHeight: 818, // iPhone Air usable height after safe areas
  },

  // Section weights (percentages of usable height, total = 100)
  weights: {
    header: 8, // ~65pt on reference - Level + money pods
    diceTray: 32, // ~262pt on reference - 3D scene with thermometer
    scoreRow: 6, // ~49pt on reference - Selected hand + formula
    scoringGrid: 38, // ~311pt on reference - 13 hand slots (compact)
    footer: 12, // ~98pt on reference - Stats + CTA button
    // gaps: 4% implicit (100 - 96)
  },

  // Scoring grid internal distribution (ratios within scoringGrid height)
  // 3 equal rows: Special, Upper, Lower - compact for better spacing
  scoring: {
    specialRatio: 0.2, // Special section - 20% of scoring area (compact)
    upperRatio: 0.2, // Upper section (6 slots) - 20%
    lowerRatio: 0.2, // Lower section (6 slots) - 20%
    labelsRatio: 0.09, // Section labels (3% each × 3) get 9%
    gapRatio: 0.31, // Remaining space for gaps/padding
  },

  // Font scaling limits (prevent extremes on very small/large screens)
  minFontScale: 0.7,
  maxFontScale: 1.2,

  // Minimum touch target (accessibility)
  minTouchTarget: 44,
} as const;

// Dimensions
export const DIMENSIONS = {
  // Border radii
  borderRadius: 12,
  borderRadiusSmall: 8,
  borderRadiusLarge: 16,
  borderRadiusRound: 60,

  // Border widths
  borderWidth: 2,
  borderWidthThin: 1,
  borderWidthThick: 3,

  // Component heights
  headerHeight: 64,
  rollButtonHeight: 60,
  progressBarHeight: 20,
  tileHeight: 70,

  // Icon sizes
  iconSize: {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 64,
  },
} as const;

// @deprecated - Use useLayout().diceTrayHeight instead
// Kept for backwards compatibility during migration
export const calculateDiceTrayHeight = (screenHeight: number): number => {
  return Math.round(screenHeight * 0.32);
};

// Slot Visual States - Continuous rounded stroke, "Toy" bevels
export const SLOT_STATES = {
  empty: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.overlays.whiteMild,
    borderWidth: 1,
    borderStyle: "solid",
    // Bevel effect
    borderTopWidth: 1,
    borderTopColor: COLORS.overlays.whiteMedium,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.overlays.blackMedium,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  possible: {
    // Same as empty but allows for preview text updates in component
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.overlays.whiteMild,
    borderWidth: 1,
    borderStyle: "solid",
    // Bevel
    borderTopWidth: 1,
    borderTopColor: COLORS.overlays.whiteMedium,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.overlays.blackMedium,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  scratch: {
    // Eligible tiles in scratch mode: Coral tint + Border
    backgroundColor: COLORS.overlays.coralSubtle,
    borderColor: COLORS.coral,
    borderWidth: 2,
    borderStyle: "solid",
    // Bevel
    borderTopWidth: 1,
    borderTopColor: COLORS.overlays.coralMild,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.overlays.blackMild,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  selected: {
    // Selection: Cyan border + Soft Glow
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.cyan,
    borderWidth: 3,
    borderStyle: "solid",
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    // Bevel (subtle lift)
    borderTopWidth: 1,
    borderTopColor: COLORS.overlays.whiteStrong,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.overlays.blackStrong,
  },
  filled: {
    // Committed: Dim fill, Flat-ish
    backgroundColor: COLORS.bg,
    borderColor: COLORS.overlays.whiteSubtle,
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

// Animation timing constants
export const ANIMATION = {
  // Durations (ms)
  duration: {
    instant: 50,
    fast: 75,
    normal: 100,
    medium: 150,
    slow: 200,
    verySlow: 400,
    fade: 300,
    // Win Moment
    winCTAOut: 180,
    winCTAIn: 220,
    winGoalColor: 240,
    winGoalPopUp: 80,
    winGoalPopSettle: 160,
  },

  // Counting animation (ScoreRow)
  counting: {
    initialDelay: 640,
    perDieDelay: 560,
    handScoreDisplay: 1000,
    totalScoreDisplay: 1600,
    colorFadeDelay: 200,
    colorFadeDuration: 800,
  },

  // Button press timing
  buttonPress: {
    down: 75,
    up: 120,
  },

  // Spring configurations (for reanimated)
  springs: {
    button: { damping: 20, stiffness: 400 },
    modal: { damping: 25, stiffness: 400, mass: 0.8 },
    lamp: { damping: 24, stiffness: 160 },
    slideIn: { damping: 20, stiffness: 200 },
    lampOut: { damping: 26, stiffness: 180 },
  },

  // Highlight/Pulse (Die)
  highlight: {
    pulseDuration: 200,
    peakScale: 1.12,
    attackRatio: 0.35,
  },

  // Goal meter (ScoreRow)
  goalMeter: {
    cyanBarDuration: 180,
    cyanSettleDelay: 40,
    cyanSettleDuration: 120,
    goldBarDelay: 490,
    goldBarDuration: 160,
    goldSettleDelay: 30,
    goldSettleDuration: 100,
    overshootCyan: 1.03,
    overshootGold: 1.05,
  },

  // End screen stagger delays
  endScreen: {
    iconDelay: 200,
    titleDelay: 400,
    subtitleDelay: 600,
    statsDelay: 800,
    buttonDelay: 1000,
    fadeDuration: 400,
  },

  // Lamp indicator
  lamp: {
    staggerDelay: 50,
    fadeIn: 300,
    colorTransition: 300,
  },

  // Tile animations (TileButton)
  tile: {
    breathe: {
      duration: 1600, // Full breathe cycle
      minOpacity: 0.35, // Lowest halo opacity
      maxOpacity: 0.75, // Highest halo opacity
    },
    press: {
      scaleDown: 0.985, // Scale when pressed
    },
    select: {
      shineDuration: 420, // One-shot shine sweep
    },
  },

  // Phase transitions (PhaseDeck sliding panels)
  phase: {
    // Spring config for slide animations (uses springs.slideIn by default)
    springConfig: { damping: 22, stiffness: 180 },
    // Parallax ratios for HUD elements (how far they move relative to screen width)
    parallax: {
      trayModule: 0.5, // Moves 50% of screen width (furthest back)
      scoreRow: 0.6, // Moves 60% of screen width
      scoringGrid: 0.75, // Moves 75% of screen width
      footer: 0.9, // Moves 90% of screen width (closest to viewer)
    },
  },

  // Lock outline (die lock visual feedback)
  lockOutline: {
    // Lock ON animation
    drawIn: 120, // ms - outline draw-in/fade-in
    popUp: { scale: 1.06, duration: 70 },
    popDown: { duration: 110 },
    // Lock OFF animation
    fadeOut: 90, // ms - outline fade out
    popDownOff: { scale: 0.97, duration: 60 },
    popUpOff: { duration: 90 },
    // Idle pulse (step-like, not breathing)
    pulseInterval: 1400, // ms between pulses
    pulseAlphaDown: 0.7,
    pulseAlphaUp: 0.85,
    pulseDuration: 120, // ms for each alpha step
    // Multi-dice dampening
    maxAlpha: 0.9,
    multiDiceAmplitudeReduction: 0.3, // 30% reduction for 3+ dice
  },
} as const;

// Physics constants for 3D dice
export const PHYSICS = {
  die: {
    size: 0.8,
    restitution: 0.08,
    friction: 0.9,
    linearDamping: 0.35,
    angularDamping: 0.6,
    pipRadiusRatio: 0.08,
    pipOffsetRatio: 0.25,
    metalnessUnlocked: 0.1,
    metalnessLocked: 0.6,
    roughnessUnlocked: 0.4,
    roughnessLocked: 0.2,
  },

  reveal: {
    positionLerpSpeed: 8,
    deltaCapMs: 33,
    lockedScale: 1.1,
  },

  settle: {
    speedThreshold: 0.05,
    spinThreshold: 0.1,
    stableTimeRequired: 0.15,
  },

  roll: {
    impulseYMin: -2,
    impulseYMax: -1.2,
    impulseXZMin: -0.35,
    impulseXZMax: 0.35,
    torqueMin: -0.8,
    torqueMax: 0.8,
  },

  camera: {
    revealZoomRatio: 0.6,
  },
} as const;

// Haptics configuration
export const HAPTICS = {
  actions: {
    selection: "selection" as const,
    buttonPress: "light" as const,
    buttonConfirm: "medium" as const,
    scoreTick: "selection" as const,
    handScoreReveal: "selection" as const,
    totalScoreReveal: "light" as const,
    goalReached: "success" as const,
    warning: "warning" as const,
  },
} as const;
