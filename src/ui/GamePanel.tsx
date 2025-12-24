import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useGameStore } from "../state/gameStore";

export function GamePanel() {
  const money = useGameStore((s) => s.money);
  const turn = useGameStore((s) => s.turn);
  const roll = useGameStore((s) => s.roll);
  const isRolling = useGameStore((s) => s.isRolling);
  const startRoll = useGameStore((s) => s.startRoll);

  // quick "pop" animation when money changes
  const pop = useSharedValue(1);

  useEffect(() => {
    pop.value = withSequence(
      withTiming(1.08, { duration: 120 }),
      withTiming(1, { duration: 180 })
    );
  }, [money]);

  const moneyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>TURN {turn}/13</Text>
        <Animated.View style={moneyStyle}>
          <Text>${money}</Text>
        </Animated.View>
      </View>

      <Text>ROLL {roll}/3</Text>

      <Pressable
        onPress={() => startRoll()}
        disabled={isRolling}
        style={{
          opacity: isRolling ? 0.4 : 1,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: "#222",
        }}
      >
        <Text style={{ color: "white" }}>
          {isRolling ? "Rolling…" : "Roll Dice"}
        </Text>
      </Pressable>
    </View>
  );
}
