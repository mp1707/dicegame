import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { ModalShell } from "../ui/ModalShell";

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
    <ModalShell
      visible={visible}
      title="SHOP"
      titleStyle={styles.title}
      cardStyle={{
        borderColor: COLORS.mint,
        borderWidth: 2,
        borderRadius: DIMENSIONS.borderRadius * 2,
      }}
    >
      <View style={{ alignItems: "center", width: "100%" }}>
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
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  overlay: {
    // Moved to ModalShell
  },
  content: {
    // Moved to ModalShell
  },
  title: {
    ...TYPOGRAPHY.displayLarge,
    color: COLORS.mint,
    marginBottom: 0, // Managed by header in ModalShell, but we override
    textShadowColor: COLORS.mint,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  moneyDisplay: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 32,
    marginTop: 16, // Added spacing since title is in header now
    textAlign: "center",
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
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  futureText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  nextButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.mint,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: "#449E78",
    borderBottomWidth: 5,
    alignItems: "center",
  },
  nextButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textDark,
    letterSpacing: 1,
  },
});
