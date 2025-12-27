import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { X } from "lucide-react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { triggerLightImpact } from "../../utils/haptics";

export type ModalVariant = "default" | "success" | "danger";

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

const VARIANT_BORDER_COLORS: Record<ModalVariant, string> = {
  default: COLORS.border,
  success: COLORS.mint,
  danger: COLORS.coral,
};

export const Modal = ({
  visible,
  onClose,
  title,
  children,
  variant = "default",
  showCloseButton = true,
  contentStyle,
}: ModalProps) => {
  if (!visible) return null;

  const borderColor = VARIANT_BORDER_COLORS[variant];

  const handleClose = () => {
    if (onClose) {
      triggerLightImpact();
      onClose();
    }
  };

  return (
    <View style={styles.absoluteFill} pointerEvents="auto">
      {/* Scrim */}
      <Animated.View entering={FadeIn.duration(100)} style={styles.scrim}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Content Container */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <Animated.View
          entering={SlideInUp.springify()
            .damping(25)
            .stiffness(400)
            .mass(0.8)
            .damping(35)}
          style={[styles.card, { borderColor }]}
        >
          {/* Header */}
          {(title || (showCloseButton && onClose)) && (
            <View style={styles.header}>
              <Text style={styles.title}>{title || ""}</Text>
              {showCloseButton && onClose && (
                <TouchableWithoutFeedback onPress={handleClose}>
                  <View style={styles.closeBtn}>
                    <X size={20} color={COLORS.textMuted} />
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
          )}

          {/* Content */}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(42, 34, 66, 0.6)",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: SPACING.screenPadding,
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: DIMENSIONS.borderWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  title: {
    fontFamily: "Bungee-Regular",
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
});
