import React from "react";
import { View, StyleSheet } from "react-native";
import { PrimaryButton } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import { RollCounter } from "./RollCounter";

export const FooterControls = () => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const scratchCategory = useGameStore((s) => s.scratchCategory);
  const phase = useGameStore((s) => s.phase);
  const goToShop = useGameStore((s) => s.goToShop);
  const retryRun = useGameStore((s) => s.retryRun);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const submitCategory = useGameStore((s) => s.submitCategory);

  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "rolling" &&
    !pendingCategoryId;

  const isConfirming = !!pendingCategoryId;
  const isScratchConfirming = !!pendingScratchCategoryId;

  const handleGoToShop = () => {
    goToShop();
  };

  const handleRetryRun = () => {
    retryRun();
  };

  const handleConfirmCategory = () => {
    if (isConfirming && pendingCategoryId) {
      submitCategory(pendingCategoryId);
      triggerSelectionHaptic();
    }
  };

  const handleConfirmScratch = () => {
    if (isScratchConfirming && pendingScratchCategoryId) {
      scratchCategory(pendingScratchCategoryId);
      triggerSelectionHaptic();
    }
  };

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  const renderContent = () => {
    if (phase === "won") {
      return (
        <PrimaryButton
          onPress={handleGoToShop}
          label="SHOP"
          variant="mint"
          style={styles.button}
        />
      );
    }

    if (phase === "lost") {
      return (
        <PrimaryButton
          onPress={handleRetryRun}
          label="NOCHMAL"
          variant="coral"
          style={styles.button}
        />
      );
    }

    if (isScratchConfirming) {
      return (
        <PrimaryButton
          onPress={handleConfirmScratch}
          label="STREICHEN"
          variant="coral"
          icon={
            <MaterialCommunityIcons
              name="close-thick"
              size={24}
              color={COLORS.textDark}
            />
          }
          style={styles.button}
        />
      );
    }

    if (isConfirming) {
      return (
        <PrimaryButton
          onPress={handleConfirmCategory}
          label="ANNEHMEN"
          variant="cyan"
          icon={
            <MaterialCommunityIcons
              name="pencil-outline"
              size={24}
              color={COLORS.textDark}
            />
          }
          style={styles.button}
        />
      );
    }

    const label = isRolling ? "WÜRFELT..." : "WURF";

    return (
      <View style={styles.mainControlWrapper}>
        <RollCounter remaining={rollsRemaining} />
        <PrimaryButton
          onPress={onPressRoll}
          label={label}
          disabled={!canRoll}
          variant="cyan"
          icon={
            canRoll ? (
              <MaterialCommunityIcons
                name="dice-multiple"
                size={24}
                color={COLORS.textDark}
              />
            ) : undefined
          }
        />
      </View>
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: SPACING.sectionGap,
    gap: 8,
    alignItems: "center",
  },
  mainControlWrapper: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    shadowOpacity: 0.6,
  },
});
