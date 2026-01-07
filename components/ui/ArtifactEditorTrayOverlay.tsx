import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { COLORS, SPACING } from "../../constants/theme";

/**
 * ArtifactEditorTrayOverlay - Title overlay for artifact editor phase
 *
 * Displays:
 * - Title: "Seite wählen"
 * - Subtitle: Shows selected face or hint
 * Purple theme accent
 */
export const ArtifactEditorTrayOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={FadeInUp.duration(250)}
        exiting={FadeOutDown.duration(200)}
        style={styles.content}
      >
        <TrayOverlayTitle
          title="Seite wählen"
          subtitle="D20 Artefakt"
          color={COLORS.artifact}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: SPACING.xl,
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
  },
  content: {
    alignItems: "center",
  },
});
