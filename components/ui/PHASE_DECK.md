# PhaseDeck Layout System

PhaseDeck is the main game layout orchestrator that manages phase-based transitions. **TopMenuStrip is always visible** - only the bottom panel content switches based on the current game phase.

---

## Architecture

PhaseDeck consists of three main layers:

1. **TopMenuStrip** - Always visible (Level, Money, Goal, Selected Hand)
2. **BottomPanel** - Switches content based on phase
3. **Footer** - Phase-aware CTA buttons

---

## Layout Structure

```
PhaseDeck
├── TopMenuStrip (ALWAYS VISIBLE)
│   ├── Stats (Level, Money)
│   ├── Hand/Rolls info
│   └── Goal/Score info
├── BottomPanel (CONTENT SWITCHES)
│   ├── LEVEL_PLAY → TrayWindow + ScoringGrid
│   ├── LEVEL_RESULT → CashoutRewardsPanel
│   ├── SHOP_MAIN → ShopContent
│   ├── SHOP_PICK_UPGRADE → UpgradeContent
│   ├── DICE_EDITOR_DIE → DieEditorContent
│   ├── DICE_EDITOR_FACE → FaceEditorContent
│   └── WIN/LOSE_SCREEN → EndContent
└── Footer (FooterControls)
```

**Important**: During `DICE_EDITOR_DIE` and `DICE_EDITOR_FACE` phases, the TrayWindow shows a single large rotatable die (`SingleDiePreview`) instead of the normal `DiceTray` with 5 dice.

---

## Phase-Aware Header

The goal header in TopMenuStrip changes based on the current phase:

| Phase                  | Header Display             | Progress Bar         |
| ---------------------- | -------------------------- | -------------------- |
| **LEVEL_PLAY**         | "ZIEL" + Amount            | Visible (score/goal) |
| **SHOP phases**        | "SHOP" (large text)        | Hidden               |
| **DICE_EDITOR phases** | "WÜRFEL VERBESSERN" + pill | Hidden               |

**DICE_EDITOR pill examples**:

- "+10 Punkte" (blue) - Points enhancement
- "+1 Mult" (red) - Mult enhancement

---

## TrayOverlay Titles

Tray overlays use `TrayOverlayTitle` component with fade-in + move-up animation:

| Phase                 | Title                  | Subtitle                   |
| --------------------- | ---------------------- | -------------------------- |
| **SHOP_MAIN**         | "Wähle ein Upgrade"    | (none - SHOP is in header) |
| **SHOP_PICK_UPGRADE** | "Verbessere eine Hand" | "+5 Punkte"                |
| **DICE_EDITOR_DIE**   | "Würfel wählen"        | "Schritt 1/2"              |
| **DICE_EDITOR_FACE**  | "Seite wählen"         | "Schritt 2/2"              |

---

## Phase → BottomPanel Content Mapping

| Phase                 | Content Component   | Footer CTA          | Description                      |
| --------------------- | ------------------- | ------------------- | -------------------------------- |
| **LEVEL_PLAY**        | ScoringGrid         | Roll/Accept         | Main gameplay with hand slots    |
| **LEVEL_RESULT**      | CashoutRewardsPanel | SHOP                | Reward breakdown after level win |
| **SHOP_MAIN**         | ShopContent         | NEXT LEVEL          | Shop grid (upgrades + items)     |
| **SHOP_PICK_UPGRADE** | UpgradeContent      | ZURÜCK              | Choose 1 of 3 hands to upgrade   |
| **DICE_EDITOR_DIE**   | DieEditorContent    | ZURÜCK + WEITER     | Select which die to enhance      |
| **DICE_EDITOR_FACE**  | FaceEditorContent   | ZURÜCK + VERBESSERN | Select which face to enhance     |
| **WIN_SCREEN**        | EndContent          | NEUER RUN           | Victory screen                   |
| **LOSE_SCREEN**       | EndContent          | NEUER RUN           | Game over screen                 |

---

## Content Components (`components/ui/`)

### Panel Switcher

- **BottomPanel.tsx** - Phase-based content switcher with easing-based slide transitions

### Gameplay Phase

- **ScoringGrid.tsx** (in `components/scoring/`) - 13 hand slots (6 upper, 7 lower)

### Result Phase

- **CashoutRewardsPanel.tsx** - Celebratory reward breakdown with hero payout, staggered rows, sparkles
- **CashoutTrayOverlay.tsx** - Tray overlay for cashout phase

### Shop Phases

- **ShopContent.tsx** - Shop grid with header, money capsule, 2×2 ShopItemCard grid
- **ShopItemCard.tsx** - Individual shop item card with affordable/unaffordable/soon states, shimmer animation
- **ShopHeader.tsx** - Money display in shop
- **ShopTrayOverlay.tsx** - Tray overlay for shop
- **UpgradeContent.tsx** - Cascade-animated upgrade cards with selection feedback
- **UpgradeTrayOverlay.tsx** - Tray overlay for upgrade selection

### Dice Editor Phases

- **DieEditorContent.tsx** - Die selection row with 5 TileButtons (DICE_EDITOR_DIE phase)
- **FaceEditorContent.tsx** - Face selection 2×3 grid with TileButtons (DICE_EDITOR_FACE phase)
- **DiceEditorTrayOverlay.tsx** - Tray overlay for dice editor (both phases)

### End Screens

- **EndContent.tsx** - Compact win/lose display with stats
- **LoseTrayOverlay.tsx** - Tray overlay for lose screen

### Shared Components

- **SparkleEffect.tsx** - Particle micro-animation for celebratory effects
- **TrayOverlayTitle.tsx** - Animated title component for tray overlays

---

## Special Components

### SingleDiePreview (`components/SingleDiePreview.tsx`)

Wrapper for `DiePreview3D` that connects to store. Used during DICE_EDITOR_DIE and DICE_EDITOR_FACE phases to show a single rotatable die in the PlayConsole tray (replaces the normal 5-dice DiceTray).

**Features**:

- Multi-axis auto-rotation (Y + X axes)
- Manual rotation with drag
- Face snapping (DICE_EDITOR_FACE only)
- Face sync with TileButton selection

---

## Phase Transitions

### Slide Animation

Phase transitions use easing-based slide animations configured in `ANIMATION.phase.*`.

**Parallax effect**: Different layers move at different speeds, creating depth during transitions.

### Transition Timing

See `ANIMATION.transition` keys in `constants/theme.ts`.

---

## Integration in App.tsx

```typescript
import { PhaseDeck } from "./components/ui/PhaseDeck";
import { DiceTray } from "./components/DiceTray";

<PhaseDeck
  diceTray={
    <DiceTray containerHeight={diceTrayHeight} containerWidth={screenWidth} />
  }
/>;
```

**Props**:

- `diceTray`: The 3D dice tray component (or SingleDiePreview during dice editor)

---

## Phase Flow Diagram

```
START
  │
  ├─► LEVEL_PLAY ──► (win) ──► LEVEL_RESULT ──► SHOP_MAIN
  │                                                  │
  │                                                  ├─► NEXT LEVEL ──► LEVEL_PLAY
  │                                                  ├─► SHOP_PICK_UPGRADE ──► SHOP_MAIN
  │                                                  └─► DICE_EDITOR_DIE ──► DICE_EDITOR_FACE ──► SHOP_MAIN
  │
  └─► (lose) ──► LOSE_SCREEN ──► NEW RUN ──► LEVEL_PLAY

  (all 8 levels won) ──► WIN_SCREEN ──► NEW RUN ──► LEVEL_PLAY
```

---

## Adding a New Phase

1. **Define phase** in `store/gameStore.ts`:

   ```typescript
   type GamePhase =
     | "LEVEL_PLAY"
     | "NEW_PHASE"  // Add here
     | ...
   ```

2. **Add content component** in `components/ui/`:

   ```typescript
   // NewPhaseContent.tsx
   export const NewPhaseContent = () => {
     return <View>{/* Phase UI */}</View>;
   };
   ```

3. **Map phase to content** in `BottomPanel.tsx`:

   ```typescript
   const content = {
     LEVEL_PLAY: <ScoringGrid />,
     NEW_PHASE: <NewPhaseContent />,  // Add here
     ...
   }[phase];
   ```

4. **Add footer CTA** in `FooterControls.tsx`:

   ```typescript
   if (phase === "NEW_PHASE") {
     return <Button label="ACTION" onPress={handleAction} />;
   }
   ```
