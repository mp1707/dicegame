import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
  Easing,
} from "react-native-reanimated";
import { useGameStore, GamePhase } from "../../../store/gameStore";
import { ANIMATION, COLORS } from "../../../constants/theme";

// Import panels
import { ResultPanel } from "../../screens/ResultScreen";
import { ShopPanel } from "../../screens/ShopScreen";
import { UpgradePickerPanel } from "../../screens/UpgradePickerScreen";
import { EndPanel } from "../../screens/EndScreen";

// Import HUD components
import { ScoreRow } from "../../ui/ScoreRow";
import { ScoringGrid } from "../../scoring/ScoringGrid";
import { FooterControls } from "../../ui/FooterControls";
import { WinOverlay } from "../../ui/WinOverlay";

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) - rendered as base layer */
  diceTray: React.ReactNode;
  /** Height of the dice tray container */
  diceTrayHeight: number;
}

/**
 * Determines which "deck position" we're at based on phase.
 * Returns a value that can be animated to control layer positions.
 *
 * 0 = Gameplay (HUD visible)
 * 1 = Result
 * 2 = Shop
 * 3 = UpgradePicker
 * 4 = End (Win/Lose)
 */
const getDeckPosition = (phase: GamePhase): number => {
  switch (phase) {
    case "LEVEL_PLAY":
    case "CASHOUT_CHOICE":
      return 0;
    case "LEVEL_RESULT":
      return 1;
    case "SHOP_MAIN":
      return 2;
    case "SHOP_PICK_UPGRADE":
      return 3;
    case "WIN_SCREEN":
    case "LOSE_SCREEN":
      return 4;
    default:
      return 0;
  }
};

// Snappy easing config - fast attack, no wobble
const timingConfig = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
};

/**
 * Hook to create animated style for sliding layers
 */
const useSlideStyle = (
  deckPosition: SharedValue<number>,
  visibleAt: number,
  screenWidth: number,
  isHUD: boolean = false,
  parallaxRatio: number = 1
) => {
  return useAnimatedStyle(() => {
    const position = deckPosition.value;

    if (isHUD) {
      // HUD slides left when position > 0
      // Apply parallax ratio to create depth effect
      const translateX = interpolate(
        position,
        [0, 1],
        [0, -screenWidth * parallaxRatio],
        "clamp"
      );
      return { transform: [{ translateX }] };
    }

    // Overlay panels:
    // - Off-screen right when position < visibleAt
    // - Visible when position === visibleAt
    // - Off-screen left when position > visibleAt
    const translateX = interpolate(
      position,
      [visibleAt - 1, visibleAt, visibleAt + 1],
      [screenWidth, 0, -screenWidth],
      "clamp"
    );

    return { transform: [{ translateX }] };
  });
};

/**
 * PhaseDeck - Orchestrates sliding transitions between game phases
 *
 * Architecture:
 * 1. Base Layer: DiceTray (3D scene) - always visible, not animated
 * 2. Fixed Layer: GlassHeader - handled by App.tsx, not inside PhaseDeck
 * 3. HUD Layer: ScoreRow, ScoringGrid, Footer - slides out with parallax
 * 4. Overlay Layer: Result, Shop, UpgradePicker, End - slides in on demand
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({
  diceTray,
  diceTrayHeight,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const phase = useGameStore((s) => s.phase);

  // Animated deck position
  const deckPosition = useSharedValue(getDeckPosition(phase));

  // React to phase changes
  useEffect(() => {
    const targetPosition = getDeckPosition(phase);
    deckPosition.value = withTiming(targetPosition, timingConfig);
  }, [phase, deckPosition]);

  // HUD layer animated styles with parallax
  const scoreRowStyle = useSlideStyle(
    deckPosition,
    0,
    screenWidth,
    true,
    ANIMATION.phase.parallax.scoreRow
  );
  const scoringGridStyle = useSlideStyle(
    deckPosition,
    0,
    screenWidth,
    true,
    ANIMATION.phase.parallax.scoringGrid
  );
  const footerStyle = useSlideStyle(
    deckPosition,
    0,
    screenWidth,
    true,
    ANIMATION.phase.parallax.footer
  );

  // Overlay panel animated styles
  const resultStyle = useSlideStyle(deckPosition, 1, screenWidth);
  const shopStyle = useSlideStyle(deckPosition, 2, screenWidth);
  const upgradeStyle = useSlideStyle(deckPosition, 3, screenWidth);
  const endStyle = useSlideStyle(deckPosition, 4, screenWidth);

  // Determine which layers should be rendered (for performance)
  const isGameplayVisible =
    phase === "LEVEL_PLAY" || phase === "CASHOUT_CHOICE";
  const isResultVisible = phase === "LEVEL_RESULT" || isGameplayVisible;
  const isShopVisible = phase === "SHOP_MAIN" || phase === "LEVEL_RESULT";
  const isUpgradeVisible =
    phase === "SHOP_PICK_UPGRADE" || phase === "SHOP_MAIN";
  const isEndVisible = phase === "WIN_SCREEN" || phase === "LOSE_SCREEN";

  return (
    <View style={styles.container}>
      {/* Base Layer: DiceTray - always visible */}
      <View style={[styles.diceContainer, { height: diceTrayHeight }]}>
        {diceTray}
        <WinOverlay />
      </View>

      {/* HUD Layer: ScoreRow, ScoringGrid, Footer - slides with parallax */}
      <Animated.View style={[styles.hudLayer, scoreRowStyle]}>
        <ScoreRow />
      </Animated.View>

      <Animated.View style={[styles.scoringGridLayer, scoringGridStyle]}>
        <View style={styles.scoringDashboard}>
          <ScoringGrid />
        </View>
      </Animated.View>

      <Animated.View style={[styles.footerLayer, footerStyle]}>
        <FooterControls />
      </Animated.View>

      {/* Overlay Layer: Panels that slide in from right */}
      {/* Result Panel */}
      <Animated.View
        style={[styles.overlayPanel, resultStyle]}
        pointerEvents={phase === "LEVEL_RESULT" ? "auto" : "none"}
      >
        {isResultVisible && <ResultPanel />}
      </Animated.View>

      {/* Shop Panel */}
      <Animated.View
        style={[styles.overlayPanel, shopStyle]}
        pointerEvents={phase === "SHOP_MAIN" ? "auto" : "none"}
      >
        {isShopVisible && <ShopPanel />}
      </Animated.View>

      {/* Upgrade Picker Panel */}
      <Animated.View
        style={[styles.overlayPanel, upgradeStyle]}
        pointerEvents={phase === "SHOP_PICK_UPGRADE" ? "auto" : "none"}
      >
        {isUpgradeVisible && <UpgradePickerPanel />}
      </Animated.View>

      {/* End Panel (Win/Lose) */}
      <Animated.View
        style={[styles.overlayPanel, endStyle]}
        pointerEvents={isEndVisible ? "auto" : "none"}
      >
        {isEndVisible && <EndPanel skipAnimations />}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  diceContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  hudLayer: {
    // ScoreRow position
  },
  scoringGridLayer: {
    flex: 1,
  },
  scoringDashboard: {
    flex: 1,
    width: "100%",
    marginTop: 8,
  },
  footerLayer: {
    // Footer position - handled by FooterControls internally
  },
  overlayPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
});
