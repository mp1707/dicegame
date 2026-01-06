import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { SPACING } from "../../constants/theme";

/**
 * UpgradeTrayOverlay - Title for the dice tray area during SHOP_PICK_UPGRADE phase
 *
 * Displays:
 * - "Verbessere eine Hand" title
 * - "+5 Punkte" subtitle
 */
export const UpgradeTrayOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={FadeInUp.duration(250)}
        exiting={FadeOutDown.duration(200)}
        style={styles.content}
      >
        <TrayOverlayTitle title="Verbessere eine Hand" subtitle="+5 Punkte" />
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
