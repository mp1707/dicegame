# UI Kit - Sparks Component

The UI Kit now primarily contains the `Sparks` particle effect component. Most container components have been migrated to the `pixel-ui-kit` folder.

---

## Current Components

| Component | Purpose                             | File         |
| --------- | ----------------------------------- | ------------ |
| `Sparks`  | Particle animation for celebrations | `Sparks.tsx` |

---

## Migration to pixel-ui-kit

The following components are the new standard for UI containers:

| Component      | Purpose                                   | Location                        |
| -------------- | ----------------------------------------- | ------------------------------- |
| `Surface`      | Base container with 9-slice pixel texture | `pixel-ui-kit/Surface.tsx`      |
| `Pressable`    | 3D press effect for buttons               | `pixel-ui-kit/Pressable.tsx`    |
| `PixelChip`    | Status badge                              | `pixel-ui-kit/PixelChip.tsx`    |
| `PixelDivider` | Visual separator                          | `pixel-ui-kit/PixelDivider.tsx` |

---

## Interactive Elements (shared/)

| Component          | Purpose                              | File                          |
| ------------------ | ------------------------------------ | ----------------------------- |
| `Button`           | Main CTA button with pixel 3D effect | `shared/Button.tsx`           |
| `TileButton`       | Selectable tile with 3D press        | `shared/TileButton.tsx`       |
| `SquareTileButton` | Square version of TileButton         | `shared/SquareTileButton.tsx` |
| `GameText`         | Text with M6x11 pixel font           | `shared/GameText.tsx`         |
| `Modal`            | Modal wrapper                        | `shared/Modal.tsx`            |

---

## Visual Rules

### DO

- ✅ Use `Surface` from `pixel-ui-kit` for containers
- ✅ Use `Button` from `shared` for CTAs
- ✅ Use `TileButton` from `shared` for selectable items
- ✅ Use `PixelChip` for status badges
- ✅ Reference theme constants (`COLORS.*`, `SPACING.*`, `DIMENSIONS.*`)

### DON'T

- ❌ Don't use raw `View` with inline styles for containers
- ❌ Don't hardcode colors, spacing, or dimensions - use theme constants
- ❌ Don't wrap containers in `Pressable` - use `Button` or `TileButton`

---

## Flow Components

The `flow/` subdirectory contains the layout orchestrator:

- **PhaseDeck.tsx** - Main game layout that switches content based on phase

See `flow/CLAUDE.md` for details on the phase system.

---

## Related Documentation

- **Theme constants**: See `constants/theme.ts` for all design tokens
- **Pixel UI Kit**: See `pixel-ui-kit/` for container components
- **Shared components**: See `components/shared/` for Button, TileButton, etc.
- **PhaseDeck layout**: See `components/ui-kit/flow/CLAUDE.md` for layout orchestration
