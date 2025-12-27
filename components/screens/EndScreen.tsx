import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Trophy, Skull } from "lucide-react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { PrimaryButton } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";
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
        entering={SlideInUp.springify().damping(20).stiffness(200)}
        style={styles.content}
      >
        {/* Icon */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[
            styles.iconContainer,
            isWin ? styles.iconContainerWin : styles.iconContainerLose,
          ]}
        >
          {isWin ? (
            <Trophy size={64} color={COLORS.gold} />
          ) : (
            <Skull size={64} color={COLORS.coral} />
          )}
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeIn.delay(400).duration(400)}
          style={[styles.title, isWin ? styles.titleWin : styles.titleLose]}
        >
          {isWin ? "GEWONNEN!" : "VERLOREN"}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeIn.delay(600).duration(400)}
          style={styles.subtitle}
        >
          {isWin
            ? "All 8 levels completed!"
            : `Failed at Level ${levelNumber}`}
        </Animated.Text>

        {/* Stats */}
        <Animated.View
          entering={FadeIn.delay(800).duration(400)}
          style={styles.statsContainer}
        >
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Final Money</Text>
            <Text style={styles.statValue}>${formatNumber(money)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Levels Completed</Text>
            <Text style={styles.statValue}>
              {isWin ? 8 : currentLevelIndex} / 8
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        entering={FadeIn.delay(1000).duration(400)}
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
    gap: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainerWin: {
    backgroundColor: "rgba(255, 200, 87, 0.15)",
    borderWidth: 3,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconContainerLose: {
    backgroundColor: "rgba(255, 90, 122, 0.15)",
    borderWidth: 3,
    borderColor: COLORS.coral,
  },
  title: {
    fontSize: 44,
    fontFamily: "Bungee-Regular",
    textAlign: "center",
    letterSpacing: 2,
  },
  titleWin: {
    color: COLORS.gold,
    textShadowColor: "rgba(255, 200, 87, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleLose: {
    color: COLORS.coral,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  statsContainer: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter-Bold",
    fontVariant: ["tabular-nums"],
  },
  footer: {
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
