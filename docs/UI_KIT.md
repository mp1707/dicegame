# UI Kit - Material Layers

The UI Kit provides container components with clear visual hierarchy. The key principle is:
**Containers should look like containers, not buttons.**

## Component Overview

| Component | Purpose | Interactive? |
|-----------|---------|--------------|
| `Surface` | Base container with variants | No |
| `HUDCard` | Panel wrapper for info displays | No |
| `InsetSlot` | Recessed sub-surface for data | No |
| `Chip` | Status badge | No |
| `SectionHeader` | Section title with optional icon | No |
| `Divider` | Visual separator | No |

For interactive elements, use:
- `PrimaryButton` - Main action buttons
- `TileButton` - Selectable tiles/slots
- `Pressable3DBase` - Custom 3D pressable elements

---

## Surface Variants

```typescript
import { Surface } from "../components/ui-kit";

// Panel - Main container (flat, matte, subtle border)
<Surface variant="panel" padding="lg">
  <Text>Panel content</Text>
</Surface>

// Inset - Recessed data display (darker, inner shadow feel)
<Surface variant="inset" padding="sm">
  <Text>Data value</Text>
</Surface>

// Chip - Badge background (minimal, flat)
<Surface variant="chip" padding="none">
  <Text>BADGE</Text>
</Surface>

// Overlay - Modal background (semi-transparent)
<Surface variant="overlay" padding="lg">
  <Text>Modal content</Text>
</Surface>
```

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

---

## Chip Usage

Chips are informational badges. They should NOT be tappable.

```typescript
import { Chip } from "../components/ui-kit";

// Color variants
<Chip label="NEW" color="cyan" />
<Chip label="TIER 2" color="gold" />
<Chip label="UPGRADE" color="mint" />
<Chip label="LOCKED" color="coral" />
<Chip label="COMING SOON" color="muted" />

// Size variants
<Chip label="LV.3" size="sm" />
<Chip label="BONUS" size="md" />
```

---

## SectionHeader Usage

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

## Do's and Don'ts

### DO

- Use `HUDCard` for information panels
- Use `InsetSlot` for recessed data displays inside cards
- Use `Chip` for status badges and labels
- Use `Divider` to separate sections within a panel

### DON'T

- Don't add strong bevels or glows to panels (they'll look like buttons)
- Don't use thick bottom borders on containers (that's a button pattern)
- Don't wrap `Surface` in `Pressable` - use dedicated button components instead
- Don't use chips for tappable actions - they are informational only

---

## Visual Hierarchy

```
Level 0: Background (COLORS.bg)
   │
   └─► Level 1: Panel (Surface variant="panel")
          │
          └─► Level 1.5: Inset (Surface variant="inset")
                 │
                 └─► Level 2: Interactive (PrimaryButton, TileButton)
```

Only Level 2 elements should have 3D button styling with bevels and press effects.
