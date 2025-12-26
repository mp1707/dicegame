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
}: DieProps & { onWake: (index: number) => void }) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const prevRollTrigger = useRef(rollTrigger);
  const initialPosition = useRef(position);
  const settleReportedRef = useRef(false);
  const stableTimeRef = useRef(0);

  // Trigger Roll Logic - only when rollTrigger changes
  useEffect(() => {
    if (rollTrigger > prevRollTrigger.current) {
      settleReportedRef.current = false;
      stableTimeRef.current = 0;

      if (isLocked) {
        // LOCKED DICE: Immediate settle, no physics action
        // We report settle immediately so the parent knows this die is "done"
        // We use the current face value logic or we could store the last value.
        // Re-evaluating the face is safer to ensure sync.
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

  // Detect when the die becomes stable without waiting for Rapier's sleep timeout
  useFrame((_, delta) => {
    if (isLocked || settleReportedRef.current || !rigidBody.current) return;

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

  // Die colors based on selection
  const dieColor = isLocked ? COLORS.cyan : "#f5f5f5"; // Cyan when locked
  const dieOpacity = isVisible ? 1 : 0;
  const dieEmissive = isLocked ? COLORS.cyan : "#000000";
  const dieEmissiveIntensity = isLocked ? 0.65 : 0;

  return (
    <RigidBody
      ref={rigidBody}
      colliders="cuboid"
      restitution={0.08}
      friction={0.9}
      linearDamping={0.35}
      angularDamping={0.6}
      // Fixed type for locked dice prevents any movement/drift
      type={isLocked ? "fixed" : "dynamic"}
      onSleep={reportSettle}
      onWake={handleWake}
      position={position}
    >
      <group onPointerDown={handlePointerDown}>
        {isLocked && (
          <mesh scale={[1.08, 1.08, 1.08]}>
            <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
            <meshBasicMaterial
              color={COLORS.cyan}
              transparent
              opacity={isVisible ? 0.25 : 0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Main die body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
          <meshStandardMaterial
            color={dieColor}
            emissive={dieEmissive}
            emissiveIntensity={dieEmissiveIntensity}
            transparent
            opacity={dieOpacity}
          />
        </mesh>

        {/* Face 1 - Right (+X) */}
        <DieFace
          faceValue={1}
          rotation={[0, Math.PI / 2, 0]}
          position={[FACE_OFFSET, 0, 0]}
          opacity={dieOpacity}
        />

        {/* Face 6 - Left (-X) */}
        <DieFace
          faceValue={6}
          rotation={[0, -Math.PI / 2, 0]}
          position={[-FACE_OFFSET, 0, 0]}
          opacity={dieOpacity}
        />

        {/* Face 3 - Top (+Y) */}
        <DieFace
          faceValue={3}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FACE_OFFSET, 0]}
          opacity={dieOpacity}
        />

        {/* Face 4 - Bottom (-Y) */}
        <DieFace
          faceValue={4}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -FACE_OFFSET, 0]}
          opacity={dieOpacity}
        />

        {/* Face 2 - Front (+Z) */}
        <DieFace
          faceValue={2}
          rotation={[0, 0, 0]}
          position={[0, 0, FACE_OFFSET]}
          opacity={dieOpacity}
        />

        {/* Face 5 - Back (-Z) */}
        <DieFace
          faceValue={5}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, -FACE_OFFSET]}
          opacity={dieOpacity}
        />
      </group>
    </RigidBody>
  );
};
