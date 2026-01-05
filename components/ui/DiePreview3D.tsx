import React, { useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  DieEnhancement,
  DiceUpgradeType,
  PipState,
} from "../../utils/gameCore";
import { COLORS } from "../../constants/theme";
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
  isNewlyEnhanced?: boolean;
}

const Pip: React.FC<PipProps> = ({
  position,
  state,
  isNewlyEnhanced = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);

  // Reset animation time when enhancement triggers
  React.useEffect(() => {
    if (isNewlyEnhanced) {
      timeRef.current = 0;
    }
  }, [isNewlyEnhanced]);

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

  // Light Up and Settle Animation
  // Phase 1 (0-100ms): Ignition - Rapid expansion and bright flash
  // Phase 2 (100-500ms): Settle - Elastic bounce back to normal size
  // Phase 3 (500ms+): Steady - Gentle glow
  useFrame((_, delta) => {
    if (!isNewlyEnhanced || !meshRef.current || !materialRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;

    let scale = 1;
    let emissiveIntensity = 0.4;

    if (t < 0.1) {
      // Phase 1: Ignition (0 -> 100ms)
      const progress = t / 0.1;
      scale = 1 + progress * 0.4; // 1.0 -> 1.4
      emissiveIntensity = 0.4 + progress * 2.1; // 0.4 -> 2.5 (Very bright!)
    } else {
      // Phase 2 & 3: Decay and Settle (100ms+)
      const settleT = t - 0.1;

      // Elastic scale settle: damp oscillation
      // decaying cos wave: amp * exp(-dec*t) * cos(freq*t)
      scale = 1 + 0.4 * Math.exp(-settleT * 6) * Math.cos(settleT * 20);

      // Emissive intensity decay: exponential
      // Decays from 2.5 back to 0.4
      emissiveIntensity = 0.4 + 2.1 * Math.exp(-settleT * 3);
    }

    // Safety clamp
    if (scale < 1) scale = 1;
    if (emissiveIntensity < 0.4) emissiveIntensity = 0.4;

    meshRef.current.scale.setScalar(scale);
    materialRef.current.emissiveIntensity = emissiveIntensity;
  });

  return (
    <mesh ref={meshRef} position={position} geometry={SHARED_PIP_GEOMETRY}>
      <meshStandardMaterial
        ref={materialRef}
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
  enhancedPipIndex?: number; // Index of pip currently being enhanced (pulsing)
}

const DieFace: React.FC<DieFaceProps> = ({
  faceValue,
  rotation,
  position,
  pipStates,
  enhancedPipIndex,
}) => {
  const pips = PIP_POSITIONS[faceValue] || [];

  return (
    <group rotation={rotation} position={position}>
      {pips.map((pipPos, i) => (
        <Pip
          key={i}
          position={[pipPos[0], pipPos[1], 0.01]}
          state={pipStates[i] || "none"}
          isNewlyEnhanced={enhancedPipIndex === i}
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
  enhancedFace?: number; // Face with the enhanced pip (1-6)
  enhancedPipIndex?: number; // Index of enhanced pip on that face
}

const InteractiveDie: React.FC<InteractiveDieProps> = ({
  enhancements,
  selectedFace,
  onFaceChange,
  upgradeType,
  enhancedFace,
  enhancedPipIndex,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const currentFaceRef = useRef<number | null>(null);

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

  // R3F pointer event handlers (work in React Native)
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    isSnapping.current = false;
    // Use uv or point coordinates for consistent tracking
    previousPointer.current = { x: e.point.x, y: e.point.y };
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current || !groupRef.current) return;
    e.stopPropagation();

    // Calculate rotation based on pointer movement in 3D space
    const deltaX = (e.point.x - previousPointer.current.x) * 3;
    const deltaY = (e.point.y - previousPointer.current.y) * 3;

    // Rotate based on drag - intuitive mapping:
    // Drag right → rotate around Y axis (positive)
    // Drag down → rotate around X axis (negative for intuitive feel)
    groupRef.current.rotation.y += deltaX;
    groupRef.current.rotation.x -= deltaY; // Inverted for intuitive gesture

    previousPointer.current = { x: e.point.x, y: e.point.y };
  };

  const handlePointerUp = (e: any) => {
    if (isDragging.current && groupRef.current) {
      // Start snapping to nearest face
      const quaternion = groupRef.current.quaternion.clone();
      const frontFace = detectFrontFace(quaternion);
      targetQuaternion.current.copy(FACE_ROTATIONS[frontFace]);
      isSnapping.current = true;
    }
    isDragging.current = false;
  };

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
      triggerSelectionHaptic();
      onFaceChange(newFace);
    }
  });

  // Get pip states for each face
  const getPipStates = (faceValue: number): PipState[] => {
    return enhancements.faces[faceValue - 1] || [];
  };

  return (
    <group ref={groupRef}>
      {/* Invisible sphere for touch interaction - larger than die for easier grabbing */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <sphereGeometry args={[DIE_SIZE * 1.2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

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
        enhancedPipIndex={enhancedFace === 1 ? enhancedPipIndex : undefined}
      />
      {/* Face 6 - Left (-X) */}
      <DieFace
        faceValue={6}
        rotation={[0, -Math.PI / 2, 0]}
        position={[-FACE_OFFSET, 0, 0]}
        pipStates={getPipStates(6)}
        enhancedPipIndex={enhancedFace === 6 ? enhancedPipIndex : undefined}
      />
      {/* Face 3 - Top (+Y) */}
      <DieFace
        faceValue={3}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FACE_OFFSET, 0]}
        pipStates={getPipStates(3)}
        enhancedPipIndex={enhancedFace === 3 ? enhancedPipIndex : undefined}
      />
      {/* Face 4 - Bottom (-Y) */}
      <DieFace
        faceValue={4}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -FACE_OFFSET, 0]}
        pipStates={getPipStates(4)}
        enhancedPipIndex={enhancedFace === 4 ? enhancedPipIndex : undefined}
      />
      {/* Face 2 - Front (+Z) */}
      <DieFace
        faceValue={2}
        rotation={[0, 0, 0]}
        position={[0, 0, FACE_OFFSET]}
        pipStates={getPipStates(2)}
        enhancedPipIndex={enhancedFace === 2 ? enhancedPipIndex : undefined}
      />
      {/* Face 5 - Back (-Z) */}
      <DieFace
        faceValue={5}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, -FACE_OFFSET]}
        pipStates={getPipStates(5)}
        enhancedPipIndex={enhancedFace === 5 ? enhancedPipIndex : undefined}
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
  enhancedFace?: number; // Face with newly enhanced pip (1-6)
  enhancedPipIndex?: number; // Index of newly enhanced pip
}

export const DiePreview3D: React.FC<DiePreview3DProps> = ({
  dieIndex,
  enhancements,
  selectedFace,
  onFaceSelect,
  upgradeType,
  enhancedFace,
  enhancedPipIndex,
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
          enhancedFace={enhancedFace}
          enhancedPipIndex={enhancedPipIndex}
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
