import React from "react";
import { View, StyleSheet } from "react-native";
import { useLayout } from "../../../utils/LayoutContext";
import { SPACING } from "../../../constants/theme";

// Import components
import { PlayConsole } from "../../ui/PlayConsole";
import { ScoreLip } from "../../ui/ScoreLip";
import { BottomPanel } from "../../ui/BottomPanel";
import { FooterControls } from "../../ui/FooterControls";

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) - rendered inside PlayConsole */
  diceTray: React.ReactNode;
}

/**
 * PhaseDeck - Simplified game layout orchestrator
 *
 * Architecture:
 * 1. PlayConsole: Always visible - HUDHeader + TrayWindow + ScoreLip
 * 2. BottomPanel: Switches content based on phase (ScoringGrid, Shop, etc.)
 * 3. Footer: CTA buttons (phase-aware)
 *
 * No parallax animations or full-screen overlays.
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({ diceTray }) => {
  const layout = useLayout();

  // Calculate PlayConsole height: header + tray + scoreLip
  const playConsoleHeight =
    layout.diceTrayHeight + layout.scoreRowHeight + layout.headerHeight;

  return (
    <View style={styles.container}>
      {/* PlayConsole - ALWAYS VISIBLE */}
      <View style={[styles.playConsoleWrapper, { height: playConsoleHeight }]}>
        <PlayConsole
          diceTray={<View style={styles.diceTrayWrapper}>{diceTray}</View>}
          scoreLip={<ScoreLip />}
        />
      </View>

      {/* Bottom Panel - Content switches by phase */}
      <View style={[styles.bottomPanel, { height: layout.scoringGridHeight }]}>
        <BottomPanel />
      </View>

      {/* Footer - Phase-aware CTA */}
      <View style={[styles.footerLayer, { height: layout.footerHeight }]}>
        <FooterControls />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playConsoleWrapper: {
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
  },
  diceTrayWrapper: {
    flex: 1,
    width: "100%",
  },
  bottomPanel: {
    marginTop: SPACING.sectionGap,
    overflow: "hidden",
  },
  footerLayer: {
    justifyContent: "center",
    marginTop: SPACING.sectionGap,
  },
});
