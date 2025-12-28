import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ArrowUp, Lock, ShoppingBag } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { PrimaryButton, GameText } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
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
      <GameText
        variant="bodySmall"
        color={disabled ? COLORS.textMuted : COLORS.text}
        numberOfLines={1}
        style={[styles.shopItemLabel, disabled && styles.disabledText]}
      >
        {label}
      </GameText>
      {sublabel && (
        <Chip
          label={sublabel}
          color={disabled ? "muted" : "cyan"}
          size="sm"
          style={styles.sublabelChip}
        />
      )}
    </View>
  </Pressable3DBase>
);

interface ShopPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * ShopPanel - The inner content of ShopScreen, extracted for PhaseDeck animation
 */
export const ShopPanel: React.FC<ShopPanelProps> = ({ style }) => {
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

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <ShoppingBag size={DIMENSIONS.iconSize.lg} color={COLORS.cyan} />
        <GameText variant="displayLarge" style={styles.title}>
          SHOP
        </GameText>
      </View>

      {/* Money display */}
      <GameText variant="displayHuge" color={COLORS.gold} style={styles.moneyDisplay}>
        ${formatNumber(money)}
      </GameText>

      {/* Shop grid */}
      <View style={styles.grid}>
        {/* Upgrade Hand - Active */}
        <ShopItem
          icon={<ArrowUp size={DIMENSIONS.iconSize.lg} color={COLORS.mint} strokeWidth={3} />}
          label="UPGRADE HAND"
          sublabel="BOOST POWER"
          onPress={handleUpgrade}
        />

        {/* Placeholder items - Disabled */}
        <ShopItem
          icon={<Lock size={DIMENSIONS.iconSize.md} color={COLORS.textMuted} />}
          label="JOKER CARDS"
          sublabel="COMING SOON"
          disabled
        />

        <ShopItem
          icon={<Lock size={DIMENSIONS.iconSize.md} color={COLORS.textMuted} />}
          label="EXTRA DICE"
          sublabel="COMING SOON"
          disabled
        />

        <ShopItem
          icon={<Lock size={DIMENSIONS.iconSize.md} color={COLORS.textMuted} />}
          label="SPECIAL POWERS"
          sublabel="COMING SOON"
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

/**
 * ShopScreen - Full screen wrapper with upgrade picker handling
 */
export const ShopScreen = () => {
  const phase = useGameStore((s) => s.phase);

  // Show upgrade picker if in that phase
  if (phase === "SHOP_PICK_UPGRADE") {
    return <UpgradePickerScreen />;
  }

  return <ShopPanel />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm + 2,
    marginBottom: SPACING.lg,
  },
  title: {
    letterSpacing: 2,
  },
  moneyDisplay: {
    textAlign: "center",
    marginBottom: SPACING.xxl,
    textShadowColor: COLORS.shadows.goldStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
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
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.border,
    borderTopWidth: DIMENSIONS.borderWidthThin,
    borderTopColor: COLORS.overlays.whiteMedium,
    borderBottomWidth: DIMENSIONS.borderWidthThick + 1,
    borderBottomColor: COLORS.overlays.blackMedium,
  },
  disabledItemFace: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.overlays.whiteSubtle,
  },
  shopItemContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  shopItemLabel: {
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sublabelChip: {
    marginTop: SPACING.xs,
  },
  disabledText: {
    opacity: 0.6,
  },
  footer: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
