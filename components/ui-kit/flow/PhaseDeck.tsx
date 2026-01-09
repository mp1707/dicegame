import React from "react";
import { View, StyleSheet } from "react-native";
import { useLayout } from "../../../utils/LayoutContext";
import { SPACING } from "../../../constants/theme";
import { useGameStore } from "../../../store/gameStore";

// Import components
import { HUDHeader } from "../../ui/HUDHeader";
import { ItemRow } from "../../ui/ItemRow";
import { TrayWindow } from "../../ui/TrayWindow";
import { ScorePanel } from "../../ui/ScorePanel"; // Renamed visually to ScoringRow usage
import { BottomPanel } from "../../ui/BottomPanel"; // Contains ScoringGrid usually
import { FooterControls } from "../../ui/FooterControls";
import { CashoutTrayOverlay } from "../../ui/CashoutTrayOverlay";
import { ShopItemPreviewOverlay } from "../../ui/ShopItemPreviewOverlay";
import { UpgradeTrayOverlay } from "../../ui/UpgradeTrayOverlay";
import { DiceEditorTrayOverlay } from "../../ui/DiceEditorTrayOverlay";
import { LoseTrayOverlay } from "../../ui/LoseTrayOverlay";
import { ShopContent } from "../../ui/ShopContent";

// Helper to determine active content
const getContentForPhase = (phase: string) => {
  // Logic to determine what renders in the "Main Content" area
  // LEVEL_PLAY: TrayWindow + ScorePanel + BottomPanel (ScoringGrid)
  // But wait, PhaseDeck original had BottomPanel AFTER PlayConsole.
  // User wants "get rid of PlayConsole".
  // So we stack: HUDHeader -> ItemRow -> [Content] -> Footer
};

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) */
  diceTray: React.ReactNode;
}

/**
 * PhaseDeck - Orchestrator for the game layout
 *
 * New Layout (Vertical Stack):
 * 1. HUDHeader (Always Visible)
 * 2. ItemRow (Always Visible)
 * 3. Content Area (Swappable based on Phase)
 *    - LEVEL_PLAY: TrayWindow -> Seam -> ScorePanel -> Seam -> BottomPanel(ScoringGrid)
 *    - SHOP: ShopContent (replaces Tray+Score+Grid)
 *    - EDITOR: EditorContent + TrayWindow(? or custom view)
 * 4. Footer (Always Visible)
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({ diceTray }) => {
  const layout = useLayout();
  const phase = useGameStore((s) => s.phase);

  // Helper to render the tray overlay
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
    // If we are in specific "fullscreen" modes (Shop, etc) that replace the play area
    // Note: User said "header and inventory row stay... not the full playConsole"
    // So Shop should replace Tray + ScorePanel.

    if (phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE") {
      // Shop View
      // We use BottomPanel for shop? No, usually ShopContent was IN BottomPanel before?
      // Original PhaseDeck: PlayConsole + BottomPanel.
      // If Shop, PlayConsole showed TrayOverlay, BottomPanel showed ShopContent.
      // User wants separation.
      // Construct:
      // TrayWindow (with overlay) + ShopContent?
      // Or pure ShopContent taking full space?
      // "only the header and inventory row stay" implies the REST is swappable.
      // So we probably want the Shop to take the full remaining space.

      // HOWEVER, Shop usually needs the DiceTray to preview dice!
      // In previous design, Tray was visible with Overlay.
      // If we remove TrayWindow, where is diceTray?
      // We can render TrayWindow as part of the "Shop Layout".

      return (
        <View style={styles.flexContent}>
          {/* Shop preserves Tray visibility? User said "header and inventory row stay... not the full playConsole".
                    This implies PlayConsole (Tray+Score) is GONE/Swapped.
                    But if we need Tray, we must include it in the swapped content.
                */}
          <View style={[styles.trayWrapper, { height: layout.diceTrayHeight }]}>
            <TrayWindow overlay={trayOverlay}>{diceTray}</TrayWindow>
          </View>

          <View style={styles.seamDivider}>
            <View style={styles.seamHighlight} />
            <View style={styles.seamShadow} />
          </View>

          {/* Bottom Panel (Shop Grid) */}
          <View style={{ flex: 1 }}>
            <BottomPanel />
          </View>
        </View>
      );
    }

    // Default Gameplay Layout
    return (
      <View style={styles.flexContent}>
        {/* Tray */}
        <View style={[styles.trayWrapper, { height: layout.diceTrayHeight }]}>
          <TrayWindow overlay={trayOverlay}>{diceTray}</TrayWindow>
        </View>

        {/* Seam */}
        <View style={styles.seamDivider}>
          <View style={styles.seamHighlight} />
          <View style={styles.seamShadow} />
        </View>

        {/* Scoring Row */}
        <View style={{ height: layout.scoreRowHeight }}>
          <ScorePanel />
        </View>

        {/* Seam */}
        <View style={styles.seamDivider}>
          <View style={styles.seamHighlight} />
          <View style={styles.seamShadow} />
        </View>

        {/* Bottom Panel (Scoring Grid / Hand Slots) */}
        <View style={{ flex: 1 }}>
          <BottomPanel />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Stack: Header (Always Visible) */}
      <View style={{ height: layout.headerHeight }}>
        <HUDHeader />
      </View>

      {/* Spacer */}
      <View style={{ height: SPACING.sm }} />

      {/* 2. Stack: ItemRow (Always Visible) */}
      <View style={{ height: layout.itemRowHeight }}>
        <ItemRow />
      </View>

      {/* Spacer */}
      <View style={{ height: SPACING.sm }} />

      {/* 3. Stack: Swappable Content */}
      <View style={[styles.flexContent, { overflow: "hidden" }]}>
        {renderContent()}
      </View>

      {/* Spacer */}
      <View style={{ height: SPACING.sm }} />

      {/* 4. Footer (Always Visible) */}
      <View style={[styles.footerLayer, { height: layout.footerHeight }]}>
        <FooterControls />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.sm, // Outer padding for frame effect
    paddingVertical: SPACING.sm,
    // Gap handled by spacers
  },
  // We removed the big PlayConsole Surface.
  // Now we have independent blocks.
  // We can adding "gap" in container to separate the rows visually as requested ("seperate visual containers").

  flexContent: {
    flex: 1,
    overflow: "hidden", // Ensure tray/content doesn't bleed
    borderRadius: 12, // Optional rounding for the content block
    gap: SPACING.sm, // Add internal gap for Tray/Score/Grid separation
  },
  trayWrapper: {
    marginBottom: 0,
  },
  // === Seam Dividers ===
  seamDivider: {
    height: 3,
    flexDirection: "row",
    opacity: 0.5, // Faint seam between blocks?
    // actually, if we want separate visual containers, maybe we use gap instead of seams?
    // User said "seperate rows... all are seperate visual containers now".
    // This implies we don't seam them together into one big panel.
    // So we should rely on the `gap` in `container` and `borderRadius` on individual components.
    display: "none",
  },
  seamHighlight: { flex: 1 },
  seamShadow: { position: "absolute" },

  footerLayer: {
    justifyContent: "center",
  },
});
