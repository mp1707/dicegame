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
import { CATEGORIES, CategoryId } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";

interface ScratchModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScratchModal = ({ visible, onClose }: ScratchModalProps) => {
  const categories = useGameStore((s) => s.categories);
  const scratchCategory = useGameStore((s) => s.scratchCategory);

  // Get unfilled categories
  const unfilledCategories = CATEGORIES.filter(
    (cat) => categories[cat.id].score === null
  );

  const handleClose = () => {
    triggerSelectionHaptic();
    onClose();
  };

  const handleScratch = (categoryId: CategoryId) => {
    triggerSelectionHaptic();
    scratchCategory(categoryId);
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
          {/* Title */}
          <Text style={styles.title}>Streichen</Text>
          <Text style={styles.subtitle}>Kategorie mit 0 Punkten eintragen</Text>

          {/* Category list */}
          <ScrollView style={styles.list}>
            {unfilledCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryRow}
                onPress={() => handleScratch(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryName}>{cat.labelDe}</Text>
                <View style={styles.rightSide}>
                  <Text style={styles.zeroScore}>0</Text>
                  <Text style={styles.crossIcon}>❌</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>ABBRECHEN</Text>
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
    maxHeight: "80%",
    backgroundColor: COLORS.slotBg,
    borderRadius: DIMENSIONS.borderRadius * 2,
    padding: 20,
  },
  title: {
    color: COLORS.cyan,
    ...TYPOGRAPHY.largeScore,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: COLORS.textLight,
    ...TYPOGRAPHY.metaInfo,
    textAlign: "center",
    marginBottom: 20,
  },
  list: {
    maxHeight: 300,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: DIMENSIONS.borderRadius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  categoryName: {
    color: COLORS.textWhite,
    ...TYPOGRAPHY.labels,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  zeroScore: {
    color: COLORS.red,
    ...TYPOGRAPHY.smallScore,
  },
  crossIcon: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cyanDark,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textBlack,
    ...TYPOGRAPHY.mediumScore,
  },
});
