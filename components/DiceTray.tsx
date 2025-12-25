import React, { Suspense } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { ContactShadows, Environment } from "@react-three/drei";
import { Die } from "./Die";
import { useGameStore } from "../store/gameStore";
import { COLORS } from "../constants/theme";

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.gold} />
    <Text style={styles.loadingText}>Loading Physics...</Text>
  </View>
);

// Game end overlay
const GameEndOverlay = () => {
  const phase = useGameStore((s) => s.phase);

  if (phase !== "won" && phase !== "lost") return null;

  const isWon = phase === "won";

  return (
    <View style={styles.gameEndOverlay}>
      <Text
        style={[
          styles.gameEndText,
          { color: isWon ? COLORS.green : COLORS.red },
        ]}
      >
        {isWon ? "GEWONNEN!" : "VERLOREN"}
      </Text>
    </View>
  );
};

export const DiceTray = () => {
  const isRolling = useGameStore((state) => state.isRolling);

  return (
    <View style={styles.container}>
      <Canvas
        shadows
        style={styles.canvas}
        frameloop="always"
        camera={{ position: [0, 8, 4], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          castShadow
        />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor */}
            <RigidBody type="fixed" restitution={0.2} friction={1}>
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[20, 0.5, 20]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </RigidBody>

            {/* Walls (Invisible colliders) */}
            <RigidBody type="fixed">
              <CuboidCollider args={[10, 2, 0.5]} position={[0, 2, 6]} />
              <CuboidCollider args={[10, 2, 0.5]} position={[0, 2, -6]} />
              <CuboidCollider args={[0.5, 2, 10]} position={[6, 2, 0]} />
              <CuboidCollider args={[0.5, 2, 10]} position={[-6, 2, 0]} />
            </RigidBody>

            {/* The 5 Dice */}
            {[-2, -1, 0, 1, 2].map((x, i) => (
              <Die key={i} index={i} position={[x * 1.5, 5, 0]} />
            ))}
          </Physics>

          <ContactShadows opacity={0.6} blur={2.5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>

      {/* Game End Overlay */}
      <GameEndOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundDark,
  },
  loadingText: {
    color: COLORS.textWhite,
    marginTop: 10,
    fontSize: 14,
  },
  gameEndOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameEndText: {
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
