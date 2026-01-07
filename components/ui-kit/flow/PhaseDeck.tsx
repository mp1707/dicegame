import React from "react";
import { View, StyleSheet } from "react-native";
import { useLayout } from "../../../utils/LayoutContext";
import { SPACING } from "../../../constants/theme";
import { useGameStore } from "../../../store/gameStore";

// Import components
import { PlayConsole } from "../../ui/PlayConsole";
import { ScoreLip } from "../../ui/ScoreLip";
import { BottomPanel } from "../../ui/BottomPanel";
import { FooterControls } from "../../ui/FooterControls";
import { CashoutTrayOverlay } from "../../ui/CashoutTrayOverlay";
import { ShopTrayOverlay } from "../../ui/ShopTrayOverlay";
import { UpgradeTrayOverlay } from "../../ui/UpgradeTrayOverlay";
import { DiceEditorTrayOverlay } from "../../ui/DiceEditorTrayOverlay";
import { ArtifactEditorTrayOverlay } from "../../ui/ArtifactEditorTrayOverlay";
import { LoseTrayOverlay } from "../../ui/LoseTrayOverlay";

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) - rendered inside PlayConsole */
  diceTray: React.ReactNode;
}

/**
 * PhaseDeck - Simplified game layout orchestrator
 *
 * Architecture:
 * 1. PlayConsole: Always visible - HUDHeader + TrayWindow + ScoreLip
 *    - TrayWindow shows diceTray or phase-specific overlay
 * 2. BottomPanel: Switches content based on phase (ScoringGrid, Shop, etc.)
 * 3. Footer: CTA buttons (phase-aware)
 *
 * Phase-specific tray overlays:
 * - LEVEL_RESULT: CashoutTrayOverlay (title + sum card)
 * - SHOP_MAIN: ShopTrayOverlay (title + subtitle)
 * - SHOP_PICK_UPGRADE: UpgradeTrayOverlay (title + subtitle)
 * - DICE_EDITOR_*: DiceEditorTrayOverlay (title + subtitle + optional die info)
 * - ARTIFACT_EDITOR: ArtifactEditorTrayOverlay (title + subtitle)
 * - Other phases: diceTray (3D scene)
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({ diceTray }) => {
  const layout = useLayout();
  const phase = useGameStore((s) => s.phase);

  // Calculate PlayConsole height: header + tray + scoreLip
  const playConsoleHeight =
    layout.diceTrayHeight + layout.scoreRowHeight + layout.headerHeight;

  // Determine which overlay to show in tray (if any)
  const renderTrayOverlay = () => {
    switch (phase) {
      case "LEVEL_RESULT":
        return <CashoutTrayOverlay />;
      case "SHOP_MAIN":
        return <ShopTrayOverlay />;
      case "SHOP_PICK_UPGRADE":
        return <UpgradeTrayOverlay />;
      case "DICE_EDITOR_DIE":
      case "DICE_EDITOR_FACE":
        return <DiceEditorTrayOverlay />;
      case "ARTIFACT_EDITOR":
        return <ArtifactEditorTrayOverlay />;
      case "LOSE_SCREEN":
        return <LoseTrayOverlay />;
      default:
        return null;
    }
  };

  const trayOverlay = renderTrayOverlay();

  return (
    <View style={styles.container}>
      {/* PlayConsole - ALWAYS VISIBLE */}
      <View style={[styles.playConsoleWrapper, { height: playConsoleHeight }]}>
        <PlayConsole
          diceTray={<View style={styles.diceTrayWrapper}>{diceTray}</View>}
          trayOverlay={trayOverlay}
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
