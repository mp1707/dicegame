import React from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  ImageBackground,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { DiceTray } from "./components/DiceTray";
import { GlassHeader } from "./components/ui/GlassHeader";
import { OverviewModal } from "./components/modals/OverviewModal";
import { PhaseDeck } from "./components/ui-kit/flow";
import { useGameStore } from "./store/gameStore";
import { COLORS, calculateDiceTrayHeight } from "./constants/theme";

export default function App() {
  // Load single font (M6x11)
  const [fontsLoaded] = useFonts({
    "M6x11-Regular": require("./assets/fonts/m6x11plus.ttf"),
  });

  // Game states
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

        <SafeAreaView
          style={styles.safeArea}
          edges={["bottom", "left", "right"]}
        >
          {/* Top HUD - always visible, does NOT animate */}
          <GlassHeader />

          {/* Main Content Area - PhaseDeck handles all phase transitions */}
          <View style={styles.mainContent}>
            <PhaseDeck
              diceTray={
                <View style={styles.crtScreenInner}>
                  <DiceTray
                    containerHeight={diceTrayHeight}
                    containerWidth={screenWidth}
                  />
                </View>
              }
              diceTrayHeight={diceTrayHeight}
            />
          </View>

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
  crtScreenInner: {
    flex: 1,
    width: "100%",
  },
});
