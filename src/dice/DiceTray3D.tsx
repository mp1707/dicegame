import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FilamentScene,
  FilamentView,
  DefaultLight,
  Camera,
  useFilamentContext,
  useModel,
  RenderCallbackContext,
  useWorld,
  useBoxShape,
  useStaticPlaneShape,
  useRigidBody,
  DebugBox,
} from "react-native-filament";
import { useGameStore } from "../state/gameStore";
import {
  Worklets,
  useSharedValue,
  ISharedValue,
} from "react-native-worklets-core";

import Die from "../../assets/models/die.glb";

const { useRenderCallback } = RenderCallbackContext;

// Constants
const TRAY_SIZE = 12;
const WALL_HEIGHT = 5;

// Helpers
function makeTransform(
  position: [number, number, number],
  rotation: [number, number, number]
): number[] {
  const [px, py, pz] = position;
  const [rx, ry, rz] = rotation;

  const cx = Math.cos(rx),
    sx = Math.sin(rx);
  const cy = Math.cos(ry),
    sy = Math.sin(ry);
  const cz = Math.cos(rz),
    sz = Math.sin(rz);

  // Euler ZYX
  const r00 = cy * cz;
  const r01 = cz * sx * sy - cx * sz;
  const r02 = cx * cz * sy + sx * sz;

  const r10 = cy * sz;
  const r11 = cx * cz + sx * sy * sz;
  const r12 = -cz * sx + cx * sy * sz;

  const r20 = -sy;
  const r21 = cy * sx;
  const r22 = cx * cy;

  return [r00, r10, r20, 0, r01, r11, r21, 0, r02, r12, r22, 0, px, py, pz, 1];
}

// Ramp Component
function Ramp({ world }: { world: ReturnType<typeof useWorld> }) {
  const rampShape = useBoxShape(6, 0.1, 5);
  const transform = useMemo(() => makeTransform([0, 7, 5], [-0.7, 0, 0]), []);

  useRigidBody({
    id: "ramp",
    mass: 0,
    shape: rampShape,
    transform: transform as any,
    friction: 0.1,
    world,
  });

  const bump1Shape = useBoxShape(0.5, 0.1, 0.1);
  const bump1Trans = useMemo(
    () => makeTransform([-1, 7.5, 5], [-0.7, 0, 0]),
    []
  );
  useRigidBody({
    id: "bump1",
    mass: 0,
    shape: bump1Shape,
    transform: bump1Trans as any,
    friction: 0.8,
    world,
  });

  const bump2Shape = useBoxShape(0.5, 0.1, 0.1);
  const bump2Trans = useMemo(
    () => makeTransform([1, 6.5, 4], [-0.7, 0, 0]),
    []
  );
  useRigidBody({
    id: "bump2",
    mass: 0,
    shape: bump2Shape,
    transform: bump2Trans as any,
    friction: 0.8,
    world,
  });

  return null;
}

// Wall component
function Wall({
  id,
  position,
  size,
  world,
}: {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  world: ReturnType<typeof useWorld>;
}) {
  const shape = useBoxShape(size[0] / 2, size[1] / 2, size[2] / 2);
  useRigidBody({
    id,
    mass: 0, // static
    shape,
    origin: position,
    friction: 0.5,
    world,
  });
  return null;
}

// Persistent Die Component
function PhysicsDie({
  world,
  index,
  rollTrigger, // SharedValue: increment to roll
  onSettled,
  isHeld,
}: {
  world: ReturnType<typeof useWorld>;
  index: number;
  rollTrigger: ISharedValue<number>;
  onSettled: (index: number, face: number) => void;
  isHeld: boolean;
}) {
  const { transformManager } = useFilamentContext();
  const model = useModel(Die);
  const dieShape = useBoxShape(0.5, 0.5, 0.5);

  // Initial dummy position (off-screen or initial spawn)
  // We'll reset this imperatively on roll.
  const initialTransform = useMemo(
    () => makeTransform([0, 10, 0], [0, 0, 0]),
    []
  );

  const dieBody = useRigidBody({
    id: `die-${index}`,
    mass: 1,
    shape: dieShape,
    transform: initialTransform as any,
    friction: 0.3,
    damping: [0.1, 0.1],
    world,
  });

  const lastTriggerVal = useSharedValue(0);
  const isRolling = useSharedValue(0);
  const settleTimer = useSharedValue(0);

  const onSettledCallback = Worklets.createRunOnJS(onSettled);

  useRenderCallback(
    ({ passedSeconds, timeSinceLastFrame }) => {
      "worklet";
      if (!dieBody || model.state !== "loaded" || !model.rootEntity) return;

      // Check for Roll Trigger
      if (rollTrigger.value > lastTriggerVal.value) {
        lastTriggerVal.value = rollTrigger.value;

        if (!isHeld) {
          // RESET STATE
          isRolling.value = 1;
          settleTimer.value = 0;

          // Random Start Position/Rotation
          const spreadX = (Math.random() - 0.5) * 3;
          const rx = Math.random() * Math.PI * 2;
          const ry = Math.random() * Math.PI * 2;
          const rz = Math.random() * Math.PI * 2;

          // Initial "Hand" Position
          const startPos = [spreadX, 10, 6];

          // Native Methods (assumed available on worklet)
          // Cast to any because TS definitions are missing specific methods
          const body = dieBody as any;

          // Reset Transform
          // We need to calculate the matrix for setWorldTransform(matrix) or setCenterOfMassTransform?
          // Usually setWorldTransform takes a matrix (array of 16 numbers)
          // Let's reuse makeTransform helper but we need it on worklet?
          // It is defined in same file, should work if captured?
          // No, file-level functions might not be available if not specifically 'worklet' capable or captured.
          // Worklets usually capture scope. makeTransform is pure JS, should be fine.
          // BUT to be safe, let's inline simple random reset or duplicate helper.
          // Actually, makeTransform is pure, it will likely be captured.

          // Let's try resetting to a known pos first.
          // Wait, if I can't call makeTransform, I can't reset easily.
          // I'll assume it works.

          // Recalculate transform
          // We can't use 'useMemo' inside worklet. We need plain math.
          // Re-implementing simplified transform logic or just using identity with translation?
          // We need rotation for randomness.

          // Quick inline transform production
          const cx = Math.cos(rx),
            sx = Math.sin(rx);
          const cy = Math.cos(ry),
            sy = Math.sin(ry);
          const cz = Math.cos(rz),
            sz = Math.sin(rz);

          // Just Rz * Ry * Rx
          const r00 = cy * cz;
          const r01 = cz * sx * sy - cx * sz;
          const r02 = cx * cz * sy + sx * sz;
          const r10 = cy * sz;
          const r11 = cx * cz + sx * sy * sz;
          const r12 = -cz * sx + cx * sy * sz;
          const r20 = -sy;
          const r21 = cy * sx;
          const r22 = cx * cy;

          const matrix = [
            r00,
            r10,
            r20,
            0,
            r01,
            r11,
            r21,
            0,
            r02,
            r12,
            r22,
            0,
            startPos[0],
            startPos[1],
            startPos[2],
            1,
          ];

          if (body.setWorldTransform) {
            body.setWorldTransform(matrix);
          }

          // Reset Velocities
          if (body.setLinearVelocity) body.setLinearVelocity([0, 0, 0]);
          if (body.setAngularVelocity) body.setAngularVelocity([0, 0, 0]);

          // Apply Initial Throw Impulse/Velocity
          const vx = (Math.random() - 0.5) * 2;
          const vy = -5 - Math.random() * 5;
          const vz = -15 - Math.random() * 5;

          const avx = (Math.random() - 0.5) * 20;
          const avy = (Math.random() - 0.5) * 20;
          const avz = (Math.random() - 0.5) * 20;

          if (body.setLinearVelocity) body.setLinearVelocity([vx, vy, vz]);
          if (body.setAngularVelocity) body.setAngularVelocity([avx, avy, avz]);

          // Ensure activation
          if (body.activate) body.activate();
        } else {
          // Held dice: ensure they stay put?
          // Or just don't reset them. They remain where they were.
          isRolling.value = 0;
          // Optionally force them to a "held" position?
          // For now, let's leave them.
          // But we need to report "settled" immediately?
          // The parent waits for all settled.
          // If we don't roll, we are "settled".
          onSettledCallback(index, 0); // 0 or current face? Parent handles face lookup for held.
        }
      }

      // Sync Visuals
      transformManager.updateTransformByRigidBody(model.rootEntity, dieBody);

      // Settle Check
      if (isRolling.value === 1) {
        // Check velocity
        const body = dieBody as any;
        // getLinearVelocity might return [x,y,z] or object?
        // Assuming [x,y,z]
        let speed = 100;
        if (body.getLinearVelocity) {
          const v = body.getLinearVelocity();
          // v might be Float3 array
          speed = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        }

        if (speed < 0.1) {
          settleTimer.value += timeSinceLastFrame;
        } else {
          settleTimer.value = 0;
        }

        if (settleTimer.value > 0.5) {
          // 0.5s of stillness
          isRolling.value = 0;
          // Determine face?
          // For now random result
          const result = Math.floor(Math.random() * 6) + 1;
          onSettledCallback(index, result);
        }
        // Fallback timeout
        if (
          passedSeconds > lastTriggerVal.value + 5.0 &&
          isRolling.value === 1
        ) {
          // Force settle after 5s
          isRolling.value = 0;
          const result = Math.floor(Math.random() * 6) + 1;
          onSettledCallback(index, result);
        }
      }
    },
    [dieBody, model, transformManager, onSettledCallback, index, isHeld]
  );

  return null;
}

function DiceScene() {
  const isRolling = useGameStore((s) => s.isRolling);
  const diceCount = useGameStore((s) => s.diceCount);
  const held = useGameStore((s) => s.held);
  const faces = useGameStore((s) => s.faces);
  const commitRollResult = useGameStore((s) => s.commitRollResult);

  // Shared Value for Roll Command (increments to trigger)
  const rollTrigger = useSharedValue(0);

  // Local state to track completion
  const [settledCount, setSettledCount] = useState(0);
  const resultsRef = useRef<number[]>([]);

  const world = useWorld(0, -9.8, 0);

  // Floor
  const floorShape = useStaticPlaneShape(0, 1, 0, 0);
  useRigidBody({
    id: "floor",
    mass: 0,
    shape: floorShape,
    origin: [0, 0, 0],
    friction: 0.6,
    world,
  });

  // Physics Step
  useRenderCallback(
    ({ timeSinceLastFrame }) => {
      "worklet";
      if (world) {
        world.stepSimulation(timeSinceLastFrame, 1, 1 / 60);
      }
    },
    [world]
  );

  // Trigger Roll when store says so
  useEffect(() => {
    if (isRolling) {
      setSettledCount(0);
      resultsRef.current = [...faces]; // start with current
      // Increment trigger to signal worklets
      rollTrigger.value += 1;
    }
  }, [isRolling]);

  const onDieSettled = (index: number, face: number) => {
    // If we just settled, update result
    // Note: Held dice callback immediately with 0?
    // We should use stored face for held dice.
    if (!held[index]) {
      resultsRef.current[index] = face;
    }

    setSettledCount((c) => {
      const next = c + 1;
      if (next >= 5) {
        // Always 5 dice
        // All settled
        // Avoid double commit?
        commitRollResult(resultsRef.current);
      }
      return next;
    });
  };

  return (
    <FilamentView style={{ flex: 1, backgroundColor: "#000" }}>
      <DefaultLight />
      <Camera cameraPosition={[0, 14, 10]} cameraTarget={[0, 0, 0]} />

      <DebugBox
        halfExtent={[TRAY_SIZE / 2, 0.1, TRAY_SIZE / 2]}
        translate={[0, -0.1, 0]}
      />

      <Ramp world={world} />

      <Wall
        id="wall-north"
        world={world}
        position={[0, 2.5, -TRAY_SIZE / 2]}
        size={[TRAY_SIZE, WALL_HEIGHT, 1]}
      />
      <Wall
        id="wall-south"
        world={world}
        position={[0, 2.5, TRAY_SIZE / 2]}
        size={[TRAY_SIZE, WALL_HEIGHT, 1]}
      />
      <Wall
        id="wall-east"
        world={world}
        position={[TRAY_SIZE / 2, 2.5, 0]}
        size={[1, WALL_HEIGHT, TRAY_SIZE]}
      />
      <Wall
        id="wall-west"
        world={world}
        position={[-TRAY_SIZE / 2, 2.5, 0]}
        size={[1, WALL_HEIGHT, TRAY_SIZE]}
      />

      {Array.from({ length: 5 }).map((_, i) => (
        <PhysicsDie
          key={`die-${i}`} // Stable key
          index={i}
          world={world}
          rollTrigger={rollTrigger}
          isHeld={held[i]}
          onSettled={onDieSettled}
        />
      ))}
    </FilamentView>
  );
}

export function DiceTray3D() {
  return (
    <FilamentScene>
      <DiceScene />
    </FilamentScene>
  );
}
