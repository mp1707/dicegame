import React, { Suspense, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { ContactShadows, Environment } from "@react-three/drei";
import { Die } from "./Die";
import { useGameStore } from "../store/gameStore";
import { COLORS } from "../constants/theme";

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.gold} />
    <Text style={styles.loadingText}>Loading Physics...</Text>
  </View>
);

// Game end overlay
const GameEndOverlay = () => {
  const phase = useGameStore((s) => s.phase);

  if (phase !== "won" && phase !== "lost") return null;

  const isWon = phase === "won";

  return (
    <View style={styles.gameEndOverlay}>
      <Text
        style={[
          styles.gameEndText,
          { color: isWon ? COLORS.green : COLORS.red },
        ]}
      >
        {isWon ? "GEWONNEN!" : "VERLOREN"}
      </Text>
    </View>
  );
};

export const DiceTray = () => {
  // Subscribe only to what we need for triggering rolls
  const rollTrigger = useGameStore((state) => state.rollTrigger);
  const selectedDice = useGameStore((state) => state.selectedDice);
  const diceValues = useGameStore((state) => state.diceValues);
  const isRolling = useGameStore((state) => state.isRolling);
  const completeRoll = useGameStore((state) => state.completeRoll);
  const toggleDiceLock = useGameStore((state) => state.toggleDiceLock);

  // Track settled dice values during a roll
  const settledValuesRef = useRef<number[]>([...diceValues]);
  const settledCountRef = useRef(0);
  const lastRollTriggerRef = useRef(rollTrigger);

  // Reset tracking when a new roll starts
  if (rollTrigger > lastRollTriggerRef.current) {
    // Count how many dice will actually roll (not locked)
    const rollingCount = selectedDice.filter((locked) => !locked).length;
    settledCountRef.current = 0;
    // Keep locked dice values, reset rolling dice tracking
    settledValuesRef.current = [...diceValues];
    lastRollTriggerRef.current = rollTrigger;
  }

  // Callback for when a die settles
  const handleDieSettle = useCallback(
    (index: number, value: number) => {
      settledValuesRef.current[index] = value;
      settledCountRef.current += 1;

      // Check if all 5 dice have reported their values
      if (settledCountRef.current >= 5) {
        // Batch update the store with all final values
        completeRoll([...settledValuesRef.current]);
      }
    },
    [completeRoll]
  );

  // Callback for die tap
  const handleDieTap = useCallback(
    (index: number) => {
      toggleDiceLock(index);
    },
    [toggleDiceLock]
  );

  return (
    <View style={styles.container}>
      <Canvas
        shadows
        style={styles.canvas}
        frameloop="always"
        camera={{ position: [0, 10, 0], fov: 45, up: [0, 0, -1] }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} castShadow />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor - sized for 16:9 viewport */}
            <RigidBody type="fixed" restitution={0.2} friction={1}>
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[10, 0.5, 6]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </RigidBody>

            {/* Walls (Invisible colliders) - tighter bounds */}
            <RigidBody type="fixed">
              <CuboidCollider args={[5, 2, 0.3]} position={[0, 1.5, 3]} />
              <CuboidCollider args={[5, 2, 0.3]} position={[0, 1.5, -3]} />
              <CuboidCollider args={[0.3, 2, 3]} position={[5, 1.5, 0]} />
              <CuboidCollider args={[0.3, 2, 3]} position={[-5, 1.5, 0]} />
            </RigidBody>

            {/* The 5 Dice */}
            {[-2, -1, 0, 1, 2].map((x, i) => (
              <Die
                key={i}
                index={i}
                position={[x * 1.2, 4, 0]}
                isLocked={selectedDice[i]}
                rollTrigger={rollTrigger}
                onSettle={handleDieSettle}
                onTap={handleDieTap}
              />
            ))}
          </Physics>

          <ContactShadows opacity={0.6} blur={2.5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>

      {/* Game End Overlay */}
      <GameEndOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundDark,
  },
  loadingText: {
    color: COLORS.textWhite,
    marginTop: 10,
    fontSize: 14,
  },
  gameEndOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameEndText: {
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
