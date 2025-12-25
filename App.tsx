import React, { useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
import { ScoreProgress } from "./components/ui/ScoreProgress";
import { ScoringGrid } from "./components/scoring/ScoringGrid";
import { FooterControls } from "./components/ui/FooterControls";
import { ScratchModal } from "./components/modals/ScratchModal";
import { ShopModal } from "./components/modals/ShopModal";
import { OverviewModal } from "./components/modals/OverviewModal";
import { useGameStore, useHasValidCategories } from "./store/gameStore";
import {
  COLORS,
  SPACING,
  calculateDiceTrayHeight,
  TYPOGRAPHY,
  DIMENSIONS,
} from "./constants/theme";

export default function App() {
  const [scratchModalVisible, setScratchModalVisible] = useState(false);
  const [overviewVisible, setOverviewVisible] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const hasRolled = useGameStore((s) => s.hasRolledThisRound);
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const hasValidCategories = useHasValidCategories();

  // Calculate responsive dice tray height
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const diceTrayHeight = calculateDiceTrayHeight(screenHeight);
  const canScratch =
    hasRolled && !hasValidCategories && rollsRemaining === 0 && phase === "rolling";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Glass Header HUD */}
        <GlassHeader />

        {/* 3D Dice Rolling Area (responsive sizing) */}
        <View
          style={[styles.diceContainer, { height: diceTrayHeight, width: "100%" }]}
        >
          <DiceTray
            containerHeight={diceTrayHeight}
            containerWidth={screenWidth}
          />
        </View>

        {/* Progress Bar */}
        <ScoreProgress />

        {/* Scoring Dashboard */}
        <View style={styles.scoringDashboard}>
          <View style={styles.scoreActions}>
            <TouchableOpacity
              style={styles.overviewButton}
              onPress={() => setOverviewVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.overviewText}>Übersicht</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scratchButton,
                !canScratch && styles.actionButtonDisabled,
              ]}
              onPress={() => {
                if (canScratch) setScratchModalVisible(true);
              }}
              disabled={!canScratch}
              activeOpacity={0.8}
            >
              <Text style={styles.scratchText}>STREICHEN</Text>
            </TouchableOpacity>
          </View>
          <ScoringGrid />
        </View>

        {/* Footer Controls */}
        <FooterControls />

        {/* Modals */}
        <ScratchModal
          visible={scratchModalVisible}
          onClose={() => setScratchModalVisible(false)}
        />
        <OverviewModal
          visible={overviewVisible}
          onClose={() => setOverviewVisible(false)}
        />
        <ShopModal visible={phase === "shop"} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  diceContainer: {
    // Height set dynamically via inline style
  },
  scoringDashboard: {
    flex: 1,
    paddingTop: SPACING.sectionGap,
  },
  scoreActions: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.slotGapHorizontal,
  },
  overviewButton: {
    flex: 1,
    height: DIMENSIONS.rollButtonHeight,
    backgroundColor: COLORS.gold,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: COLORS.goldDark,
    borderBottomWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewText: {
    color: COLORS.textBlack,
    ...TYPOGRAPHY.mediumScore,
    letterSpacing: 1,
  },
  scratchButton: {
    flex: 1,
    height: DIMENSIONS.rollButtonHeight,
    backgroundColor: COLORS.red,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: COLORS.redDark,
    borderBottomWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  scratchText: {
    color: COLORS.textWhite,
    ...TYPOGRAPHY.mediumScore,
    letterSpacing: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});
