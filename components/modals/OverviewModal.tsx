import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Modal, PrimaryButton } from "../shared";

interface OverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OverviewModal = ({ visible, onClose }: OverviewModalProps) => {
  const categories = useGameStore((s) => s.categories);

  return (
    <Modal visible={visible} onClose={onClose} title="Übersicht">
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

        <PrimaryButton
          onPress={onClose}
          label="SCHLIEßEN"
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
    ...TYPOGRAPHY.scoreValue,
    fontSize: 16,
  },
  closeButton: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
  },
});
