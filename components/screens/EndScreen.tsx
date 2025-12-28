import React from "react";
import { View, StyleSheet } from "react-native";
import { Trophy, Skull } from "lucide-react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { PrimaryButton, GameText } from "../shared";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  ANIMATION,
} from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";

export const EndScreen = () => {
  const phase = useGameStore((s) => s.phase);
  const money = useGameStore((s) => s.money);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const startNewRun = useGameStore((s) => s.startNewRun);

  const isWin = phase === "WIN_SCREEN";
  const levelNumber = currentLevelIndex + 1;

  const handleNewRun = () => {
    triggerSelectionHaptic();
    startNewRun();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={SlideInUp.springify()
          .damping(ANIMATION.springs.slideIn.damping)
          .stiffness(ANIMATION.springs.slideIn.stiffness)}
        style={styles.content}
      >
        {/* Icon */}
        <Animated.View
          entering={FadeIn.delay(ANIMATION.endScreen.iconDelay).duration(ANIMATION.endScreen.fadeDuration)}
          style={[
            styles.iconContainer,
            isWin ? styles.iconContainerWin : styles.iconContainerLose,
          ]}
        >
          {isWin ? (
            <Trophy size={DIMENSIONS.iconSize.xxl} color={COLORS.gold} />
          ) : (
            <Skull size={DIMENSIONS.iconSize.xxl} color={COLORS.coral} />
          )}
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeIn.delay(ANIMATION.endScreen.titleDelay).duration(ANIMATION.endScreen.fadeDuration)}
        >
          <GameText
            variant="displayHuge"
            style={[styles.title, isWin ? styles.titleWin : styles.titleLose]}
          >
            {isWin ? "GEWONNEN!" : "VERLOREN"}
          </GameText>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          entering={FadeIn.delay(ANIMATION.endScreen.subtitleDelay).duration(ANIMATION.endScreen.fadeDuration)}
        >
          <GameText variant="bodyLarge" color={COLORS.textMuted} style={styles.subtitle}>
            {isWin
              ? "All 8 levels completed!"
              : `Failed at Level ${levelNumber}`}
          </GameText>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeIn.delay(ANIMATION.endScreen.statsDelay).duration(ANIMATION.endScreen.fadeDuration)}
          style={styles.statsContainer}
        >
          <View style={styles.statRow}>
            <GameText variant="bodyMedium" color={COLORS.textMuted}>
              Final Money
            </GameText>
            <GameText variant="scoreboardSmall">
              ${formatNumber(money)}
            </GameText>
          </View>

          <View style={styles.statRow}>
            <GameText variant="bodyMedium" color={COLORS.textMuted}>
              Levels Completed
            </GameText>
            <GameText variant="scoreboardSmall">
              {isWin ? 8 : currentLevelIndex} / 8
            </GameText>
          </View>
        </Animated.View>
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        entering={FadeIn.delay(ANIMATION.endScreen.buttonDelay).duration(ANIMATION.endScreen.fadeDuration)}
        style={styles.footer}
      >
        <PrimaryButton
          onPress={handleNewRun}
          label="NEUER RUN"
          variant={isWin ? "mint" : "coral"}
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: DIMENSIONS.borderRadiusRound,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  iconContainerWin: {
    backgroundColor: COLORS.overlays.goldSubtle,
    borderWidth: DIMENSIONS.borderWidthThick,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconContainerLose: {
    backgroundColor: COLORS.overlays.coralSubtle,
    borderWidth: DIMENSIONS.borderWidthThick,
    borderColor: COLORS.coral,
  },
  title: {
    textAlign: "center",
    letterSpacing: 2,
  },
  titleWin: {
    color: COLORS.gold,
    textShadowColor: COLORS.shadows.goldStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleLose: {
    color: COLORS.coral,
  },
  subtitle: {
    textAlign: "center",
  },
  statsContainer: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: COLORS.overlays.blackMild,
    borderRadius: DIMENSIONS.borderRadius,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.xxl,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
