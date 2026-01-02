import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { GameText } from "../shared";
import { Surface } from "../ui-kit";
import { COLORS } from "../../constants/theme";

interface SpecialSectionProps {
  style?: StyleProp<ViewStyle>;
}

export const SpecialSection = ({ style }: SpecialSectionProps) => {
  return (
    <Surface variant="panel" style={[styles.container, style]}>
      <GameText variant="bodyMedium" color={COLORS.textMuted}>
        Coming soon...
      </GameText>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
