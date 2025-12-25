# Performance Optimization Notes (Dice Game)

## Goals
- Reduce device heat and battery use in dev builds.
- Keep dice throws responsive with no visible lag, including after idle periods.
- Avoid heavy reinitialization costs during a roll.

## Observed Hotspots
- The 3D scene renders continuously (`frameloop="always"`) even when idle.
- Physics simulation runs at a fixed 60fps by default.
- Each die runs a per-frame stability check via `useFrame`.
- Shadows and HDR environment lighting are expensive on mobile.
- Dice pips are many small meshes (high draw-call count).
- Dice visibility is opacity-only; physics/render loops still run.

## Strategy: Keep 3D Mounted, Pause Work When Idle
The key requirement is *no lag when the user starts rolling*. That means keeping the 3D scene mounted, but making it cheap while idle:

1) **On-demand rendering instead of full-time render loop**
   - Use `Canvas frameloop="demand"` so the scene renders only when invalidated.
   - Use `Physics updateLoop="independent"` so Rapier runs its own loop and only invalidates the scene when bodies are moving.
   - Result: the scene stays mounted (no reinit lag), but idle periods cost nearly zero.

2) **Lower physics step rate while rolling (optional)**
   - Set `timeStep={1/30}` or `timeStep="vary"` if visuals remain acceptable.
   - Benefit: cut CPU use during rolling without sacrificing responsiveness.

3) **Keep physics asleep when idle**
   - Ensure bodies are allowed to sleep and do not get woken by UI interactions.
   - Only apply impulses/torques on roll.

## GPU/Rendering Cost Reductions (while keeping UX smooth)
These can be toggled based on `isRolling` to avoid quality loss during a roll:

- **Shadows**: disable or reduce while idle.
  - Example: `shadows={isRolling}` on `Canvas` or `castShadow` on light only during roll.
- **ContactShadows**: reduce resolution/frames or show only while rolling.
- **Environment lighting**: replace `Environment preset="studio"` with simpler light setup (ambient + directional) or only enable during roll.
- **Device pixel ratio (DPR)**: cap to `dpr={[1, 1.5]}` or `dpr={1}` on mobile.

## Geometry / Draw-call Reduction
- Current dice use many small meshes for pips. This is expensive on mobile GPUs.
- Options:
  - Use a single textured cube (atlas) for each die face.
  - Use instanced meshes for pips to share geometry/materials.

## Suggested Implementation Order (No-Lag First)
1) **On-demand render + independent physics loop** (biggest win, minimal risk).
2) **Idle-quality reductions** (shadows/environment only during roll).
3) **Lower physics timestep during roll** (test to ensure visuals remain smooth).
4) **Reduce draw calls via textures/instancing** (bigger refactor).

## Validation Checklist
- Start a roll immediately after idle: no stutter or delayed response.
- Dice visually settle correctly and the result updates as expected.
- Thermal and battery improvements observable after a few minutes of idle + normal play.

## Notes on Dev Builds
Dev mode adds overhead (debug logging, dev client, extra instrumentation). Always compare with a preview or release build to confirm improvements.
