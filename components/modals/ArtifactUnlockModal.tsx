import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { Modal, PrimaryButton, GameText } from "../shared";

interface ArtifactUnlockModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * ArtifactUnlockModal - Shows when artifact die is unlocked (after beating level 1)
 *
 * Features:
 * - Purple theme accent color
 * - Celebratory message
 * - "WEITER" CTA to dismiss
 */
export const ArtifactUnlockModal = ({
  visible,
  onClose,
}: ArtifactUnlockModalProps) => {
  return (
    <Modal visible={visible} onClose={onClose} title="Freigeschaltet!">
      <View style={styles.container}>
        {/* D20 Icon/Visual */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <GameText variant="displayLarge" color={COLORS.text}>
              D20
            </GameText>
          </View>
        </View>

        {/* Title */}
        <GameText
          variant="displayMedium"
          color={COLORS.artifact}
          style={styles.title}
        >
          ARTEFAKT WÜRFEL
        </GameText>

        {/* Description */}
        <GameText
          variant="bodyMedium"
          color={COLORS.textMuted}
          style={styles.description}
        >
          Der mystische Artefaktwürfel wurde deiner Sammlung hinzugefügt.
        </GameText>

        <GameText
          variant="bodySmall"
          color={COLORS.textMuted}
          style={styles.hint}
        >
          Verbessere ihn im Shop für +1 Mult Boni!
        </GameText>

        {/* CTA */}
        <PrimaryButton
          onPress={onClose}
          label="WEITER"
          variant="cyan"
          style={styles.button}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    backgroundColor: COLORS.overlays.artifactMild,
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.artifact,
    justifyContent: "center",
    alignItems: "center",
    // Glow effect
    shadowColor: COLORS.artifact,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    textAlign: "center",
    marginBottom: SPACING.sm,
    textShadowColor: COLORS.shadows.artifact,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    textAlign: "center",
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  hint: {
    textAlign: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    opacity: 0.8,
  },
  button: {
    width: "100%",
  },
});
