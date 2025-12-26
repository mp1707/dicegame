import React from "react";
import { View, StyleSheet } from "react-native";
import { UpperSection } from "./UpperSection";
import { LowerSection } from "./LowerSection";
import { SPACING } from "../../constants/theme";

export const ScoringGrid = () => {
  return (
    <View style={styles.container}>
      <UpperSection />
      <LowerSection />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
});
