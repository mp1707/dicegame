import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
  Easing,
} from "react-native-reanimated";
import { useGameStore, GamePhase } from "../../../store/gameStore";
import { ANIMATION, COLORS, SPACING } from "../../../constants/theme";
import { useLayout } from "../../../utils/LayoutContext";

// Import panels
import { ShopPanel } from "../../screens/ShopScreen";
import { UpgradePickerPanel } from "../../screens/UpgradePickerScreen";
import { EndPanel } from "../../screens/EndScreen";

// Import HUD components
import { PlayConsole } from "../../ui/PlayConsole";
import { ScoreLip } from "../../ui/ScoreLip";
import { ScoringGrid } from "../../scoring/ScoringGrid";
import { FooterControls } from "../../ui/FooterControls";
import { CashoutResultList } from "../../ui/CashoutResultList";

interface PhaseDeckProps {
  /** The DiceTray component (3D scene) - rendered inside PlayConsole */
  diceTray: React.ReactNode;
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
 * 1. PlayConsole: Unified container with HUDHeader + TrayWindow + ScoreLip
 * 2. ScoringGrid: Hand selection area (slides out at LEVEL_RESULT)
 * 3. Footer: CTA buttons (slides with parallax)
 * 4. Overlay Layer: Shop, UpgradePicker, End panels
 */
export const PhaseDeck: React.FC<PhaseDeckProps> = ({ diceTray }) => {
  // Layout from context - stable game-like proportions
  const layout = useLayout();
  const { screenWidth } = layout;
  const phase = useGameStore((s) => s.phase);

  // Animated deck position
  const deckPosition = useSharedValue(getDeckPosition(phase));

  // React to phase changes
  useEffect(() => {
    const targetPosition = getDeckPosition(phase);
    deckPosition.value = withTiming(targetPosition, timingConfig);
  }, [phase, deckPosition]);

  // PlayConsole: animate at SHOP transition (position 1→2)
  // Stays visible during LEVEL_RESULT, then slides out when going to SHOP
  const playConsoleStyle = useAnimatedStyle(() => {
    const position = deckPosition.value;
    const translateX = interpolate(
      position,
      [1, 2],
      [0, -screenWidth * ANIMATION.phase.parallax.trayModule],
      "clamp"
    );
    return { transform: [{ translateX }] };
  });

  const footerStyle = useAnimatedStyle(() => {
    const position = deckPosition.value;
    const translateX = interpolate(
      position,
      [1, 2],
      [0, -screenWidth * ANIMATION.phase.parallax.footer],
      "clamp"
    );
    return { transform: [{ translateX }] };
  });

  // ScoringGrid: animate at LEVEL_RESULT transition (position 0→1)
  // Use 1.0 ratio to fully slide off-screen
  const scoringGridStyle = useSlideStyle(
    deckPosition,
    0,
    screenWidth,
    true,
    1.0
  );

  // CashoutResultList slides in from right at position 1, then out left at position 2+
  const cashoutSlideStyle = useAnimatedStyle(() => {
    const position = deckPosition.value;
    const translateX = interpolate(
      position,
      [0, 1, 2],
      [screenWidth, 0, -screenWidth],
      "clamp"
    );
    return { transform: [{ translateX }] };
  });

  // Overlay panel animated styles
  const shopStyle = useSlideStyle(deckPosition, 2, screenWidth);
  const upgradeStyle = useSlideStyle(deckPosition, 3, screenWidth);
  const endStyle = useSlideStyle(deckPosition, 4, screenWidth);

  // Determine which layers should be rendered (for performance)
  const isGameplayVisible = phase === "LEVEL_PLAY";
  const isCashoutVisible = phase === "LEVEL_RESULT" || isGameplayVisible;
  const isShopVisible = phase === "SHOP_MAIN" || phase === "LEVEL_RESULT";
  const isUpgradeVisible =
    phase === "SHOP_PICK_UPGRADE" || phase === "SHOP_MAIN";
  const isEndVisible = phase === "WIN_SCREEN" || phase === "LOSE_SCREEN";

  // Calculate PlayConsole height: header + tray + scoreLip
  // Header rows: ~80px, ScoreLip: ~50px
  const playConsoleHeight =
    layout.diceTrayHeight + layout.scoreRowHeight + layout.headerHeight;

  return (
    <View style={styles.container}>
      {/* PlayConsole: Unified Header + Tray + ScoreLip */}
      <Animated.View
        style={[
          styles.playConsoleWrapper,
          { height: playConsoleHeight },
          playConsoleStyle,
        ]}
      >
        <PlayConsole
          diceTray={<View style={styles.diceTrayWrapper}>{diceTray}</View>}
          scoreLip={<ScoreLip />}
        />
      </Animated.View>

      {/* Scoring Area: Contains both ScoringGrid and CashoutResultList */}
      <View
        style={[
          styles.scoringAreaContainer,
          { height: layout.scoringGridHeight },
        ]}
      >
        {/* ScoringGrid - slides out left */}
        <Animated.View style={[styles.scoringGridLayer, scoringGridStyle]}>
          <View style={styles.scoringDashboard}>
            <ScoringGrid />
          </View>
        </Animated.View>

        {/* CashoutResultList - slides in from right at position 1 */}
        <Animated.View
          style={[styles.cashoutResultLayer, cashoutSlideStyle]}
          pointerEvents={phase === "LEVEL_RESULT" ? "auto" : "none"}
        >
          {isCashoutVisible && <CashoutResultList />}
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footerLayer,
          { height: layout.footerHeight },
          footerStyle,
        ]}
      >
        <FooterControls />
      </Animated.View>

      {/* Overlay Layer: Panels that slide in from right */}

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
  playConsoleWrapper: {
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    zIndex: 10,
  },
  diceTrayWrapper: {
    flex: 1,
    width: "100%",
  },
  scoringAreaContainer: {
    position: "relative",
    overflow: "hidden",
    marginTop: SPACING.sectionGap,
  },
  scoringGridLayer: {
    flex: 1,
  },
  scoringDashboard: {
    flex: 1,
    width: "100%",
  },
  cashoutResultLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  footerLayer: {
    justifyContent: "center",
    marginTop: SPACING.sectionGap,
  },
  overlayPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
});
