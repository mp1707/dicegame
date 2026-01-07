import React from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { DiceTray } from "./components/DiceTray";
import { SingleDiePreview } from "./components/SingleDiePreview";
import { OverviewModal } from "./components/modals/OverviewModal";
import { ItemDetailModal } from "./components/modals/ItemDetailModal";
import { PhaseDeck } from "./components/ui-kit/flow";
import { useGameStore } from "./store/gameStore";
import { getShopItemById } from "./items";
import { COLORS, SPACING } from "./constants/theme";
import { LayoutProvider, useLayout } from "./utils/LayoutContext";

// Icon mapping for items (shared with ShopContent/ScorePanel)
const ITEM_ICONS: Record<string, any> = {
  fokus: require("./assets/items/skull.png"),
};

// Layout constants - PlayConsole internal dimensions
const PANEL_BORDER = 2; // Surface panel border

/**
 * Main App component - wraps everything in providers
 */
export default function App() {
  // Load single font (M6x11)
  const [fontsLoaded] = useFonts({
    "M6x11-Regular": require("./assets/fonts/m6x11plus.ttf"),
  });

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
      <LayoutProvider>
        <AppContent />
      </LayoutProvider>
    </SafeAreaProvider>
  );
}

/**
 * Inner app content - has access to layout context
 */
const AppContent: React.FC = () => {
  // Layout from context (stable game-like proportions)
  const layout = useLayout();

  // Game states
  const overviewVisible = useGameStore((s) => s.overviewVisible);
  const toggleOverview = useGameStore((s) => s.toggleOverview);
  const phase = useGameStore((s) => s.phase);
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);

  // Item modal state
  const itemModalId = useGameStore((s) => s.itemModalId);
  const itemModalShowPurchase = useGameStore((s) => s.itemModalShowPurchase);
  const closeItemModal = useGameStore((s) => s.closeItemModal);
  const purchaseItem = useGameStore((s) => s.purchaseItem);
  const money = useGameStore((s) => s.money);

  // Get item for modal
  const modalItem = itemModalId ? getShopItemById(itemModalId) : null;
  const canAffordItem = modalItem ? money >= modalItem.cost : false;

  const handlePurchaseFromModal = () => {
    if (itemModalId) {
      purchaseItem(itemModalId);
      closeItemModal();
    }
  };

  // Check if we're in dice editor mode (show single die preview)
  const isInDiceEditor =
    phase === "DICE_EDITOR_DIE" || phase === "DICE_EDITOR_FACE";

  const hideStatusBar = Platform.OS === "ios";

  // Calculate tray width inside PlayConsole:
  // Screen width - PlayConsole horizontal padding (sm*2) - panel borders
  const playConsolePadding = SPACING.sm * 2; // paddingHorizontal in playConsoleWrapper
  const diceTrayWidth =
    layout.screenWidth - playConsolePadding - PANEL_BORDER * 2;

  // Scanline overlay style
  const scanlineOverlayStyle = {
    position: "absolute" as const,
    width: layout.screenWidth,
    height: layout.screenHeight,
    opacity: 0.04,
  };

  return (
    <>
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
          edges={["top", "bottom", "left", "right"]}
        >
          {/* Main Content Area - PhaseDeck with PlayConsole handles everything */}
          <View style={styles.mainContent}>
            <PhaseDeck
              diceTray={
                <View style={styles.diceTrayInner}>
                  {/* Always show the background tray */}
                  <DiceTray
                    containerHeight={layout.diceTrayHeight}
                    containerWidth={diceTrayWidth}
                  />

                  {/* Overlay single die preview in editor mode */}
                  {isInDiceEditor && (
                    <View
                      style={{
                        position: "absolute",
                        top: "33%",
                        height: "67%",
                        width: "100%",
                      }}
                      pointerEvents="box-none"
                    >
                      <SingleDiePreview
                        containerHeight={layout.diceTrayHeight * 0.67}
                        containerWidth={diceTrayWidth}
                      />
                    </View>
                  )}
                </View>
              }
            />
          </View>

          {/* Modals */}
          <OverviewModal visible={overviewVisible} onClose={toggleOverview} />

          {/* Global Item Detail Modal */}
          {modalItem && (
            <ItemDetailModal
              visible={!!itemModalId}
              onClose={closeItemModal}
              title={modalItem.name}
              description={modalItem.description}
              iconSource={ITEM_ICONS[modalItem.id] || ITEM_ICONS.fokus}
              price={itemModalShowPurchase ? modalItem.cost : undefined}
              canAfford={canAffordItem}
              onPurchase={
                itemModalShowPurchase ? handlePurchaseFromModal : undefined
              }
            />
          )}
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
    </>
  );
};

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
  diceTrayInner: {
    flex: 1,
    width: "100%",
  },
});
