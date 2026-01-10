/**
 * Layout Units Hook - Stable game-like proportions
 *
 * Calculates all layout dimensions based on screen size.
 * All sections scale proportionally.
 *
 * Reference device: iPhone Air (420×912pt, ~818pt usable)
 */

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LAYOUT } from "../constants/theme";

export interface LayoutUnits {
  // Computed section heights (in points)
  topStripHeight: number; // Renamed from headerHeight - contains Level/Money/Score/Hands/Rolls/Goal
  itemRowHeight: number;
  diceTrayHeight: number;
  // scoreRowHeight removed - integrated into topStrip
  scoringGridHeight: number;
  footerHeight: number;

  // Slot heights within scoring grid (2 rows: Upper, Lower)
  upperSlotHeight: number;
  lowerSlotHeight: number;
  sectionLabelHeight: number;

  // Font scale factor (for GameText)
  fontScale: number;

  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  usableHeight: number;

  // Safe area insets
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useLayoutUnits = (): LayoutUnits => {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Calculate usable height after safe areas
  const usableHeight = screenHeight - insets.top - insets.bottom;

  // One "design unit" = 1% of usable height
  const unit = usableHeight / 100;

  // Font scale: ratio of current usable height to reference height
  // Clamped to prevent extremes on very small/large screens
  const fontScale = Math.max(
    LAYOUT.minFontScale,
    Math.min(LAYOUT.maxFontScale, usableHeight / LAYOUT.reference.usableHeight)
  );

  // Calculate section heights from weights
  const { weights, scoring } = LAYOUT;
  const topStripHeight = unit * weights.topStrip; // Renamed from headerHeight
  const itemRowHeight = unit * weights.itemRow;
  const diceTrayHeight = unit * weights.diceTray;
  // scoreRowHeight removed - integrated into topStrip
  const scoringGridHeight = unit * weights.scoringGrid;
  const footerHeight = unit * weights.footer;

  // Calculate slot heights within scoring grid
  // 2 rows: Upper (6 slots), Lower (6 slots) - items moved to ScorePanel
  const upperSectionHeight = scoringGridHeight * scoring.upperRatio;
  const lowerSectionHeight = scoringGridHeight * scoring.lowerRatio;
  const sectionLabelHeight = (scoringGridHeight * scoring.labelsRatio) / 2; // Divided by 2 for each label

  // Each row height = its section height (single row per section)
  const upperSlotHeight = upperSectionHeight;
  const lowerSlotHeight = lowerSectionHeight;

  // P3.3: Memoize return value to prevent unnecessary child re-renders
  return useMemo(
    () => ({
      // Section heights
      topStripHeight, // Renamed from headerHeight
      itemRowHeight,
      diceTrayHeight,
      // scoreRowHeight removed - integrated into topStrip
      scoringGridHeight,
      footerHeight,

      // Slot heights (2 rows: Upper, Lower)
      upperSlotHeight,
      lowerSlotHeight,
      sectionLabelHeight,

      // Scaling
      fontScale,

      // Dimensions
      screenWidth,
      screenHeight,
      usableHeight,

      // Insets
      insets: {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      },
    }),
    [
      topStripHeight,
      itemRowHeight,
      diceTrayHeight,
      scoringGridHeight,
      footerHeight,
      upperSlotHeight,
      lowerSlotHeight,
      sectionLabelHeight,
      fontScale,
      screenWidth,
      screenHeight,
      usableHeight,
      insets.top,
      insets.bottom,
      insets.left,
      insets.right,
    ]
  );
};
