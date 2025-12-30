import React from "react";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Flower,
  Flower2,
  Gift,
  House,
  Tally3,
  Tally4,
  Tally5,
} from "lucide-react-native";
import { CategoryId } from "../../utils/yahtzeeScoring";

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

const CATEGORY_ICONS: Record<CategoryId, React.ComponentType<IconProps>> = {
  ones: Dice1,
  twos: Dice2,
  threes: Dice3,
  fours: Dice4,
  fives: Dice5,
  sixes: Dice6,
  threeOfKind: Tally3,
  fourOfKind: Tally4,
  fullHouse: House,
  smallStraight: Flower,
  largeStraight: Flower2,
  chance: Gift,
  yahtzee: Tally5,
};

export const CategoryIcon = ({
  categoryId,
  color,
  size,
  strokeWidth,
}: { categoryId: CategoryId } & IconProps) => {
  const Icon = CATEGORY_ICONS[categoryId];
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
};
