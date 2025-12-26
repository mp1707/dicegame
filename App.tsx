import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  ImageBackground,
  Platform,
  Text,
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
import { ScoringGrid } from "./components/scoring/ScoringGrid";
import { FooterControls } from "./components/ui/FooterControls";
import { ShopModal } from "./components/modals/ShopModal";
import { OverviewModal } from "./components/modals/OverviewModal";
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

  // CRT lines - Horizontal & Subtle (Rotated back to 0 or removed rotation if image is vertical, assumes image is horizontal lines)
  // Actually scanlines are usually horizontal. If the image needs rotation to be horizontal, that depends on the image.
  // Assuming the previous rotation was wrong ("vertical and quite uniform"), let's try no rotation or 90 deg depending on source.
  // User said "CRT scanlines are typically horizontal... Your lines look vertical".
  // Previous code had `transform: [{ rotate: "90deg" }]`. So removing rotation should make them horizontal if the source is horizontal lines.
  const scanlineOverlayStyle = {
    position: "absolute" as const,
    width: screenWidth,
    height: screenHeight,
    opacity: 0.04, // Reduced opacity as requested (3-6%)
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

  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        {/* Global Background Color is in mainContainer */}

        {/* Playfield Framing - Inner Shadow / Spotlight Effect */}
        {/* We can achieve a vignette using a radial gradient or a bordered view with large width */}
        <View style={styles.vignette} pointerEvents="none" />

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
        {/* Noise - kept subtle */}
        <View style={styles.noiseOverlay} />

        {/* Scanlines - Horizontal */}
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
    backgroundColor: COLORS.bg, // Main background
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Simple way to do a vignette without gradient: a semi-transparent border logic or just opacity
    // But better to use the theme surface color for valid "play table" feel
    backgroundColor: "transparent",
    zIndex: 0,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    opacity: 0.03, // Reduced noise for cleaner look
    zIndex: 100, // On top
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
    // Add a subtle shadow catch for the dice area ("table recess")
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
