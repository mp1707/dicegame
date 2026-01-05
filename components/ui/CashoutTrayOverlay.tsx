import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

/**
 * CashoutTrayOverlay - Title and subtitle for the dice tray area during LEVEL_RESULT phase
 *
 * Displays:
 * - Flavor title ("Hier kommt deine Belohnung")
 * - Subtitle ("LEVEL X COMPLETE")
 * - No payout card (sum is now in bottom panel)
 */
export const CashoutTrayOverlay: React.FC = () => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const levelNumber = currentLevelIndex + 1;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={SlideInLeft.duration(300)}
        exiting={SlideOutRight.duration(300)}
        style={styles.content}
      >
        <TrayOverlayTitle
          title="Hier kommt deine Belohnung"
          subtitle={`LEVEL ${levelNumber} COMPLETE`}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  content: {
    alignItems: "center",
  },
});
