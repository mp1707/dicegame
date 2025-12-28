import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { Surface, PaddingPreset } from "./Surface";

interface InsetSlotProps {
  /** Padding preset (defaults to sm for compact data rows) */
  padding?: PaddingPreset;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
  /** Content to render inside */
  children?: React.ReactNode;
}

/**
 * InsetSlot - Recessed sub-surface for data displays
 *
 * Use inside HUDCard for:
 * - Data rows
 * - Value displays
 * - Icon containers
 *
 * Creates a "pressed in" / recessed appearance.
 */
export const InsetSlot: React.FC<InsetSlotProps> = ({
  padding = "sm",
  style,
  children,
}) => {
  return (
    <Surface variant="inset" padding={padding} style={style}>
      {children}
    </Surface>
  );
};
