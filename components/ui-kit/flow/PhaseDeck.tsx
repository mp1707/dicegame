import React from "react";
import { View, StyleSheet } from "react-native";
import { useLayout } from "../../../utils/LayoutContext";
import { SPACING } from "../../../constants/theme";
import { useGameStore, GamePhase } from "../../../store/gameStore";

// Import components
import { HUDHeader } from "../../ui/HUDHeader";
import { ItemRow } from "../../ui/ItemRow";
import { TrayWindow } from "../../ui/TrayWindow";
import { ScorePanel } from "../../ui/ScorePanel";
import { BottomPanel } from "../../ui/BottomPanel";
import { FooterControls } from "../../ui/FooterControls";
import { CashoutTrayOverlay } from "../../ui/CashoutTrayOverlay";
import { ShopItemPreviewOverlay } from "../../ui/ShopItemPreviewOverlay";
import { UpgradeTrayOverlay } from "../../ui/UpgradeTrayOverlay";
import { DiceEditorTrayOverlay } from "../../ui/DiceEditorTrayOverlay";
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
 * New Layout (Vertical Stack with gap):
 * 1. HUDHeader (Fixed height - Always Visible)
 * 2. ItemRow (Fixed height - Always Visible)
 * 3. Content Area (flex:1 - Phase-dependent)
 *    - LEVEL_PLAY: TrayWindow + ScorePanel + BottomPanel (ScoringGrid)
 *    - Other phases: BottomPanel only (takes full space)
 * 4. Footer (Fixed height - Always Visible)
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
        return <ShopItemPreviewOverlay />;
      case "SHOP_PICK_UPGRADE":
        return <UpgradeTrayOverlay />;
      case "DICE_EDITOR_DIE":
      case "DICE_EDITOR_FACE":
        return <DiceEditorTrayOverlay />;
      case "LOSE_SCREEN":
        return <LoseTrayOverlay />;
      default:
        return null;
    }
  };

  const trayOverlay = renderTrayOverlay();

  // Determine what to render in the main content area
  const renderContent = () => {
    if (isFullPlayLayout(phase)) {
      // Full gameplay layout: Tray + ScorePanel + ScoringGrid
      return (
        <View style={styles.playLayout}>
          {/* Tray */}
          <View style={{ height: layout.diceTrayHeight }}>
            <TrayWindow overlay={trayOverlay}>{diceTray}</TrayWindow>
          </View>

          {/* Scoring Row */}
          <View style={{ height: layout.scoreRowHeight }}>
            <ScorePanel />
          </View>

          {/* Bottom Panel (ScoringGrid) */}
          <View style={styles.bottomPanelFlex}>
            <BottomPanel />
          </View>
        </View>
      );
    }

    // Simplified layout for all other phases
    // BottomPanel takes the full available space
    // Tray/ScorePanel are hidden - content components handle their own UI
    return (
      <View style={styles.bottomPanelFlex}>
        <BottomPanel />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header (Fixed height - Always Visible) */}
      <View style={[styles.sectionWrapper, { height: layout.headerHeight }]}>
        <HUDHeader />
      </View>

      {/* 2. ItemRow (Fixed height - Always Visible) */}
      <View style={[styles.sectionWrapper, { height: layout.itemRowHeight }]}>
        <ItemRow />
      </View>

      {/* 3. Content Area (flex:1 - Phase-dependent) */}
      <View style={styles.contentBlock}>{renderContent()}</View>

      {/* 4. Footer (Fixed height - Always Visible) */}
      <View style={[styles.sectionWrapper, { height: layout.footerHeight }]}>
        <FooterControls />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.sm, // Unified gap between all major sections
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  sectionWrapper: {
    overflow: "hidden", // Strict containment for fixed-height sections
  },
  contentBlock: {
    flex: 1,
    overflow: "hidden", // Prevent content bleeding
  },
  playLayout: {
    flex: 1,
    gap: SPACING.sm, // Internal gap for Tray/ScorePanel/BottomPanel
  },
  bottomPanelFlex: {
    flex: 1,
  },
});
