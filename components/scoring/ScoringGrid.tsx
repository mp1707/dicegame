import React from "react";
import { View, StyleSheet } from "react-native";
import { SpecialSection } from "./SpecialSection";
import { UpperSection } from "./UpperSection";
import { LowerSection } from "./LowerSection";
import { SPACING } from "../../constants/theme";

export const ScoringGrid = () => {
  return (
    <View style={styles.container}>
      <SpecialSection />
      <UpperSection />
      <LowerSection />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "space-evenly", // Distribute sections evenly in available space
  },
});
