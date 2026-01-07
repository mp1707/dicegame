import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SlideInLeft,
  SlideOutRight,
  Easing,
} from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";
import { ANIMATION } from "../../constants/theme";

// Import content components
import { ScoringGrid } from "../scoring/ScoringGrid";
import { CashoutRewardsPanel } from "./CashoutRewardsPanel";
import { ShopContent } from "./ShopContent";
import { UpgradeContent } from "./UpgradeContent";
import { EndContent } from "./EndContent";
import { DieEditorContent } from "./DieEditorContent";
import { FaceEditorContent } from "./FaceEditorContent";
import { ArtifactEditorContent } from "./ArtifactEditorContent";

// Snappy easing animation config
const SLIDE_DURATION = 180;
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
 * Animation: Snappy easing-based transitions.
 * Outgoing panel exits immediately, incoming panel has slight delay.
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
      case "DICE_EDITOR_DIE":
        return <DieEditorContent />;
      case "DICE_EDITOR_FACE":
        return <FaceEditorContent />;
      case "ARTIFACT_EDITOR":
        return <ArtifactEditorContent />;
      case "WIN_SCREEN":
      case "LOSE_SCREEN":
        return <EndContent />;
      default:
        return <ScoringGrid />;
    }
  };

  // P4.3: Memoize animation configs to avoid recreation on every render
  const enteringAnimation = useMemo(
    () =>
      SlideInLeft.duration(SLIDE_DURATION)
        .easing(Easing.out(Easing.quad))
        .delay(incomingDelay),
    []
  );

  const exitingAnimation = useMemo(
    () => SlideOutRight.duration(SLIDE_DURATION).easing(Easing.in(Easing.quad)),
    []
  );

  // Note: key={phase} is required for Reanimated entering/exiting animations to trigger.
  // The remount is intentional - content components should be memoized to minimize work.
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
