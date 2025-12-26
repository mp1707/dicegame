import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { ModalShell } from "../ui/ModalShell";
import { CTA3DButton } from "../ui/Button3DVariants";

interface OverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OverviewModal = ({ visible, onClose }: OverviewModalProps) => {
  const categories = useGameStore((s) => s.categories);
  const handleClose = () => {
    // triggerSelectionHaptic(); // ModalShell close button (X) handles haptics. BUT bottom button should too.
    // PrimaryCTAButton handles haptics automatically.
    onClose();
  };

  return (
    <ModalShell visible={visible} onClose={handleClose} title="Übersicht">
      <View style={styles.container}>
        <View style={styles.listWrapper}>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {CATEGORIES.map((cat) => {
              const slot = categories[cat.id];
              const score = slot.score === null ? "-" : String(slot.score);
              const isFilled = slot.score !== null;

              return (
                <View key={cat.id} style={styles.row}>
                  <View style={styles.leftSide}>
                    <CategoryIcon
                      categoryId={cat.id}
                      size={18}
                      strokeWidth={2}
                      color={isFilled ? COLORS.gold : COLORS.textMuted}
                    />
                    <Text
                      style={[styles.label, isFilled && { color: COLORS.gold }]}
                    >
                      {cat.labelDe}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.score,
                      isFilled
                        ? { color: COLORS.text }
                        : { color: COLORS.textMuted },
                    ]}
                  >
                    {score}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <CTA3DButton
          onPress={handleClose}
          label="SCHLIEßEN"
          colors={[COLORS.surfaceHighlight, COLORS.surface]}
          style={styles.closeButton}
        />
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    // flexShrink: 1, // Container just wraps. Children shrink.
  },
  listWrapper: {
    // flex: 1, // REMOVED: Caused collapse in auto-height container
    flexShrink: 1, // Allow shrinking when parent hits max height
    marginBottom: SPACING.sectionGap,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    minHeight: 100,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0, // Render full content height naturally
  },
  listContent: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  score: {
    ...TYPOGRAPHY.scoreValue, // Tabular numbers
    fontSize: 16,
  },
  closeButton: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
  },
});
