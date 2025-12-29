import React, {
  Suspense,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { View, Text, StyleSheet } from "react-native";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { ContactShadows, Environment, useEnvironment } from "@react-three/drei";
import * as THREE from "three";
import { Die } from "./Die";
import { useGameStore } from "../store/gameStore";
import { COLORS } from "../constants/theme";
import { triggerLightImpact, triggerSelectionHaptic } from "../utils/haptics";
import { getContributingDiceIndices } from "../utils/gameCore";

// Game end overlay
const GameEndOverlay = () => {
  const phase = useGameStore((s) => s.phase);

  if (phase !== "WIN_SCREEN" && phase !== "LOSE_SCREEN") return null;

  const isWon = phase === "WIN_SCREEN";

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

// Force shader compilation on mount to avoid first-roll jank
const ShaderWarmup = () => {
  const { gl, scene, camera } = useThree();
  const warmedUp = useRef(false);

  useEffect(() => {
    if (warmedUp.current) return;
    warmedUp.current = true;

    // Create minimal geometry to trigger shader compilation
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const standardMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const basicMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const mesh1 = new THREE.Mesh(geo, standardMat);
    const mesh2 = new THREE.Mesh(geo, basicMat);
    mesh1.position.y = -100; // Off-screen
    mesh2.position.y = -100;

    scene.add(mesh1, mesh2);
    gl.compile(scene, camera); // Force synchronous shader compilation
    scene.remove(mesh1, mesh2);

    geo.dispose();
    standardMat.dispose();
    basicMat.dispose();
  }, [gl, scene, camera]);

  return null;
};

// Preload HDRI environment to avoid first-render stutter
const PreloadedEnvironment = () => {
  const envMap = useEnvironment({ preset: "night" });
  return <Environment map={envMap} />;
};

// Camera controller for zoom animation during reveal
interface CameraControllerProps {
  defaultHeight: number;
  defaultFOV: number;
  isRevealing: boolean;
}

const CameraController = ({
  defaultHeight,
  defaultFOV,
  isRevealing,
}: CameraControllerProps) => {
  const { camera, invalidate } = useThree();
  // Track a single progress value (0 = normal, 1 = reveal)
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);

  // Target FOV for reveal (narrow = less perspective distortion)
  const revealFOV = 15;
  // Zoom factor (< 1 means zoom in slightly on top of the FOV change)
  const zoomFactor = 0.85;

  useEffect(() => {
    targetProgressRef.current = isRevealing ? 1 : 0;
  }, [isRevealing]);

  useFrame((state, delta) => {
    const target = targetProgressRef.current;
    const current = progressRef.current;

    // Smooth lerp toward target
    const lerpSpeed = 4;
    const newProgress = THREE.MathUtils.lerp(
      current,
      target,
      1 - Math.exp(-lerpSpeed * delta)
    );

    // Only update if there's meaningful change
    if (Math.abs(newProgress - current) > 0.0001) {
      progressRef.current = newProgress;

      // Interpolate FOV
      const currentFOV = THREE.MathUtils.lerp(
        defaultFOV,
        revealFOV,
        newProgress
      );

      // Calculate height to maintain CONSTANT visible floor size at each FOV
      // Plus apply zoom factor for slight zoom-in effect
      const baseHeight =
        (defaultHeight * Math.tan((defaultFOV * Math.PI) / 360)) /
        Math.tan((currentFOV * Math.PI) / 360);
      const zoomAdjust = THREE.MathUtils.lerp(1, zoomFactor, newProgress);
      const currentHeight = baseHeight * zoomAdjust;

      camera.position.y = currentHeight;
      (camera as THREE.PerspectiveCamera).fov = currentFOV;
      camera.updateProjectionMatrix();
      invalidate();
    }
  });

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
  const phase = useGameStore((state) => state.phase);
  const diceVisible = useGameStore((state) => state.diceVisible);
  const completeRoll = useGameStore((state) => state.completeRoll);
  const toggleDiceLock = useGameStore((state) => state.toggleDiceLock);
  const selectedHandId = useGameStore((state) => state.selectedHandId);
  const revealState = useGameStore((state) => state.revealState);

  // Determine contributing indices
  const contributingIndices =
    revealState?.breakdown?.contributingIndices ||
    (selectedHandId
      ? getContributingDiceIndices(selectedHandId, diceValues)
      : []);
  const contributingSet = new Set(contributingIndices);

  // Reveal state tracking
  const isRevealing = !!revealState?.active;

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
  // Negative margin = camera closer = floor fills/overflows edges
  const cameraHeight = Math.max(fitHeight, fitWidth) - 0.3;

  // Calculate arranged positions for reveal animation
  // Dice line up in center with consistent spacing
  const DIE_SIZE = 0.7;
  const arrangedY = 0.25 + DIE_SIZE / 2; // Floor top + half die height
  const arrangedSpacing = DIE_SIZE * 1.8; // Gap between dice (increased for readability)
  const arrangedSlots = useMemo(() => {
    return [-2, -1, 0, 1, 2].map(
      (x) => [x * arrangedSpacing, arrangedY, 0] as [number, number, number]
    );
  }, [arrangedSpacing, arrangedY]);

  // Track dice X positions for sorted slot assignment
  const diceXPositionsRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const slotAssignmentsRef = useRef<number[]>([0, 1, 2, 3, 4]); // die index -> slot index
  const wasRevealingRef = useRef(false);

  // When reveal starts, compute slot assignments based on current X positions
  if (isRevealing && !wasRevealingRef.current) {
    // Sort dice indices by their X position (left to right)
    const sortedIndices = [0, 1, 2, 3, 4]
      .map((i) => ({ index: i, x: diceXPositionsRef.current[i] }))
      .sort((a, b) => a.x - b.x)
      .map((item) => item.index);

    // Assign slots: leftmost die gets slot 0, next gets slot 1, etc.
    sortedIndices.forEach((dieIndex, slotIndex) => {
      slotAssignmentsRef.current[dieIndex] = slotIndex;
    });
  }
  wasRevealingRef.current = isRevealing;

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

  // Callback: Die reports its position (called when settling)
  const handleDiePositionUpdate = useCallback((index: number, x: number) => {
    diceXPositionsRef.current[index] = x;
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
      if (selectedHandId) return; // Can't lock dice when a hand is selected
      triggerSelectionHaptic();
      toggleDiceLock(index);
    },
    [selectedHandId, toggleDiceLock]
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
          <ShaderWarmup />
          <CameraController
            defaultHeight={cameraHeight}
            defaultFOV={adjustedFOV}
            isRevealing={isRevealing}
          />
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
                arrangedPosition={arrangedSlots[slotAssignmentsRef.current[i]]}
                isLocked={selectedDice[i]}
                isVisible={diceVisible}
                rollTrigger={rollTrigger}
                onSettle={handleDieSettle}
                onPositionUpdate={handleDiePositionUpdate}
                onWake={handleDieWake}
                onTap={handleDieTap}
                isHighlighted={
                  !!revealState?.active && revealState.currentDieIndex === i
                }
                isContributing={contributingSet.has(i)}
                isRevealActive={!!revealState?.active}
              />
            ))}
          </Physics>

          <ContactShadows opacity={0.6} blur={2.5} />
          <PreloadedEnvironment />
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
    backgroundColor: "transparent", // Let parent bg show through
  },
  canvas: {
    flex: 1,
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
});
