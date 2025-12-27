import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { getBasePoints, HAND_BASE_CONFIG } from "../../utils/gameCore";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Modal, PrimaryButton } from "../shared";

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
                      <Text style={styles.levelText}>LV{level}</Text>
                    </View>

                    {/* Icon */}
                    <CategoryIcon
                      categoryId={cat.id}
                      size={18}
                      strokeWidth={2}
                      color={isUsed ? COLORS.textMuted : COLORS.cyan}
                    />

                    {/* Name */}
                    <Text
                      style={[
                        styles.label,
                        isUsed && { color: COLORS.textMuted, opacity: 0.6 },
                      ]}
                    >
                      {cat.labelDe}
                    </Text>
                  </View>

                  {/* Formula */}
                  <Text
                    style={[styles.formula, isUsed && styles.formulaUsed]}
                  >
                    {isUsed ? "USED" : formula}
                  </Text>
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
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    minHeight: 100,
    maxHeight: 400,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  rowUsed: {
    opacity: 0.5,
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: "rgba(77, 238, 234, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 36,
    alignItems: "center",
  },
  levelText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontFamily: "Inter-Bold",
    letterSpacing: 0.3,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
  },
  formula: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter-Medium",
    letterSpacing: 0.3,
  },
  formulaUsed: {
    color: COLORS.textMuted,
    opacity: 0.6,
    fontStyle: "italic",
  },
  closeButton: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
  },
});
