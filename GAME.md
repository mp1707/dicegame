# Roguelike Yahtzee - Game Design Document

## Game Concept

A roguelike dice game combining classic Yahtzee mechanics with progression systems inspired by games like Balatro. Players roll dice to create scoring combinations, earn money, and progressively increase difficulty through multiple runs.

---

## Core Gameplay Loop

### Single Round Flow

1. **Roll Phase** (up to 3 rolls per round)

   - Player rolls 5 dice
   - After each roll, player can tap dice to "lock" them (they turn grey)
   - Locked dice stay in place for next roll
   - Player has 3 total rolls to create their best combination

2. **Scoring Phase**

   - After rolling, valid category slots glow with cyan border
   - Player taps a glowing slot to submit their score
   - Alternatively, if no valid categories exist, player must "scratch" (enter 0 in a category)

3. **Next Round**
   - Dice reset (all unlocked)
   - Repeat for 13 total rounds (matching 13 Yahtzee categories)

### Run Completion

After 13 rounds:

- **Win Condition**: Total score ≥ Target Score
- **Lose Condition**: Total score < Target Score
- **Bonus Money**: Leftover rolls are converted to cash (3 money per unused roll)

### Meta Progression

- **Win**: Enter shop → Purchase upgrades → Start new run with increased target (1.5x multiplier)
- **Lose**: Retry from beginning with fresh target (200 points)

---

## UI Structure

### Layout Overview

```
┌─────────────────────────────────────┐
│  GLASS HEADER HUD                   │  ← Dark semi-transparent panel
│  [Round X/13]      Progress    [$X] │
├─────────────────────────────────────┤
│                                     │
│         3D DICE ROLLING AREA        │  ← 38% of screen height
│                                     │
├─────────────────────────────────────┤
│  SCORING DASHBOARD                  │
│  ┌─┬─┬─┬─┬─┬─┐                     │  ← Upper section (6 slots)
│  │●│●│●│●│●│●│                     │
│  └─┴─┴─┴─┴─┴─┘                     │
│  ┌───────────────────────────────┐ │
│  │ Three of a kind         +15 ✓ │ │  ← Lower section (7 slots)
│  │ Four of a kind              - │ │
│  │ Full house                  - │ │
│  │ ...                           │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  ●●○   WURF                   │ │  ← Footer button
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Glass Header HUD

**Purpose**: Display round info and progress at a glance

### Components

1. **Top Row** (floating in safe area corners)

   - Left: `Round X/13` (small, light grey text)
   - Right: `$X` (money, small text)

2. **Progress Bar** (horizontal, full-width)

   - **Background**: Dark grey (`#1A1A1F`)
   - **Fill**: Gold (`#FFD700`), width = `(currentScore / targetScore) * 100%`
   - **Height**: 24px

3. **Score Labels** (overlaid on progress bar)
   - **Left side**:
     - Label: "STAND" (tiny, dark text)
     - Value: Current score (large, bold, black text on gold fill)
   - **Right side**:
     - Label: "ZIEL" (tiny, light grey text)
     - Value: Target score (medium, light grey text)

### Visual Style

- Dark semi-transparent background `rgba(20, 20, 25, 0.95)`
- No borders
- Feels "embedded" or "recessed" into background
- Progress bar has subtle rounded corners (4px)

---

## 3D Dice Rolling Area

**Purpose**: Visual feedback for dice rolls with physics simulation

### Layout

- Takes up 38% of screen height
- Positioned between header and scoring dashboard
- Background: Transparent (shows main game background image)

### Dice Interaction

1. **Initial State**: 5 white dice sitting in arena
2. **Tap to Lock**:
   - User taps a die
   - Die changes color to grey/silver
   - Shows it's "selected" (locked for next roll)
3. **Rolling Animation**:
   - Dice tumble with physics
   - Locked dice stay in place
   - Animation includes haptic feedback

### Game End Overlay

When round 13 completes:

- Dark overlay (`rgba(0, 0, 0, 0.7)`) dims the dice area
- Large text appears:
  - **Win**: "GEWONNEN!" (green glow)
  - **Lose**: "VERLOREN" (red glow)

---

## Scoring Dashboard

### Overview

Two distinct sections for the 13 Yahtzee categories:

1. **Upper Section**: 6 square slots (Ones through Sixes)
2. **Lower Section**: 7 wide slots (Poker hand combinations)

---

### Upper Section (Dice 1-6)

**Layout**: Horizontal row of 6 equal-width squares

#### Visual Design

Each slot is a square container showing:

- **Dice Icon**: Dot pattern (⚀ ⚁ ⚂ ⚃ ⚄ ⚅) instead of text labels
- **Score Value**: Centered below icon
- **Checkmark**: `✓` appears when slot is active (valid)

#### Dimensions

- Aspect ratio: 1:1 (square)
- Gap between slots: 6px
- Rounded corners: 6px

---

### Lower Section (Poker Hands)

**Layout**: Vertical scrollable list of 7 wide buttons

#### Categories (in order)

1. Three of a kind
2. Four of a kind
3. Full house
4. Sm Straight (Small Straight)
5. Lg Straight (Large Straight)
6. Yahtzee
7. Chance

#### Visual Design

Each slot is a wide rectangular button showing:

- **Left**: Category name (e.g., "Full house")
- **Right**: Score value or "-" if not filled
- **Checkmark**: `✓` appears on right when active

#### Dimensions

- Height: ~44px per slot
- Gap between slots: 4px
- Rounded corners: 6px

---

## Visual State System

**Critical**: Every scoring slot has exactly ONE of three states

### State A: Active (Scorable)

**Condition**: Category is unfilled AND current dice create valid combination

**Visual**:

- Border: 2px cyan glow `rgba(0, 255, 255, 0.6)`
- Background: Cyan tint `rgba(0, 255, 255, 0.3)`
- Drop shadow: Cyan glow (8px blur)
- Score text: Cyan color, shows `+30` (with plus sign)
- Checkmark: Visible `✓` in cyan

**Interaction**: Tappable → Submits score immediately

---

### State B: Filled (Completed)

**Condition**: Category already has a score (player used this slot in previous round)

**Visual**:

- Border: 1px dark `#2A2A2F`
- Background: Very dark `rgba(15, 15, 18, 0.95)`
- Score text: Muted gold `#A08000`
- No checkmark
- No glow

**Interaction**: Not tappable

---

### State C: Empty (Unfilled/Invalid)

**Condition**: Category is unfilled AND current dice don't create valid combination (or no dice rolled yet)

**Visual**:

- Border: 1px grey `#3D3D3D`
- Background: Dark metal `rgba(30, 30, 35, 0.9)`
- Score text: Low opacity white `rgba(255, 255, 255, 0.3)`, shows `-`
- No checkmark
- No glow

**Interaction**: Not tappable

---

## Footer Controls

### Roll Button (Primary Action)

**Full-width amber/gold button** at bottom of dashboard

#### Visual Design

- Background: Gold `#FFD700`
- Border: 3px dark gold `#B8860B`
- Border-bottom: 5px (3D effect)
- Height: ~48px
- Border radius: 6px

#### Content Layout (horizontal flex)

- **Left**: 3 pips showing remaining rolls
  - Active pips: Black circles `●`
  - Used pips: Semi-transparent grey `○`
  - Example: `●●○` means 1 roll used, 2 remaining
- **Center**: Text "WURF" (large pixel font, black text)

#### States

- **Active**: Full opacity, tappable
- **Disabled** (after 3 rolls): 50% opacity, not tappable
- **Pressed**: Button shifts 2px down, bottom border reduces to 3px

---

### Scratch Button (Conditional)

**Appears only when**: Player has rolled at least once AND no valid categories exist

**Visual Design**

- Background: Red `#FF4444`
- Border: 3px dark red `#991B1B`
- Text: "STREICHEN" (white, pixel font)
- Positioned above Roll button (8px gap)

**Interaction**: Opens scratch modal to pick a category to zero out

---

## Scratch Modal

**Trigger**: User taps "STREICHEN" button

### Layout

Full-screen dark overlay with centered content:

1. **Title**: "Streichen" (large, cyan glow)
2. **Subtitle**: "Kategorie mit 0 Punkten eintragen" (small grey text)
3. **Category List**: Scrollable list showing all unfilled categories
   - Each row: Category name | "0" (red) | "❌" icon
   - Tapping row immediately scratches that category (enters 0 points)
4. **Bottom Button**: "ABBRECHEN" (cyan button) to close modal

### Visual Notes

- Background overlay: `rgba(0, 0, 0, 0.95)`
- Modal content width: ~90% of screen
- List items have hover/press state (slight red tint)

---

## Shop Phase

**Trigger**: Player wins a round (score ≥ target)

### Layout

Full-screen overlay with:

1. **Title**: "SHOP" (large, cyan glow)
2. **Money Display**: `$X` (large gold text with orange glow)
3. **Content Area**:
   - Currently shows placeholder: "Shop ist leer"
   - Future: Grid of upgrade cards
4. **Bottom Button**: "NÄCHSTE RUNDE" (large green button)

### Interaction Flow

1. Player wins → Shop opens automatically
2. (Future) Player buys upgrades with accumulated cash
3. Player taps "NÄCHSTE RUNDE"
4. Target score increases by 50% (e.g., 200 → 300 → 450)
5. New run starts (round 1/13 with fresh scorecard)

---

## Typography Scale

### Fonts

1. **Primary (Headings/Scores)**: Press Start 2P (pixel/retro font)
2. **Secondary (Labels/Body)**: Roboto Mono (monospace)

### Size Scale

| Element      | Font         | Size | Usage                      |
| ------------ | ------------ | ---- | -------------------------- |
| Large Score  | PressStart2P | 24px | Shop money, game end score |
| Medium Score | PressStart2P | 16px | Roll button text           |
| Small Score  | PressStart2P | 12px | Slot scores, progress bar  |
| Tiny Score   | PressStart2P | 10px | Upper slot scores          |
| Labels       | RobotoMono   | 13px | Lower slot category names  |
| Meta Info    | RobotoMono   | 12px | Round counter, cash        |
| Micro Labels | RobotoMono   | 8px  | "STAND" / "ZIEL" labels    |

---

## Color Palette

### Functional Colors

| Name       | Hex                   | Usage                                 |
| ---------- | --------------------- | ------------------------------------- |
| Cyan       | `#00FFFF`             | Active state, titles, glows           |
| Cyan Dark  | `#00CCCC`             | Borders, buttons                      |
| Cyan Glow  | `rgba(0,255,255,0.3)` | Active background tint                |
| Gold       | `#FFD700`             | Progress fill, scores, primary button |
| Gold Dark  | `#B8860B`             | Button borders                        |
| Muted Gold | `#A08000`             | Filled slot scores                    |
| Red        | `#FF4444`             | Scratch button, zero scores           |
| Green      | `#22C55E`             | Win state, shop button                |

### Neutral Palette

| Name        | Hex                     | Usage                   |
| ----------- | ----------------------- | ----------------------- |
| Dark BG     | `rgba(20,20,25,0.95)`   | Header panel            |
| Slot BG     | `rgba(30,30,35,0.9)`    | Default slot background |
| Filled BG   | `rgba(15,15,18,0.95)`   | Filled slots            |
| Slot Border | `#3D3D3D`               | Default borders         |
| Text Muted  | `rgba(255,255,255,0.3)` | Empty slot text         |
| Text Light  | `rgba(255,255,255,0.7)` | Secondary text          |

---

## Yahtzee Scoring Rules

### Upper Section (Ones through Sixes)

**Objective**: Collect as many of each number as possible

| Category | Score Calculation | Example          |
| -------- | ----------------- | ---------------- |
| Ones     | Sum of all 1s     | [1,1,3,4,6] = 2  |
| Twos     | Sum of all 2s     | [2,2,2,5,6] = 6  |
| Threes   | Sum of all 3s     | [3,3,3,3,5] = 12 |
| Fours    | Sum of all 4s     | [4,4,4,1,2] = 12 |
| Fives    | Sum of all 5s     | [5,5,1,2,3] = 10 |
| Sixes    | Sum of all 6s     | [6,6,6,6,6] = 30 |

**Bonus Rule**: If upper section total ≥ 63 points, add +35 bonus to final score

---

### Lower Section (Poker Hands)

| Category        | Requirements    | Score           | Example          |
| --------------- | --------------- | --------------- | ---------------- |
| Three of a kind | 3+ dice same    | Sum of all dice | [4,4,4,2,3] = 17 |
| Four of a kind  | 4+ dice same    | Sum of all dice | [5,5,5,5,1] = 21 |
| Full house      | 3 same + 2 same | **25 fixed**    | [3,3,3,6,6] = 25 |
| Small Straight  | 4 consecutive   | **30 fixed**    | [1,2,3,4,6] = 30 |
| Large Straight  | 5 consecutive   | **40 fixed**    | [2,3,4,5,6] = 40 |
| Yahtzee         | 5 same dice     | **50 fixed**    | [4,4,4,4,4] = 50 |
| Chance          | Any combination | Sum of all dice | [1,2,3,4,5] = 15 |

### Straight Detection

**Small Straight** accepts these patterns:

- 1-2-3-4 (with any 5th die)
- 2-3-4-5 (with any 5th die)
- 3-4-5-6 (with any 5th die)

**Large Straight** accepts:

- 1-2-3-4-5 exactly
- 2-3-4-5-6 exactly

---

## Game State Flow

```
START
  ↓
ROLLING (Phase: "ROLLING")
  ├→ Roll dice (up to 3 times)
  ├→ Lock/unlock individual dice
  └→ Valid categories glow cyan
       ↓
       ├→ TAP ACTIVE SLOT → Submit score
       │    ↓
       │   Next round (if < 13)
       │    ↓
       │   ROLLING
       │
       └→ NO VALID CATEGORIES → Tap STREICHEN
            ↓
           SCRATCH MODAL
            ↓
           Pick category → Enter 0
            ↓
           Next round
             ↓
            ROLLING

After Round 13:
  ↓
Check: Total Score ≥ Target?
  ├→ YES: GAME_WON
  │         ↓
  │        Display overlay "GEWONNEN!"
  │         ↓
  │        Tap SHOP
  │         ↓
  │        SHOP phase
  │         ↓
  │        Tap NÄCHSTE RUNDE
  │         ↓
  │        Target × 1.5
  │         ↓
  │        Round 1 (fresh scorecard)
  │
  └→ NO: GAME_OVER
           ↓
          Display overlay "VERLOREN"
           ↓
          Tap NOCHMAL
           ↓
          Round 1 (fresh scorecard, target = 200)
```

---

## Design Principles

### 1. Immediate Visual Feedback

- Active slots glow brightly (impossible to miss)
- Clear distinction between three states
- No ambiguity about what's clickable

### 2. No Hidden Information

- All 13 categories visible at once
- Progress bar shows exact goal distance
- Roll count always visible (pips in button)

### 3. Minimal Interaction

- One tap to score (no confirmation dialogs)
- Modals only for edge cases (scratch, shop)
- Everything else inline on main screen

### 4. Arcade Aesthetic

- High contrast colors (cyan, gold, red)
- Pixel fonts for retro feel
- 3D button effects (border-bottom technique)
- Glows and shadows for "juice"

### 5. Mobile-First Layout

- Large touch targets (44px+ height)
- Thumb-friendly bottom actions
- Scrollable only where necessary (lower section)
- Top 38% reserved for 3D visuals

---

## Number Formatting

**Problem**: Roguelike games can produce very large numbers

**Solution**: Compact notation for numbers ≥ 1000

| Number | Display |
| ------ | ------- |
| 42     | `42`    |
| 999    | `999`   |
| 1234   | `1.2k`  |
| 12345  | `12.3k` |
| 100000 | `100k`  |

**Formula**: `${(n / 1000).toFixed(1)}k`

---

## Future Expansion Points

Based on roguelike design:

1. **Special Dice** (purchased in shop)

   - Example: "Lucky Die" (always rolls 6)
   - Example: "2x Die" (doubles its value)
   - Visual: Different colors/textures in 3D area

2. **Hand Upgrades** (Balatro-style)

   - Example: "Full House +" (scores 35 instead of 25)
   - Example: "Yahtzee Mega" (scores 100 instead of 50)
   - Visual: Glow effect on upgraded slots

3. **Meta-Currency** (persistent between runs)

   - Unlocks permanent upgrades
   - Visual: Star icon in header next to money

4. **Dice Modifiers**

   - "Reroll Token" (adds +1 roll to a round)
   - "Lock-All" (locks all 5 dice)
   - Visual: Icons on footer next to roll button

5. **Challenge Modes**
   - "No Upper Section" (only poker hands)
   - "Ascending Targets" (200, 250, 300...)
   - Visual: Badge/icon in header

---

## Key Measurements Reference

Quick reference for recreating layout:

```
Screen Height: 100%
├─ Header HUD: Auto (fits content, ~80px)
├─ 3D Dice Area: 38%
├─ Upper Scoring: Auto (fits 1 row, ~80px)
├─ Lower Scoring: Flex (remaining space, scrollable)
└─ Footer Controls: Auto (~60-70px)

Spacing:
- Screen padding (horizontal): 8px
- Section gaps (vertical): 8px
- Slot gaps (horizontal): 6px
- Slot gaps (vertical): 4px

Container Padding:
- Header: 16px horizontal, 4/12px vertical
- Slots: 12px horizontal, 10-14px vertical
- Buttons: 14-18px vertical
```

---

## Testing Checklist

When implementing this UI from scratch, verify:

**Visual States**

- [ ] All 3 states (active/filled/empty) are visually distinct
- [ ] Cyan glow is prominent on active slots
- [ ] Progress bar fills correctly based on score/target ratio
- [ ] Dice icons show correct dot patterns (1-6)

**Interactions**

- [ ] Tapping active slot submits score immediately
- [ ] Tapping filled/empty slots does nothing
- [ ] Roll button disables after 3 rolls
- [ ] Scratch button only appears when needed

**Gameplay Flow**

- [ ] 13 rounds complete → triggers win/lose check
- [ ] Win → shows shop → next round increases target
- [ ] Lose → retry resets to 200 target
- [ ] Locked dice stay locked between rolls

**Edge Cases**

- [ ] Rolling [1,1,1,1,1] lights up correct categories (Yahtzee, 5-kind, 3-kind, Ones, Chance)
- [ ] No valid categories → Scratch button appears
- [ ] All categories filled → round 13 ends immediately
- [ ] Score exactly equals target → counts as win

---

## Conclusion

This game combines:

- **Yahtzee**: Classic dice game with 13 categories
- **Roguelike**: Progressive difficulty, runs, shop upgrades
- **Arcade UI**: High contrast, immediate feedback, minimal interaction

The key innovation is **inline scoring** — removing modal popups in favor of a unified dashboard where ALL game state is visible at once. This creates a "control panel" aesthetic that feels premium and responsive.
