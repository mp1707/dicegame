import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal, PrimaryButton } from "../shared";
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
    <Modal visible={visible} title="SHOP" variant="success">
      <View style={styles.container}>
        <Text style={styles.moneyDisplay}>${formatNumber(money)}</Text>

        <View style={styles.shopContent}>
          <Text style={styles.emptyText}>Shop ist leer</Text>
          <Text style={styles.futureText}>Upgrades kommen bald...</Text>
        </View>

        <PrimaryButton
          onPress={handleStartNextRun}
          label="NÄCHSTE RUNDE"
          variant="mint"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  moneyDisplay: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 32,
    marginTop: 16,
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
});
