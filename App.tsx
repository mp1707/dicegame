import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  ImageBackground,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
import { ScoringGrid } from "./components/scoring/ScoringGrid";
import { FooterControls } from "./components/ui/FooterControls";
import { ShopModal } from "./components/modals/ShopModal";
import { OverviewModal } from "./components/modals/OverviewModal";
import { useGameStore } from "./store/gameStore";
import { COLORS, calculateDiceTrayHeight } from "./constants/theme";

export default function App() {
  // Game states
  const phase = useGameStore((s) => s.phase);
  const overviewVisible = useGameStore((s) => s.overviewVisible);
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  // Modals
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

  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

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
            <ScoringGrid />
          </View>

          {/* Footer Controls */}
          <FooterControls />

          {/* Modals */}
          <OverviewModal visible={overviewVisible} onClose={toggleOverview} />
          <ShopModal visible={shopVisible} />
        </SafeAreaView>
      </View>
      {/* Global UI Overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ImageBackground
          source={require("./assets/scanline.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="repeat"
          imageStyle={{ opacity: 0.3 }}
        />
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
});
