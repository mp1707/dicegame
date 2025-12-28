import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { getBasePoints, HAND_BASE_CONFIG } from "../../utils/gameCore";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Modal, PrimaryButton, GameText } from "../shared";

interface OverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OverviewModal = ({ visible, onClose }: OverviewModalProps) => {
  const handLevels = useGameStore((s) => s.handLevels);
  const usedHandsThisLevel = useGameStore((s) => s.usedHandsThisLevel);

  return (
    <Modal visible={visible} onClose={onClose} title="Punkte">
      <View style={styles.container}>
        <View style={styles.listWrapper}>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {CATEGORIES.map((cat) => {
              const level = handLevels[cat.id];
              const isUsed = usedHandsThisLevel.includes(cat.id);
              const basePoints = getBasePoints(cat.id, level);
              const mult = HAND_BASE_CONFIG[cat.id].mult;

              // Format formula: "(BP + pips) × M"
              const formula = `(${basePoints} + pips) × ${mult}`;

              return (
                <View
                  key={cat.id}
                  style={[styles.row, isUsed && styles.rowUsed]}
                >
                  <View style={styles.leftSide}>
                    {/* Level badge */}
                    <View style={styles.levelBadge}>
                      <GameText
                        variant="labelSmall"
                        color={COLORS.cyan}
                        style={styles.levelText}
                      >
                        LV{level}
                      </GameText>
                    </View>

                    {/* Icon */}
                    <CategoryIcon
                      categoryId={cat.id}
                      size={DIMENSIONS.iconSize.sm}
                      strokeWidth={2}
                      color={isUsed ? COLORS.textMuted : COLORS.cyan}
                    />

                    {/* Name */}
                    <GameText
                      variant="bodySmall"
                      color={isUsed ? COLORS.textMuted : COLORS.text}
                      style={[styles.label, isUsed && styles.labelUsed]}
                    >
                      {cat.labelDe}
                    </GameText>
                  </View>

                  {/* Formula */}
                  <GameText
                    variant="labelSmall"
                    color={COLORS.textMuted}
                    style={[styles.formula, isUsed && styles.formulaUsed]}
                  >
                    {isUsed ? "USED" : formula}
                  </GameText>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <PrimaryButton
          onPress={onClose}
          label="SCHLIESSEN"
          variant="cyan"
          style={styles.closeButton}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  listWrapper: {
    flexShrink: 1,
    marginBottom: SPACING.sectionGap,
    backgroundColor: COLORS.overlays.blackSubtle,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteSubtle,
    minHeight: 100,
    maxHeight: 400,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    padding: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteSubtle,
  },
  rowUsed: {
    opacity: 0.5,
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: COLORS.overlays.cyanMild,
    paddingHorizontal: SPACING.iconGapMedium,
    paddingVertical: SPACING.xxs,
    borderRadius: SPACING.xs,
    minWidth: 36,
    alignItems: "center",
  },
  levelText: {
    letterSpacing: 0.3,
  },
  label: {
    flex: 1,
  },
  labelUsed: {
    opacity: 0.6,
  },
  formula: {
    letterSpacing: 0.3,
  },
  formulaUsed: {
    opacity: 0.6,
    fontStyle: "italic",
  },
  closeButton: {
    shadowColor: COLORS.shadows.black,
    shadowOpacity: 0.3,
  },
});
