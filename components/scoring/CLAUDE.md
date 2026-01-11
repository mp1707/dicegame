# Scoring Reveal Animation

When a player accepts a hand, a coordinated reveal animation plays across multiple components: DiceTray, Die, and ScoreLip. This choreography creates a satisfying visual sequence that shows which dice contributed to the score.

---

## Animation Flow (5 Steps)

### Step 1: Trigger (`acceptHand()` in gameStore)

**Actions**:
- Sets `revealState.active = true` with scoring breakdown
- Unlocks all dice (locks no longer needed during scoring)
- Computes contributing dice indices

**State Changes**:
```typescript
{
  revealState: {
    active: true,
    contributingIndices: [0, 2, 4], // Example: dice 1, 3, 5
    arrangedPositions: [...],
    // ... other reveal state
  }
}
```

---

### Step 2: DiceTray Orchestration

**CameraController**:
- Zooms camera to 60% of default height (40% closer to dice)
- Creates dramatic focus on the scoring moment

**Slot Assignment**:
- Sorts dice by X position (left-to-right)
- Assigns each die to an arranged slot position
- Creates orderly line-up for reveal

**Die Props Updated**:
Each Die component receives:
- `isRevealActive` - Triggers reveal animation
- `arrangedPosition` - Target position in lineup
- `isHighlighted` - Whether this die is currently being counted
- `isContributing` - Whether this die contributes to the hand score

---

### Step 3: Die Animation (in useFrame)

**First Reveal Frame** (initialization):
1. Switches die to dynamic type (in case it was kinematic from locking)
2. Captures current physics position/rotation
3. Computes target quaternion to show top face
4. Applies captured position immediately (no lerp) and returns early
5. Calls `invalidate()` to ensure next frame renders

**Subsequent Frames** (animation loop):
1. Caps `delta` to max 33ms to prevent instant jumps after long pauses (`frameloop="demand"`)
2. Lerps position toward arranged slot
3. Slerps rotation toward flat orientation (top face visible)
4. Physics disabled by zeroing velocities while animation runs

**Why the two-frame pattern?**
- Frame 1 prevents physics from interfering with animation start
- Subsequent frames smoothly animate to target without physics drift

---

### Step 4: ScoreLip Counting Animation (3 Phases)

**Phase 1: Counting Phase**

Iterates through `contributingIndices` one by one:
- Updates `currentDieIndex` to highlight each die in turn
- Accumulates pips and animates score display
- Per-die delay: **560ms** (was 700ms, optimized 20% faster)

**Phase 2: Hand Score Display (1s)**

- Shows hand score in white (e.g., "120")
- Brief pause to let player see the hand total
- No animations during this phase (visual rest)

**Phase 3: Total Score Display (1.6s)**

- Shows new total score, starting gold with glow
- Fades from gold to white over 1s
- Ensures total is always visible before phase transitions (e.g., LEVEL_RESULT)
- After total phase completes, calls `finalizeHand()`

**Timing Reference**:
```typescript
// constants/theme.ts
ANIMATION.counting = {
  initialDelay: 640,
  perDieDelay: 560,
  handScoreDisplay: 1000,
  totalScoreDisplay: 1600,
  colorFadeDelay: 200,
  colorFadeDuration: 800,
}
```

---

### Step 5: Die Visual States During Reveal

**Highlighted State** (current die being counted):
- Gold color (`COLORS.gold`)
- Pulse scale animation (1.0 → 1.12 → 1.0)
- Draws attention to the active die

**Contributing State** (awaiting highlight):
- Normal opacity (100%)
- Standard white material
- Ready to be highlighted when its turn comes

**Non-contributing State** (doesn't match hand):
- Dimmed to **30% opacity**
- Clearly distinguished from scoring dice
- Remains visible but de-emphasized

---

## Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **DiceTray** | `components/DiceTray.tsx` | Camera zoom, slot assignment |
| **Die** | `components/Die.tsx` | Position lerp, rotation slerp, visual states |
| **ScoreLip** | `components/ui/ScoreLip.tsx` | Counting animation, score display phases |
| **GameStore** | `store/gameStore.ts` | `acceptHand()` trigger, reveal state management |

---

## Performance Considerations

**Frame-demand rendering**:
- Canvas uses `frameloop="demand"`
- Animation calls `invalidate()` only when needed
- Stops rendering when animation completes

**Delta capping**:
- Max delta of 33ms prevents instant jumps
- Handles long pauses between frames (e.g., device sleep)
- Ensures smooth animation even with variable frame timing

**Physics pause**:
- Physics velocities zeroed during reveal
- Prevents physics from interfering with animation
- Re-enabled after reveal completes

For more performance patterns, see `docs/PERFORMANCE.md`.

---

## Timing Constants Reference

All timing values are centralized in `constants/theme.ts` under `ANIMATION.counting.*`:

| Constant | Value (ms) | Purpose |
|----------|------------|---------|
| `initialDelay` | 640 | Delay before counting starts |
| `perDieDelay` | 560 | Time per die highlight |
| `handScoreDisplay` | 1000 | Hand score pause duration |
| `totalScoreDisplay` | 1600 | Total score fade duration |
| `colorFadeDelay` | 200 | Delay before color fade |
| `colorFadeDuration` | 800 | Gold→white fade duration |

**Highlight animation**:
```typescript
ANIMATION.highlight = {
  pulseDuration: 200,   // Full pulse cycle
  peakScale: 1.12,      // Max scale at peak
  attackRatio: 0.35,    // Ratio of time spent scaling up
}
```

---

## Related Documentation

- **Die enhancements**: See `components/ui/dice-editor/CLAUDE.md` for enhancement indicators during reveal
- **Performance**: See `docs/PERFORMANCE.md` for useFrame optimization patterns
- **Theme timing**: See `constants/theme.ts` for all animation constants
