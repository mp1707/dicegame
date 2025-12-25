# CRT Overlay (Expo, No Shader)

This guide documents a "practical overlay" CRT effect: a full-screen layer with scanlines, vignette, noise, and subtle flicker. It is lightweight and works on iOS/Android without shader rewrites. It does not warp the underlying scene.

## 1) Install dependencies

Use Expo-managed packages:

```sh
npx expo install expo-linear-gradient expo-blur
```

`react-native-reanimated` is already present in this repo and will drive the flicker/noise animation.

## 2) Add assets

Place these in `assets/crt/`:

- `assets/crt/scanlines.png` (a 2–4px tall strip with 1–2px dark lines, transparent background). This will tile vertically.
- `assets/crt/noise.png` (small grayscale noise texture, 64x64 or 128x128).

Notes:
- Keep them small to stay fast.
- PNG with transparency works well for overlay blending.

## 3) Create the overlay component

Create `components/ui/CRTEffect.tsx`:

```tsx
import React from "react";
import { StyleSheet, View, ImageBackground } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const SCANLINES = require("../../assets/crt/scanlines.png");
const NOISE = require("../../assets/crt/noise.png");

export function CRTEffect() {
  const flicker = useSharedValue(0.08);
  const noiseX = useSharedValue(0);
  const noiseY = useSharedValue(0);

  React.useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.04, { duration: 120, easing: Easing.linear }),
        withTiming(0.1, { duration: 160, easing: Easing.linear }),
        withTiming(0.06, { duration: 140, easing: Easing.linear })
      ),
      -1,
      true
    );

    noiseX.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 220, easing: Easing.linear }),
        withTiming(12, { duration: 220, easing: Easing.linear })
      ),
      -1,
      true
    );

    noiseY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 180, easing: Easing.linear }),
        withTiming(10, { duration: 180, easing: Easing.linear })
      ),
      -1,
      true
    );
  }, [flicker, noiseX, noiseY]);

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flicker.value,
  }));

  const noiseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: noiseX.value },
      { translateY: noiseY.value },
      { scale: 1.2 },
    ],
    opacity: 0.08,
  }));

  return (
    <View pointerEvents="none" style={styles.root}>
      {/* Vignette */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.45)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.35)",
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Scanlines */}
      <ImageBackground
        source={SCANLINES}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
        imageStyle={styles.scanlines}
      />

      {/* Noise */}
      <Animated.Image
        source={NOISE}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, styles.noise, noiseStyle]}
      />

      {/* Flicker (subtle brightness pulse) */}
      <Animated.View style={[styles.flicker, flickerStyle]} />

      {/* Optional bloom/bleed */}
      <BlurView intensity={8} tint="dark" style={styles.blur} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  scanlines: {
    opacity: 0.2,
  },
  noise: {
    width: "120%",
    height: "120%",
  },
  flicker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
});
```

What this does:
- `LinearGradient` creates a soft vignette.
- `ImageBackground` with `resizeMode="repeat"` tiles the scanlines.
- `Animated.Image` uses a small noise texture and jitters it.
- `Animated.View` adds a faint flicker overlay.
- `BlurView` adds a small bloom/bleed (optional).

## 4) Mount it above the app UI

In `App.tsx`, render the overlay at the end of `SafeAreaView` so it sits above everything:

```tsx
import { CRTEffect } from "./components/ui/CRTEffect";

// inside <SafeAreaView> ... add at the end
<CRTEffect />
```

Keep `pointerEvents="none"` so the overlay never blocks touches.

## 5) Tuning values

Fast tweaks that matter most:
- Scanlines opacity: `styles.scanlines.opacity` (try 0.12–0.3)
- Noise opacity: `noiseStyle.opacity` (try 0.04–0.12)
- Flicker intensity: `flicker` values (keep small)
- Vignette strength: gradient colors alpha
- Blur intensity/opacity: `BlurView` intensity and `styles.blur.opacity`

## 6) Optional: disable blur for low-end devices

If you see perf issues, remove `BlurView` or gate it behind a flag:

```tsx
const ENABLE_BLOOM = false;
// ...
{ENABLE_BLOOM && <BlurView ... />}
```

## 7) Known limitations

- No barrel distortion or RGB split of the underlying content.
- You can fake subtle chroma offset by duplicating specific UI layers with tiny offsets and a tinted color, but it is manual.

## 8) Visual checks

After adding the overlay:
- Check readability of text at small sizes.
- Verify that scanlines are not too strong on light UI.
- Confirm no input is blocked (touches should pass through).
