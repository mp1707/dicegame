# Performance Optimization Patterns

This app runs 3D physics simulation, complex animations, and reactive state. **Thermal management is critical** - the device should stay cool during normal gameplay. Follow these patterns to prevent performance regressions.

---

## Critical Rule: Idle State = Near-Zero Work

When the player is "thinking" (dice settled, no animations running), the app should do **almost nothing**:

✅ **Idle State Requirements**:
- No render loop invalidations (use `frameloop="demand"`)
- No JS intervals/timeouts ticking
- Animations cancelled or complete
- CPU/GPU usage near baseline

❌ **Common Mistakes**:
- Unconditional `invalidate()` calls in useFrame
- Infinite animations without phase-awareness
- Background timers that never stop

> **Note**: Physics is NOT paused when idle. Pausing/unpausing Rapier causes WASM collision detection JIT on first roll, creating lag. With only 5 dice, idle physics is negligible.

---

## Physics Considerations (`DiceTray.tsx`)

### Why Physics is NOT Paused

Pausing Rapier physics and resuming causes WASM collision detection code to JIT-compile on the first floor impact, creating **noticeable lag** on the first roll after app load.

**Solution**: Keep physics running but minimize frame updates using `frameloop="demand"`.

### Pattern: Frame Guard for Settle Detection

Prevents race conditions where dice report "settled" before physics has time to apply impulses.

```typescript
// Die.tsx - Skip settle detection for first N frames after roll
const framesSinceRollRef = useRef(100); // Start high so existing dice don't trigger

// In roll trigger effect:
framesSinceRollRef.current = 0; // Reset on new roll

// In useFrame:
framesSinceRollRef.current += 1;
if (framesSinceRollRef.current > 10) {
  // Now safe to check settle conditions
  if (velocityMagnitude < SETTLE_THRESHOLD) {
    reportSettle();
  }
}
```

**Why 10 frames?** Gives physics engine time to apply impulses before checking for settle.

---

## 3D Render Loop (`frameloop="demand"`)

The Canvas uses `frameloop="demand"` which only renders when `invalidate()` is called. This saves **massive GPU cycles**.

### Pattern: Only Invalidate During Active Animations

```typescript
// DieOutline.tsx - Only invalidate during active pulse phases
useFrame((state) => {
  // ✅ Only invalidate when actually animating
  if (pulsePhaseRef.current === "up" || pulsePhaseRef.current === "down") {
    state.invalidate();
  }
  // ❌ DON'T invalidate during "idle" or "wait" phases
});
```

**Result**: GPU idle when pulse isn't animating (most of the time).

### Pattern: Gate Position Updates on Settle State

```typescript
// Die.tsx - Stop updating after dice settle
if (
  !isRevealActive &&
  rigidBody.current &&
  isVisible &&
  !settleReportedRef.current
) {
  onPositionUpdate(index, rigidBody.current.translation().x);
}
// After settle is reported, this callback stops firing
```

**Result**: No work done after dice have settled.

### Pattern: Early Exit When At Target

```typescript
// DiePreview3D.tsx - Skip lerping when camera settled
const posDist = camera.position.distanceTo(CAMERA_TARGET_POS);
if (posDist < 0.01) return; // Already at target, skip work
```

**Result**: Camera lerp stops as soon as target is reached.

### Anti-Patterns

❌ **Calling `invalidate()` unconditionally in useFrame**
```typescript
// BAD - Renders every frame even when nothing changes
useFrame((state) => {
  state.invalidate();  // Always re-render
  // ... other logic
});
```

❌ **Lerping values that are already at target**
```typescript
// BAD - Continues lerping even when camera hasn't moved
useFrame(() => {
  camera.position.lerp(targetPos, 0.1);  // No early exit
});
```

❌ **Running useFrame logic when component is offscreen**
```typescript
// BAD - Animates dice outline even during shop phase
useFrame(() => {
  updatePulse();  // Should check if in LEVEL_PLAY phase
});
```

---

## Object Pooling in useFrame

Creating objects inside `useFrame` causes GC pressure (stutters every few seconds).

### Pattern: Pre-Allocate Reusable Objects

```typescript
// Die.tsx - Pooled objects outside useFrame
const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
const tempVector = useMemo(() => new THREE.Vector3(), []);
const tempUpVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);

useFrame(() => {
  // ✅ Reuse pooled objects
  tempQuaternion.copy(someQuat);
  tempVector.set(x, y, z);

  // ❌ DON'T allocate inside useFrame
  // const newQuat = new THREE.Quaternion(); // BAD - 60 allocations/sec
});
```

**Why this matters**: At 60 FPS, `new THREE.Quaternion()` creates 60 objects/second = 3,600/minute. This triggers frequent garbage collection, causing frame drops.

### Anti-Patterns

❌ `new THREE.Vector3()` inside useFrame (creates 60 objects/sec)
❌ `.clone()` inside useFrame (allocates new object)
❌ Array spreads `[...arr]` inside useFrame (allocates new array)

---

## Animation Lifecycle Management

Animations must stop when not visible or relevant.

### Pattern: Cancel Animations When Leaving Phase

```typescript
// ShopItemCard.tsx - Stop shimmer when leaving shop
const phase = useGameStore((s) => s.phase);
const isInShop = phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE";

useEffect(() => {
  if (state === "soon" && isInShop) {
    shimmerPosition.value = withRepeat(...);
  } else {
    cancelAnimation(shimmerPosition);  // ← CRITICAL
    shimmerPosition.value = -1;
  }
  return () => cancelAnimation(shimmerPosition);
}, [state, isInShop]);
```

**Why**: Without cancellation, shimmer continues animating in background even when shop is closed.

### Pattern: Use Reanimated Callbacks Instead of setTimeout

```typescript
// UpgradeContent.tsx - Sync with animation completion
selectionProgress.value = withTiming(
  1,
  { duration: ANIMATION.tile.select.shineDuration },
  (finished) => {
    if (finished) {
      runOnJS(pickUpgradeHand)(handId); // ← Called at exact animation end
    }
  }
);

// ❌ DON'T use setTimeout with hardcoded delays
// setTimeout(() => pickUpgradeHand(handId), 400); // Timing drift risk
```

**Benefits**:
- Guaranteed sync with animation completion
- No timing drift
- Animation can be interrupted without leaving orphaned timeout

### Anti-Patterns

❌ **`withRepeat(..., -1)` without phase-awareness** (infinite loop)
```typescript
// BAD - Shimmer never stops
shimmerPosition.value = withRepeat(
  withTiming(1, { duration: 800 }),
  -1  // Infinite, no cleanup
);
```

❌ **`setInterval` on JS thread for animations** (use Reanimated)
```typescript
// BAD - JS thread animations cause jank
setInterval(() => {
  setRotation(r => r + 1);
}, 16);
```

❌ **Hardcoded `setTimeout` delays that don't match animation durations**
```typescript
// BAD - Duration drift if animation changes
withTiming(1, { duration: 420 });
setTimeout(callback, 400);  // Off by 20ms
```

❌ **Not cleaning up animations in useEffect return**
```typescript
// BAD - Animation continues after unmount
useEffect(() => {
  shimmerPosition.value = withRepeat(...);
  // Missing: return () => cancelAnimation(shimmerPosition);
}, []);
```

---

## Zustand State Management

Improper subscriptions cause cascade re-renders across many components.

### Pattern: Batch Selectors with useShallow

```typescript
// PlayConsole.tsx - Single batched subscription
import { useShallow } from "zustand/react/shallow";

const {
  money,
  levelGoal,
  levelScore,
  phase,
  // ... other fields
} = useGameStore(
  useShallow((s) => ({
    money: s.money,
    levelGoal: s.levelGoal,
    levelScore: s.levelScore,
    phase: s.phase,
  }))
);

// ❌ DON'T use separate subscriptions for each field
// const money = useGameStore((s) => s.money);      // Re-render on money change
// const levelGoal = useGameStore((s) => s.levelGoal); // Re-render on goal change
// This causes N re-renders instead of 1
```

**Why**: Without `useShallow`, Zustand compares object references. New object on every state change = unnecessary re-renders.

### Pattern: Stable Action References

```typescript
// Actions don't need useShallow - they're stable references
const rollDice = useGameStore((s) => s.rollDice);
const selectHand = useGameStore((s) => s.selectHand);
```

---

## React.memo for Repeated Components

Components rendered in lists (13 HandSlots, 5 dice, shop cards) must be memoized.

### Pattern: Wrap with React.memo

```typescript
// ScoringGrid.tsx - Memoize to prevent 13× re-renders
const HandSlot = React.memo(({ handId, labelLine1 }: Props) => {
  // Batch internal selectors too
  const { handLevel, isUsed, isSelected } = useGameStore(
    useShallow((s) => ({
      handLevel: s.handLevels[handId],
      isUsed: s.usedHandsThisLevel.includes(handId),
      isSelected: s.selectedHandId === handId,
    }))
  );
  // ...
});
```

**Without memo**: Every state change re-renders all 13 HandSlots, even if only 1 changed.
**With memo**: Only the affected HandSlot re-renders.

### Memoized Components in This Codebase

- **HandSlot** (13 instances in ScoringGrid)
- **TileButton**, **Surface**, **InsetSlot**, **Chip** (UI-kit)
- **Layout context value** (`useLayoutUnits.ts`)

---

## Context Memoization

Context values must be memoized to prevent provider re-renders cascading to all consumers.

### Pattern: Memoize Context Value

```typescript
// useLayoutUnits.ts
return useMemo(
  () => ({
    headerHeight,
    diceTrayHeight,
    scoreRowHeight,
    // ... all properties
  }),
  [headerHeight, diceTrayHeight, scoreRowHeight /* ... all dependencies */]
);
```

**Without memo**: New object on every parent re-render → all context consumers re-render.
**With memo**: Object only changes when dependencies change.

---

## Performance Checklist for New Features

Before adding new features, verify:

- [ ] **useFrame**: Am I allocating objects? Use pooled/memoized objects.
- [ ] **useFrame**: Am I always invalidating? Add early-exit conditions.
- [ ] **Animations**: Do they stop when offscreen/phase changes? Add cleanup.
- [ ] **Zustand**: Am I using `useShallow` for multi-field selectors?
- [ ] **Lists**: Are repeated components wrapped in `React.memo`?
- [ ] **Timers**: Am I using `setTimeout`? Consider Reanimated callbacks instead.
- [ ] **Idle State**: Does the feature stop working when player isn't interacting?

---

## Key Files with Performance-Critical Code

| File | Critical Patterns |
|------|-------------------|
| **DiceTray.tsx** | Settle detection, shader warmup |
| **Die.tsx** | Object pooling, frame guard for settle, reveal animation |
| **DieOutline.tsx** | Conditional invalidate, material caching |
| **DiePreview3D.tsx** | Camera early exit, pre-allocated vectors |
| **PlayConsole.tsx** | Batched Zustand selectors |
| **ScoringGrid.tsx** | Memoized HandSlot components |
| **ShopItemCard.tsx** | Phase-aware shimmer cancellation |
| **UpgradeContent.tsx** | Reanimated callbacks |
| **BottomPanel.tsx** | Memoized animation configs |
| **useLayoutUnits.ts** | Memoized context value |

---

## Performance Debugging Tips

### Identifying Performance Issues

1. **Check frame rate**: Look for consistent 60 FPS during idle state
2. **Monitor heat**: Device should stay cool during normal gameplay
3. **Profile with React DevTools**: Find components re-rendering unnecessarily
4. **Check memory**: GC spikes indicate allocation issues

### Common Culprits

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Frame drops during idle | Unconditional `invalidate()` | Add early-exit conditions |
| Stutters every few seconds | Object allocation in useFrame | Pre-allocate objects outside loop |
| Battery drain | Infinite animations | Cancel when offscreen/phase changes |
| Lag after shop | Animations not cleaned up | Add cleanup in useEffect return |
| Slow list scrolling | Missing React.memo | Wrap list items |
| Cascade re-renders | Separate Zustand subscriptions | Use useShallow for batch |

---

## Related Documentation

- **3D render optimization**: See `components/Die.tsx` for useFrame patterns
- **Animation timing**: See `constants/theme.ts` for all ANIMATION.* constants
- **State management**: See `store/gameStore.ts` for Zustand setup
- **Scoring animation**: See `components/scoring/CLAUDE.md` for reveal choreography
