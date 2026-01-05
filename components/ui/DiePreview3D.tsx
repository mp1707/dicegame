import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  DieEnhancement,
  DiceUpgradeType,
  PipState,
} from "../../utils/gameCore";
import { COLORS, ANIMATION } from "../../constants/theme";
import { triggerSelectionHaptic } from "../../utils/haptics";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DIE_SIZE = 1.2;
const DIE_HALF = DIE_SIZE / 2;
const FACE_OFFSET = DIE_HALF + 0.01;
const PIP_OFFSET = 0.25 * DIE_SIZE;
const PIP_RADIUS = 0.08 * DIE_SIZE;

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

// Face normals for snap detection
const FACE_NORMALS = [
  { face: 1, normal: new THREE.Vector3(1, 0, 0) }, // Right
  { face: 6, normal: new THREE.Vector3(-1, 0, 0) }, // Left
  { face: 3, normal: new THREE.Vector3(0, 1, 0) }, // Top
  { face: 4, normal: new THREE.Vector3(0, -1, 0) }, // Bottom
  { face: 2, normal: new THREE.Vector3(0, 0, 1) }, // Front
  { face: 5, normal: new THREE.Vector3(0, 0, -1) }, // Back
];

// Target quaternions for each face pointing toward camera
const FACE_ROTATIONS: Record<number, THREE.Quaternion> = {};
FACE_NORMALS.forEach(({ face, normal }) => {
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(normal, new THREE.Vector3(0, 0, 1));
  FACE_ROTATIONS[face] = quat;
});

// ─────────────────────────────────────────────────────────────────────────────
// Pip Component with Color Support
// ─────────────────────────────────────────────────────────────────────────────

interface PipProps {
  position: [number, number, number];
  state: PipState;
}

const Pip: React.FC<PipProps> = ({ position, state }) => {
  const color =
    state === "points"
      ? COLORS.upgradePoints
      : state === "mult"
      ? COLORS.upgradeMult
      : "black";

  const emissive =
    state === "points"
      ? COLORS.upgradePoints
      : state === "mult"
      ? COLORS.upgradeMult
      : undefined;

  return (
    <mesh position={position} geometry={SHARED_PIP_GEOMETRY}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={state !== "none" ? 0.4 : 0}
      />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Die Face Component
// ─────────────────────────────────────────────────────────────────────────────

interface DieFaceProps {
  faceValue: number;
  rotation: [number, number, number];
  position: [number, number, number];
  pipStates: PipState[];
}

const DieFace: React.FC<DieFaceProps> = ({
  faceValue,
  rotation,
  position,
  pipStates,
}) => {
  const pips = PIP_POSITIONS[faceValue] || [];

  return (
    <group rotation={rotation} position={position}>
      {pips.map((pipPos, i) => (
        <Pip
          key={i}
          position={[pipPos[0], pipPos[1], 0.01]}
          state={pipStates[i] || "none"}
        />
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Die
// ─────────────────────────────────────────────────────────────────────────────

interface InteractiveDieProps {
  enhancements: DieEnhancement;
  selectedFace: number | null;
  onFaceChange: (face: number) => void;
  upgradeType: DiceUpgradeType | null;
}

const InteractiveDie: React.FC<InteractiveDieProps> = ({
  enhancements,
  selectedFace,
  onFaceChange,
  upgradeType,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const currentFaceRef = useRef<number | null>(null);

  const { size, gl } = useThree();

  // Target rotation for snapping
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isSnapping = useRef(false);

  // Detect which face is closest to camera
  const detectFrontFace = (quaternion: THREE.Quaternion): number => {
    const cameraDirection = new THREE.Vector3(0, 0, 1);
    let bestDot = -1;
    let bestFace = 1;

    FACE_NORMALS.forEach(({ face, normal }) => {
      const worldNormal = normal.clone().applyQuaternion(quaternion);
      const dot = worldNormal.dot(cameraDirection);
      if (dot > bestDot) {
        bestDot = dot;
        bestFace = face;
      }
    });

    return bestFace;
  };

  // Handle pointer events
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      isSnapping.current = false;
      previousPointer.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return;

      const deltaX = e.clientX - previousPointer.current.x;
      const deltaY = e.clientY - previousPointer.current.y;

      // Rotate based on drag
      const rotationSpeed = 0.01;
      groupRef.current.rotation.y += deltaX * rotationSpeed;
      groupRef.current.rotation.x += deltaY * rotationSpeed;

      velocity.current = { x: deltaX, y: deltaY };
      previousPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (isDragging.current && groupRef.current) {
        // Start snapping to nearest face
        const quaternion = groupRef.current.quaternion.clone();
        const frontFace = detectFrontFace(quaternion);
        targetQuaternion.current.copy(FACE_ROTATIONS[frontFace]);
        isSnapping.current = true;
      }
      isDragging.current = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isSnapping.current) {
      // Slerp toward target
      groupRef.current.quaternion.slerp(targetQuaternion.current, 0.15);

      // Check if close enough
      if (
        groupRef.current.quaternion.angleTo(targetQuaternion.current) < 0.01
      ) {
        groupRef.current.quaternion.copy(targetQuaternion.current);
        isSnapping.current = false;
      }
    }

    // Detect current front face
    const newFace = detectFrontFace(groupRef.current.quaternion);
    if (newFace !== currentFaceRef.current) {
      currentFaceRef.current = newFace;
      if (ANIMATION.diceEditor.faceSnapHaptic) {
        triggerSelectionHaptic();
      }
      onFaceChange(newFace);
    }
  });

  // Get pip states for each face
  const getPipStates = (faceValue: number): PipState[] => {
    return enhancements.faces[faceValue - 1] || [];
  };

  return (
    <group ref={groupRef}>
      <RoundedBox
        args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]}
        radius={0.1}
        smoothness={4}
      >
        <meshStandardMaterial color="#f5f5f5" metalness={0.1} roughness={0.4} />
      </RoundedBox>

      {/* Face 1 - Right (+X) */}
      <DieFace
        faceValue={1}
        rotation={[0, Math.PI / 2, 0]}
        position={[FACE_OFFSET, 0, 0]}
        pipStates={getPipStates(1)}
      />
      {/* Face 6 - Left (-X) */}
      <DieFace
        faceValue={6}
        rotation={[0, -Math.PI / 2, 0]}
        position={[-FACE_OFFSET, 0, 0]}
        pipStates={getPipStates(6)}
      />
      {/* Face 3 - Top (+Y) */}
      <DieFace
        faceValue={3}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FACE_OFFSET, 0]}
        pipStates={getPipStates(3)}
      />
      {/* Face 4 - Bottom (-Y) */}
      <DieFace
        faceValue={4}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -FACE_OFFSET, 0]}
        pipStates={getPipStates(4)}
      />
      {/* Face 2 - Front (+Z) */}
      <DieFace
        faceValue={2}
        rotation={[0, 0, 0]}
        position={[0, 0, FACE_OFFSET]}
        pipStates={getPipStates(2)}
      />
      {/* Face 5 - Back (-Z) */}
      <DieFace
        faceValue={5}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, -FACE_OFFSET]}
        pipStates={getPipStates(5)}
      />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface DiePreview3DProps {
  dieIndex: number;
  enhancements: DieEnhancement[];
  selectedFace: number | null;
  onFaceSelect: (face: number) => void;
  upgradeType: DiceUpgradeType | null;
}

export const DiePreview3D: React.FC<DiePreview3DProps> = ({
  dieIndex,
  enhancements,
  selectedFace,
  onFaceSelect,
  upgradeType,
}) => {
  const dieEnhancement = enhancements[dieIndex] || { faces: Array(6).fill([]) };

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <InteractiveDie
          enhancements={dieEnhancement}
          selectedFace={selectedFace}
          onFaceChange={onFaceSelect}
          upgradeType={upgradeType}
        />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
