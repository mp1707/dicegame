import React, { useRef, useEffect } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { COLORS, ANIMATION } from "../constants/theme";
import { DieOutline } from "./DieOutline";

// Standard D6 Face Normals
const FACE_NORMALS = [
  { face: 1, normal: new THREE.Vector3(1, 0, 0) }, // Right
  { face: 6, normal: new THREE.Vector3(-1, 0, 0) }, // Left
  { face: 3, normal: new THREE.Vector3(0, 1, 0) }, // Top
  { face: 4, normal: new THREE.Vector3(0, -1, 0) }, // Bottom
  { face: 2, normal: new THREE.Vector3(0, 0, 1) }, // Front
  { face: 5, normal: new THREE.Vector3(0, 0, -1) }, // Back
];

const DIE_SIZE = 0.8;
const DIE_HALF = DIE_SIZE / 2;
const FACE_OFFSET = DIE_HALF + 0.01;
const PIP_OFFSET = 0.25 * DIE_SIZE;
const PIP_RADIUS = 0.08 * DIE_SIZE;

// Shared geometry for all pips (avoids creating 150+ instances)
const SHARED_PIP_GEOMETRY = new THREE.CircleGeometry(PIP_RADIUS, 16);

// Pip positions for each face value
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [PIP_OFFSET, PIP_OFFSET],
  ],
  3: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [0, 0],
    [PIP_OFFSET, PIP_OFFSET],
  ],
  4: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [PIP_OFFSET, -PIP_OFFSET],
    [-PIP_OFFSET, PIP_OFFSET],
    [PIP_OFFSET, PIP_OFFSET],
  ],
  5: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [PIP_OFFSET, -PIP_OFFSET],
    [0, 0],
    [-PIP_OFFSET, PIP_OFFSET],
    [PIP_OFFSET, PIP_OFFSET],
  ],
  6: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [PIP_OFFSET, -PIP_OFFSET],
    [-PIP_OFFSET, 0],
    [PIP_OFFSET, 0],
    [-PIP_OFFSET, PIP_OFFSET],
    [PIP_OFFSET, PIP_OFFSET],
  ],
};

// Component for rendering pips on a single face
const DieFace = ({
  faceValue,
  rotation,
  position,
  opacity,
}: {
  faceValue: number;
  rotation: [number, number, number];
  position: [number, number, number];
  opacity: number;
}) => {
  const pips = PIP_POSITIONS[faceValue] || [];

  return (
    <group rotation={rotation} position={position}>
      {pips.map((pipPos, i) => (
        <mesh
          key={i}
          position={[pipPos[0], pipPos[1], 0.01]}
          geometry={SHARED_PIP_GEOMETRY}
        >
          <meshBasicMaterial color="black" transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

interface DieProps {
  position: [number, number, number];
  arrangedPosition: [number, number, number];
  index: number;
  isLocked: boolean;
  isVisible: boolean;
  rollTrigger: number;
  onSettle: (index: number, value: number) => void;
  onPositionUpdate: (index: number, x: number) => void;
  onTap: (index: number) => void;
  // Animation props for scoring reveal
  isHighlighted: boolean;
  isContributing: boolean;
  isRevealActive: boolean;
  lockedDiceCount: number;
}

export const Die = ({
  position,
  arrangedPosition,
  index,
  isLocked,
  isVisible,
  rollTrigger,
  onSettle,
  onPositionUpdate,
  onWake,
  onTap,
  isHighlighted,
  isContributing,
  isRevealActive,
  lockedDiceCount,
}: DieProps & { onWake: (index: number) => void }) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const prevRollTrigger = useRef(rollTrigger);
  const initialPosition = useRef(position);
  const settleReportedRef = useRef(false);
  const stableTimeRef = useRef(0);

  // Animation refs for smooth transitions
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const animatedScaleRef = useRef(1.0);
  const animatedColorRef = useRef(new THREE.Color("#f5f5f5"));
  const animatedOpacityRef = useRef(1.0);

  // Arranged position animation refs
  const animatedPositionRef = useRef(new THREE.Vector3(...position));
  const animatedQuaternionRef = useRef(new THREE.Quaternion());
  const targetQuaternionRef = useRef(new THREE.Quaternion());
  const targetPositionRef = useRef(new THREE.Vector3());
  const wasRevealActiveRef = useRef(false);
  const capturedPhysicsQuaternionRef = useRef(new THREE.Quaternion());

  // Cached color ref (white only - no gold tint)
  const whiteColorRef = useRef(new THREE.Color("#f5f5f5"));

  // Highlight pulse tracking
  const wasHighlightedRef = useRef(false);
  const highlightStartTimeRef = useRef(0);

  // Lock micro-pop animation tracking
  const wasLockedRef = useRef(isLocked);
  const lockPopStartRef = useRef(0);
  const lockPopPhaseRef = useRef<"none" | "up" | "down">("none");

  // Trigger Roll Logic - only when rollTrigger changes
  useEffect(() => {
    if (rollTrigger > prevRollTrigger.current) {
      settleReportedRef.current = false;
      stableTimeRef.current = 0;

      if (isLocked) {
        // LOCKED DICE: Switch to kinematicPosition to be truly immovable
        // Other dice will bounce off locked dice naturally
        if (rigidBody.current) {
          rigidBody.current.setBodyType(1, true); // 1 = kinematicPosition
        }
        // Report settle immediately since locked dice don't move
        reportSettle();
      } else {
        // UNLOCKED DICE: Ensure dynamic type and roll
        if (rigidBody.current) {
          // Ensure die is dynamic for rolling
          rigidBody.current.setBodyType(0, true); // 0 = dynamic

          const pos = initialPosition.current;

          // Wake and reset position
          rigidBody.current.wakeUp();
          rigidBody.current.setTranslation(
            { x: pos[0] * 0.7, y: pos[1], z: pos[2] },
            true
          );
          rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

          // Apply Random Impulse & Torque
          const rand = (min: number, max: number) =>
            Math.random() * (max - min) + min;

          rigidBody.current.applyImpulse(
            {
              x: rand(-0.35, 0.35),
              y: rand(-1.2, -2),
              z: rand(-0.35, 0.35),
            },
            true
          );

          rigidBody.current.applyTorqueImpulse(
            {
              x: rand(-0.8, 0.8),
              y: rand(-0.8, 0.8),
              z: rand(-0.8, 0.8),
            },
            true
          );
        }

        onWake(index); // Notify parent we are moving
      }
    }

    prevRollTrigger.current = rollTrigger;
  }, [rollTrigger, isLocked]);

  const reportSettle = () => {
    if (settleReportedRef.current) return;
    settleReportedRef.current = true;
    stableTimeRef.current = 0;
    handleSleep();
  };

  // Face Detection Logic - report to parent via callback
  const handleSleep = () => {
    if (!rigidBody.current) return;

    const rotation = rigidBody.current.rotation();
    const quaternion = new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    const upVector = new THREE.Vector3(0, 1, 0);

    let bestDot = -1.0;
    let resultFace = 1;

    FACE_NORMALS.forEach(({ face, normal }) => {
      const worldNormal = normal.clone().applyQuaternion(quaternion);
      const dot = worldNormal.dot(upVector);
      if (dot > bestDot) {
        bestDot = dot;
        resultFace = face;
      }
    });

    // Report position for slot sorting
    const pos = rigidBody.current.translation();
    onPositionUpdate(index, pos.x);

    // Report settled value to parent
    onSettle(index, resultFace);
  };

  // Detect highlight transition for pulse animation
  useEffect(() => {
    if (isHighlighted && !wasHighlightedRef.current) {
      highlightStartTimeRef.current = performance.now();
    }
    wasHighlightedRef.current = isHighlighted;
  }, [isHighlighted]);

  // Reset animation state when reveal ends
  useEffect(() => {
    if (!isRevealActive) {
      animatedScaleRef.current = 1.0; // No locked scale boost anymore
      animatedColorRef.current.set("#f5f5f5"); // Always white
      animatedOpacityRef.current = isVisible ? 1.0 : 0.0;
    }
  }, [isRevealActive, isVisible]);

  // Combined useFrame for settle detection + animation
  useFrame((state, delta) => {
    // ARRANGED POSITION ANIMATION during reveal
    if (isRevealActive && rigidBody.current) {
      // Capture physics state on FIRST reveal frame (before any animation)
      // This must happen in useFrame, not useEffect, to avoid timing issues
      if (!wasRevealActiveRef.current) {
        // CRITICAL: Ensure die is dynamic for animation (in case it was kinematic from locking)
        rigidBody.current.setBodyType(0, true); // 0 = dynamic

        // Force capture current physics state immediately
        // This is the TRUE position after the roll settled
        const pos = rigidBody.current.translation();
        animatedPositionRef.current.set(pos.x, pos.y, pos.z);

        // Capture current physics rotation
        const rot = rigidBody.current.rotation();
        capturedPhysicsQuaternionRef.current.set(rot.x, rot.y, rot.z, rot.w);
        animatedQuaternionRef.current.copy(
          capturedPhysicsQuaternionRef.current
        );

        // Calculate target quaternion to show top face upward
        const upVector = new THREE.Vector3(0, 1, 0);
        let bestDot = -1;
        let bestFaceNormal = new THREE.Vector3(0, 1, 0);
        let bestFace = 3; // Track which face is on top

        FACE_NORMALS.forEach(({ face, normal }) => {
          const worldNormal = normal
            .clone()
            .applyQuaternion(capturedPhysicsQuaternionRef.current);
          const dot = worldNormal.dot(upVector);
          if (dot > bestDot) {
            bestDot = dot;
            bestFaceNormal = normal.clone();
            bestFace = face;
          }
        });

        // Create quaternion that rotates the best face to point up
        const rotationToUp = new THREE.Quaternion();
        rotationToUp.setFromUnitVectors(bestFaceNormal, upVector);

        // Apply face-specific orientation correction
        // Face 6 pips are arranged as two vertical columns - rotate around Y to align
        // Use premultiply so Y rotation happens AFTER the face is pointing up
        if (bestFace === 6) {
          const yAxisCorrection = new THREE.Quaternion();
          yAxisCorrection.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            Math.PI / 2
          );
          rotationToUp.premultiply(yAxisCorrection);
        }

        targetQuaternionRef.current.copy(rotationToUp);

        wasRevealActiveRef.current = true;

        // IMPORTANT: Skip lerp on capture frame - just apply captured position
        // This ensures animation starts from correct position on next frame
        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.current.setTranslation(
          {
            x: animatedPositionRef.current.x,
            y: animatedPositionRef.current.y,
            z: animatedPositionRef.current.z,
          },
          true
        );
        rigidBody.current.setRotation(
          {
            x: animatedQuaternionRef.current.x,
            y: animatedQuaternionRef.current.y,
            z: animatedQuaternionRef.current.z,
            w: animatedQuaternionRef.current.w,
          },
          true
        );

        // Force next frame to render immediately
        state.invalidate();
        return; // Skip rest of animation logic on capture frame
      }

      // Cap delta to prevent instant jumps after long pauses between frames
      // With frameloop="demand", delta can be huge after settling
      const cappedDelta = Math.min(delta, 1 / 30); // Cap at ~33ms

      // Smooth lerp position toward arranged position (using cached ref)
      targetPositionRef.current.set(
        arrangedPosition[0],
        arrangedPosition[1],
        arrangedPosition[2]
      );
      const posLerpSpeed = 8; // Balanced speed for smooth but snappy movement
      const posT = 1 - Math.exp(-posLerpSpeed * cappedDelta);
      animatedPositionRef.current.lerp(targetPositionRef.current, posT);

      // Smooth slerp rotation toward target (top face up)
      animatedQuaternionRef.current.slerp(targetQuaternionRef.current, posT);

      // Apply to RigidBody (disable physics movement)
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setTranslation(
        {
          x: animatedPositionRef.current.x,
          y: animatedPositionRef.current.y,
          z: animatedPositionRef.current.z,
        },
        true
      );
      rigidBody.current.setRotation(
        {
          x: animatedQuaternionRef.current.x,
          y: animatedQuaternionRef.current.y,
          z: animatedQuaternionRef.current.z,
          w: animatedQuaternionRef.current.w,
        },
        true
      );
    } else if (!isRevealActive) {
      // Reset tracking when reveal ends
      wasRevealActiveRef.current = false;
    }

    // Continuously report position for slot sorting (ensures positions are current before reveal)
    if (!isRevealActive && rigidBody.current && isVisible) {
      onPositionUpdate(index, rigidBody.current.translation().x);
    }

    // Settle detection (only for unlocked, unsettled dice, and not during reveal)
    if (
      !isLocked &&
      !settleReportedRef.current &&
      rigidBody.current &&
      !isRevealActive
    ) {
      const linvel = rigidBody.current.linvel();
      const angvel = rigidBody.current.angvel();
      const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
      const spin = Math.hypot(angvel.x, angvel.y, angvel.z);

      if (speed < 0.05 && spin < 0.1) {
        stableTimeRef.current += delta;
        if (stableTimeRef.current >= 0.15) {
          reportSettle();
        }
      } else {
        stableTimeRef.current = 0;
      }
    }

    // Animation logic - using proper exponential decay for smooth transitions
    const lerpFactor = 1 - Math.exp(-12 * delta);
    const now = performance.now();

    // Detect lock state transitions for micro-pop
    if (isLocked !== wasLockedRef.current) {
      wasLockedRef.current = isLocked;
      lockPopStartRef.current = now;
      lockPopPhaseRef.current = isLocked ? "up" : "down";
    }

    // Calculate target values based on state
    let targetScale: number;
    let targetOpacity: number;
    let applyDirectly = false; // For highlight pulse - apply directly without lerp

    if (isHighlighted) {
      // Snappy pulse: quick grow, fast return
      const elapsed = now - highlightStartTimeRef.current;
      const pulseDuration = 200; // Faster pulse
      const peakScale = 1.12; // Slightly more pronounced for visibility

      if (elapsed < pulseDuration * 0.35) {
        // Fast attack (35% of duration)
        const t = elapsed / (pulseDuration * 0.35);
        // Ease-out cubic for snappy attack
        const eased = 1 - Math.pow(1 - t, 3);
        targetScale = THREE.MathUtils.lerp(1.0, peakScale, eased);
      } else if (elapsed < pulseDuration) {
        // Quick settle (65% of duration)
        const t = (elapsed - pulseDuration * 0.35) / (pulseDuration * 0.65);
        // Ease-out quad for smooth settle
        const eased = 1 - (1 - t) * (1 - t);
        targetScale = THREE.MathUtils.lerp(peakScale, 1.0, eased);
      } else {
        targetScale = 1.0;
      }
      targetOpacity = 1.0;
      applyDirectly = true; // Pulse already has easing, don't re-lerp
    } else if (lockPopPhaseRef.current !== "none") {
      // Lock micro-pop animation
      const popElapsed = now - lockPopStartRef.current;
      const config = ANIMATION.lockOutline;

      if (lockPopPhaseRef.current === "up") {
        // Lock ON: 1.0 -> 1.06 (70ms) -> 1.0 (110ms)
        if (popElapsed < config.popUp.duration) {
          const t = popElapsed / config.popUp.duration;
          // Overshoot easing (back ease out)
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          targetScale = THREE.MathUtils.lerp(1.0, config.popUp.scale, eased);
        } else if (
          popElapsed <
          config.popUp.duration + config.popDown.duration
        ) {
          const t =
            (popElapsed - config.popUp.duration) / config.popDown.duration;
          // Ease out quad for settle
          const eased = 1 - (1 - t) * (1 - t);
          targetScale = THREE.MathUtils.lerp(config.popUp.scale, 1.0, eased);
        } else {
          targetScale = 1.0;
          lockPopPhaseRef.current = "none";
        }
      } else {
        // Lock OFF: 1.0 -> 0.97 (60ms) -> 1.0 (90ms)
        if (popElapsed < config.popDownOff.duration) {
          const t = popElapsed / config.popDownOff.duration;
          const eased = 1 - Math.pow(1 - t, 3);
          targetScale = THREE.MathUtils.lerp(
            1.0,
            config.popDownOff.scale,
            eased
          );
        } else if (
          popElapsed <
          config.popDownOff.duration + config.popUpOff.duration
        ) {
          const t =
            (popElapsed - config.popDownOff.duration) /
            config.popUpOff.duration;
          const eased = 1 - (1 - t) * (1 - t);
          targetScale = THREE.MathUtils.lerp(
            config.popDownOff.scale,
            1.0,
            eased
          );
        } else {
          targetScale = 1.0;
          lockPopPhaseRef.current = "none";
        }
      }
      targetOpacity = 1.0;
      applyDirectly = true;
    } else if (isRevealActive && !isContributing) {
      // Non-contributing during reveal: dimmed
      targetScale = 1.0;
      targetOpacity = 0.3;
    } else if (isRevealActive && isContributing) {
      // Contributing but not currently highlighted
      targetScale = 1.0;
      targetOpacity = 1.0;
    } else {
      // Normal state (locked or unlocked - no scale/color change)
      targetScale = 1.0;
      targetOpacity = isVisible ? 1.0 : 0.0;
    }

    // Apply animations - direct for highlight/pop, lerped for others
    if (applyDirectly) {
      // Direct application - animation already has its own easing
      animatedScaleRef.current = targetScale;
      animatedColorRef.current.copy(whiteColorRef.current); // Always white
      animatedOpacityRef.current = targetOpacity;
    } else {
      // Smooth lerp transitions
      animatedScaleRef.current = THREE.MathUtils.lerp(
        animatedScaleRef.current,
        targetScale,
        lerpFactor * 1.5
      );
      animatedColorRef.current.lerp(whiteColorRef.current, lerpFactor * 1.2); // Always lerp to white
      animatedOpacityRef.current = THREE.MathUtils.lerp(
        animatedOpacityRef.current,
        targetOpacity,
        lerpFactor * 1.4
      );
    }

    // Apply to refs
    if (groupRef.current) {
      const s = animatedScaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(animatedColorRef.current);
      mat.opacity = animatedOpacityRef.current;
    }

    // Keep frame loop running during reveal animation, highlight pulse, or lock pop
    if (isRevealActive || isHighlighted || lockPopPhaseRef.current !== "none") {
      state.invalidate();
    }
  });

  // also report wake on standard wake events (collisions etc)
  const handleWake = () => {
    if (!isLocked) {
      stableTimeRef.current = 0;
      onWake(index);
    }
  };

  // Handle tap to toggle lock
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onTap(index);
  };

  // Metal/Roughness - always use unlocked values (no gold effect)
  const metalness = 0.1;
  const roughness = 0.4;

  // Base opacity for DieFace pips (matches animation target)
  const pipOpacity =
    isRevealActive && !isContributing ? 0.3 : isVisible ? 1 : 0;

  return (
    <RigidBody
      ref={rigidBody}
      colliders="cuboid"
      restitution={0.08}
      friction={0.9}
      linearDamping={0.35}
      angularDamping={0.6}
      type="dynamic"
      onSleep={reportSettle}
      onWake={handleWake}
      position={position}
    >
      <group ref={groupRef} onPointerDown={handlePointerDown}>
        {/* Main die body */}
        <RoundedBox
          ref={meshRef}
          args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]}
          radius={0.08}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            metalness={metalness}
            roughness={roughness}
            transparent
          />
        </RoundedBox>

        {/* Face 1 - Right (+X) */}
        <DieFace
          faceValue={1}
          rotation={[0, Math.PI / 2, 0]}
          position={[FACE_OFFSET, 0, 0]}
          opacity={pipOpacity}
        />

        {/* Face 6 - Left (-X) */}
        <DieFace
          faceValue={6}
          rotation={[0, -Math.PI / 2, 0]}
          position={[-FACE_OFFSET, 0, 0]}
          opacity={pipOpacity}
        />

        {/* Face 3 - Top (+Y) */}
        <DieFace
          faceValue={3}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FACE_OFFSET, 0]}
          opacity={pipOpacity}
        />

        {/* Face 4 - Bottom (-Y) */}
        <DieFace
          faceValue={4}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -FACE_OFFSET, 0]}
          opacity={pipOpacity}
        />

        {/* Face 2 - Front (+Z) */}
        <DieFace
          faceValue={2}
          rotation={[0, 0, 0]}
          position={[0, 0, FACE_OFFSET]}
          opacity={pipOpacity}
        />

        {/* Face 5 - Back (-Z) */}
        <DieFace
          faceValue={5}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, -FACE_OFFSET]}
          opacity={pipOpacity}
        />

        {/* Lock outline (purple stroke) */}
        <DieOutline isLocked={isLocked} lockedDiceCount={lockedDiceCount} />
      </group>
    </RigidBody>
  );
};
