import React, { Suspense, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { ContactShadows, Environment } from "@react-three/drei";
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Die } from "./Die";
import { DiceIcon } from "./ui/DiceIcon";
import { useGameStore } from "../store/gameStore";
import { COLORS } from "../constants/theme";
import { triggerLightImpact, triggerSelectionHaptic } from "../utils/haptics";
import { getContributingDiceIndices } from "../utils/gameCore";

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

const RenderWarmup = ({ rollTrigger }: { rollTrigger: number }) => {
  const { invalidate } = useThree();
  const warmedUpRef = useRef(false);

  useEffect(() => {
    if (warmedUpRef.current) return;
    warmedUpRef.current = true;

    let framesLeft = 3;
    let rafId = 0;

    const tick = () => {
      invalidate();
      framesLeft -= 1;
      if (framesLeft > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [invalidate]);

  useEffect(() => {
    invalidate();
  }, [invalidate, rollTrigger]);

  return null;
};

interface DiceTrayProps {
  containerHeight: number;
  containerWidth: number;
}

export const DiceTray = ({
  containerHeight,
  containerWidth,
}: DiceTrayProps) => {
  // Subscribe only to what we need for triggering rolls
  const rollTrigger = useGameStore((state) => state.rollTrigger);
  const selectedDice = useGameStore((state) => state.selectedDice);
  const diceValues = useGameStore((state) => state.diceValues);
  const isRolling = useGameStore((state) => state.isRolling);
  const hasRolledThisRound = useGameStore((state) => state.hasRolledThisRound);
  const phase = useGameStore((state) => state.phase);
  const diceVisible = useGameStore((state) => state.diceVisible);
  const completeRoll = useGameStore((state) => state.completeRoll);
  const toggleDiceLock = useGameStore((state) => state.toggleDiceLock);
  const pendingCategoryId = useGameStore((state) => state.pendingCategoryId);
  const selectedHandId = useGameStore((state) => state.selectedHandId);
  const revealState = useGameStore((state) => state.revealState);

  // Animation values for 2D dice
  const dieScales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];

  // Spring config for snappy animation
  const springConfig = { damping: 15, stiffness: 400 };

  // Reset animation when reveal ends
  useEffect(() => {
    if (!revealState?.active) {
      dieScales.forEach((scale) => (scale.value = 1));
    }
  }, [revealState?.active]);

  // Animate specific dice when active in reveal
  useEffect(() => {
    if (revealState?.active && revealState.currentDieIndex !== undefined) {
      const idx = revealState.currentDieIndex;
      // Animate die scale: 1 -> 1.15 -> 1
      if (dieScales[idx]) {
        dieScales[idx].value = withSequence(
          withSpring(1.15, springConfig),
          withSpring(1, springConfig)
        );
      }
    }
  }, [revealState?.currentDieIndex]);

  // Determine contributing indices
  const contributingIndices =
    revealState?.breakdown?.contributingIndices ||
    (selectedHandId
      ? getContributingDiceIndices(selectedHandId, diceValues)
      : []);
  const contributingSet = new Set(contributingIndices);

  const show2DDice = !!selectedHandId;

  // Calculate scene scaling based on container height
  const BASE_HEIGHT = 180;
  const BASE_WIDTH = 360;
  const widthScale = containerWidth / BASE_WIDTH;
  const aspect = containerWidth / containerHeight;

  // Adjust camera FOV to keep the shorter tray readable
  const baseFOV = 45;
  const fovScale = BASE_HEIGHT / containerHeight;
  const adjustedFOV = Math.min(Math.max(baseFOV * fovScale, 35), 65);

  // Scaled dimensions for 3D scene to fit the full-width, shorter tray
  const floorWidth = 10 * widthScale;
  const floorDepth = floorWidth / aspect;
  const depthScale = floorDepth / 6;
  const wallXPosition = floorWidth / 2;
  const wallZPosition = floorDepth / 2;
  const diceSpawnY = 4 * depthScale;
  const diceSpacing = floorWidth / 6;
  const halfFovTan = Math.tan((adjustedFOV * Math.PI) / 360);
  const fitHeight = floorDepth / 2 / halfFovTan;
  const fitWidth = floorWidth / 2 / (halfFovTan * aspect);
  const cameraHeight = Math.max(fitHeight, fitWidth) + 0.4;

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
        triggerLightImpact();
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
      if (pendingCategoryId) return;
      triggerSelectionHaptic();
      toggleDiceLock(index);
    },
    [pendingCategoryId, toggleDiceLock]
  );

  return (
    <View style={styles.container}>
      <Canvas
        shadows
        style={styles.canvas}
        frameloop="demand"
        camera={{
          position: [0, cameraHeight, 0],
          fov: adjustedFOV,
          up: [0, 0, -1],
        }}
      >
        <ambientLight intensity={1.4} />
        <hemisphereLight args={[0xffffff, 0x1e8a63, 0.5]} />
        <spotLight
          position={[5, 10, 5]}
          angle={0.3}
          penumbra={1}
          castShadow
          intensity={1.0}
          color={"#FFD700"}
        />
        <spotLight
          position={[-5, 10, -5]}
          angle={0.3}
          penumbra={1}
          castShadow
          intensity={0.8}
          color={COLORS.cyan}
        />

        <Suspense fallback={null}>
          <RenderWarmup rollTrigger={rollTrigger} />
          <Physics gravity={[0, -18, 0]} updateLoop="independent">
            {/* Floor - scaled based on container height */}
            <RigidBody type="fixed" restitution={0.05} friction={1}>
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[floorWidth, 0.5, floorDepth]} />
                <meshStandardMaterial
                  color={COLORS.feltGreen}
                  roughness={0.65}
                  metalness={0.1}
                />
              </mesh>
            </RigidBody>

            {/* Walls (Invisible colliders) - scaled to match floor */}
            <RigidBody type="fixed">
              <CuboidCollider
                args={[floorWidth / 2, 3, 0.3]}
                position={[0, 2.5, wallZPosition]}
              />
              <CuboidCollider
                args={[floorWidth / 2, 3, 0.3]}
                position={[0, 2.5, -wallZPosition]}
              />
              <CuboidCollider
                args={[0.3, 3, floorDepth / 2]}
                position={[wallXPosition, 2.5, 0]}
              />
              <CuboidCollider
                args={[0.3, 3, floorDepth / 2]}
                position={[-wallXPosition, 2.5, 0]}
              />
            </RigidBody>

            {/* The 5 Dice - scaled spawn positions */}
            {[-2, -1, 0, 1, 2].map((x, i) => (
              <Die
                key={i}
                index={i}
                position={[x * diceSpacing, diceSpawnY, 0]}
                isLocked={selectedDice[i]}
                isVisible={diceVisible}
                rollTrigger={rollTrigger}
                onSettle={handleDieSettle}
                onWake={handleDieWake}
                onTap={handleDieTap}
              />
            ))}
          </Physics>

          <ContactShadows opacity={0.6} blur={2.5} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {/* Dimming Overlay when Hand is selected */}
      {show2DDice && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.dimmingOverlay}
          pointerEvents="none"
        />
      )}

      {phase === "rolling" && !hasRolledThisRound && !isRolling && (
        <View pointerEvents="none" style={styles.readyToRollOverlay}>
          <Text style={styles.readyToRollText}>START</Text>
        </View>
      )}

      {/* Goal Display (Bottom Left) */}
      <View style={styles.goalDisplayOverlay} pointerEvents="none">
        <Text style={styles.goalText}>
          ZIEL -{" "}
          <Text style={styles.goalValue}>
            {useGameStore((s) => s.levelGoal)}
          </Text>
        </Text>
      </View>

      {/* 2D Dice Overlay (Bottom Right) */}
      {show2DDice && (
        <View style={styles.diceOverlay} pointerEvents="none">
          <View style={styles.diceRow}>
            {diceValues.map((value, index) => (
              <DiceIcon
                key={index}
                value={value}
                isHighlighted={
                  !!(
                    revealState?.active &&
                    revealState?.currentDieIndex === index
                  )
                }
                isContributing={contributingSet.has(index)}
                animatedScale={dieScales[index]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Game End Overlay */}
      <GameEndOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // Let parent bg show through
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg2,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 10,
    fontSize: 14,
    fontFamily: "RobotoMono-Regular",
  },
  gameEndOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  gameEndText: {
    fontSize: 32,
    fontFamily: "PressStart2P-Regular",
    textShadowColor: COLORS.cyanGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  readyToRollOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  readyToRollText: {
    color: "rgba(255, 255, 255, 0.15)", // Very subtle watermark style
    fontSize: 40,
    fontFamily: "PressStart2P-Regular",
    letterSpacing: 4,
  },
  goalDisplayOverlay: {
    position: "absolute",
    bottom: 12, // slightly above bottom edge
    left: 16,
    zIndex: 30, // Above dimmer
  },
  goalText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: "Bungee-Regular",
    letterSpacing: 1,
  },
  goalValue: {
    color: COLORS.text,
    fontSize: 20,
  },
  // Dim the 3D scene when 2D dice are shown
  dimmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 25, // Above canvas (10), below overlays (30)
  },
  // 2D Dice Overlay (Bottom Right)
  diceOverlay: {
    position: "absolute",
    bottom: 12,
    right: 16,
    zIndex: 30, // Above dimmer
  },
  diceRow: {
    flexDirection: "row",
    gap: 4,
  },
});
