import React from "react";
import { View, StyleSheet } from "react-native";
import { UpperSection } from "./UpperSection";
import { LowerSection } from "./LowerSection";
import { SPACING } from "../../constants/theme";

interface ScoringGridProps {
  canScratch: boolean;
  onScratchPress: () => void;
}

export const ScoringGrid = ({
  canScratch,
  onScratchPress,
}: ScoringGridProps) => {
  return (
    <View style={styles.container}>
      <UpperSection />
      <LowerSection canScratch={canScratch} onScratchPress={onScratchPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
});
