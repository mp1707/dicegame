import React, { useRef, useEffect, useMemo } from "react";
import { RigidBody, RapierRigidBody, BallCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "../constants/theme";
import {
  ArtifactDieEnhancement,
  isArtifactFaceEnhanced,
} from "../utils/gameCore";

// D20 geometry constants
const D20_SCALE = 0.7; // Slightly smaller than D6 to not dominate
const ENHANCED_EMISSIVE = 0.4; // Glow intensity when face is enhanced

// Icosahedron face normals for detecting which face is up
// Standard icosahedron has 20 triangular faces
// We map each face to a number 1-20
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Icosahedron vertices (before normalization)
const ICO_VERTICES = [
  new THREE.Vector3(-1, PHI, 0).normalize(),
  new THREE.Vector3(1, PHI, 0).normalize(),
  new THREE.Vector3(-1, -PHI, 0).normalize(),
  new THREE.Vector3(1, -PHI, 0).normalize(),
  new THREE.Vector3(0, -1, PHI).normalize(),
  new THREE.Vector3(0, 1, PHI).normalize(),
  new THREE.Vector3(0, -1, -PHI).normalize(),
  new THREE.Vector3(0, 1, -PHI).normalize(),
  new THREE.Vector3(PHI, 0, -1).normalize(),
  new THREE.Vector3(PHI, 0, 1).normalize(),
  new THREE.Vector3(-PHI, 0, -1).normalize(),
  new THREE.Vector3(-PHI, 0, 1).normalize(),
];

// Face definitions (vertex indices for each triangular face)
// Standard icosahedron face ordering
const ICO_FACES = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

// Calculate face centers (normals) for each face
const FACE_NORMALS: { face: number; normal: THREE.Vector3 }[] = ICO_FACES.map(
  (indices, i) => {
    const v0 = ICO_VERTICES[indices[0]];
    const v1 = ICO_VERTICES[indices[1]];
    const v2 = ICO_VERTICES[indices[2]];
    const center = new THREE.Vector3().addVectors(v0, v1).add(v2).normalize();
    return { face: i + 1, normal: center };
  }
);

interface D20DieProps {
  position: [number, number, number];
  arrangedPosition: [number, number, number];
  isVisible: boolean;
  rollTrigger: number;
  onSettle: (value: number) => void;
  onWake: () => void;
  isHighlighted: boolean;
  isRevealActive: boolean;
  isWinAnimating?: boolean;
  artifactEnhancement?: ArtifactDieEnhancement;
  presetValue?: number | null; // Force a specific value (for testing/reveal)
}

/**
 * D20Die - 3D icosahedron die for the artifact system
 *
 * Features:
 * - Uses icosahedron geometry (20 triangular faces)
 * - Purple material with emissive glow when enhanced faces are rolled
 * - Rolling physics with Rapier
 * - Face detection to report rolled value
 * - Displays current value as text on top
 */
export const D20Die = ({
  position,
  arrangedPosition,
  isVisible,
  rollTrigger,
  onSettle,
  onWake,
  isHighlighted,
  isRevealActive,
  isWinAnimating,
  artifactEnhancement,
  presetValue,
}: D20DieProps) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const prevRollTrigger = useRef(rollTrigger);
  const initialPosition = useRef(position);
  const settleReportedRef = useRef(false);
  const stableTimeRef = useRef(0);
  const framesSinceRollRef = useRef(100);
  const currentFaceRef = useRef(1);

  // Animation refs
  const animatedScaleRef = useRef(1.0);
  const animatedOpacityRef = useRef(isVisible ? 1.0 : 0.0);
  const animatedPositionRef = useRef(new THREE.Vector3(...position));
  const animatedQuaternionRef = useRef(new THREE.Quaternion());
  const capturedPhysicsQuaternionRef = useRef(new THREE.Quaternion());
  const targetQuaternionRef = useRef(new THREE.Quaternion());
  const wasRevealActiveRef = useRef(false);

  // Highlight tracking
  const wasHighlightedRef = useRef(false);
  const highlightStartTimeRef = useRef(0);

  // Win animation tracking
  const wasWinAnimatingRef = useRef(false);
  const winAnimStartRef = useRef(0);

  // Pooled objects for calculations
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempUpVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tempWorldNormal = useMemo(() => new THREE.Vector3(), []);
  const tempRotationToUp = useMemo(() => new THREE.Quaternion(), []);
  const tempBestFaceNormal = useMemo(() => new THREE.Vector3(), []);
  const targetPositionRef = useRef(new THREE.Vector3());

  // Detect which face is up
  const detectTopFace = () => {
    if (!rigidBody.current) return 1;

    const rotation = rigidBody.current.rotation();
    tempQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    tempUpVector.set(0, 1, 0);

    let bestDot = -1.0;
    let resultFace = 1;

    FACE_NORMALS.forEach(({ face, normal }) => {
      tempWorldNormal.copy(normal).applyQuaternion(tempQuaternion);
      const dot = tempWorldNormal.dot(tempUpVector);
      if (dot > bestDot) {
        bestDot = dot;
        resultFace = face;
      }
    });

    return resultFace;
  };

  // Report settle
  const reportSettle = () => {
    if (settleReportedRef.current) return;
    settleReportedRef.current = true;
    stableTimeRef.current = 0;
    const value = presetValue ?? detectTopFace();
    currentFaceRef.current = value;
    onSettle(value);
  };

  // Trigger roll logic
  useEffect(() => {
    if (rollTrigger > prevRollTrigger.current) {
      settleReportedRef.current = false;
      stableTimeRef.current = 0;
      framesSinceRollRef.current = 0;

      if (rigidBody.current) {
        rigidBody.current.setBodyType(0, true); // dynamic

        const pos = initialPosition.current;
        rigidBody.current.wakeUp();
        rigidBody.current.setTranslation(
          { x: pos[0], y: pos[1], z: pos[2] },
          true
        );
        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Apply impulse and torque
        const rand = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        rigidBody.current.applyImpulse(
          {
            x: rand(-0.25, 0.25),
            y: rand(-0.9, -1.4),
            z: rand(-0.25, 0.25),
          },
          true
        );

        rigidBody.current.applyTorqueImpulse(
          {
            x: rand(-0.5, 0.5),
            y: rand(-0.5, 0.5),
            z: rand(-0.5, 0.5),
          },
          true
        );

        onWake();
      }
    }

    prevRollTrigger.current = rollTrigger;
  }, [rollTrigger]);

  // Detect highlight transition
  useEffect(() => {
    if (isHighlighted && !wasHighlightedRef.current) {
      highlightStartTimeRef.current = performance.now();
    }
    wasHighlightedRef.current = isHighlighted;
  }, [isHighlighted]);

  // Reset animation when reveal ends
  useEffect(() => {
    if (!isRevealActive) {
      animatedScaleRef.current = 1.0;
      animatedOpacityRef.current = isVisible ? 1.0 : 0.0;
    }
  }, [isRevealActive, isVisible]);

  // Frame updates
  useFrame((state, delta) => {
    // Settle detection
    framesSinceRollRef.current += 1;

    if (
      !settleReportedRef.current &&
      rigidBody.current &&
      !isRevealActive &&
      framesSinceRollRef.current > 10
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

      // Update current face for real-time display
      currentFaceRef.current = detectTopFace();
    }

    // Reveal animation
    if (isRevealActive && rigidBody.current) {
      if (!wasRevealActiveRef.current) {
        // Capture physics state
        rigidBody.current.setBodyType(0, true);
        const pos = rigidBody.current.translation();
        animatedPositionRef.current.set(pos.x, pos.y, pos.z);

        const rot = rigidBody.current.rotation();
        capturedPhysicsQuaternionRef.current.set(rot.x, rot.y, rot.z, rot.w);
        animatedQuaternionRef.current.copy(
          capturedPhysicsQuaternionRef.current
        );

        // Calculate target rotation for top face up
        tempUpVector.set(0, 1, 0);
        let bestDot = -1;
        tempBestFaceNormal.set(0, 1, 0);

        FACE_NORMALS.forEach(({ normal }) => {
          tempWorldNormal
            .copy(normal)
            .applyQuaternion(capturedPhysicsQuaternionRef.current);
          const dot = tempWorldNormal.dot(tempUpVector);
          if (dot > bestDot) {
            bestDot = dot;
            tempBestFaceNormal.copy(normal);
          }
        });

        tempRotationToUp.setFromUnitVectors(tempBestFaceNormal, tempUpVector);
        targetQuaternionRef.current.copy(tempRotationToUp);

        wasRevealActiveRef.current = true;

        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

        state.invalidate();
        return;
      }

      // Lerp to arranged position
      const cappedDelta = Math.min(delta, 1 / 30);
      targetPositionRef.current.set(
        arrangedPosition[0],
        arrangedPosition[1],
        arrangedPosition[2]
      );
      const posLerpSpeed = 8;
      const posT = 1 - Math.exp(-posLerpSpeed * cappedDelta);
      animatedPositionRef.current.lerp(targetPositionRef.current, posT);
      animatedQuaternionRef.current.slerp(targetQuaternionRef.current, posT);

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
      wasRevealActiveRef.current = false;
    }

    // Animation logic
    const lerpFactor = 1 - Math.exp(-12 * delta);
    const now = performance.now();

    // Win animation
    if (isWinAnimating && !wasWinAnimatingRef.current) {
      winAnimStartRef.current = now;
    }
    wasWinAnimatingRef.current = !!isWinAnimating;

    let targetScale: number;
    let targetOpacity: number;
    let applyDirectly = false;

    if (isHighlighted) {
      const elapsed = now - highlightStartTimeRef.current;
      const pulseDuration = 200;
      const peakScale = 1.15;

      if (elapsed < pulseDuration * 0.35) {
        const t = elapsed / (pulseDuration * 0.35);
        const eased = 1 - Math.pow(1 - t, 3);
        targetScale = THREE.MathUtils.lerp(1.0, peakScale, eased);
      } else if (elapsed < pulseDuration) {
        const t = (elapsed - pulseDuration * 0.35) / (pulseDuration * 0.65);
        const eased = 1 - (1 - t) * (1 - t);
        targetScale = THREE.MathUtils.lerp(peakScale, 1.0, eased);
      } else {
        targetScale = 1.0;
      }
      targetOpacity = 1.0;
      applyDirectly = true;
    } else if (isWinAnimating) {
      const elapsed = now - winAnimStartRef.current;
      const delay = 150;
      const duration = 250;

      if (elapsed < delay) {
        targetScale = 1.0;
        targetOpacity = 1.0;
      } else {
        const t = Math.min((elapsed - delay) / duration, 1.0);
        targetScale = 1.0 - 0.08 * t;
        targetOpacity = 1.0 - t;
      }
      applyDirectly = true;
    } else if (isRevealActive) {
      targetScale = 1.0;
      targetOpacity = 1.0;
    } else {
      targetScale = 1.0;
      targetOpacity = isVisible ? 1.0 : 0.0;
    }

    if (applyDirectly) {
      animatedScaleRef.current = targetScale;
      animatedOpacityRef.current = targetOpacity;
    } else {
      animatedScaleRef.current = THREE.MathUtils.lerp(
        animatedScaleRef.current,
        targetScale,
        lerpFactor * 1.5
      );
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
      mat.opacity = animatedOpacityRef.current;
    }

    // Keep loop running during animations
    if (isRevealActive || isHighlighted || isWinAnimating) {
      state.invalidate();
    }
  });

  // Handle wake events
  const handleWake = () => {
    stableTimeRef.current = 0;
    onWake();
  };

  // Check if current face is enhanced
  const isCurrentFaceEnhanced = artifactEnhancement
    ? isArtifactFaceEnhanced(currentFaceRef.current, artifactEnhancement)
    : false;

  // Material color - purple with enhanced glow
  const baseColor = COLORS.artifact;
  const emissiveIntensity = isCurrentFaceEnhanced ? ENHANCED_EMISSIVE : 0.1;

  if (!isVisible) return null;

  return (
    <>
      <RigidBody
        ref={rigidBody}
        colliders={false}
        restitution={0.1}
        friction={0.9}
        linearDamping={0.4}
        angularDamping={0.65}
        type="dynamic"
        onSleep={reportSettle}
        onWake={handleWake}
        position={position}
      >
        <BallCollider args={[D20_SCALE * 0.85]} />
        <group ref={groupRef}>
          {/* D20 icosahedron */}
          <mesh ref={meshRef} castShadow receiveShadow>
            <icosahedronGeometry args={[D20_SCALE, 0]} />
            <meshStandardMaterial
              color={baseColor}
              metalness={0.3}
              roughness={0.35}
              transparent
              emissive={baseColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      </RigidBody>
    </>
  );
};
