import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { DiceTray } from "./components/DiceTray";
import { useGameStore } from "./store/gameStore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export default function App() {
  const { diceValues, triggerRoll, isRolling, setRolling } = useGameStore();

  // Simple Reanimated Example: Scale button when pressed
  const scale = useSharedValue(1);
  const rButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    setRolling(true); // Enable frame loop
    triggerRoll(); // Physics Impulse
  };

  // Hacky "settled" check for the POC to turn off the loop
  // In production, you'd count how many dice are asleep
  useEffect(() => {
    if (isRolling) {
      const timeout = setTimeout(() => {
        setRolling(false);
      }, 3000); // Assume dice settle in 3s
      return () => clearTimeout(timeout);
    }
  }, [isRolling]);

  return (
    <View style={styles.container}>
      {/* Upper 50%: 3D Tray */}
      <View style={styles.topContainer}>
        <DiceTray />
      </View>

      {/* Lower 50%: State Machine UI */}
      <View style={styles.bottomContainer}>
        <Text style={styles.title}>ROGUE YAHTZEE</Text>

        <View style={styles.resultsRow}>
          {diceValues.map((val, i) => (
            <View key={i} style={styles.dieResult}>
              <Text style={styles.dieText}>{val}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={rButtonStyle}>
          <TouchableOpacity
            style={styles.rollButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isRolling ? "ROLLING..." : "ROLL"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topContainer: { flex: 1, backgroundColor: "#111" }, // 50%
  bottomContainer: {
    flex: 1, // 50%
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  title: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 40 },
  resultsRow: { flexDirection: "row", gap: 10, marginBottom: 50 },
  dieResult: {
    width: 50,
    height: 50,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  dieText: { color: "white", fontSize: 24, fontWeight: "bold" },
  rollButton: {
    backgroundColor: "#ff4040",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
