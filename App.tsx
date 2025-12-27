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
import { useFonts, Bungee_400Regular } from "@expo-google-fonts/bungee";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
import { ScoreRow } from "./components/ui/ScoreRow";
import { ScoringGrid } from "./components/scoring/ScoringGrid";
import { FooterControls } from "./components/ui/FooterControls";
import { OverviewModal } from "./components/modals/OverviewModal";
import { ResultScreen, ShopScreen, EndScreen } from "./components/screens";
import { useGameStore } from "./store/gameStore";
import { COLORS, calculateDiceTrayHeight } from "./constants/theme";

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    "Bungee-Regular": Bungee_400Regular,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  // Game states
  const phase = useGameStore((s) => s.phase);
  const overviewVisible = useGameStore((s) => s.overviewVisible);
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const diceTrayHeight = calculateDiceTrayHeight(screenHeight);
  const hideStatusBar = Platform.OS === "ios";

  // Scanline overlay style
  const scanlineOverlayStyle = {
    position: "absolute" as const,
    width: screenWidth,
    height: screenHeight,
    opacity: 0.04,
  };

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.mainContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  // Render main content based on phase
  const renderMainContent = () => {
    // Result screen (after cash out)
    if (phase === "LEVEL_RESULT") {
      return <ResultScreen />;
    }

    // Shop screens
    if (phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE") {
      return <ShopScreen />;
    }

    // Win/Lose screens
    if (phase === "WIN_SCREEN" || phase === "LOSE_SCREEN") {
      return <EndScreen />;
    }

    // Default: Game play view (LEVEL_PLAY, CASHOUT_CHOICE)
    return (
      <>
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

        {/* Score Row (selected hand + formula) */}
        <ScoreRow />

        {/* Scoring Dashboard */}
        <View style={styles.scoringDashboard}>
          <ScoringGrid />
        </View>
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        <StatusBar
          hidden={hideStatusBar}
          barStyle="light-content"
          backgroundColor={COLORS.bg}
        />

        {/* Vignette effect */}
        <View style={styles.vignette} pointerEvents="none" />

        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          {/* Top HUD - always visible */}
          <GlassHeader />

          {/* Main Content Area */}
          <View style={styles.mainContent}>{renderMainContent()}</View>

          {/* Footer Controls */}
          <FooterControls />

          {/* Modals */}
          <OverviewModal visible={overviewVisible} onClose={toggleOverview} />
        </SafeAreaView>
      </View>

      {/* Global UI Overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Noise */}
        <View style={styles.noiseOverlay} />

        {/* Scanlines */}
        <ImageBackground
          source={require("./assets/scanline3.png")}
          style={scanlineOverlayStyle}
          resizeMode="repeat"
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
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 0,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    opacity: 0.03,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
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
