import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";

interface OverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OverviewModal = ({ visible, onClose }: OverviewModalProps) => {
  const categories = useGameStore((s) => s.categories);
  const handleClose = () => {
    triggerSelectionHaptic();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Übersicht</Text>

          <View style={styles.listWrapper}>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORIES.map((cat) => {
                const slot = categories[cat.id];
                const score = slot.score === null ? "-" : String(slot.score);

                return (
                  <View key={cat.id} style={styles.row}>
                    <View style={styles.leftSide}>
                      <CategoryIcon
                        categoryId={cat.id}
                        size={18}
                        strokeWidth={2}
                        color={COLORS.cyan}
                      />
                      <Text style={styles.label}>{cat.labelDe}</Text>
                    </View>
                    <Text style={styles.score}>{score}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "90%",
    height: "85%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius * 2,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.displayLarge,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  listWrapper: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.cyan,
  },
  score: {
    ...TYPOGRAPHY.scoreValue,
    color: COLORS.gold,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  closeText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});
