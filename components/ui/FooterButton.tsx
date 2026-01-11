import React from "react";
import { StyleProp, ViewStyle, StyleSheet, ColorValue } from "react-native";
import { GameText, Button } from "../shared";
import { COLORS } from "../../constants/theme";

interface FooterButtonProps {
  label: string;
  onPress: () => void;
  activeColor?: ColorValue;
  disabledColor?: ColorValue;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

/**
 * FooterButton - specialized button for footer controls
 * Enforces consistent depth (3) and text styling (buttonLarge)
 */
export const FooterButton = ({
  label,
  onPress,
  activeColor = COLORS.cyan,
  disabledColor = COLORS.surface2,
  disabled = false,
  style,
  fullWidth = false,
}: FooterButtonProps) => {
  return (
    <Button
      onPress={onPress}
      activeColor={activeColor}
      disabledColor={disabledColor}
      disabled={disabled}
      depth={3}
      style={[styles.base, fullWidth && styles.fullWidth, style]}
    >
      <GameText
        variant="buttonLarge"
        style={disabled && styles.labelDisabled}
        adjustsFontSizeToFit
      >
        {label}
      </GameText>
    </Button>
  );
};

const styles = StyleSheet.create({
  base: {
    // Base styles if needed
  },
  fullWidth: {
    width: "100%",
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
});
