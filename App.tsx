import React from "react";
import { View } from "react-native";
import { DiceTray3D } from "./src/dice/DiceTray3D";
import { GamePanel } from "./src/ui/GamePanel";

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DiceTray3D />
      </View>
      <View style={{ flex: 1 }}>
        <GamePanel />
      </View>
    </View>
  );
}
