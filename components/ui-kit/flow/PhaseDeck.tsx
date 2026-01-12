import React from "react";
import { View, StyleSheet } from "react-native";
import { useLayout } from "../../../utils/LayoutContext";
import { SPACING } from "../../../constants/theme";
import { useGameStore, GamePhase } from "../../../store/gameStore";

// Import components
import { TopMenuStrip } from "../../ui/TopMenuStrip";
import { ItemRow } from "../../ui/ItemRow";
import { TrayWindow } from "../../ui/TrayWindow";
import { BottomPanel } from "../../ui/BottomPanel";
import { FooterControls } from "../../ui/FooterControls";
import { CashoutTrayOverlay } from "../../ui/CashoutTrayOverlay";
import { ShopTrayOverlay } from "../../ui/ShopTrayOverlay";
import { UpgradeTrayOverlay } from "../../ui/UpgradeTrayOverlay";
import { LoseTrayOverlay } from "../../ui/LoseTrayOverlay";

/**
 * Helper to determine if we show full gameplay layout (Tray + ScorePanel + ScoringGrid)
 * Only LEVEL_PLAY gets the full layout with dice tray visible
 */
const isFullPlayLayout = (phase: GamePhase): boolean => {
  return phase === "LEVEL_PLAY";
};

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) */
  diceTray: React.ReactNode;
}

/**
 * PhaseDeck - Orchestrator for the game layout
 *
 * Layout (Vertical Stack with gap):
 * 1. TopMenuStrip (Fixed height - Always Visible) - Level/Money/Score/Hands/Rolls/Goal
 * 2. Content Area (flex:1 - Phase-dependent)
 *    - LEVEL_PLAY: TrayWindow + ItemRow + BottomPanel (ScoringGrid)
 *    - Other phases: ItemRow + BottomPanel only
 * 3. Footer (Fixed height - Always Visible)
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({ diceTray }) => {
  const layout = useLayout();
  const phase = useGameStore((s) => s.phase);

  // Helper to render the tray overlay (only used in LEVEL_PLAY phase)
  const renderTrayOverlay = () => {
    switch (phase) {
      case "LEVEL_RESULT":
        return <CashoutTrayOverlay />;
      case "SHOP_MAIN":
        return <ShopTrayOverlay />;
      case "SHOP_PICK_UPGRADE":
        return <UpgradeTrayOverlay />;
      case "LOSE_SCREEN":
        return <LoseTrayOverlay />;
      default:
        return null;
    }
  };

  const trayOverlay = renderTrayOverlay();

  // Determine what to render in the main content area
  // ItemRow is now rendered at the top level, so content is Tray + ScoringGrid only
  const renderContent = () => {
    if (isFullPlayLayout(phase)) {
      // Full gameplay layout: Tray + ScoringGrid (ItemRow is above, ScorePanel is in TopMenuStrip)
      return (
        <View style={styles.playLayout}>
          {/* Tray */}
          <View style={{ height: layout.diceTrayHeight }}>
            <TrayWindow overlay={trayOverlay}>{diceTray}</TrayWindow>
          </View>

          {/* Bottom Panel (ScoringGrid) - WITH PADDING */}
          <View style={[styles.bottomPanelFlex, styles.paddedSection]}>
            <BottomPanel />
          </View>
        </View>
      );
    }

    // Simplified layout for all other phases: BottomPanel only
    // ItemRow is already rendered at top level
    return (
      <View style={[styles.bottomPanelFlex, styles.paddedSection]}>
        <BottomPanel />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TopMenuStrip (Fixed height - Always Visible) - FULL BLEED */}
      <View style={[styles.sectionWrapper, { height: layout.topStripHeight }]}>
        <TopMenuStrip />
      </View>

      {/* 2. ItemRow (Fixed height - Always Visible) - WITH PADDING */}
      <View
        style={[
          styles.sectionWrapper,
          styles.paddedSection,
          { height: layout.itemRowHeight },
        ]}
      >
        <ItemRow />
      </View>

      {/* 3. Content Area (flex:1 - Phase-dependent) */}
      <View style={styles.contentBlock}>{renderContent()}</View>

      {/* 4. Footer (Fixed height - Always Visible) */}
      <View
        style={[
          styles.sectionWrapper,
          styles.paddedSection,
          { height: layout.footerHeight },
        ]}
      >
        <FooterControls />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.sm, // Unified gap between all major sections
    // No horizontal padding - TopMenuStrip goes full bleed
    paddingVertical: SPACING.sm,
  },
  sectionWrapper: {
    overflow: "hidden", // Strict containment for fixed-height sections
  },
  paddedSection: {
    paddingHorizontal: SPACING.sm, // Horizontal padding for non-full-bleed sections
  },
  contentBlock: {
    flex: 1,
    overflow: "hidden", // Prevent content bleeding
  },
  playLayout: {
    flex: 1,
    gap: SPACING.sm, // Internal gap for Tray/ScoringGrid
  },
  bottomPanelFlex: {
    flex: 1,
  },
});
