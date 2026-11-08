# Chaos School Life (CSL)

> Ren, a transfer student at SMA Yuson, just wants good grades and a quiet graduation — but the school runs on bullying and gang influence, and every choice he makes changes who he becomes.

**Live demo:** https://csl-henna.vercel.app/

**Genre:** Action-Adventure + Narrative + Social Simulation  
**Platform:** Desktop (keyboard + mouse) & **mobile browser** (touch: virtual joystick + camera drag + action buttons)  
**Stack:** React 18 + TypeScript + Vite + React Three Fiber + Drei + Rapier + Zustand

---

## 🎮 Play

1. Open https://csl-henna.vercel.app/ in a desktop browser.
2. Click **NEW GAME** to start the opening cinematic.
3. After the cinematic, click anywhere to engage pointer lock (mouse look).
4. **WASD** move · **Shift** run (hold) / dodge (tap) · **Space** jump · **Mouse** camera orbit — di HP: joystick kiri (jalan/lari), geser layar kanan (kamera), tombol E/↑/ATK/BLK
5. **LMB** light attack · **Q** heavy attack · **RMB** block · **E** interact
6. **Tab/R/M/I/J/P/O** status / relationships / map / inventory / quests / phone / save-load
7. **Esc** pause

Three endings (BAD / TRUE / BITTER) depending on Chapter 3 choice + Chapter 4 final test. **v0.7.0 adds the 4th:** NEUTRAL ("Lulus Tanpa Nama") from ignoring Aris at the back stairs.

---

## 🛠️ Develop

```bash
git clone https://github.com/ridho1141haha/CSL.git
cd CSL
npm install
npm run dev       # → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm test          # 52 vitest unit tests
```

Requires Node 18+ (tested on Node 22).

---

## 📦 Project Structure

```
CSL/
├── public/                   # static assets
│   ├── jamalpur_zilla_school_2022.glb   # 7.3MB school exterior
│   ├── char.glb                          # placeholder (no skeleton)
│   └── npc/                              # MB-Lab NPC models
│       ├── *.glb                         # originals (158MB)
│       └── compressed/                   # Draco-compressed (21.5MB, 86% smaller)
├── src/
│   ├── App.tsx               # composition root (Canvas + UI switching)
│   ├── types/index.ts        # shared types
│   ├── data/                 # content only (dialogue, chapters, quests, npcs, world, items)
│   ├── stores/               # 9 Zustand stores (game/player/stats/story/social/quest/inventory/dialogue/combat/settings)
│   ├── game/
│   │   ├── input.ts          # keyboard/mouse/touch abstraction (held + just-pressed + tap-vs-hold + virtual axes)
│   │   ├── mobile.ts         # device tier + render diagnostics + watchdog
│   │   ├── audio.ts          # WebAudio procedural synth (5 buses)
│   │   ├── save.ts           # versioned localStorage save (v2 + v1 migration)
│   │   ├── runtime.ts        # per-frame mutable state (outside React)
│   │   ├── systems/          # pure functions (effects, conditions, endingResolver, relationship, reputation, time, study)
│   │   ├── player/Player.tsx # Rapier dynamic controller
│   │   ├── camera/CameraRig.tsx  # TP orbit + cinematic override + FP→TP transition
│   │   ├── npc/              # Character + Npc (scheduled + ambient)
│   │   ├── combat/           # real-time FSM combat + enemy AI
│   │   ├── world/World.tsx   # SMA Yuson grounds (zones, colliders, props)
│   │   └── StoryDirector.tsx # story/zone/quest glue per frame
│   ├── game-ui/              # MainMenu, Hud, DialogueUI, Screens, menus/
│   └── test/                 # 52 vitest specs
├── ARCHITECTURE.md           # strict layering rules
├── PRD.md / GDD.md           # canon product/game design docs
├── DECISIONS.md              # 14 architectural decisions logged
├── TODO.md                   # phase-by-phase status (synced with reality)
└── CHANGELOG.md              # 0.1.0 → 0.2.0
```

**Layering (strict):** `data → stores → systems → runtime → UI`. UI never decides story logic; render components never own global state; dialogue components never compute endings.

---

## 🎭 Story (canon — 4 chapters, 4 endings)

**v0.7.0** — opening baru yang lebih lambat ("Minggu Pertama — Pria Tanpa Wajah")
dan rute ketiga (NETRAL) dari GDD §"Alur yang lebih lambat" + §"Rute Netral".

| Chapter | Title | Key Beat |
|---------|-------|----------|
| **I** | Minggu Pertama — Pria Tanpa Wajah | Slower 4-scene opening: gerbang & map merah → kelas (Aris) → lorong (Siti warning) → kantin: bisik-bisik + Bimo notices Ren |
| **II** | Kesalahan Kecil Aris | Aris menumpahkan air ke sepatu anak geng Bimo → **route fork: [A] Mengabaikan → NEUTRAL / [B] Membela → stair fight → Bimo impressed** |
| **III** | Momen Kunci · (netral: Dinding Dingin & Keheningan Kelas) | Main: rooftop proposition → **[A] ACCEPT BIMO → Bad / [B] REJECT → Resistance**. Netral: 4-scene montage — bangku kosong, konfrontasi Siti, pengabaian Bimo, surat pengunduran diri Aris |
| **IV** | Cabang Cerita & Penentuan Akhir · (netral: Lulus Tanpa Nama) | Branch finale → ending resolver. Netral: hari kelulusan di gerbang utama |

### Endings (canon)

| Ending | Title | Trigger | Lesson |
|--------|-------|---------|--------|
| BAD | "Rantai Dendam" | Accept Bimo | Violence as identity turns you into what you opposed |
| TRUE | "Kebenaran & Solidaritas" | Reject + help Aris in final test | Strength wins fights; intelligence + integrity + solidarity change the future |
| BITTER | "Lulus Tapi Sendirian" | Reject + walk away from Aris | You can protect your future and still lose something inside |
| NEUTRAL | "Lulus Tanpa Nama" | Ignore Aris at the back stairs (Bab 2) | Protecting yourself until no one is left beside you is the quietest way to survive |

`EndingResolver` is a pure function (unit-tested) — never called from UI components.

---

## 🎮 Systems

- **Stats:** HP, Focus (0–100, combat resource), Academic, Violence, Diplomacy, Reputation (UNKNOWN→KNOWN→RESPECTED/TROUBLEMAKER/FEARED)
- **Relationships:** −100…+100 with labels (HOSTILE→SUSPICIOUS→NEUTRAL→ACQUAINTANCE→FRIEND→CLOSE FRIEND)
- **Combat:** Real-time manual — light/heavy/block/dodge; player FSM + enemy FSM (idle/approach/windup/strike/recover/hurt/stagger/ko); hit pause ~60ms; camera shake; Focus-gated heavy/dodge
- **School life:** Day/hour/minute clock with 6 periods (arrival/class/break/lunch/after); NPC schedules per period
- **Quests:** MAIN/SIDE/EVENT with states LOCKED→AVAILABLE→ACTIVE→COMPLETED/FAILED
- **World:** fully procedural, multi-scene map (no school GLB) — campus with accessible interior (hall, classroom, teacher room, canteen), the 3-storey **Gedung B** with a fully walkable switchback stair (all floors reachable, y-aware zones) and the **Perpustakaan** (full interior, neutral-route scene location), plus rooftop & warehouse as on-demand scenes with fade transitions and save-aware positioning
- **Inventory:** 7 categories (ALL/CONSUMABLE/QUEST/KEY/MISC) with usable consumables
- **Save:** Versioned localStorage (`csl-save-v2`), v1→v2 migration, 4 slots (auto/1/2/3), per-field validation
- **Audio:** WebAudio procedural synth (MASTER/MUSIC/SFX/UI/AMBIENT buses), graceful no-op fallback
- **VFX:** Hit pause, camera shake, hurt flash, fade transitions

---

## ⚙️ Performance

- **Bundle:** app code 34KB gzip · React vendor 76KB · Three.js engine3d 1.03MB · CSS 5KB
- **Zero world GLB payload:** the entire school, rooftop and warehouse are procedural geometry (world was rebuilt from scratch in 0.3.0; the 7.3MB school GLB was removed from `public/`)
- **Render guards:** DPR clamp [1,2], shadow map 2048, throttled store writes (@12 frames), few physics bodies (player + walls + ground; NPCs kinematic)
- **v0.9.0 render optimization:** graphics quality presets (auto/high/medium/low — DPR, shadow maps, Sky shader, view distance; persisted, live-applied), frustum + interior render culling over registered static bundles (`<Cull>` + `CullingManager`), single shadow-casting light rig per scene (duplicate root rig removed), and a real-progress loading screen with desktop world-prewarm
- **Code-splitting:** Three.js + R3F isolated in `engine3d` chunk for better caching

---

## ✅ Quality Status (Phase 20)

- **Build:** `npm run build` PASS (0 TS errors)
- **Tests:** 52/52 vitest specs PASS (`systems` + `dialogue` + `storyFlow` + `world`)
- **World v2 (0.3.0):** multi-scene rebuild — campus interior accessible, rooftop & warehouse scenes on demand, scene-aware zones/NPC schedules/minimap, scene persisted in saves
- **Story-flow audit (0.2.1):** resistance-route soft-lock fixed, death recovery via auto-save checkpoints, save integrity on endings
- **Smoke test (Playwright):** 9/9 steps PASS against https://csl-henna.vercel.app/
  - Boot → main menu
  - NEW GAME → opening cinematic (REN speaking)
  - Advance through opening → reach mandatory first choice
  - Select [A] (help Aris) → effects applied to dialogue store
  - Canvas mounts (R3F + Rapier 3D scene)
  - BUG-3.1 fix verified in bundle (pointer lock hint overlay)
  - No console errors
  - Smoke test script: `scripts/smoke-test.mjs` (run: `SMOKE_URL=https://csl-henna.vercel.app/ node scripts/smoke-test.mjs`)

### ⚠️ Known Limitations

- **Headless WebGL:** Full 3D scene rendering crashes in Playwright headless with software WebGL (SwiftShader cannot reliably run R3F + Rapier). This is a headless-only limitation — real browsers (Chrome/Edge/Firefox desktop) handle the scene fine. The smoke test verifies all critical paths up to and including canvas mount.
- **No animated character models:** `char.glb` has no skeleton (DECISIONS.md #13). Runtime characters use procedural `Figure` with limb-swing animation. Compressed NPC GLBs (`public/npc/compressed/`) are ready for future swap-in when animated models become available.
- **No mobile support:** Deferred per PRD §5 (non-goals). Architecture supports later addition.

---

## 📋 Development Phases (per master directive)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Audit + Planning | ✅ | docs + git init |
| 1 — Foundation | ✅ | modular layout + types |
| 2 — Core Engine | ✅ | mode FSM + input + save v2 |
| 3 — Player + Camera | ✅ | 5 bugs fixed (pointer lock UX, run/dodge tap-vs-hold, spawn y, grounded ray, dead state) |
| 4 — World | ✅ | SMA Yuson grounds + zones + colliders + props |
| 5 — NPC | ✅ | Aris/Siti/Bimo/Pak Budi + ambient students + schedules |
| 6 — Dialogue + Choice | ✅ | data-driven graph + effects pipeline |
| 7 — Opening Vertical Slice | ✅ | canon scenes 1–6 |
| 8 — Combat | ✅ | 3 bugs fixed (block Focus drain, block cone angle, enemy idle state) |
| 9 — Quest + School life | ✅ | quest system + time + study mini-game |
| 10 — Social | ✅ | relationship + reputation + stats |
| 11 — World expansion | ✅ | back alley + warehouse finale |
| 12 — Story expansion | ✅ | Ch.2–4 + 3 endings + EndingResolver |
| 13 — Full UI | ✅ | HUD + 9 menus + diegetic phone |
| 14 — Audio + VFX | ✅ | WebAudio + transitions |
| 15 — Polish | ✅ | lighting + camera feel + keyboard nav |
| 16 — Optimization | ✅ | code-splitting + GLB compression |
| 17 — QA | ✅ | 30/30 tests + build pass + 9/9 smoke test |
| 18 — Release | ✅ | README (this file) |

---

## 📄 Documentation

- [`PRD.md`](./PRD.md) — Product Requirements (v0.2)
- [`GDD.md`](./GDD.md) — Game Design Document (v0.2)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Strict layering rules
- [`DECISIONS.md`](./DECISIONS.md) — 14 architectural decisions
- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — One-pager
- [`PROJECT_STATE.md`](./PROJECT_STATE.md) — Audit findings
- [`TODO.md`](./TODO.md) — Phase-by-phase status (synced with reality)
- [`CHANGELOG.md`](./CHANGELOG.md) — 0.1.0 → 0.2.0

---

## 📜 License

All content original (no copyrighted assets). No license file yet — currently "all rights reserved" by default. Add LICENSE file if open-sourcing.
