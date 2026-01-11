# UI Kit - Material Layer System

The UI Kit provides container components with clear visual hierarchy. The key principle is: **Containers should look like containers, not buttons.**

Only interactive elements (PrimaryButton, TileButton) should have 3D bevels and glows. All other components should be flat and matte.

---

## Material Hierarchy (back to front)

```
Level 0: Background (COLORS.bg)
   │
   └─► Level 1: Panel (Surface variant="panel")
          │
          └─► Level 1.5: Inset (Surface variant="inset")
                 │
                 └─► Level 2: Interactive (PrimaryButton, TileButton)
```

1. **Background** (`COLORS.bg`) - Main app background
2. **Panel** (`Surface variant="panel"`) - Card/section containers
3. **Inset** (`Surface variant="inset"`) - Recessed data displays inside panels
4. **Interactive** (`PrimaryButton`, `TileButton`) - Tappable elements with 3D effect

**Only Level 2 elements should have 3D button styling with bevels and press effects.**

---

## Component Overview

| Component | Purpose | Interactive? | File |
|-----------|---------|--------------|------|
| `Surface` | Base container with variants | No | `Surface.tsx` |
| `HUDCard` | Panel wrapper for info displays | No | `HUDCard.tsx` |
| `InsetSlot` | Recessed sub-surface for data | No | `InsetSlot.tsx` |
| `Chip` | Status badge | No | `Chip.tsx` |
| `SectionHeader` | Section title with optional icon | No | `SectionHeader.tsx` |
| `Divider` | Visual separator | No | `Divider.tsx` |
| `ProgressBar` | Animated progress bar | No | `ProgressBar.tsx` |
| `NumericCapsule` | Fixed-width number display | No | `NumericCapsule.tsx` |

For interactive elements, use:
- `PrimaryButton` (in `components/shared/`) - Main action buttons
- `TileButton` (in `components/shared/`) - Selectable tiles/slots
- `Pressable3DBase` (in `components/ui/`) - Custom 3D pressable elements

---

## Surface Variants

The Surface component is the foundation of all container layouts.

### Panel Variant

Main container for card-like sections:

```typescript
import { Surface } from "../components/ui-kit";

<Surface variant="panel" padding="lg">
  <Text>Panel content</Text>
</Surface>
```

**Visual characteristics**:
- Flat fill (`COLORS.surface`)
- Subtle top border (`overlays.whiteMild`)
- NO outer glow
- Matte appearance

### Inset Variant

Recessed data display (darker than panel):

```typescript
<Surface variant="inset" padding="sm">
  <Text>Data value</Text>
</Surface>
```

**Visual characteristics**:
- Darker fill (`COLORS.bg`)
- Top dark border for recessed effect
- Appears "sunken" into the panel

### Chip Variant

Badge background (minimal styling):

```typescript
<Surface variant="chip" padding="none">
  <Text>BADGE</Text>
</Surface>
```

**Visual characteristics**:
- Minimal flat badge
- NO bevel
- Color variants: cyan, gold, mint, coral, muted

### Overlay Variant

Modal background (semi-transparent):

```typescript
<Surface variant="overlay" padding="lg">
  <Text>Modal content</Text>
</Surface>
```

**Visual characteristics**:
- Semi-transparent backdrop
- Used for modals and overlays

---

## HUDCard + InsetSlot Pattern

Use HUDCard as the outer container and InsetSlot for nested data displays:

```typescript
import { HUDCard, InsetSlot, Divider } from "../components/ui-kit";

<HUDCard header="REWARDS">
  <InsetSlot style={styles.dataRow}>
    <Text>Win Bonus</Text>
    <Text>+$10</Text>
  </InsetSlot>

  <InsetSlot style={styles.dataRow}>
    <Text>Unused Hands</Text>
    <Text>+$4</Text>
  </InsetSlot>

  <Divider />

  <View style={styles.totalRow}>
    <Text>TOTAL</Text>
    <Text style={styles.gold}>+$14</Text>
  </View>
</HUDCard>
```

**Pattern benefits**:
- Clear visual hierarchy (panel → inset → data)
- Consistent spacing and layout
- Reusable across all info displays

---

## Chip Usage

Chips are informational badges. They should **NOT** be tappable.

### Color Variants

```typescript
import { Chip } from "../components/ui-kit";

<Chip label="NEW" color="cyan" />
<Chip label="TIER 2" color="gold" />
<Chip label="UPGRADE" color="mint" />
<Chip label="LOCKED" color="coral" />
<Chip label="COMING SOON" color="muted" />
```

### Size Variants

```typescript
<Chip label="LV.3" size="sm" />
<Chip label="BONUS" size="md" />
```

**Usage guidelines**:
- Use for status indicators (level, tier, state)
- Never wrap in `Pressable` - chips are read-only
- For tappable badges, use `TileButton` instead

---

## SectionHeader Usage

Section headers with optional icons and accessories:

```typescript
import { SectionHeader } from "../components/ui-kit";
import { Trophy } from "lucide-react-native";

// Simple header
<SectionHeader title="REWARDS" />

// With icon
<SectionHeader
  title="LEVEL COMPLETE"
  icon={<Trophy size={18} color={COLORS.gold} />}
  color={COLORS.gold}
/>

// With accessory
<SectionHeader
  title="SHOP ITEMS"
  accessory={<Chip label="3" color="cyan" />}
/>
```

---

## ProgressBar Features

Animated progress bar with game-feel polish:

```typescript
import { ProgressBar } from "../components/ui-kit";

<ProgressBar value={score} max={goal} size="sm" />
```

**Features**:
- **InsetSlot-style track** (recessed appearance)
- **Smooth fill animation** with subtle overshoot and settle
- **Gradient fill** with leading edge shine
- **Color transition**: cyan → gold at 100%
- **Glow effect** when near/at goal
- **Sizes**: `sm` (8px height), `md` (14px height)

**Visual effect timeline**:
1. Bar fills with cyan gradient
2. At 90%: Subtle glow appears
3. At 100%: Transforms to gold with stronger glow
4. Overshoot to 103%, settle back to 100%

---

## NumericCapsule

Fixed-width number display that prevents layout shift:

```typescript
import { NumericCapsule } from "../components/ui-kit";

<NumericCapsule value={1234} variant="gold" />
<NumericCapsule value={score} variant="cyan" size="sm" />
```

**Purpose**: Prevents UI jitter when numbers change (e.g., score ticking up)

---

## Visual Rules

### DO

- ✅ Use `HUDCard` for information panels
- ✅ Use `InsetSlot` for recessed data displays inside cards
- ✅ Use `Chip` for status badges and labels
- ✅ Use `Divider` to separate sections within a panel
- ✅ Use `Surface` variants to establish visual hierarchy
- ✅ Reference theme constants (`COLORS.*`, `SPACING.*`, `DIMENSIONS.*`)

### DON'T

- ❌ Don't add strong bevels or glows to panels (they'll look like buttons)
- ❌ Don't use thick bottom borders on containers (that's a button pattern)
- ❌ Don't wrap `Surface` in `Pressable` - use dedicated button components instead
- ❌ Don't use chips for tappable actions - they are informational only
- ❌ Don't hardcode colors, spacing, or dimensions - use theme constants

---

## New Feature UI Guidelines

When building new features (modals, screens, flows), follow these guidelines to maintain UI consistency.

### Component Selection Hierarchy

1. **Interactive elements** → Use `PrimaryButton` (CTAs) or `TileButton` (grid items)
2. **Containers** → Use `Surface` (panel, inset, chip, overlay variants)
3. **Status badges** → Use `Chip` component
4. **Text** → Use `GameText` with typography variants
5. **Spacing** → Use `SPACING.*` constants
6. **Dimensions** → Use `DIMENSIONS.*` or `LAYOUT.*` constants

### Pre-Implementation Checklist

Before writing new UI code, verify:

- [ ] Am I using an existing UI kit component instead of a raw `View`/`Pressable`?
- [ ] Are all colors from `COLORS.*` (no hex literals)?
- [ ] Are all spacings from `SPACING.*` (no magic numbers)?
- [ ] Are all dimensions from `DIMENSIONS.*` or `LAYOUT.*`?
- [ ] Are touch targets at least `LAYOUT.minTouchTarget` (44px)?
- [ ] Do interactive elements have proper 3D bevels (via `PrimaryButton`/`TileButton`)?

### Gap Handling Protocol

If you need a component, color, or dimension that doesn't exist in the theme:

1. **Stop and ask the user** before creating custom styles
2. Propose adding the new token to `constants/theme.ts`
3. Propose adding a new UI kit component if the pattern will be reused
4. Only proceed with inline styles if the user confirms it's a one-off

### Common Mistakes to Avoid

| ❌ Wrong | ✅ Right |
|----------|----------|
| `<Pressable style={{...}}>` for CTAs | `<PrimaryButton label="..." />` |
| `<View style={{border: 1}}>` for badges | `<Chip label="..." color="..." />` |
| `width: 72` hardcoded | `width: DIMENSIONS.tileHeight` |
| `height: 40` for touch targets | `height: LAYOUT.minTouchTarget` |
| `backgroundColor: "#352B58"` | `backgroundColor: COLORS.surface` |
| `gap: 8` | `gap: SPACING.sm` |

---

## Complete Component List

### Non-Interactive Containers (ui-kit/)
- `Surface` - Base container with 4 variants
- `HUDCard` - Panel wrapper with optional header
- `InsetSlot` - Recessed sub-surface
- `Chip` - Status badge
- `SectionHeader` - Section title with icon
- `Divider` - Visual separator
- `ProgressBar` - Animated progress
- `NumericCapsule` - Fixed-width numbers
- `GlassPanel` - Glass effect container
- `Sparks` - Particle animation
- `TrayOverlay` - Overlay titles

### Interactive Elements (shared/)
- `PrimaryButton` - Main CTA button (3D bevel)
- `TileButton` - Selectable tile (3D bevel)
- `GameText` - Text with M6x11 font
- `Modal` - Modal wrapper

### Custom Interactive (ui/)
- `Pressable3DBase` - Foundation for custom pressables
- `BasePressableAnimated` - Animated pressable base

---

## Example: Building a Reward Panel

```typescript
import { HUDCard, InsetSlot, Divider, Chip } from "../components/ui-kit";
import { GameText } from "../components/shared";
import { COLORS, SPACING } from "../constants/theme";

const RewardPanel = ({ rewards, tier }) => {
  return (
    <HUDCard
      header={
        <View style={styles.header}>
          <GameText variant="displaySmall">REWARDS</GameText>
          <Chip label={`TIER ${tier}`} color="gold" size="sm" />
        </View>
      }
    >
      {rewards.map((reward, index) => (
        <InsetSlot key={index} style={styles.rewardRow}>
          <GameText variant="bodyMedium" color={COLORS.text}>
            {reward.label}
          </GameText>
          <GameText variant="bodyLarge" color={COLORS.gold}>
            +${reward.amount}
          </GameText>
        </InsetSlot>
      ))}

      <Divider spacing="md" />

      <View style={styles.totalRow}>
        <GameText variant="displaySmall" color={COLORS.text}>
          TOTAL
        </GameText>
        <GameText variant="displayLarge" color={COLORS.gold}>
          +${rewards.reduce((sum, r) => sum + r.amount, 0)}
        </GameText>
      </View>
    </HUDCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.md,
  },
});
```

---

## Related Documentation

- **Theme constants**: See `constants/theme.ts` for all design tokens
- **Typography**: See `TYPOGRAPHY.*` in theme for text variants
- **Spacing**: See `SPACING.*` for consistent gaps
- **Interactive buttons**: See `components/shared/` for PrimaryButton and TileButton
- **PhaseDeck layout**: See `components/ui-kit/flow/CLAUDE.md` for layout orchestration
