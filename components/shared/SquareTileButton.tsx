import React from "react";
import {
  View,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Check } from "lucide-react-native";
import { Button } from "./Button";
import { GameText } from "./GameText";
import { Surface } from "../pixel-ui-kit";
import { COLORS, SPACING } from "../../constants/theme";

export type TileButtonState = "selected" | "active" | "used" | "invalid";

export interface SquareTileButtonProps {
  /** Image source for the icon */
  iconSource: ImageSourcePropType;
  /** Primary label text */
  label: string;
  /** Optional second line (e.g., "1", "2", etc.) */
  sublabel?: string;
  /** Optional level badge (top-right) */
  level?: number;
  /** Whether the button is selected (cyan background, black text) */
  isSelected?: boolean;
  /** Whether the button is disabled (muted appearance) */
  isDisabled?: boolean;
  /** Whether the button is in "used" state (checkmark + gold) */
  isUsed?: boolean;
  /** Called when the button is pressed */
  onPress: () => void;
  /** Enhancement points sum (blue pill, bottom-left) */
  enhancePoints?: number;
  /** Enhancement mult sum (red pill, bottom-right) */
  enhanceMult?: number;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
}

/**
 * LevelBadge - Small badge showing level in top-right corner
 */
interface LevelBadgeProps {
  level: number;
  isSelected?: boolean;
}

const LevelBadge: React.FC<LevelBadgeProps> = React.memo(
  ({ level, isSelected }) => (
    <Surface
      tintColor={
        isSelected ? COLORS.overlays.blackSubtle : COLORS.overlays.whiteMedium
      }
      padding="xxs"
      style={styles.levelBadge}
      contentStyle={styles.levelBadgeContent}
    >
      <GameText
        variant="caption"
        color={isSelected ? "#000000" : COLORS.text}
        style={styles.levelText}
      >
        LV {level}
      </GameText>
    </Surface>
  )
);

LevelBadge.displayName = "LevelBadge";

/**
 * EnhancePill - Small badge for enhancement display
 */
interface EnhancePillProps {
  type: "points" | "mult";
  value: number;
}

const EnhancePill: React.FC<EnhancePillProps> = React.memo(
  ({ type, value }) => (
    <Surface
      tintColor={type === "points" ? COLORS.upgradePoints : COLORS.upgradeMult}
      padding="xxs"
      style={[
        styles.enhancePill,
        type === "points" ? styles.enhancePillLeft : styles.enhancePillRight,
      ]}
      contentStyle={styles.enhancePillContent}
    >
      <GameText variant="caption" color={COLORS.text} style={styles.pillText}>
        {type === "points" ? `+${value * 10}` : `+${value}`}
      </GameText>
    </Surface>
  )
);

EnhancePill.displayName = "EnhancePill";

/**
 * SquareTileButton - Reusable square button for icon+label grids
 *
 * Used in:
 * - Dice editor (die selection, face selection)
 * - Shop upgrade picker
 * - Scoring grid upper section
 *
 * Features:
 * - Icon + label + optional sublabel
 * - Level badge (top-right, optional)
 * - Enhancement pills (bottom corners, optional)
 * - Black text on cyan for readability
 * - Used state with checkmark
 * - Built-in selection pulse animation (via Button)
 */
export const SquareTileButton: React.FC<SquareTileButtonProps> = React.memo(
  ({
    iconSource,
    label,
    sublabel,
    level,
    isSelected = false,
    isDisabled = false,
    isUsed = false,
    onPress,
    enhancePoints,
    enhanceMult,
    style,
  }) => {
    // Get text color based on state
    const getTextColor = () => {
      if (isUsed) return COLORS.goldDark;
      if (isSelected) return "#000000"; // Black on cyan for readability
      if (isDisabled) return COLORS.textMuted;
      return COLORS.text;
    };

    // Get icon opacity based on state
    const iconOpacity = isDisabled && !isUsed ? 0.5 : 1;

    // Determine active color
    const activeColor = isUsed ? COLORS.surface2 : COLORS.purple;

    const textColor = getTextColor();

    return (
      <Button
        onPress={onPress}
        disabled={isDisabled || isUsed}
        selected={isSelected}
        activeColor={activeColor}
        selectedColor={COLORS.cyan}
        disabledColor={COLORS.surface2}
        padding="sm"
        depth={3}
        style={[styles.container, style]}
        contentStyle={styles.content}
      >
        {/* Level Badge (top-right, absolute) */}
        {level !== undefined && (
          <LevelBadge level={level} isSelected={isSelected} />
        )}

        {/* Enhancement Pills (bottom corners, absolute) */}
        {enhancePoints !== undefined && enhancePoints > 0 && (
          <EnhancePill type="points" value={enhancePoints} />
        )}
        {enhanceMult !== undefined && enhanceMult > 0 && (
          <EnhancePill type="mult" value={enhanceMult} />
        )}

        {/* Center content */}
        <View style={styles.centerContent}>
          {isUsed ? (
            <Check size={20} color={COLORS.goldDark} strokeWidth={2.5} />
          ) : (
            <Image
              source={iconSource}
              style={[styles.icon, { opacity: iconOpacity }]}
              resizeMode="contain"
            />
          )}
          <GameText variant="body" color={textColor} style={styles.labelText}>
            {label}
          </GameText>
          {sublabel && (
            <GameText variant="body" color={textColor} style={styles.labelText}>
              {sublabel}
            </GameText>
          )}
        </View>
      </Button>
    );
  }
);

SquareTileButton.displayName = "SquareTileButton";

const styles = StyleSheet.create({
  container: {
    // Caller provides sizing via style prop
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xxs,
  },
  icon: {
    width: 28,
    height: 28,
  },
  labelText: {
    textAlign: "center",
    lineHeight: 12,
  },
  // Level badge styles
  levelBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },
  levelBadgeContent: {
    paddingHorizontal: 2,
  },
  levelText: {
    fontSize: 7,
    letterSpacing: 0.3,
  },
  // Enhancement pill styles
  enhancePill: {
    position: "absolute",
    bottom: 4,
    zIndex: 10,
  },
  enhancePillLeft: {
    left: 4,
  },
  enhancePillRight: {
    right: 4,
  },
  enhancePillContent: {
    paddingHorizontal: 2,
  },
  pillText: {
    fontSize: 7,
    letterSpacing: 0.2,
  },
});
