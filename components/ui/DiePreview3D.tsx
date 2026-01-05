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

const DIE_SIZE = 1.0;
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
  isPreview?: boolean;
  previewColor?: string;
}

const Pip: React.FC<PipProps> = ({
  position,
  state,
  isNewlyEnhanced = false,
  isPreview = false,
  previewColor,
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

  // Reset material color when preview ends
  React.useEffect(() => {
    if (!isPreview && materialRef.current) {
      // Reset to base color based on state
      const baseColor =
        state === "points"
          ? COLORS.upgradePoints
          : state === "mult"
          ? COLORS.upgradeMult
          : "black";
      materialRef.current.color.set(baseColor);
      if (state !== "none") {
        materialRef.current.emissive.set(baseColor);
        materialRef.current.emissiveIntensity = 0.4;
      } else {
        materialRef.current.emissive.set("black");
        materialRef.current.emissiveIntensity = 0;
      }
    }
  }, [isPreview, state]);

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

  // Light Up and Settle Animation (for newly enhanced pips)
  // OR Continuous Pulse Animation (for preview pips)
  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Preview pip: continuous color pulse (color -> black -> color)
    if (isPreview && previewColor) {
      timeRef.current += delta;
      // Pulse cycle: 0.8s period
      const pulse = (Math.sin(timeRef.current * 8) + 1) / 2; // 0 to 1
      const r = parseInt(previewColor.slice(1, 3), 16) / 255;
      const g = parseInt(previewColor.slice(3, 5), 16) / 255;
      const b = parseInt(previewColor.slice(5, 7), 16) / 255;
      materialRef.current.color.setRGB(r * pulse, g * pulse, b * pulse);
      materialRef.current.emissive.setRGB(r * pulse, g * pulse, b * pulse);
      materialRef.current.emissiveIntensity = 0.6 * pulse;
      return;
    }

    // Newly enhanced pip animation
    if (!isNewlyEnhanced) return;

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
      scale = 1 + 0.4 * Math.exp(-settleT * 6) * Math.cos(settleT * 20);
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
  previewPipIndex?: number; // Index of pip to preview (continuous pulse)
  previewColor?: string;
}

const DieFace: React.FC<DieFaceProps> = ({
  faceValue,
  rotation,
  position,
  pipStates,
  enhancedPipIndex,
  previewPipIndex,
  previewColor,
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
          isPreview={previewPipIndex === i}
          previewColor={previewColor}
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
  previewFace?: number; // Face to show preview pulse (1-6)
  previewPipIndex?: number; // Index of pip to preview
  previewColor?: string; // Color for preview pulse
}

const InteractiveDie: React.FC<InteractiveDieProps> = ({
  enhancements,
  selectedFace,
  onFaceChange,
  upgradeType,
  enhancedFace,
  enhancedPipIndex,
  previewFace,
  previewPipIndex,
  previewColor,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const currentFaceRef = useRef<number | null>(null);

  // Target rotation for snapping
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isSnapping = useRef(false);
  const isAutoRotating = useRef(false);

  // Effect to handle programmatic face selection
  React.useEffect(() => {
    if (selectedFace !== null && !isDragging.current) {
      // Find the target rotation for this face
      const target = FACE_ROTATIONS[selectedFace];
      if (target) {
        targetQuaternion.current.copy(target);
        isAutoRotating.current = true;
        isSnapping.current = false;
      }
    }
  }, [selectedFace]);

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
    isAutoRotating.current = false;
    // Use uv or point coordinates for consistent tracking
    previousPointer.current = { x: e.point.x, y: e.point.y };
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current || !groupRef.current) return;
    e.stopPropagation();

    // Calculate rotation based on pointer movement in 3D space
    const deltaX = (e.point.x - previousPointer.current.x) * 3;
    const deltaY = (e.point.y - previousPointer.current.y) * 3;

    // Rotate around WORLD axes to prevent "gimbal lock" feel and confusing local rotation
    const rotateY = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      deltaX
    );
    const rotateX = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -deltaY
    );

    // Apply world rotations: pre-multiply to apply in world space
    groupRef.current.quaternion.premultiply(rotateY);
    groupRef.current.quaternion.premultiply(rotateX);

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

    if (isSnapping.current || isAutoRotating.current) {
      // Slerp toward target
      const speed = isAutoRotating.current ? 0.1 : 0.15;
      groupRef.current.quaternion.slerp(targetQuaternion.current, speed);

      // Check if close enough
      if (
        groupRef.current.quaternion.angleTo(targetQuaternion.current) < 0.01
      ) {
        groupRef.current.quaternion.copy(targetQuaternion.current);
        isSnapping.current = false;
        isAutoRotating.current = false;
      }
    }

    // Detect current front face only if dragging or snapping (not auto-rotating to avoid updates during animation)
    if (!isAutoRotating.current) {
      const newFace = detectFrontFace(groupRef.current.quaternion);
      if (newFace !== currentFaceRef.current) {
        currentFaceRef.current = newFace;
        // Only trigger haptic/callback if actual change and not just initial setup
        if (selectedFace !== null || currentFaceRef.current !== 1) {
          // We don't want to spam callbacks during drag, but we want haptics
          // triggerSelectionHaptic(); // Optional: might be too much during drag
        }

        // Update parent only when snapping is done or during drag if desired
        // For smoother UI, maybe only update on snap completion?
        // But user wants to see "Current Face" update?
        // Let's stick to update on snap completion or debounce
      }

      // We must update the parent when the face changes so the UI reflects it
      // But avoid circular updates if this was triggered BY the parent
      if (
        newFace !== selectedFace &&
        !isAutoRotating.current &&
        isSnapping.current &&
        groupRef.current.quaternion.angleTo(targetQuaternion.current) < 0.05
      ) {
        onFaceChange(newFace);
      }
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
        previewPipIndex={previewFace === 1 ? previewPipIndex : undefined}
        previewColor={previewColor}
      />
      {/* Face 6 - Left (-X) */}
      <DieFace
        faceValue={6}
        rotation={[0, -Math.PI / 2, 0]}
        position={[-FACE_OFFSET, 0, 0]}
        pipStates={getPipStates(6)}
        enhancedPipIndex={enhancedFace === 6 ? enhancedPipIndex : undefined}
        previewPipIndex={previewFace === 6 ? previewPipIndex : undefined}
        previewColor={previewColor}
      />
      {/* Face 3 - Top (+Y) */}
      <DieFace
        faceValue={3}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FACE_OFFSET, 0]}
        pipStates={getPipStates(3)}
        enhancedPipIndex={enhancedFace === 3 ? enhancedPipIndex : undefined}
        previewPipIndex={previewFace === 3 ? previewPipIndex : undefined}
        previewColor={previewColor}
      />
      {/* Face 4 - Bottom (-Y) */}
      <DieFace
        faceValue={4}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -FACE_OFFSET, 0]}
        pipStates={getPipStates(4)}
        enhancedPipIndex={enhancedFace === 4 ? enhancedPipIndex : undefined}
        previewPipIndex={previewFace === 4 ? previewPipIndex : undefined}
        previewColor={previewColor}
      />
      {/* Face 2 - Front (+Z) */}
      <DieFace
        faceValue={2}
        rotation={[0, 0, 0]}
        position={[0, 0, FACE_OFFSET]}
        pipStates={getPipStates(2)}
        enhancedPipIndex={enhancedFace === 2 ? enhancedPipIndex : undefined}
        previewPipIndex={previewFace === 2 ? previewPipIndex : undefined}
        previewColor={previewColor}
      />
      {/* Face 5 - Back (-Z) */}
      <DieFace
        faceValue={5}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, -FACE_OFFSET]}
        pipStates={getPipStates(5)}
        enhancedPipIndex={enhancedFace === 5 ? enhancedPipIndex : undefined}
        previewPipIndex={previewFace === 5 ? previewPipIndex : undefined}
        previewColor={previewColor}
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
  previewFace?: number; // Face to show preview pulse (1-6)
  previewPipIndex?: number; // Index of pip to preview
}

export const DiePreview3D: React.FC<DiePreview3DProps> = ({
  dieIndex,
  enhancements,
  selectedFace,
  onFaceSelect,
  upgradeType,
  enhancedFace,
  enhancedPipIndex,
  previewFace,
  previewPipIndex,
}) => {
  const dieEnhancement = enhancements[dieIndex] || { faces: Array(6).fill([]) };

  // Compute preview color from upgrade type
  const previewColor =
    upgradeType === "points"
      ? COLORS.upgradePoints
      : upgradeType === "mult"
      ? COLORS.upgradeMult
      : undefined;

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, -0.3, 2.8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <InteractiveDie
          enhancements={dieEnhancement}
          selectedFace={selectedFace}
          onFaceChange={onFaceSelect}
          upgradeType={upgradeType}
          enhancedFace={enhancedFace}
          enhancedPipIndex={enhancedPipIndex}
          previewFace={previewFace}
          previewPipIndex={previewPipIndex}
          previewColor={previewColor}
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
