import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArrowUp, Lock, ShoppingBag } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { PrimaryButton } from "../shared";
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { UpgradePickerScreen } from "./UpgradePickerScreen";

interface ShopItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  onPress?: () => void;
}

const ShopItem = ({
  icon,
  label,
  sublabel,
  disabled = false,
  onPress,
}: ShopItemProps) => (
  <Pressable3DBase
    onPress={
      disabled
        ? () => {}
        : () => {
            triggerSelectionHaptic();
            onPress?.();
          }
    }
    disabled={disabled}
    depth={6}
    borderRadius={DIMENSIONS.borderRadius}
    showLighting={false}
    style={[styles.shopItem, disabled && styles.disabledItem]}
    face={
      <View
        style={[styles.shopItemFace, disabled && styles.disabledItemFace]}
      />
    }
  >
    <View style={styles.shopItemContent}>
      {icon}
      <Text
        style={[styles.shopItemLabel, disabled && styles.disabledText]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          style={[styles.shopItemSublabel, disabled && styles.disabledText]}
        >
          {sublabel}
        </Text>
      )}
    </View>
  </Pressable3DBase>
);

export const ShopScreen = () => {
  const phase = useGameStore((s) => s.phase);
  const money = useGameStore((s) => s.money);
  const selectUpgradeItem = useGameStore((s) => s.selectUpgradeItem);
  const closeShopNextLevel = useGameStore((s) => s.closeShopNextLevel);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);

  const isLastLevel = currentLevelIndex >= 7;

  const handleNextLevel = () => {
    triggerSelectionHaptic();
    closeShopNextLevel();
  };

  const handleUpgrade = () => {
    selectUpgradeItem();
  };

  // Show upgrade picker if in that phase
  if (phase === "SHOP_PICK_UPGRADE") {
    return <UpgradePickerScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ShoppingBag size={28} color={COLORS.cyan} />
        <Text style={styles.title}>SHOP</Text>
      </View>

      {/* Money display */}
      <Text style={styles.moneyDisplay}>${formatNumber(money)}</Text>

      {/* Shop grid */}
      <View style={styles.grid}>
        {/* Upgrade Hand - Active */}
        <ShopItem
          icon={<ArrowUp size={28} color={COLORS.mint} strokeWidth={3} />}
          label="UPGRADE HAND"
          sublabel="Boost a hand's power"
          onPress={handleUpgrade}
        />

        {/* Placeholder items - Disabled */}
        <ShopItem
          icon={<Lock size={24} color={COLORS.textMuted} />}
          label="COMING SOON"
          sublabel="Joker cards"
          disabled
        />

        <ShopItem
          icon={<Lock size={24} color={COLORS.textMuted} />}
          label="COMING SOON"
          sublabel="Extra dice"
          disabled
        />

        <ShopItem
          icon={<Lock size={24} color={COLORS.textMuted} />}
          label="COMING SOON"
          sublabel="Special powers"
          disabled
        />
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <PrimaryButton
          onPress={handleNextLevel}
          label={isLastLevel ? "FINISH RUN" : "NEXT LEVEL"}
          variant="cyan"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: "Bungee-Regular",
    letterSpacing: 2,
  },
  moneyDisplay: {
    color: COLORS.gold,
    fontSize: 40,
    fontFamily: "Bungee-Regular",
    textAlign: "center",
    marginBottom: 24,
    textShadowColor: "rgba(255, 200, 87, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    flex: 1,
  },
  shopItem: {
    width: "46%",
    aspectRatio: 1,
    borderRadius: DIMENSIONS.borderRadius,
  },
  disabledItem: {
    opacity: 0.6,
  },
  shopItemFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  disabledItemFace: {
    backgroundColor: COLORS.bg,
    borderColor: "rgba(255,255,255,0.05)",
  },
  shopItemContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  shopItemLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shopItemSublabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  disabledText: {
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
