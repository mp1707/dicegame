import React from "react";
import { StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";

// Import content components
import { ScoringGrid } from "../scoring/ScoringGrid";
import { CashoutResultList } from "./CashoutResultList";
import { ShopContent } from "./ShopContent";
import { UpgradeContent } from "./UpgradeContent";
import { EndContent } from "./EndContent";

// Animation timing
const SLIDE_DURATION = 250;

/**
 * BottomPanel - Switches content based on game phase
 *
 * Renders the appropriate component for the bottom area of the game screen:
 * - LEVEL_PLAY: ScoringGrid (hand selection)
 * - LEVEL_RESULT: CashoutResultList (reward breakdown)
 * - SHOP_MAIN: ShopContent (compact shop)
 * - SHOP_PICK_UPGRADE: UpgradeContent (upgrade picker)
 * - WIN_SCREEN/LOSE_SCREEN: EndContent (game end)
 *
 * Animation: Content slides out to the right, new content slides in from left.
 * This creates a consistent "forward" flow through game phases.
 */
export const BottomPanel: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  const renderContent = () => {
    switch (phase) {
      case "LEVEL_PLAY":
        return <ScoringGrid />;
      case "LEVEL_RESULT":
        return <CashoutResultList />;
      case "SHOP_MAIN":
        return <ShopContent />;
      case "SHOP_PICK_UPGRADE":
        return <UpgradeContent />;
      case "WIN_SCREEN":
      case "LOSE_SCREEN":
        return <EndContent />;
      default:
        return <ScoringGrid />;
    }
  };

  return (
    <Animated.View
      key={phase}
      entering={SlideInLeft.duration(SLIDE_DURATION)}
      exiting={SlideOutRight.duration(SLIDE_DURATION)}
      style={styles.container}
    >
      {renderContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
