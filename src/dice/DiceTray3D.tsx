import React from "react";
import {
  FilamentScene,
  FilamentView,
  DefaultLight,
  Camera,
  Model,
  useSyncSharedValue,
  useDerivedValue,
} from "react-native-filament";
import { useGameStore } from "../state/gameStore";
import {
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import Die from "../../assets/models/die.glb";

// Inner component - uses filament hooks (has FilamentScene context)
function DiceScene() {
  const isRolling = useGameStore((s) => s.isRolling);
  const diceCount = useGameStore((s) => s.diceCount);
  const held = useGameStore((s) => s.held);
  const commitRollResult = useGameStore((s) => s.commitRollResult);

  // Reanimated shared value for animation
  const rotationY = useSharedValue(0);

  // Bridge to worklets-core for Filament compatibility
  const syncedY = useSyncSharedValue(rotationY);

  // Create Float3 rotation for the Model
  const rotation = useDerivedValue(() => {
    "worklet";
    return [syncedY.value * 0.5, syncedY.value, 0] as [number, number, number];
  });

  const handleRollComplete = () => {
    const results = Array.from({ length: diceCount }, (_, i) => {
      if (held[i]) {
        return useGameStore.getState().faces[i];
      }
      return Math.floor(Math.random() * 6) + 1;
    });
    commitRollResult(results);
  };

  // Trigger animation when rolling
  React.useEffect(() => {
    if (isRolling) {
      rotationY.value = withSequence(
        withTiming(Math.PI * 6, { duration: 1500 }),
        withTiming(0, { duration: 500 }, () => {
          runOnJS(handleRollComplete)();
        })
      );
    }
  }, [isRolling]);

  return (
    <FilamentView style={{ flex: 1 }}>
      <DefaultLight />
      <Camera cameraPosition={[0, 3, 5]} />
      <Model source={Die} rotate={rotation} />
    </FilamentView>
  );
}

// Outer component - provides FilamentScene context
export function DiceTray3D() {
  return (
    <FilamentScene>
      <DiceScene />
    </FilamentScene>
  );
}
