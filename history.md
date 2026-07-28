# BLNK Flywheel - Project Memory & Local RAG (`history.md`)

This document is the authoritative local project memory and source of truth for the `blnk-flywheel` repository. It should be updated whenever significant features, bug fixes, or architectural decisions are completed.

---

# Architecture
- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript.
- **UI & Styling**: Chakra UI v2 (`@chakra-ui/react`, `@chakra-ui/next-js`) combined with Emotion and standard CSS custom properties.
- **3D & Graphics**: React Three Fiber (`@react-three/fiber`), `@react-three/drei`, and Three.js for canvas rendering.
- **Physics Engine**: Rapier (`@react-three/rapier`) for rigid body simulation, collision detection, and claw machine physics.
- **Authentication**: MetaMask Sign-In With Ethereum (SIWE) + custom nonce verification route (`/api/auth/*`).
- **Database**: MongoDB (Atlas) via Mongoose ODM (v8.24.2) for persistent user profiles, coin balances, completed tasks, and referral codes.
- **Reference Implementation**: `../claw-game` is the read-only behavioural specification for all gameplay mechanics.

---

# Folder Structure
```text
blnk-flywheel/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/auth/         # SIWE authentication (nonce, verify, me)
│   ├── api/game/         # Gameplay action endpoints (play, outcomes)
│   ├── api/tasks/        # Social/onboarding task verification
│   ├── game/page.tsx     # Main 3D Claw Machine game page
│   ├── page.tsx          # Root dashboard & MetaMask connection
│   └── layout.tsx        # Root layout with Chakra CacheProvider
├── components/           # UI and 3D React components
│   ├── Ball.tsx          # Physics wrapper for individual prize items (to render /assets/pre.glb)
│   ├── ButtonsControl.tsx # UI controls (Pick button)
│   ├── JoystickControl.tsx # Touch/mouse joystick control for claw horizontal movement
│   ├── ProgressBar.tsx   # Loading screen progress indicator
│   └── Scene.tsx         # Main 3D claw machine scene, lighting, and physics container
├── hooks/                # Custom React hooks (e.g., useMounted for SSR parity)
├── lib/                  # Shared utilities (MongoDB connection singleton)
├── models/               # Mongoose schemas (User.ts)
└── public/               # Static assets
    └── assets/           # Canonical 3D GLB models and textures (pre.glb)
```

---

# Current State
- **Authentication**: Working. MetaMask connection signs message, backend verifies signature, and stores user in MongoDB with initial 9 coins.
- **SSR & Hydration Parity**: Fixed. All root Page components return consistent DOM containers (`<Box>`) across SSR and initial client hydration. `useMounted` gating applies only to child components or client-only render blocks without leaving `<RootLayout>` children empty.
- **Gameplay Porting**: Completed. Gameplay mechanics in `blnk-flywheel` (joystick movement, claw grab sequence, physics, gravity scale toggling) match `claw-game` 100% while integrating web3 coin deduction and prize outcome routing.
- **Capsule Integration**: Completed. Legacy `ball-*.glb` imports replaced with `/assets/pre.glb` in `Scene.tsx` and `Ball.tsx`. Canonical meshes (`top`, `bottom`) resolved by name, tinted with a vibrant 5-color palette, and scaled by `0.003` to match the `0.155` radius Rapier collider.
- **Interactive Prize Reveal**: Completed. Built `components/PrizeCapsule.tsx` with procedural R3F animations (Idle floating/bobbing, Hover scale easing, Click lid lift along Y-axis, smooth camera zoom, and Apple-like UI reveal overlay). Integrated into `app/game/page.tsx` replacing the legacy 2D loot card modal.
- **Build Status**: Verified. `npm run build` succeeds cleanly with 0 compilation errors or type warnings.

---

# Gameplay Flow
1. **Dashboard (`/`)**: User connects MetaMask wallet. If authenticated, user profile is fetched from `/api/auth/me` showing coin balance and tasks.
2. **Launch Game (`/game`)**: User enters the claw machine room. 3D assets load while `<ProgressBar>` reflects loading status.
3. **Control Phase**:
   - Player drags `<JoystickControl>` to adjust claw rest position (`x` and `z` coordinates within bounded box).
   - Player clicks "Pick" button (`<ButtonsControl>`), invoking `onPick()` in `<Scene>`.
4. **Claw Grab Sequence**:
   - `catchAnimationSet` drops `clawRest3` vertically down to the physics pile.
   - `catchBall()` finds the closest prize item in range and temporarily disables gravity (`setGravityScale(0)`).
   - Claws close (`claw1`, `claw2`, `claw3` rotate inward).
   - Claw assembly lifts back up to center and calls `playNextAnimation()`.
5. **Prize Drop Sequence**:
   - If a prize was caught, `releaseAnimationSet` moves the assembly to the drop chute (`[-0.75, 0, 0]`, `[0, 0, 0.5]`).
   - Claws open, gravity is restored (`setGravityScale(1)`), and item drops down the chute.
   - Backend `/api/game/play` deducts a coin and returns outcome (`WL_SPOT`, `LOSS`, etc.).
6. **Prize Reveal**: Upon successful prize drop, interactive 3D capsule reveal (`<PrizeCapsule>`) opens lid (`top` mesh) via continuous procedural damping in `useFrame` to present the won reward and X (Twitter) claim workflow.

---

# Rendering Pipeline
- 3D canvas is hosted via `<Canvas>` in `app/game/page.tsx` with soft shadows and 55 fov.
- Environment lighting uses HDR dancing hall texture from PolyHaven with ambient and directional point lights.
- All mesh materials in the machine assembly are procedurally traversed and grayscaled on initialization to maintain the sleek monochrome/cyberpunk aesthetic, while inside capsules (`pre.glb`) remain vibrant two-tone collectibles.

---

# Physics Notes
- Uses Rapier (`<Physics>`) with Continuous Collision Detection (`ccd`).
- The claw machine body uses a fixed `trimesh` collider.
- Prize items use dynamic rigid bodies (`<RigidBody>`) with spherical `BallCollider` (`args={[0.155]}`).
- When an item is "caught" by the claw, its gravity scale is set to 0 and its kinematic translation is manually synced to the claw's position in `useFrame`. When released over the chute, gravity scale returns to 1.

---

# Animation Notes
- **No Baked Blender Animations**: All object and UI animations are procedural.
- **Claw Assembly**: Animated via a timestamped procedural interpolation queue (`animationQueueRef`) in `useFrame`, lerping position, rotation, and scale.
- **Prize Capsule (`pre.glb`)**:
  - Contains canonical meshes: `top` (lid) and `bottom` (base).
  - Always retrieved by name: `scene.getObjectByName("top")` and `scene.getObjectByName("bottom")`. Never indexed.
  - **Idle**: Gentle vertical bobbing via sine wave in `useFrame` + subtle slow rotation.
  - **Hover**: Smooth lerp scale increase to `1.06` + emissive material highlight.
  - **Click**: Anticipation dip, vertical lid lift along Y-axis while bottom remains stationary, camera zoom.
  - **UI Reveal**: HTML overlay fades in only after lid fully opens.
  - **Close**: Smooth reverse animation back to idle/aligned state.

---

# Asset Inventory
- `/assets/pre.glb`: Canonical prize capsule model (replaces older sphere/ball references). Two clean meshes: `top` and `bottom`.
- `/floor.glb`: Room floor geometry.
- `/clawMachine.glb`: Main cabinet trimesh collision body and visual model.
- `/clawRest.glb`, `/clawRest1.glb`, `/clawRest2.glb`, `/clawRest3.glb`: Articulated gantry crane and vertical telescoping arm segments.
- `/claw1.glb`, `/claw2.glb`, `/claw3.glb`: Three articulating claw prongs.

---

# Bugs Fixed
- **Mongoose 9 Callback Error**: Downgraded to Mongoose 8.24.2 and removed redundant pre-save hooks in `User.ts` that caused `TypeError: next is not a function` during SIWE session verification.
- **SSR Hydration Mismatch (`Next.MetadataOutlet` vs `@chakra-ui/next-js`)**: Resolved structural DOM mismatches in `app/page.tsx` and `app/game/page.tsx`. Replaced `if (!mounted) return null;` at root page levels with consistent static/loading `<Box>` containers, preventing empty layout children from forcing Emotion `<style>` tag injection next to `<Next.MetadataOutlet>`.
- **Duplicate Variable Declarations**: Removed duplicate `mounted` state variables in dashboard.
- **Legacy Asset Duplication**: Removed references to `ball-blue.glb`, `ball-green.glb`, `ball-pink.glb`, `ball-red.glb`, `ball-yellow.glb` in favor of canonical `/assets/pre.glb`.
- **WebGL Context Lost / Multi-Canvas Leak**: Eliminated secondary `<Canvas>` mounting by deleting `PrizeCapsule.tsx` and implementing seamless in-scene reward reveal directly on the main R3F Canvas in `Scene.tsx`.
- **PCFSoftShadowMap Deprecation Warning**: Replaced deprecated `shadows='soft'` parameter on `<Canvas>` in `app/game/page.tsx` with standard `shadows`.
- **setLinvel TypeError in Scene.tsx**: Added missing velocity and force methods (`setLinvel`, `setAngvel`, `linvel`, `angvel`, `resetForces`, `resetTorques`) to `BallHandle` interface and `useImperativeHandle` in `Ball.tsx`, allowing `Scene.tsx` to reset ball velocity upon claw release without runtime errors.

---

# Phase 6 Changes (latest)

## Ball Opening Animation (from `test/` reference)
- `Ball.tsx`: On clone, computes bounding box of the entire model. Stores `topClosedY`, `topClosedRotX`, `topClosedRotZ` (lid's initial local-space position/rotation) and `liftDist = size.y * 0.38` (38% of model height in model units, matching `test/script.js`). All exposed via `useImperativeHandle` as `getTopClosedY()`, `getLiftDist()`, etc.
- `Scene.tsx`: Replaces hardcoded `topMesh.position.y → 2000` with a proper `openAmountRef` scalar (0→1), damped at 5.5 speed. A quarter-sine `Math.sin(oa * PI * 0.5)` is applied to the lift for organic ease-in-out. Adds a subtle mechanical tilt (`rotation.z += lift * 0.08`, `rotation.x += lift * 0.05`). Reward orb rises proportionally with the same `openAmount`. `onComplete` now fires when `oa > 0.9 && timer >= 2s`.

## Game Phase State Machine
`app/game/page.tsx` is now driven by a 5-phase state: `intro → spending → playing → grabbing → revealing`. 
- **PLAY GAME button** appears on `intro` phase. Clicking calls the API immediately.
- **Coin arc animation** plays during the network round-trip (CSS keyframe, 700ms).
- After animation: joystick + DROP button appear and are enabled.
- **DROP** starts the claw animation; outcome was already fetched and stored in `pendingOutcomeRef`.

## UI Premium Monochrome
- Background: `#0A0A0A` (near-pure black).
- All fonts: `monospace` with `letterSpacing: '0.2em'` — no color UI anywhere.
- 3D joystick: radial-gradient concave well + metallic knob with layered box-shadows.
- 3D DROP button: 6px `box-shadow` pedestal + instant press on `mousedown` (80ms transition).
- Home button (← DASHBOARD) in top bar.
- Coin balance HUD in top bar.

## Security Hardening
- `app/api/game/play/route.ts`: `Math.random()` → `crypto.getRandomValues()` (Uint32Array). Atomic deduction via `findOneAndUpdate` with `$gte` guard. Rate limiter: 1 play / 10s per wallet. Correct PRD odds: GTD 5%, FCFS 30%, LOSS 65%. Cost: 3 coins per play.
- `lib/rateLimit.ts` (new): In-memory token bucket, auto-prunes every 60s.
- `next.config.ts`: Security headers for all routes (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`). Long-lived cache headers for GLB assets.

## Build
- `npx tsc --noEmit`: ✅ 0 errors
- `npm run build`: ✅ Clean, 2.8s compile

---

# Outstanding Issues
- Security and launch-readiness audit findings are tracked separately from this source-of-truth document. The highest-priority remediation items are removal of hard-coded secrets and server-side social-task verification.

---

# Phase 7 Changes (latest)

## Capsule Reveal
- `Scene.tsx`: The claw release sequence now signals completion from its final animation callback rather than relying on a page-level timeout. This keeps the reveal in lockstep with the actual delivery animation.
- `Scene.tsx`: Reveal uses a dedicated presentation capsule, separate from the Rapier-scaled prize pile. Its model normalization, 38%-of-height local lid lift, quarter-sine easing, mechanical tilt, crystal, point light, and 35-particle sparkle system match `../test/script.js`.
- The presentation capsule's centering and scale are applied through a parent normalization group, ensuring the raw GLB-space offset is scaled and remains in camera view. Its unique material clones render as a foreground reveal without changing occlusion for the physics capsule pile.
- Reveal capsule diameter is `0.42` world units (rather than the standalone test demo's `2.6`) because the game camera is substantially closer; this keeps the complete capsule visible instead of placing the viewer inside it.
- At initialization, the reveal lid is aligned from the GLB half-mesh bounds with a tiny overlap. This removes any authoring-space gap in the ready/closed state while retaining the same procedural opening lift.
- The seam correction only applies to a genuine positive gap; existing rim overlap is preserved to prevent the closed lid from being pulled away from its base. The reward is a capsule-scaled octahedron crystal with proportionate light and sparkles, preventing it from appearing as an oversized coin beneath the reveal capsule.
- Capsule halves now replace the source GLB's textured/transparent materials entirely: every pile and reveal capsule has an opaque black lid and opaque white base. The win-only crystal has foreground render priority so it is clearly visible after the lid opens.
- `app/game/page.tsx`: After the capsule arrives and centers, the player clicks it to open; the outcome modal appears once the test-style lid animation reaches its reveal point.
- Loss pulls retain the actual captured capsule for the reveal, instead of falling back to an unrelated first capsule.

## Coin Visual
- `app/game/page.tsx`: The coin-spend animation is a gold disk with a visibly offset lower rim for thickness. It now tosses from the player-facing lower edge into the machine's front silver section while the play request is processed.

## Verification
- `npx tsc --noEmit`: passes.
- `npm run build`: passes.

---

# TODO
- [x] Phase 1: Asset Setup & Project Memory Foundation.
- [x] Phase 2: Audit and align Scene.tsx, JoystickControl.tsx, and ButtonsControl.tsx with claw-game.
- [x] Phase 3: Architect seamless single-canvas prize reveal in Scene.tsx / Ball.tsx.
- [x] Phase 4 & 5: Definition of Done verification.
- [x] Phase 6: Ball opening animation (quarter-sine + bounding-box lift), UI overhaul (play-button flow, 3D controls, monochrome, home button), security (crypto RNG, rate limit, headers).
