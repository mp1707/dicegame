import React from "react";
import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { TYPOGRAPHY, FONT_FAMILY, COLORS } from "../../constants/theme";

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
}

/**
 * GameText - Reusable text component with M6x11 font pre-applied
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
  ...rest
}) => {
  const variantStyle = TYPOGRAPHY[variant];

  const combinedStyle: TextStyle = {
    ...variantStyle,
    ...(color && { color }),
  };

  return (
    <Text style={[combinedStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

export default GameText;
