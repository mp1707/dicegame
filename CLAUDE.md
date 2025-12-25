# Dice Roller POC - Implementation Guide

This document outlines the implementation of a high-performance 3D dice roller using **Expo**, **React Three Fiber**, and **Rapier Physics** with WebAssembly.

## Tech Stack

| Library                     | Version  | Purpose                         |
| --------------------------- | -------- | ------------------------------- |
| `expo`                      | ~54.0.30 | React Native framework          |
| `three`                     | ^0.176.0 | 3D graphics engine              |
| `@react-three/fiber`        | ^9.1.2   | React renderer for Three.js     |
| `@react-three/drei`         | ^10.0.6  | Useful helpers for R3F          |
| `@react-three/rapier`       | ^2.1.0   | Rapier physics integration      |
| `@dimforge/rapier3d-compat` | ^0.15.0  | Rapier 3D physics engine (WASM) |
| `zustand`                   | ^5.0.5   | Lightweight state management    |
| `react-native-reanimated`   | ^4.2.1   | Native animations               |
| `polywasm`                  | ^0.2.0   | WebAssembly polyfill for Hermes |

---

## Critical: WebAssembly Polyfill for Hermes

**Hermes** (React Native's JS engine) does **NOT** natively support WebAssembly. Rapier physics uses WASM, so we need to polyfill it.

### Solution: `polywasm`

`polywasm` translates WebAssembly modules to pure JavaScript at runtime. It exports a `WebAssembly` object but **does NOT** auto-assign it to `globalThis`.

### Setup in `index.ts`

```typescript
// MUST be at the very top before any other imports
import { WebAssembly } from "polywasm";
(globalThis as any).WebAssembly = WebAssembly;

// Then other polyfills
import "react-native-get-random-values";
import "react-native-polyfill-globals/auto";

// Finally, app registration
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
```

> **Important**: The order matters! `polywasm` must be imported and assigned to `globalThis.WebAssembly` BEFORE any code that uses WebAssembly (including transitive dependencies like Rapier).

### Required Polyfill Dependencies

```bash
npm install polywasm react-native-get-random-values react-native-polyfill-globals \
  base-64 text-encoding react-native-url-polyfill react-native-fetch-api \
  event-target-polyfill web-streams-polyfill@3
```

---

## Metro Configuration

Metro needs to handle WASM files as assets, not source files:

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("wasm", "glb", "gltf");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== "wasm"
);

module.exports = config;
```

---

## Architecture

### State Management (Zustand)

Decouples physics from React rendering:

```typescript
// store/gameStore.ts
interface GameState {
  diceValues: number[]; // Final face values [1-6]
  isRolling: boolean; // Controls frameloop
  rollTrigger: number; // Increment to trigger roll
  triggerRoll: () => void;
  setRolling: (v: boolean) => void;
}
```

### Component Structure

```
App.tsx
├── DiceTray (3D scene - top 50%)
│   ├── Canvas (R3F)
│   │   ├── Physics (Rapier)
│   │   │   ├── Floor (RigidBody fixed)
│   │   │   ├── Walls (CuboidColliders)
│   │   │   └── Die x 5 (RigidBody dynamic)
│   │   ├── Lights
│   │   └── Environment
└── UI Controls (bottom 50%)
    ├── Dice values display
    └── Roll button
```

### Die Component Key Features

1. **Pip Rendering**: Uses child `<mesh>` elements with `<circleGeometry>` for each pip
2. **Physics**: `RigidBody` with `colliders="cuboid"` for accurate box collision
3. **Face Detection**: On `onSleep` event, calculates which face is up using quaternion math
4. **Roll Trigger**: Uses `useRef` to track previous `rollTrigger` value, preventing infinite loops

```typescript
// Only roll when button actually pressed
if (rollTrigger > prevRollTrigger.current) {
  // Apply impulse and torque
}
prevRollTrigger.current = rollTrigger;
```

---

## File Structure

```
dice-game/
├── index.ts           # Entry point with polyfills
├── App.tsx            # Main layout (50/50 split)
├── metro.config.js    # WASM asset handling
├── babel.config.js    # Reanimated plugin
├── components/
│   ├── Die.tsx        # Individual die with pips
│   └── DiceTray.tsx   # 3D scene container
├── store/
│   └── gameStore.ts   # Zustand state
└── src/types/
    └── polywasm.d.ts  # Type declarations
```

---

## Common Issues & Solutions

| Issue                                  | Solution                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Property 'WebAssembly' doesn't exist` | Ensure `polywasm` is imported and assigned to `globalThis.WebAssembly` BEFORE other imports |
| `Invalid responseType: blob`           | Ignore - related to Environment preset loading                                              |
| Dice rolling in infinite loop          | Use `useRef` to track previous `rollTrigger` value                                          |
| White screen                           | Ensure Canvas has `style={{flex: 1}}` and parent View also                                  |
| Multiple Three.js instances warning    | Can be ignored, caused by separate bundles                                                  |

---

## Running the Project

```bash
# Install dependencies
npm install

# Start Metro bundler
npx expo start

# Build for iOS (required for native modules)
npx expo run:ios --device
```

> **Note**: Must use development build (`expo run:ios`), not Expo Go, due to native modules like `react-native-reanimated` and `react-native-get-random-values`.
