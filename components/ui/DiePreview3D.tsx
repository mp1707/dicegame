import React, { useRef, useMemo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  DieEnhancement,
  DiceUpgradeType,
  PipState,
} from "../../utils/gameCore";
import { GamePhase } from "../../store/gameStore";
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

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Preview pip: continuous color pulse
    if (isPreview && previewColor) {
      timeRef.current += delta;
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
      // Phase 1: Ignition
      const progress = t / 0.1;
      scale = 1 + progress * 0.4;
      emissiveIntensity = 0.4 + progress * 2.1;
    } else {
      // Phase 2 & 3: Decay and Settle
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
  enhancedPipIndex?: number;
  previewPipIndex?: number;
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
// Interactive Die (Supports forwarded ref and interactivity toggle)
// ─────────────────────────────────────────────────────────────────────────────

interface InteractiveDieProps {
  enhancements: DieEnhancement;
  isInteractive: boolean;
  selectedFace: number | null;
  onFaceChange?: (face: number) => void;
  upgradeType: DiceUpgradeType | null;
  enhancedFace?: number;
  enhancedPipIndex?: number;
  previewFace?: number;
  previewPipIndex?: number;
  previewColor?: string;
}

const InteractiveDie = React.forwardRef<THREE.Group, InteractiveDieProps>(
  (
    {
      enhancements,
      isInteractive,
      selectedFace,
      onFaceChange,
      upgradeType,
      enhancedFace,
      enhancedPipIndex,
      previewFace,
      previewPipIndex,
      previewColor,
    },
    ref
  ) => {
    // Ensure we have a usable ref (handling both function and object refs for safety, though we'll pass object refs)
    const localRef = useRef<THREE.Group>(null);
    React.useImperativeHandle(ref, () => localRef.current as THREE.Group);

    // Internal state only matters if interactive
    const isDragging = useRef(false);
    const previousPointer = useRef({ x: 0, y: 0 });
    const currentFaceRef = useRef<number | null>(null);

    const targetQuaternion = useRef(new THREE.Quaternion());
    const isSnapping = useRef(false);
    const isAutoRotating = useRef(false);

    // Sync internal state when becoming interactive
    useEffect(() => {
      if (isInteractive && localRef.current) {
        targetQuaternion.current.copy(localRef.current.quaternion);
        isSnapping.current = false;
        isAutoRotating.current = false;
        isDragging.current = false;
      }
    }, [isInteractive]);

    // Handle programmatic face selection
    useEffect(() => {
      // Only process face selection if this die is the interactive one
      if (isInteractive && selectedFace !== null && !isDragging.current) {
        const target = FACE_ROTATIONS[selectedFace];
        if (target) {
          targetQuaternion.current.copy(target);
          isAutoRotating.current = true;
          isSnapping.current = false;
        }
      }
    }, [selectedFace, isInteractive]);

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

    const handlePointerDown = (e: any) => {
      if (!isInteractive) return;
      e.stopPropagation();
      isDragging.current = true;
      isSnapping.current = false;
      isAutoRotating.current = false;
      previousPointer.current = { x: e.point.x, y: e.point.y };
    };

    const handlePointerMove = (e: any) => {
      if (!isInteractive || !isDragging.current || !localRef.current) return;
      e.stopPropagation();

      const deltaX = (e.point.x - previousPointer.current.x) * 3;
      const deltaY = (e.point.y - previousPointer.current.y) * 3;

      const rotateY = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        deltaX
      );
      const rotateX = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -deltaY
      );

      localRef.current.quaternion.premultiply(rotateY);
      localRef.current.quaternion.premultiply(rotateX);

      previousPointer.current = { x: e.point.x, y: e.point.y };
    };

    const handlePointerUp = (e: any) => {
      if (!isInteractive) return;
      if (isDragging.current && localRef.current) {
        // Start snapping
        const quaternion = localRef.current.quaternion.clone();
        const frontFace = detectFrontFace(quaternion);
        targetQuaternion.current.copy(FACE_ROTATIONS[frontFace]);
        isSnapping.current = true;
      }
      isDragging.current = false;
    };

    useFrame((_, delta) => {
      if (!isInteractive || !localRef.current) return;

      if (isSnapping.current || isAutoRotating.current) {
        const speed = isAutoRotating.current ? 0.1 : 0.15;
        localRef.current.quaternion.slerp(targetQuaternion.current, speed);

        if (
          localRef.current.quaternion.angleTo(targetQuaternion.current) < 0.01
        ) {
          localRef.current.quaternion.copy(targetQuaternion.current);
          isSnapping.current = false;
          isAutoRotating.current = false;
        }
      }

      if (!isAutoRotating.current) {
        const newFace = detectFrontFace(localRef.current.quaternion);
        if (
          newFace !== currentFaceRef.current &&
          onFaceChange &&
          isSnapping.current &&
          localRef.current.quaternion.angleTo(targetQuaternion.current) < 0.05
        ) {
          currentFaceRef.current = newFace;
          if (newFace !== selectedFace) {
            onFaceChange(newFace);
          }
        }
      }
    });

    const getPipStates = (faceValue: number): PipState[] => {
      return enhancements.faces[faceValue - 1] || [];
    };

    return (
      <group ref={localRef}>
        {/* Interaction Sphere */}
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
          <meshStandardMaterial
            color="#f5f5f5"
            metalness={0.1}
            roughness={0.4}
          />
        </RoundedBox>

        {[1, 2, 3, 4, 5, 6].map((face) => {
          let rot: [number, number, number] = [0, 0, 0];
          let pos: [number, number, number] = [0, 0, 0];

          if (face === 1) {
            rot = [0, Math.PI / 2, 0];
            pos = [FACE_OFFSET, 0, 0];
          }
          if (face === 6) {
            rot = [0, -Math.PI / 2, 0];
            pos = [-FACE_OFFSET, 0, 0];
          }
          if (face === 3) {
            rot = [-Math.PI / 2, 0, 0];
            pos = [0, FACE_OFFSET, 0];
          }
          if (face === 4) {
            rot = [Math.PI / 2, 0, 0];
            pos = [0, -FACE_OFFSET, 0];
          }
          if (face === 2) {
            rot = [0, 0, 0];
            pos = [0, 0, FACE_OFFSET];
          }
          if (face === 5) {
            rot = [0, Math.PI, 0];
            pos = [0, 0, -FACE_OFFSET];
          }

          return (
            <DieFace
              key={face}
              faceValue={face}
              rotation={rot}
              position={pos}
              pipStates={getPipStates(face)}
              enhancedPipIndex={
                enhancedFace === face ? enhancedPipIndex : undefined
              }
              previewPipIndex={
                previewFace === face ? previewPipIndex : undefined
              }
              previewColor={previewColor}
            />
          );
        })}
      </group>
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component (Scene Coordinator)
// ─────────────────────────────────────────────────────────────────────────────

export interface DiePreview3DProps {
  phase: GamePhase;
  dieIndex: number; // Selected die index (0-4)
  allEnhancements: DieEnhancement[];
  selectedFace: number | null;
  onFaceSelect: (face: number) => void;
  upgradeType: DiceUpgradeType | null;
  enhancedFace?: number;
  enhancedPipIndex?: number;
  previewFace?: number;
  previewPipIndex?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera Controller
// ─────────────────────────────────────────────────────────────────────────────

import { useThree } from "@react-three/fiber";

const CameraController = ({ phase }: { phase: GamePhase }) => {
  const { camera } = useThree();

  useFrame((state, delta) => {
    // DICE_EDITOR_DIE: High angle, overview of the ring
    // DICE_EDITOR_FACE: Standard view (lower, straighter) for face editing
    const targetPos =
      phase === "DICE_EDITOR_DIE"
        ? new THREE.Vector3(0, 1.2, 5.0) // Closer and slightly lower
        : new THREE.Vector3(0, 0, 4.0); // Closer for face editing

    // Target rotation (Euler)
    // DICE_EDITOR_DIE: Look down slightly (-0.20 rad)
    // DICE_EDITOR_FACE: Look straight (0 rad)
    const targetRotX = phase === "DICE_EDITOR_DIE" ? -0.2 : 0;

    const speed = 4 * delta;

    // Lerp position
    camera.position.lerp(targetPos, speed);

    // Lerp rotation (X axis is the main one changing)
    camera.rotation.x += (targetRotX - camera.rotation.x) * speed;

    // Ensure scaling/aspect is clean? Usually handled by R3F.
  });

  return null;
};

// ... inside DiceScene ... (removed comment)

interface DiceSceneProps {
  phase: GamePhase;
  dieIndex: number;
  allEnhancements: DieEnhancement[];
  selectedFace: number | null;
  onFaceSelect: (face: number) => void;
  upgradeType: DiceUpgradeType | null;
  enhancedFace?: number;
  enhancedPipIndex?: number;
  previewFace?: number;
  previewPipIndex?: number;
  previewColor?: string;
}

const DiceScene: React.FC<DiceSceneProps> = ({
  phase,
  dieIndex,
  allEnhancements,
  selectedFace,
  onFaceSelect,
  upgradeType,
  enhancedFace,
  enhancedPipIndex,
  previewFace,
  previewPipIndex,
  previewColor,
}) => {
  // Use createRef for stable object refs to pass to children
  const diceRefs = useMemo(
    () => [0, 1, 2, 3, 4].map(() => React.createRef<THREE.Group>()),
    []
  );

  // Carousel state
  const carouselRotation = useRef(0);

  // Scene Logic: Layout & Rotation Sync
  useFrame((state, delta) => {
    const selectedRefObject = diceRefs[dieIndex];
    if (!selectedRefObject) return;

    const selectedGroup = selectedRefObject.current;

    // 1. Sync Rotation: All dice match the selected die (visual rotation of the die itself)
    if (selectedGroup) {
      const masterQuat = selectedGroup.quaternion;
      diceRefs.forEach((ref, i) => {
        if (i !== dieIndex && ref.current) {
          ref.current.quaternion.copy(masterQuat);
        }
      });
    }

    // 2. Animate Carousel Rotation
    // 5 dice = 360 degrees / 5 = 72 degrees per die (2PI / 5)
    // We want dieIndex to be at angle 0 (Front)
    // So carousel rotation should be -dieIndex * STEP
    const ANGLE_STEP = (Math.PI * 2) / 5;
    const targetRotation = -dieIndex * ANGLE_STEP;

    // Shortest path logic:
    let diff = targetRotation - carouselRotation.current;
    // Normalize to -PI..PI
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    // Apply rotation
    const rotSpeed = 4 * delta;
    carouselRotation.current += diff * rotSpeed;

    // 3. Position Dice in Circle
    const RADIUS = 3.5;
    const CENTER_Z = -RADIUS; // So front is at Z=0 (RADIUS + CENTER_Z = 0)

    diceRefs.forEach((ref, i) => {
      const group = ref.current;
      if (!group) return;

      // Calculate Angle on Carousel
      const theta = i * ANGLE_STEP + carouselRotation.current;

      // Calculate Circle Position
      const circleX = RADIUS * Math.sin(theta);
      const circleZ = CENTER_Z + RADIUS * Math.cos(theta);

      const target = { x: circleX, y: 0, z: circleZ, scale: 1.0, opacity: 1 };

      if (phase === "DICE_EDITOR_DIE") {
        // Die Selection
        if (i === dieIndex) {
          target.scale = 1.2;
          target.y = 0;
        } else {
          target.scale = 1.0;
          target.y = 0;
        }
      } else {
        // Face Selection
        if (i === dieIndex) {
          target.x = 0;
          target.y = 0;
          target.z = 0.5; // Zoom in
          target.scale = 1.3;
        } else {
          // Fly away from current circle pos
          const normX = Math.sin(theta);
          const normZ = Math.cos(theta);
          target.x = circleX + normX * 8;
          target.z = circleZ + normZ * 8 - 5;
          target.y = -5;
          target.scale = 0;
        }
      }

      // Apply
      const lerpSpeed = 5 * delta;
      group.position.x += (target.x - group.position.x) * lerpSpeed;
      group.position.y += (target.y - group.position.y) * lerpSpeed;
      group.position.z += (target.z - group.position.z) * lerpSpeed;

      const s = group.scale.x + (target.scale - group.scale.x) * lerpSpeed;
      group.scale.setScalar(s);

      group.visible = s > 0.05;
    });
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* Render all 5 dice */}
      {[0, 1, 2, 3, 4].map((i) => {
        const isSelected = i === dieIndex;
        const enhancement = allEnhancements[i] || {
          faces: Array(6).fill([]),
        };

        return (
          <InteractiveDie
            key={i}
            ref={diceRefs[i]}
            enhancements={enhancement}
            isInteractive={isSelected}
            selectedFace={isSelected ? selectedFace : null}
            onFaceChange={isSelected ? onFaceSelect : undefined}
            upgradeType={isSelected ? upgradeType : null}
            enhancedFace={isSelected ? enhancedFace : undefined}
            enhancedPipIndex={isSelected ? enhancedPipIndex : undefined}
            previewFace={isSelected ? previewFace : undefined}
            previewPipIndex={isSelected ? previewPipIndex : undefined}
            previewColor={previewColor}
          />
        );
      })}
    </>
  );
};

export const DiePreview3D: React.FC<DiePreview3DProps> = (props) => {
  // Compute preview color here to pass down, or let scene handle it
  // Props are passed through directly to DiceScene

  const previewColor =
    props.upgradeType === "points"
      ? COLORS.upgradePoints
      : props.upgradeType === "mult"
      ? COLORS.upgradeMult
      : undefined;

  return (
    <View style={styles.container}>
      {/* Moved camera back and up for overhead view of the circle */}
      <Canvas camera={{ fov: 35 }}>
        <CameraController phase={props.phase} />
        <DiceScene {...props} previewColor={previewColor} />
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
