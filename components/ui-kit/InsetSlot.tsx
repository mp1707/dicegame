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
// P3.4: Memoize to prevent unnecessary re-renders from parent updates
export const InsetSlot: React.FC<InsetSlotProps> = React.memo(({
  padding = "sm",
  style,
  children,
}) => {
  return (
    <Surface variant="inset" padding={padding} style={style}>
      {children}
    </Surface>
  );
});
