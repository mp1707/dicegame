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
import { ScoringGrid } from "./components/scoring/ScoringGrid";
import { FooterControls } from "./components/ui/FooterControls";
import { ScratchModal } from "./components/modals/ScratchModal";
import { ShopModal } from "./components/modals/ShopModal";
import { OverviewModal } from "./components/modals/OverviewModal";
import { useGameStore } from "./store/gameStore";
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

  // Calculate responsive dice tray height
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const diceTrayHeight = calculateDiceTrayHeight(screenHeight);

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

        {/* Scoring Dashboard */}
        <View style={styles.scoringDashboard}>
          <ScoringGrid />

          <TouchableOpacity
            style={styles.overviewButton}
            onPress={() => setOverviewVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.overviewText}>Übersicht</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Controls */}
        <FooterControls onScratchPress={() => setScratchModalVisible(true)} />

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
  overviewButton: {
    marginTop: 8,
    marginHorizontal: SPACING.screenPadding,
    height: 44,
    backgroundColor: COLORS.blue,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewText: {
    color: COLORS.textWhite,
    ...TYPOGRAPHY.mediumScore,
    letterSpacing: 1,
  },
});
