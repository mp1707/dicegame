import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { IconButton } from "./ButtonVariants";
import { X } from "lucide-react-native";
import { triggerLightImpact } from "../../utils/haptics";

interface ModalShellProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  cardStyle?: any; // Using any for simplicity in ViewStyle
  titleStyle?: any; // Using any for simplicity in TextStyle
}

export const ModalShell = ({
  visible,
  onClose,
  title,
  children,
  cardStyle,
  titleStyle,
}: ModalShellProps) => {
  if (!visible) return null;

  return (
    <View style={styles.absoluteFill} pointerEvents="auto">
      {/* Scrim */}
      <Animated.View
        entering={FadeIn.duration(100)}
        // No exiting animation for instant dismissal
        style={styles.scrim}
      >
        <TouchableWithoutFeedback onPress={onClose}>
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
            .damping(35)} // Ensuring it's snappy but not too bouncy
          // No exiting animation
          style={[styles.card, cardStyle]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, titleStyle]}>{title || ""}</Text>
            {onClose && (
              <IconButton
                onPress={() => {
                  triggerLightImpact();
                  onClose();
                }}
                style={styles.closeBtn}
                icon={<X size={20} color={COLORS.textMuted} />}
              />
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
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
    backgroundColor: "rgba(42, 34, 66, 0.6)", // Purple tinted scrim
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
    borderColor: COLORS.border,
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
  },
  content: {
    padding: 20,
  },
});
