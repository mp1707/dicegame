import React, { useRef, useEffect } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { COLORS } from "../constants/theme";

// Standard D6 Face Normals
const FACE_NORMALS = [
  { face: 1, normal: new THREE.Vector3(1, 0, 0) }, // Right
  { face: 6, normal: new THREE.Vector3(-1, 0, 0) }, // Left
  { face: 3, normal: new THREE.Vector3(0, 1, 0) }, // Top
  { face: 4, normal: new THREE.Vector3(0, -1, 0) }, // Bottom
  { face: 2, normal: new THREE.Vector3(0, 0, 1) }, // Front
  { face: 5, normal: new THREE.Vector3(0, 0, -1) }, // Back
];

const DIE_SIZE = 0.7;
const DIE_HALF = DIE_SIZE / 2;
const FACE_OFFSET = DIE_HALF + 0.01;
const PIP_OFFSET = 0.25 * DIE_SIZE;
const PIP_RADIUS = 0.08 * DIE_SIZE;

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
        <mesh key={i} position={[pipPos[0], pipPos[1], 0.01]}>
          <circleGeometry args={[PIP_RADIUS, 16]} />
          <meshBasicMaterial color="black" transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

interface DieProps {
  position: [number, number, number];
  index: number;
  isLocked: boolean;
  isVisible: boolean;
  rollTrigger: number;
  onSettle: (index: number, value: number) => void;
  onTap: (index: number) => void;
  // Animation props for scoring reveal
  isHighlighted: boolean;
  isContributing: boolean;
  isRevealActive: boolean;
}

export const Die = ({
  position,
  index,
  isLocked,
  isVisible,
  rollTrigger,
  onSettle,
  onWake,
  onTap,
  isHighlighted,
  isContributing,
  isRevealActive,
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

  // Highlight pulse tracking
  const wasHighlightedRef = useRef(false);
  const highlightStartTimeRef = useRef(0);

  // Trigger Roll Logic - only when rollTrigger changes
  useEffect(() => {
    if (rollTrigger > prevRollTrigger.current) {
      settleReportedRef.current = false;
      stableTimeRef.current = 0;

      if (isLocked) {
        // LOCKED DICE: Immediate settle, no physics action
        reportSettle();
      } else {
        // UNLOCKED DICE: Wake up and roll
        onWake(index); // Notify parent we are moving

        if (rigidBody.current) {
          const pos = initialPosition.current;

          // awake() is sometimes needed to ensure impulses work if body was sleeping
          rigidBody.current.wakeUp();

          // Reset Position
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
      animatedScaleRef.current = isLocked ? 1.1 : 1.0;
      animatedColorRef.current.set(isLocked ? COLORS.gold : "#f5f5f5");
      animatedOpacityRef.current = isVisible ? 1.0 : 0.0;
    }
  }, [isRevealActive, isLocked, isVisible]);

  // Combined useFrame for settle detection + animation + locked freeze
  useFrame((state, delta) => {
    // LOCKED DICE: Freeze in place by zeroing velocities every frame
    // This is more stable than changing RigidBody type between fixed/dynamic
    if (isLocked && rigidBody.current) {
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Settle detection (only for unlocked, unsettled dice)
    if (!isLocked && !settleReportedRef.current && rigidBody.current) {
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

    // Animation logic
    const WHITE = "#f5f5f5";
    const GOLD = COLORS.gold;
    const lerpFactor = 1 - Math.pow(0.001, delta);

    // Calculate target values based on state
    let targetScale: number;
    let targetColor: string;
    let targetOpacity: number;

    if (isHighlighted) {
      // Snappy pulse: quick grow, fast return
      const elapsed = performance.now() - highlightStartTimeRef.current;
      const pulseDuration = 200; // Faster pulse
      const peakScale = 1.08; // Subtler scale for premium feel

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
      targetColor = GOLD;
      targetOpacity = 1.0;
    } else if (isRevealActive && !isContributing) {
      // Non-contributing during reveal: dimmed
      targetScale = 1.0;
      targetColor = WHITE;
      targetOpacity = 0.3;
    } else if (isRevealActive && isContributing) {
      // Contributing but not currently highlighted
      targetScale = 1.0;
      targetColor = WHITE;
      targetOpacity = 1.0;
    } else if (isLocked) {
      // Normal locked state
      targetScale = 1.1;
      targetColor = GOLD;
      targetOpacity = 1.0;
    } else {
      // Normal unlocked state
      targetScale = 1.0;
      targetColor = WHITE;
      targetOpacity = isVisible ? 1.0 : 0.0;
    }

    // Lerp toward targets - faster for snappier feel
    animatedScaleRef.current = THREE.MathUtils.lerp(
      animatedScaleRef.current,
      targetScale,
      lerpFactor * 18 // Faster scale response
    );
    animatedColorRef.current.lerp(
      new THREE.Color(targetColor),
      lerpFactor * 12
    );
    animatedOpacityRef.current = THREE.MathUtils.lerp(
      animatedOpacityRef.current,
      targetOpacity,
      lerpFactor * 14 // Faster opacity transitions
    );

    // Apply to refs
    if (groupRef.current) {
      const s = animatedScaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(animatedColorRef.current);
      mat.opacity = animatedOpacityRef.current;
      mat.needsUpdate = true;
    }

    // Keep frame loop running during reveal animation or when locked (for freeze logic)
    if (isRevealActive || isHighlighted || isLocked) {
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

  // Metal/Roughness for Gold effect (static, not animated)
  const metalness = isLocked ? 0.6 : 0.1;
  const roughness = isLocked ? 0.2 : 0.4;

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
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
          <meshStandardMaterial
            metalness={metalness}
            roughness={roughness}
            transparent
          />
        </mesh>

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
      </group>
    </RigidBody>
  );
};
