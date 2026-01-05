import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { SPACING } from "../../constants/theme";

/**
 * ShopTrayOverlay - Title and subtitle for the dice tray area during SHOP_MAIN phase
 *
 * Displays:
 * - "SHOP" title (using shared component)
 * - "Wähle ein Upgrade" subtitle
 */
export const ShopTrayOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={SlideInLeft.duration(300)}
        exiting={SlideOutRight.duration(300)}
        style={styles.content}
      >
        <TrayOverlayTitle title="SHOP" subtitle="Wähle ein Upgrade" />
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
