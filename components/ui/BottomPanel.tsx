import React from "react";
import { StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";
import { ANIMATION } from "../../constants/theme";

// Import content components
import { ScoringGrid } from "../scoring/ScoringGrid";
import { CashoutRewardsPanel } from "./CashoutRewardsPanel";
import { ShopContent } from "./ShopContent";
import { UpgradeContent } from "./UpgradeContent";
import { EndContent } from "./EndContent";

// Spring-based animation config
const { springConfig } = ANIMATION.phase;
const { incomingDelay } = ANIMATION.transition;

/**
 * BottomPanel - Switches content based on game phase
 *
 * Renders the appropriate component for the bottom area of the game screen:
 * - LEVEL_PLAY: ScoringGrid (hand selection)
 * - LEVEL_RESULT: CashoutRewardsPanel (reward breakdown with animations)
 * - SHOP_MAIN: ShopContent (compact shop)
 * - SHOP_PICK_UPGRADE: UpgradeContent (upgrade picker)
 * - WIN_SCREEN/LOSE_SCREEN: EndContent (game end)
 *
 * Animation: Spring-based transitions with staggered timing.
 * Outgoing panel exits immediately, incoming panel has slight delay for follow-through.
 */
export const BottomPanel: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  const renderContent = () => {
    switch (phase) {
      case "LEVEL_PLAY":
        return <ScoringGrid />;
      case "LEVEL_RESULT":
        return <CashoutRewardsPanel />;
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

  // Spring-based entering animation with delay
  const enteringAnimation = SlideInLeft
    .springify()
    .damping(springConfig.damping)
    .stiffness(springConfig.stiffness)
    .delay(incomingDelay);

  // Spring-based exiting animation (immediate, no delay)
  const exitingAnimation = SlideOutRight
    .springify()
    .damping(springConfig.damping)
    .stiffness(springConfig.stiffness);

  return (
    <Animated.View
      key={phase}
      entering={enteringAnimation}
      exiting={exitingAnimation}
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
