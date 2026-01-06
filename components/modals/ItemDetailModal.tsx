/**
 * ItemDetailModal - Modal for displaying item details
 *
 * Features:
 * - Shows item icon in InsetSlot container
 * - Displays title, icon, and description
 * - Highlights keywords like "Hände" (cyan) and "Würfe" (gold)
 * - Optional CTA button for purchasing in shop context
 */

import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { Modal, GameText, PrimaryButton } from "../shared";
import { InsetSlot } from "../ui-kit";

interface ItemDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  iconSource: ImageSourcePropType;
  /** If provided, shows a "Kaufen" CTA with price */
  price?: number;
  canAfford?: boolean;
  onPurchase?: () => void;
}

/**
 * Renders description with highlighted keywords
 * - "Hände" / "Hand" → cyan
 * - "Würfe" / "Wurf" → gold
 */
const HighlightedDescription: React.FC<{ text: string }> = ({ text }) => {
  // Keywords to highlight
  const keywords = [
    { pattern: /Hände/g, color: COLORS.cyan },
    { pattern: /Hand(?![a-zäöü])/g, color: COLORS.cyan },
    { pattern: /Würfe/g, color: COLORS.gold },
    { pattern: /Wurf(?![a-zäöü])/g, color: COLORS.gold },
    { pattern: /Würfel/g, color: COLORS.gold },
  ];

  // Build segments with highlights
  interface Segment {
    text: string;
    color?: string;
  }

  let segments: Segment[] = [{ text }];

  for (const { pattern, color } of keywords) {
    const newSegments: Segment[] = [];

    for (const segment of segments) {
      if (segment.color) {
        // Already highlighted, keep as is
        newSegments.push(segment);
        continue;
      }

      // Split by pattern and interleave matches
      const parts = segment.text.split(pattern);
      const matches = segment.text.match(pattern) || [];

      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          newSegments.push({ text: parts[i] });
        }
        if (matches[i]) {
          newSegments.push({ text: matches[i], color });
        }
      }
    }

    segments = newSegments;
  }

  return (
    <GameText variant="bodyMedium" color={COLORS.textMuted}>
      {segments.map((segment, index) =>
        segment.color ? (
          <GameText
            key={index}
            variant="bodyMedium"
            color={segment.color}
            style={styles.highlightedWord}
          >
            {segment.text}
          </GameText>
        ) : (
          segment.text
        )
      )}
    </GameText>
  );
};

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  onClose,
  title,
  description,
  iconSource,
  price,
  canAfford = true,
  onPurchase,
}) => {
  const showPurchase = price !== undefined && onPurchase;

  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <View style={styles.container}>
        {/* Icon in InsetSlot */}
        <View style={styles.iconContainer}>
          <InsetSlot padding="md" style={styles.iconSlot}>
            <Image source={iconSource} style={styles.icon} />
          </InsetSlot>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <HighlightedDescription text={description} />
        </View>

        {/* Purchase CTA (optional) */}
        {showPurchase && (
          <View style={styles.ctaContainer}>
            <PrimaryButton
              onPress={onPurchase}
              label={`KAUFEN`}
              variant="mint"
              disabled={!canAfford}
              icon={
                <View style={styles.priceContainer}>
                  <Image
                    source={require("../../assets/icons/coin.png")}
                    style={styles.coinIcon}
                  />
                  <GameText
                    variant="buttonMedium"
                    color={canAfford ? COLORS.gold : COLORS.textMuted}
                  >
                    {price}
                  </GameText>
                </View>
              }
            />
          </View>
        )}

        {/* Close button when not in shop context */}
        {!showPurchase && (
          <PrimaryButton onPress={onClose} label="SCHLIESSEN" variant="cyan" />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconSlot: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  descriptionContainer: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  highlightedWord: {
    fontWeight: "600",
  },
  ctaContainer: {
    width: "100%",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  coinIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
});
