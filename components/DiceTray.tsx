import React, { Suspense } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { ContactShadows, Environment } from "@react-three/drei";
import { Die } from "./Die";
import { useGameStore } from "../store/gameStore";

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#ff4040" />
    <Text style={styles.loadingText}>Loading Physics...</Text>
  </View>
);

export const DiceTray = () => {
  const isRolling = useGameStore((state) => state.isRolling);

  return (
    <View style={styles.container}>
      <Canvas
        shadows
        style={styles.canvas}
        frameloop="always" // Always render for now to debug
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

            {/* Walls (Invisible colliders to keep dice in) */}
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

          {/* High quality shadows for grounding */}
          <ContactShadows opacity={0.6} blur={2.5} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },
});
