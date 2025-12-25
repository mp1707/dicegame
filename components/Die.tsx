import React, { useRef, useEffect, useMemo } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";

// Standard D6 Face Normals
const FACE_NORMALS = [
  { face: 1, normal: new THREE.Vector3(1, 0, 0) }, // Right
  { face: 6, normal: new THREE.Vector3(-1, 0, 0) }, // Left
  { face: 3, normal: new THREE.Vector3(0, 1, 0) }, // Top
  { face: 4, normal: new THREE.Vector3(0, -1, 0) }, // Bottom
  { face: 2, normal: new THREE.Vector3(0, 0, 1) }, // Front
  { face: 5, normal: new THREE.Vector3(0, 0, -1) }, // Back
];

// Pip positions for each face value (relative to face center, scaled for 0.5 unit cube offset)
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.25, -0.25],
    [0.25, 0.25],
  ],
  3: [
    [-0.25, -0.25],
    [0, 0],
    [0.25, 0.25],
  ],
  4: [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25],
  ],
  5: [
    [-0.25, -0.25],
    [0.25, -0.25],
    [0, 0],
    [-0.25, 0.25],
    [0.25, 0.25],
  ],
  6: [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0],
    [0.25, 0],
    [-0.25, 0.25],
    [0.25, 0.25],
  ],
};

// Component for rendering pips on a single face
const DieFace = ({
  faceValue,
  rotation,
  position,
}: {
  faceValue: number;
  rotation: [number, number, number];
  position: [number, number, number];
}) => {
  const pips = PIP_POSITIONS[faceValue] || [];

  return (
    <group rotation={rotation} position={position}>
      {pips.map((pipPos, i) => (
        <mesh key={i} position={[pipPos[0], pipPos[1], 0.01]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
      ))}
    </group>
  );
};

interface DieProps {
  position: [number, number, number];
  index: number;
}

export const Die = ({ position, index }: DieProps) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const rollTrigger = useGameStore((state) => state.rollTrigger);
  const prevRollTrigger = useRef(rollTrigger);

  // Store initial position in a ref to avoid dependency issues
  const initialPosition = useRef(position);

  // Trigger Roll Logic - only when rollTrigger actually changes
  useEffect(() => {
    // Only trigger if rollTrigger increased (actual button press)
    if (rigidBody.current && rollTrigger > prevRollTrigger.current) {
      const pos = initialPosition.current;

      // 1. Reset Position (Lift them up, but keep them closer to center)
      rigidBody.current.setTranslation(
        { x: pos[0] * 0.7, y: 3, z: pos[2] },
        true
      );
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 2. Apply Random Impulse & Torque (Reduced for smaller viewport)
      const rand = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      rigidBody.current.applyImpulse(
        {
          x: rand(-0.5, 0.5),
          y: rand(-2, -4), // Throw down
          z: rand(-0.5, 0.5),
        },
        true
      );

      rigidBody.current.applyTorqueImpulse(
        {
          x: rand(-2, 2),
          y: rand(-2, 2),
          z: rand(-2, 2),
        },
        true
      );
    }

    // Update the ref to track current value
    prevRollTrigger.current = rollTrigger;
  }, [rollTrigger]);

  // Face Detection Logic (Run when sleeping/settled)
  const onSleep = () => {
    if (!rigidBody.current) return;

    const rotation = rigidBody.current.rotation();
    const quaternion = new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    const upVector = new THREE.Vector3(0, 1, 0); // World Up

    let bestDot = -1.0;
    let resultFace = 1;

    // Compare transformed normals to World Up
    FACE_NORMALS.forEach(({ face, normal }) => {
      const worldNormal = normal.clone().applyQuaternion(quaternion);
      const dot = worldNormal.dot(upVector);
      if (dot > bestDot) {
        bestDot = dot;
        resultFace = face;
      }
    });

    // Update Global Store
    useGameStore.setState((prev) => {
      const newValues = [...prev.diceValues];
      newValues[index] = resultFace;
      return { diceValues: newValues };
    });
  };

  return (
    <RigidBody
      ref={rigidBody}
      colliders="cuboid"
      restitution={0.3}
      friction={0.8}
      onSleep={onSleep}
      position={position}
    >
      <group>
        {/* Main die body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>

        {/* Face 1 - Right (+X) */}
        <DieFace
          faceValue={1}
          rotation={[0, Math.PI / 2, 0]}
          position={[0.501, 0, 0]}
        />

        {/* Face 6 - Left (-X) */}
        <DieFace
          faceValue={6}
          rotation={[0, -Math.PI / 2, 0]}
          position={[-0.501, 0, 0]}
        />

        {/* Face 3 - Top (+Y) */}
        <DieFace
          faceValue={3}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.501, 0]}
        />

        {/* Face 4 - Bottom (-Y) */}
        <DieFace
          faceValue={4}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -0.501, 0]}
        />

        {/* Face 2 - Front (+Z) */}
        <DieFace faceValue={2} rotation={[0, 0, 0]} position={[0, 0, 0.501]} />

        {/* Face 5 - Back (-Z) */}
        <DieFace
          faceValue={5}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, -0.501]}
        />
      </group>
    </RigidBody>
  );
};
