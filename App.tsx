import React, { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
import { UpperSection } from "./components/scoring/UpperSection";
import { LowerSection } from "./components/scoring/LowerSection";
import { FooterControls } from "./components/ui/FooterControls";
import { ScratchModal } from "./components/modals/ScratchModal";
import { ShopModal } from "./components/modals/ShopModal";
import { useGameStore } from "./store/gameStore";
import { COLORS, SPACING, DIMENSIONS, calculateDiceTrayHeight } from "./constants/theme";

export default function App() {
  const [scratchModalVisible, setScratchModalVisible] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const isRolling = useGameStore((s) => s.isRolling);
  const setRolling = useGameStore((s) => s.setRolling);

  // Calculate responsive dice tray height
  const { height: screenHeight } = useWindowDimensions();
  const diceTrayHeight = calculateDiceTrayHeight(screenHeight);

  // Auto-stop rolling animation after 3s (dice should settle by then)
  useEffect(() => {
    if (isRolling) {
      const timeout = setTimeout(() => {
        setRolling(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isRolling]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Glass Header HUD */}
        <GlassHeader />

        {/* 3D Dice Rolling Area (responsive sizing) */}
        <View style={[styles.diceContainer, { height: diceTrayHeight }]}>
          <DiceTray containerHeight={diceTrayHeight} />
        </View>

        {/* Scoring Dashboard */}
        <View style={styles.scoringDashboard}>
          {/* Upper Section (6 dice slots) */}
          <View style={styles.upperSection}>
            <UpperSection />
          </View>

          {/* Lower Section (7 poker hand slots) */}
          <View style={styles.lowerSection}>
            <LowerSection />
          </View>
        </View>

        {/* Footer Controls */}
        <FooterControls onScratchPress={() => setScratchModalVisible(true)} />

        {/* Modals */}
        <ScratchModal
          visible={scratchModalVisible}
          onClose={() => setScratchModalVisible(false)}
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
  upperSection: {
    paddingBottom: SPACING.sectionGap,
  },
  lowerSection: {
    flex: 1,
  },
});
