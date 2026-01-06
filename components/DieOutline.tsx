import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture, Billboard } from "@react-three/drei";
import { COLORS, ANIMATION } from "../constants/theme";

const DIE_SIZE = 0.8;
const LOCK_ICON_SIZE = 0.6; // Size of the lock icon in 3D space

// Thickness offsets for the inverted hull strokes (in world units)
// These create the visual appearance of 2-3px outer and 1-2px inner at typical viewing distance
const OUTER_STROKE_OFFSET = 0.045; // ~3px at 1080p viewing distance
const INNER_STROKE_OFFSET = 0.025; // ~1.5px at 1080p viewing distance

// Lock icon component - uses a textured plane
const LockIcon = ({
  opacityRef,
}: {
  opacityRef: React.MutableRefObject<number>;
}) => {
  const texture = useTexture(
    require("../assets/icons/lock.png")
  ) as THREE.Texture;
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // Update opacity each frame
  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current;
      matRef.current.visible = opacityRef.current > 0.01;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[LOCK_ICON_SIZE, LOCK_ICON_SIZE]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

// Connection line component
const LockLine = ({
  color,
  opacityRef,
}: {
  color: THREE.Color;
  opacityRef: React.RefObject<number>;
}) => {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current;
      matRef.current.visible = opacityRef.current > 0.01;
    }
  });

  return (
    <mesh position={[0, -0.25, 0]}>
      <planeGeometry args={[0.06, 0.3]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

interface DieOutlineProps {
  isLocked: boolean;
  lockedDiceCount: number;
}

export const DieOutline = ({ isLocked, lockedDiceCount }: DieOutlineProps) => {
  // Animation state refs
  const outerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Lock transition tracking
  const wasLockedRef = useRef(isLocked);
  const lockTransitionStartRef = useRef(0);
  const lockProgressRef = useRef(isLocked ? 1 : 0); // 0 = unlocked, 1 = locked

  // Idle pulse tracking
  const lastPulseTimeRef = useRef(0);
  const pulsePhaseRef = useRef<"idle" | "down" | "up">("idle");
  const pulseStartTimeRef = useRef(0);

  // Parse colors once
  const outerColor = useMemo(
    // User requested darker tone, "maybe our purple background color"
    () => new THREE.Color(COLORS.lockOutline.outer),
    []
  );
  const innerColor = useMemo(
    () => new THREE.Color(COLORS.lockOutline.outer),
    []
  );

  const config = ANIMATION.lockOutline;

  useFrame((state) => {
    const now = performance.now();

    // Detect lock state transitions
    if (isLocked !== wasLockedRef.current) {
      lockTransitionStartRef.current = now;
      wasLockedRef.current = isLocked;
      // Reset pulse when locking
      if (isLocked) {
        lastPulseTimeRef.current = now;
        pulsePhaseRef.current = "idle";
      }
    }

    // Calculate lock progress (0 = unlocked, 1 = locked)
    const transitionElapsed = now - lockTransitionStartRef.current;
    if (isLocked) {
      // Animating to locked
      const progress = Math.min(1, transitionElapsed / config.drawIn);
      // easeOutCubic
      lockProgressRef.current = 1 - Math.pow(1 - progress, 3);
    } else {
      // Animating to unlocked
      const progress = Math.min(1, transitionElapsed / config.fadeOut);
      // easeInCubic
      lockProgressRef.current = 1 - Math.pow(progress, 3);
    }

    // Base alpha from lock progress
    let outerAlpha = lockProgressRef.current * COLORS.lockOutline.outerAlpha;
    let innerAlpha = lockProgressRef.current * COLORS.lockOutline.innerAlpha;

    // Only apply idle pulse when fully locked
    if (isLocked && lockProgressRef.current >= 0.99) {
      const timeSinceLastPulse = now - lastPulseTimeRef.current;

      // Trigger new pulse cycle
      if (
        pulsePhaseRef.current === "idle" &&
        timeSinceLastPulse >= config.pulseInterval
      ) {
        pulsePhaseRef.current = "down";
        pulseStartTimeRef.current = now;
      }

      // Handle pulse phases
      if (pulsePhaseRef.current === "down") {
        const pulseElapsed = now - pulseStartTimeRef.current;
        const t = Math.min(1, pulseElapsed / config.pulseDuration);
        // Step-like ease (not smooth breathing)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        // Calculate pulse amplitude (reduce for 3+ dice)
        const amplitudeMultiplier =
          lockedDiceCount >= 3 ? 1 - config.multiDiceAmplitudeReduction : 1;
        const alphaRange =
          (config.pulseAlphaUp - config.pulseAlphaDown) * amplitudeMultiplier;
        const pulseAlpha = config.pulseAlphaUp - alphaRange * eased;

        outerAlpha = pulseAlpha;
        innerAlpha =
          pulseAlpha *
          (COLORS.lockOutline.innerAlpha / COLORS.lockOutline.outerAlpha);

        if (t >= 1) {
          pulsePhaseRef.current = "up";
          pulseStartTimeRef.current = now;
        }
      } else if (pulsePhaseRef.current === "up") {
        const pulseElapsed = now - pulseStartTimeRef.current;
        const t = Math.min(1, pulseElapsed / config.pulseDuration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const amplitudeMultiplier =
          lockedDiceCount >= 3 ? 1 - config.multiDiceAmplitudeReduction : 1;
        const alphaRange =
          (config.pulseAlphaUp - config.pulseAlphaDown) * amplitudeMultiplier;
        const pulseAlpha = config.pulseAlphaDown + alphaRange * eased;

        outerAlpha = pulseAlpha;
        innerAlpha =
          pulseAlpha *
          (COLORS.lockOutline.innerAlpha / COLORS.lockOutline.outerAlpha);

        if (t >= 1) {
          pulsePhaseRef.current = "idle";
          lastPulseTimeRef.current = now;
        }
      }
    }

    // Clamp max alpha for multi-dice
    outerAlpha = Math.min(outerAlpha, config.maxAlpha);
    innerAlpha = Math.min(innerAlpha, config.maxAlpha);

    // P4.1: Apply to materials only if changed (cache optimization)
    if (outerMatRef.current) {
      const newVisible = outerAlpha > 0.01;
      if (outerMatRef.current.opacity !== outerAlpha) {
        outerMatRef.current.opacity = outerAlpha;
      }
      if (outerMatRef.current.visible !== newVisible) {
        outerMatRef.current.visible = newVisible;
      }
    }
    if (innerMatRef.current) {
      const newVisible = innerAlpha > 0.01;
      if (innerMatRef.current.opacity !== innerAlpha) {
        innerMatRef.current.opacity = innerAlpha;
      }
      if (innerMatRef.current.visible !== newVisible) {
        innerMatRef.current.visible = newVisible;
      }
    }

    // Keep frame loop running during transitions or active pulse phases
    // P1.2: Only invalidate during lock transitions or actual pulse animation (not idle wait)
    if (lockProgressRef.current > 0.01 && lockProgressRef.current < 0.99) {
      state.invalidate();
    }
    if (pulsePhaseRef.current === "down" || pulsePhaseRef.current === "up") {
      state.invalidate();
    }
  });

  // Don't render anything if never been locked (optimization)
  if (!isLocked && lockProgressRef.current < 0.01) {
    return null;
  }

  return (
    <group>
      {/* Outer stroke - bright purple */}
      <RoundedBox
        args={[
          DIE_SIZE + OUTER_STROKE_OFFSET * 2,
          DIE_SIZE + OUTER_STROKE_OFFSET * 2,
          DIE_SIZE + OUTER_STROKE_OFFSET * 2,
        ]}
        radius={0.08 + OUTER_STROKE_OFFSET * 0.5}
        smoothness={4}
      >
        <meshBasicMaterial
          ref={outerMatRef}
          color={outerColor}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Inner stroke - darker purple for edge separation */}
      <RoundedBox
        args={[
          DIE_SIZE + INNER_STROKE_OFFSET * 2,
          DIE_SIZE + INNER_STROKE_OFFSET * 2,
          DIE_SIZE + INNER_STROKE_OFFSET * 2,
        ]}
        radius={0.08 + INNER_STROKE_OFFSET * 0.5}
        smoothness={4}
      >
        <meshBasicMaterial
          ref={innerMatRef}
          color={innerColor}
          side={THREE.BackSide}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Lock icon floating above die - billboard centered on die, icon offset directly in screen Y */}
      <Billboard position={[0, 0, 0]} follow={true}>
        {/* Adjusted position: slightly further away (0.35 offset) */}
        <group position={[0, DIE_SIZE * 0.5 + 0.35, 0]}>
          {/* Connection line rendered FIRST (behind lock) */}
          <LockLine color={outerColor} opacityRef={lockProgressRef} />
          <LockIcon opacityRef={lockProgressRef} />
        </group>
      </Billboard>
    </group>
  );
};
