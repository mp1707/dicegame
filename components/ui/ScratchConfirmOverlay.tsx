import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { ModalShell } from "./ModalShell";

export const ScratchConfirmOverlay = () => {
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const clearPendingScratchCategory = useGameStore(
    (s) => s.clearPendingScratchCategory
  );

  if (!pendingScratchCategoryId) return null;

  const categoryDef = CATEGORIES.find((c) => c.id === pendingScratchCategoryId);
  const label = categoryDef?.labelDe || pendingScratchCategoryId;

  const handleCancel = () => {
    triggerSelectionHaptic();
    clearPendingScratchCategory();
  };

  return (
    <ModalShell
      visible={!!pendingScratchCategoryId}
      onClose={handleCancel}
      title={label}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconRow}>
          <X size={32} color={COLORS.coral} strokeWidth={3} />
        </View>
        <Text style={styles.scoreValue}>0 PUNKTE</Text>
        <Text style={styles.helperText}>
          Wähle STREICHEN oder tippe zum Abbrechen
        </Text>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: "center",
    gap: SPACING.sectionGap,
    paddingVertical: 12,
  },
  iconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 90, 122, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 122, 0.4)",
  },
  scoreValue: {
    fontFamily: "Bungee-Regular",
    fontSize: 32,
    color: COLORS.coral,
    textAlign: "center",
    textShadowColor: "rgba(255, 90, 122, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  helperText: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
