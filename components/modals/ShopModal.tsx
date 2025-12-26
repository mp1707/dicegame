import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";

interface ShopModalProps {
  visible: boolean;
}

export const ShopModal = ({ visible }: ShopModalProps) => {
  const money = useGameStore((s) => s.money);
  const startNextRun = useGameStore((s) => s.startNextRun);
  const handleStartNextRun = () => {
    triggerSelectionHaptic();
    startNextRun();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>SHOP</Text>

          {/* Money display */}
          <Text style={styles.moneyDisplay}>${formatNumber(money)}</Text>

          {/* Placeholder content */}
          <View style={styles.shopContent}>
            <Text style={styles.emptyText}>Shop ist leer</Text>
            <Text style={styles.futureText}>Upgrades kommen bald...</Text>
          </View>

          {/* Next round button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleStartNextRun}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>NÄCHSTE RUNDE</Text>
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
    backgroundColor: COLORS.slotBg,
    borderRadius: DIMENSIONS.borderRadius * 2,
    padding: 24,
    alignItems: "center",
  },
  title: {
    color: COLORS.cyan,
    ...TYPOGRAPHY.largeScore,
    marginBottom: 16,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  moneyDisplay: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 32,
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  shopContent: {
    width: "100%",
    minHeight: 150,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
  },
  emptyText: {
    color: COLORS.textMuted,
    ...TYPOGRAPHY.labels,
    marginBottom: 8,
  },
  futureText: {
    color: COLORS.textMuted,
    ...TYPOGRAPHY.metaInfo,
    fontStyle: "italic",
  },
  nextButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.green,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: "#166534",
    borderBottomWidth: 5,
    alignItems: "center",
  },
  nextButtonText: {
    color: COLORS.textWhite,
    ...TYPOGRAPHY.mediumScore,
    letterSpacing: 1,
  },
});
