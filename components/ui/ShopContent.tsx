import React from "react";
import { View, StyleSheet } from "react-native";
import { ArrowUp, Lock, ShoppingBag } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { GameText } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { triggerSelectionHaptic } from "../../utils/haptics";

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
    depth={4}
    borderRadius={DIMENSIONS.borderRadiusSmall}
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
        <Chip label={sublabel} color={disabled ? "muted" : "cyan"} size="sm" />
      )}
    </View>
  </Pressable3DBase>
);

/**
 * ShopContent - Compact shop for bottom panel slot
 *
 * Simplified from full-screen ShopPanel:
 * - No header (money already in PlayConsole)
 * - Smaller item grid
 * - CTA handled by FooterControls
 */
export const ShopContent: React.FC = () => {
  const selectUpgradeItem = useGameStore((s) => s.selectUpgradeItem);

  const handleUpgrade = () => {
    selectUpgradeItem();
  };

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <ShoppingBag size={DIMENSIONS.iconSize.md} color={COLORS.cyan} />
        <GameText variant="displaySmall" color={COLORS.text}>
          SHOP
        </GameText>
      </View>

      {/* Shop grid - 2x2 filling remaining space */}
      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {/* Upgrade Hand - Active */}
          <ShopItem
            icon={
              <ArrowUp
                size={DIMENSIONS.iconSize.md}
                color={COLORS.mint}
                strokeWidth={3}
              />
            }
            label="UPGRADE"
            sublabel="BOOST"
            onPress={handleUpgrade}
          />

          {/* Placeholder 1 */}
          <ShopItem
            icon={
              <Lock size={DIMENSIONS.iconSize.sm} color={COLORS.textMuted} />
            }
            label="JOKERS"
            sublabel="SOON"
            disabled
          />
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {/* Placeholder 2 */}
          <ShopItem
            icon={
              <Lock size={DIMENSIONS.iconSize.sm} color={COLORS.textMuted} />
            }
            label="DICE"
            sublabel="SOON"
            disabled
          />

          {/* Placeholder 3 */}
          <ShopItem
            icon={
              <Lock size={DIMENSIONS.iconSize.sm} color={COLORS.textMuted} />
            }
            label="POWERS"
            sublabel="SOON"
            disabled
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm, // Reduced margin for tighter fit
    flexShrink: 0,
  },
  gridContainer: {
    flex: 1,
    gap: SPACING.sm,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  shopItem: {
    flex: 1, // Take available width
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  disabledItem: {
    opacity: 0.5,
  },
  shopItemFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.border,
    borderTopColor: COLORS.overlays.whiteMild,
    borderBottomWidth: DIMENSIONS.borderWidthThick,
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
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  shopItemLabel: {
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
});
