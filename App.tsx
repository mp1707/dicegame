import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  TouchableOpacity,
  Text,
  ImageBackground,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
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
import { triggerSelectionHaptic } from "./utils/haptics";

export default function App() {
  // Game states
  const phase = useGameStore((s) => s.phase);
  const hasRolled = useGameStore((s) => s.hasRolledThisRound);
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const hasValidCategories = useHasValidCategories();
  const overviewVisible = useGameStore((s) => s.overviewVisible);
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  // Modals
  const [scratchVisible, setScratchVisible] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);

  // Sync shop visibility with game phase
  useEffect(() => {
    if (phase === "shop") {
      setShopVisible(true);
    } else {
      setShopVisible(false);
    }
  }, [phase]);

  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const diceTrayHeight = calculateDiceTrayHeight(screenHeight);

  const canScratch =
    hasRolled &&
    !hasValidCategories &&
    rollsRemaining === 0 &&
    phase === "rolling";

  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        {/* Global UI Overlays */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ImageBackground
            source={require("./assets/scanline.png")}
            style={StyleSheet.absoluteFill}
            resizeMode="repeat"
            imageStyle={{ opacity: 0.12 }}
          />
        </View>
        <View style={styles.noiseOverlay} pointerEvents="none" />

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          {/* Top HUD */}
          <GlassHeader />

          {/* 3D Dice Area */}
          <View
            style={[
              styles.diceContainer,
              { height: diceTrayHeight, width: "100%" },
            ]}
          >
            <View style={styles.crtScreenInner}>
              <DiceTray
                containerHeight={diceTrayHeight}
                containerWidth={screenWidth}
              />
            </View>
          </View>

          {/* Scoring Dashboard */}
          <View style={styles.scoringDashboard}>
            <View style={styles.scoreActions}>
              {canScratch && (
                <TouchableOpacity
                  style={styles.scratchButton}
                  onPress={() => {
                    triggerSelectionHaptic();
                    setScratchVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scratchText}>STREICHEN</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScoringGrid />
          </View>

          {/* Footer Controls */}
          <FooterControls />

          {/* Modals */}
          <ScratchModal
            visible={scratchVisible}
            onClose={() => setScratchVisible(false)}
          />
          <OverviewModal visible={overviewVisible} onClose={toggleOverview} />
          <ShopModal visible={shopVisible} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  globalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg2,
    opacity: 0.05,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  diceContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  crtScreenInner: {
    flex: 1,
    width: "100%",
  },
  scoringDashboard: {
    flex: 1,
    width: "100%",
    marginTop: 8,
  },
  scoreActions: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.slotGapVertical,
    minHeight: 40,
  },
  scratchButton: {
    paddingHorizontal: 16,
    height: 36,
    backgroundColor: "transparent",
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
  },
  scratchText: {
    ...TYPOGRAPHY.label,
    color: COLORS.red,
    fontSize: 12,
  },
});
