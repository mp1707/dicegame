import React, { useContext } from "react";
import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { TYPOGRAPHY, FONT_FAMILY, COLORS } from "../../constants/theme";
import { LayoutContext } from "../../utils/LayoutContext";

export type GameTextVariant = keyof typeof TYPOGRAPHY;

export interface GameTextProps extends Omit<TextProps, "style"> {
  /** Typography variant from theme */
  variant?: GameTextVariant;
  /** Override text color */
  color?: string;
  /** Additional styles */
  style?: StyleProp<TextStyle>;
  /** Children text content */
  children: React.ReactNode;
  /** Disable font scaling (use base font size) */
  disableScaling?: boolean;
}

/**
 * GameText - Reusable text component with M6x11 font pre-applied
 *
 * Font sizes are automatically scaled based on screen size for
 * consistent appearance across devices.
 *
 * Usage:
 * <GameText variant="displayLarge">Score: 100</GameText>
 * <GameText variant="label" color={COLORS.gold}>LEVEL 1</GameText>
 * <GameText style={{ fontSize: 16 }}>Custom size</GameText>
 */
export const GameText: React.FC<GameTextProps> = ({
  variant = "bodyMedium",
  color,
  style,
  children,
  disableScaling = false,
  ...rest
}) => {
  // Get font scale from layout context (may be null during initial render)
  const layoutContext = useContext(LayoutContext);
  const fontScale = layoutContext?.fontScale ?? 1;

  const variantStyle = TYPOGRAPHY[variant];
  const baseFontSize = variantStyle.fontSize;

  // Apply font scaling unless disabled
  const scaledFontSize = disableScaling
    ? baseFontSize
    : Math.round(baseFontSize * fontScale);

  const combinedStyle: TextStyle = {
    ...variantStyle,
    fontSize: scaledFontSize,
    ...(color && { color }),
  };

  return (
    <Text style={[combinedStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

export default GameText;
