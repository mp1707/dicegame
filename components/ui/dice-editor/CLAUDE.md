# Dice Enhancement System

Players can purchase pip upgrades from the shop to add permanent scoring bonuses to specific die faces.

## Data Model

**DieEnhancement interface**: See `utils/gameCore.ts` for the complete type definition

**Shop Integration**: See `DICE_UPGRADE_CONFIG` in `utils/gameCore.ts` for spawn rates and costs

---

## Dice Editor Flow

The dice editor is a two-phase flow integrated into PhaseDeck, allowing players to select which die and which face to enhance.

### Phase 1: DICE_EDITOR_DIE (`DieEditorContent.tsx`)

**Purpose**: Select which of the 5 dice to enhance

**UI Layout**:
- Single row of 5 TileButtons for die selection
- Icons: `die.png`
- Labels: "Würfel 1" through "Würfel 5"
- CTAs: ZURÜCK (back to shop) + WEITER (advance to face selection)

**TileButton Enhancement Pills**:
Each die tile shows enhancement summary pills in bottom corners:
- **Bottom-left (blue)**: Sum of points enhancements on all faces
  - Example: "+30" = 3 pips enhanced (3 × +10 points)
- **Bottom-right (red)**: Sum of mult enhancements on all faces
  - Example: "+3" = 3 pips enhanced (3 × +1 mult)

**3D Die Preview**:
- PlayConsole tray shows selected die with continuous multi-axis rotation (Y + X axes)
- Provides full face inspection without user interaction
- Auto-rotation allows player to see all enhancements at a glance

**Manual Rotation**:
- User can drag to rotate the die
- Auto-rotation pauses during drag
- Resumes from current position on release (no flicker/snap)

---

### Phase 2: DICE_EDITOR_FACE (`FaceEditorContent.tsx`)

**Purpose**: Select which face of the chosen die to enhance

**UI Layout**:
- 2×3 grid of TileButtons for face selection
- Icons: `1die.png` through `6die.png`
- Labels: "Seite 1" through "Seite 6"
- CTAs: ZURÜCK (back to die selection) + VERBESSERN (apply upgrade)

**TileButton Enhancement Pills**:
Each face tile shows the enhancement count for that specific face:
- Blue pill: Number of +10 points enhancements
- Red pill: Number of +1 mult enhancements

**3D Die in Tray**:
- Same rotatable 3D preview as Phase 1
- **Face snapping enabled** (only in this phase)
- Uses World Axis quaternion rotation for consistent "follow-finger" dragging

**Face Sync**:
- **Button → Die**: Tapping a face button rotates the 3D die to show that face
- **Die → Button**: Manually rotating the die updates the selected face button
- Bidirectional sync keeps UI and 3D view in perfect alignment

**Snap Behavior**:
- Snaps to nearest face on release with haptic feedback
- Only active in this phase (not in DICE_EDITOR_DIE)
- Provides tactile confirmation of face selection

---

## Colored Pip Rendering (`Die.tsx`)

Enhanced pips are visually distinct from standard white pips:

**Colors**:
- **Points enhancements**: Blue (`COLORS.upgradePoints` - `#0062FF`)
- **Mult enhancements**: Red (`COLORS.upgradeMult` - `#E02E4C`)

**Material**:
- Emissive material with 0.5 intensity for glow effect
- High contrast against white die body
- Visible during all game phases (rolling, locked, scoring)

---

## Scoring Formula with Enhancements

When a hand is scored, enhancement bonuses are calculated from **contributing dice only**:

```
finalScore = (basePoints + pips + bonusPoints) × (mult + bonusMult)
```

**Bonus Calculation**:
- `bonusPoints` = count of "points" pips across all contributing dice × 10
- `bonusMult` = count of "mult" pips across all contributing dice × 1

**Example**:
- Hand: Three of a Kind (3× threes)
- Die 1 face 3: Has 1 point enhancement
- Die 2 face 3: Has 2 mult enhancements
- Die 3 face 3: No enhancements
- Result: +10 bonusPoints, +2 bonusMult

---

## Scoring Helpers (`utils/gameCore.ts`)

```typescript
bonusPointsForDieFace(dieIndex, faceValue, enhancements); // Returns count × 10
bonusMultForDieFace(dieIndex, faceValue, enhancements); // Returns count × 1
getScoringBreakdown(handId, level, dice, enhancements); // Includes bonusPoints, bonusMult
```

Use these helpers to calculate enhancement bonuses instead of manual counting.

---

## ScoreLip Display (`components/ui/ScoreLip.tsx`)

During scoring reveal, the ScoreLip displays enhancement indicators:

**Visual Feedback**:
- Blue `(+10)` indicator for points bonuses
- Red `(+1)` indicator for mult bonuses
- Mult number turns red when enhanced (uses `COLORS.upgradeMult`)
- Mult bonus triggers pulse animation before showing final score

**Timing**:
- Indicators appear during the counting animation phase
- Synchronized with die highlighting (see `components/scoring/CLAUDE.md`)

---

## Key Files

| File | Purpose |
|------|---------|
| `components/ui/DieEditorContent.tsx` | Phase 1: Die selection |
| `components/ui/FaceEditorContent.tsx` | Phase 2: Face selection |
| `components/ui/DiePreview3D.tsx` | 3D die viewer with rotation |
| `components/Die.tsx` | Colored pip rendering |
| `components/ui/ScoreLip.tsx` | Enhancement indicators during scoring |
| `utils/gameCore.ts` | DieEnhancement interface, scoring helpers, config |

---

## Related Documentation

- **Theme colors**: See `constants/theme.ts` for `COLORS.upgradePoints` and `COLORS.upgradeMult`
- **Animation timing**: See `ANIMATION.diceEditor.*` in `constants/theme.ts`
- **PhaseDeck integration**: See `components/ui-kit/flow/CLAUDE.md` for phase transitions
