import React from "react";
import { View, StyleSheet } from "react-native";
import { GameText } from "../shared";
import { Surface } from "../ui-kit";
import { COLORS, SPACING } from "../../constants/theme";
import { useLayout } from "../../utils/LayoutContext";

export const SpecialSection = () => {
  const layout = useLayout();

  return (
    <View style={styles.wrapper}>
      <GameText
        variant="labelSmall"
        color={COLORS.textMuted}
        style={styles.header}
      >
        SPEZIAL
      </GameText>
      <Surface
        variant="panel"
        style={[styles.container, { height: layout.specialSlotHeight }]}
      >
        <GameText variant="bodyMedium" color={COLORS.textMuted}>
          Coming soon...
        </GameText>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  header: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
