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

interface DiceTrayProps {
  containerHeight: number;
}

export const DiceTray = ({ containerHeight }: DiceTrayProps) => {
  // Subscribe only to what we need for triggering rolls
  const rollTrigger = useGameStore((state) => state.rollTrigger);
  const selectedDice = useGameStore((state) => state.selectedDice);
  const diceValues = useGameStore((state) => state.diceValues);
  const isRolling = useGameStore((state) => state.isRolling);
  const completeRoll = useGameStore((state) => state.completeRoll);
  const toggleDiceLock = useGameStore((state) => state.toggleDiceLock);

  // Calculate scene scaling based on container height
  const BASE_HEIGHT = 180;
  const sceneScale = containerHeight / BASE_HEIGHT;

  // Adjust camera FOV for taller containers to maintain dice visibility
  const baseFOV = 45;
  const fovAdjustment = (containerHeight - BASE_HEIGHT) / (BASE_HEIGHT * 2);
  const adjustedFOV = Math.min(baseFOV * (1 + fovAdjustment), 60);

  // Scaled dimensions for 3D scene
  // Keep width constant, only scale depth (Z-axis) to match taller container
  const floorWidth = 10 * sceneScale; // Keep constant to fit screen width
  const floorDepth = 6 * sceneScale; // Scale depth to match height
  const wallXPosition = 5; // Keep constant
  const wallZPosition = 3 * sceneScale; // Scale with depth
  const diceSpawnY = 4 * sceneScale; // Scale spawn height

  // Track settled values and sleep state
  const settledValuesRef = useRef<number[]>([...diceValues]);
  // Track which dice are currently "sleeping" (stopped moving)
  // Initialize to true because usually they are still at start.
  // When a roll starts, active dice become false.
  const isSleepingRef = useRef<boolean[]>([true, true, true, true, true]);

  const lastRollTriggerRef = useRef(rollTrigger);

  // Reset tracking when a new roll starts
  if (rollTrigger > lastRollTriggerRef.current) {
    // Determine which dice are actually rolling
    const newSleepState = selectedDice.map((locked) => locked); // Locked dice stay sleeping (true), others wake up (false)
    isSleepingRef.current = newSleepState;

    // Reset values source of truth to current, though they will update as dice settle
    settledValuesRef.current = [...diceValues];
    lastRollTriggerRef.current = rollTrigger;
  }

  // Callback: Die woke up (started moving)
  const handleDieWake = useCallback((index: number) => {
    isSleepingRef.current[index] = false;
  }, []);

  // Callback: Die settled (stopped moving)
  const handleDieSettle = useCallback(
    (index: number, value: number) => {
      settledValuesRef.current[index] = value;
      isSleepingRef.current[index] = true;

      // Check if ALL 5 dice are now sleeping
      const allSleeping = isSleepingRef.current.every((s) => s);

      if (allSleeping) {
        // Only when everything is quiet do we update the game state
        // This prevents the UI from flickering with partial results
        completeRoll([...settledValuesRef.current]);
      }
    },
    [completeRoll]
  );

  // Also need to handle the case where a die MIGHT not wake up if it wasn't moved much?
  // Our Die component forces a wakeUp() and impulse so it should be fine.

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
        camera={{ position: [0, 10, 0], fov: adjustedFOV, up: [0, 0, -1] }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} castShadow />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor - scaled based on container height */}
            <RigidBody type="fixed" restitution={0.2} friction={1}>
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[floorWidth, 0.5, floorDepth]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </RigidBody>

            {/* Walls (Invisible colliders) - scaled to match floor */}
            <RigidBody type="fixed">
              <CuboidCollider
                args={[floorWidth / 2, 2, 0.3]}
                position={[0, 1.5, wallZPosition]}
              />
              <CuboidCollider
                args={[floorWidth / 2, 2, 0.3]}
                position={[0, 1.5, -wallZPosition]}
              />
              <CuboidCollider
                args={[0.3, 2, floorDepth / 2]}
                position={[wallXPosition, 1.5, 0]}
              />
              <CuboidCollider
                args={[0.3, 2, floorDepth / 2]}
                position={[-wallXPosition, 1.5, 0]}
              />
            </RigidBody>

            {/* The 5 Dice - scaled spawn positions */}
            {[-2, -1, 0, 1, 2].map((x, i) => (
              <Die
                key={i}
                index={i}
                position={[x * 1.2, diceSpawnY, 0]}
                isLocked={selectedDice[i]}
                rollTrigger={rollTrigger}
                onSettle={handleDieSettle}
                onWake={handleDieWake}
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
