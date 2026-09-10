# Architecture — Chaos School Life

## Layering (strict)

```
DATA (src/data)          ← all narrative/system content, no logic
  ↓
STORES (src/stores)      ← Zustand state + actions; game logic entry
  ↓
SYSTEMS (src/game/systems)  ← pure functions (resolver, rules, helpers); unit-testable
  ↓
RUNTIME (src/game)       ← R3F entities: player, camera, NPC, combat arena, world
  ↓
UI (src/game-ui)         ← overlays/menus; render state only, never compute story
```

Rules: UI never decides story logic; render components never own global game state; dialogue components never compute endings; player controller never completes quests directly (stores/systems do).

## Layout

```
src/
├── App.tsx                  # composition root (Canvas + UI overlay switching)
├── main.tsx
├── styles.css
├── types/index.ts           # shared types (GameMode, Phase, Stats, ...)
├── data/                    # content only
│   ├── dialogue.ts          # DialogueNode graph (id/speaker/text/emotion/next/choices/conditions/effects)
│   ├── chapters.ts          # chapter definitions + cinematic beats (opening script)
│   ├── quests.ts            # quest definitions
│   ├── items.ts             # item definitions
│   ├── npcs.ts              # NPC defs: positions, colors, schedules, factions
│   └── world.ts             # areas, spawn points, map nodes, bounds
├── stores/
│   ├── gameStore.ts         # phase, mode, time/day, notifications, settings glue
│   ├── playerStore.ts       # hp/focus/position/velocity-ish state
│   ├── statsStore.ts        # academic, violence, diplomacy, reputation
│   ├── storyStore.ts        # chapter/beat/flags/choices, route, route progression
│   ├── socialStore.ts       # relationships, visit
│   ├── questStore.ts        # quest states + objectives
│   ├── inventoryStore.ts    # items
│   └── settingsStore.ts     # camera, audio, accessibility
├── game/
│   ├── input.ts             # keyboard/mouse abstraction (action map, held keys)
│   ├── audio.ts             # WebAudio synth engine + bus mixer
│   ├── save.ts              # versioned saveGame/loadGame/deleteSave/hasSave + migration
│   ├── systems/
│   │   ├── effects.ts       # applyEffects(): dialogue/quest effect → store mutations
│   │   ├── conditions.ts    # condition evaluation for dialogue/choices/quests
│   │   ├── relationship.ts  # clamp, label, deltas
│   │   ├── reputation.ts    # state machine
│   │   ├── endingResolver.ts# pure ending computation (canon routes)
│   │   ├── time.ts          # clock advance, period lookup
│   │   ├── study.ts         # mini-game question flow + scoring
│   │   └── notifications.ts # queue helpers
│   ├── player/Player.tsx    # Rapier dynamic body controller + animation controller
│   ├── camera/CameraRig.tsx # third-person orbit + cinematic override + FP→TP transition
│   ├── npc/Npc.tsx          # generic character renderer + schedule mover + nameplate
│   ├── npc/Character.tsx    # GLB/placeholder renderer with animation fallback
│   ├── combat/combat.ts     # combat state machine + hit detection (pure-ish)
│   ├── combat/CombatScene.tsx # encounter staging, enemy AI tick, combat VFX
│   └── world/World.tsx      # school GLB, ground, bounds colliders, props, zones
├── game-ui/
│   ├── MainMenu.tsx
│   ├── Hud.tsx
│   ├── DialogueUI.tsx       # typewriter + choices + portraits
│   ├── CinematicUI.tsx      # letterbox, captions, skip
│   ├── CombatHud.tsx
│   ├── Notifications.tsx
│   ├── LoadingScreen.tsx
│   ├── ChapterTransition.tsx
│   ├── EndingScreen.tsx
│   └── menus/               # Status, Relationships, Quests, Inventory, Map, Phone, Pause, Settings, SaveLoad (+ FullMenu shell)
└── test/                    # vitest specs for pure systems
```

## Key mechanisms

- **Game mode state machine:** one `mode` field in `gameStore` (BOOT, MAIN_MENU, OPENING_CINEMATIC, GAMEPLAY, DIALOGUE, CHOICE, COMBAT, PAUSE, menus…, GAME_OVER, ENDING, TRANSITION). Input listeners and UI render gated by mode; no boolean soup.
- **Input:** single `input.ts` singleton — held-key map updated by listeners; action events (pressed/just-pressed) consumed per frame by Player/Combat. UI shortcuts separate.
- **Player:** Rapier `RigidBody type="dynamic"` + capsule collider; velocity set from input each frame (acceleration/deceleration); jump via impulse; ground check via ray. Transform mirrored into store only on save/interact needs (not every frame) — performance.
- **Camera:** yaw/pitch from pointer-locked mouse; distance via wheel; lerp follow + shoulder offset; occlusion via short raycast; cinematic mode takes over with beats (positions/lookAt over time) for the opening; FP→TP uses animated transition beat.
- **Animation:** `Character.tsx` plays GLB clips when present; otherwise procedural fallback (idle sway, walk bob, lean) — final GLBs drop in without gameplay changes.
- **Combat:** encounter configured via data (enemy id, arena); `combat.ts` owns a tick(dt) FSM; store keeps hp/enemy hp; UI reads store only.
- **Effects pipeline:** dialogue/choice effects are data (`{stat: 'relationship', target: 'aris', delta: 2}`) applied by `systems/effects.ts` → notifications emitted centrally.
- **Save:** whole-game snapshot = pick() of store slices + `{version: 2}`; validation per field; migration v1→v2.

## Performance guards

Few physics bodies (player + walls + ground; NPCs kinematic), shadow map 2048, dpr clamp [1,2], no constant postprocessing, GLB compression attempted (gltf-transform/Draco), lazy `useGLTF.preload`, position writes to store throttled.
