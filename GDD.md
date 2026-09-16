# GDD — Chaos School Life

Version 0.2. Canon per master directive. All invented-but-necessary content is marked **[PROPOSED]** in DECISIONS.md.

## 1. Pillars

1. **School Life** — the world feels like a real, functioning school.
2. **Exploration** — being in the yard, corridors and back areas is enjoyable.
3. **Social Relationships** — Aris, Siti, Bimo react to who Ren becomes.
4. **Action** — real-time, responsive, physical combat.
5. **Choice & Consequence** — decisions shape routes, stats, endings.
6. **Replayability** — routes/stats/relationships genuinely differ per run.

## 2. Fantasy & emotional arc

Keep your head down → something is wrong here → I'm involved whether I like it or not → my choices are catching up with me → this happened because of what I chose.

Central question: *"What kind of person will Ren become because of the choices he makes?"*

## 3. Characters

| Character | Role | Personality/voice |
|---|---|---|
| **Ren** | Player. Transfer student, smart, reserved, calm, focused | Terse inner monologue; wants grades + quiet exit |
| **Aris** | Ren's deskmate; bullying target | Quiet, nervous, cautious; grateful, not clingy |
| **Siti** | Student-council (OSIS) figure | Firm, observant, direct, brave — not a caricature hero |
| **Bimo** | Gang leader | Confident, watchful, influential; notices Ren early; never monologues |
| **Students (generic)** | Crowd life | Ambient schedules, whispers, avoidance behavior |
| **Pak Budi** | Teacher [PROPOSED from PRD v0.1] | Quest/academic gateway; academic consequences |

## 4. Story (CANON — do not silently change)

> **v0.7.0 rework:** Chapter 1–2 mengikuti GDD dokumen §"Alur yang lebih lambat"
> dan §"Rute Netral". Rute utama (bad/resistance) dari rooftop ke akhir cerita
> tidak berubah.

### Chapter 1 — Minggu Pertama: Pria Tanpa Wajah (slow opening)
Opening yang lebih lambat, empat scene dengan fade-cut: **Scene 1** gerbang pagi —
pagar karatan, bau cat semprot, murid menunduk; Ren memegang map merah
(surat pindahan + nilai hampir sempurna) dan monolog janji pribadinya →
**Scene 2** kelas 11-B — Ren duduk di sudut belakang, dua murid besar menyenggol
kursi Aris sampai pulpen jatuh; Ren memilih terus mencatat (canon), lalu Aris
menyodorkan penghapus dan berkenalan → **Scene 3** lorong istirahat — Siti
(nametag OSIS) mengenali nilai transfer Ren dan memberi peringatan aturan tak
tertulis → **Scene 4** kantin sore — dua murid kelas 10 berbisik tentang Bimo
(insiden parkiran, SMA 4 lari kocar-kacir), lalu keheningan merambat: Bimo masuk
dengan tiga pengikut, tidak bicara, hanya menatap Ren lebih lama dari yang perlu →
cinematic ends, FP→TP transition, HUD, first objective: **EXPLORE SMA YUSON**.

### Chapter 2 — Kesalahan Kecil Aris (route fork)
Jam istirahat, lorong tangga menuju kantin belakang. Aris tersandung; botol
minumnya menumpahkan air ke sepatu anak geng inti Bimo; bukunya ditendang sampai
kotor; dia dicengkeram dan mau diseret ke belakang kantin. **GARIS CABANG RUTE
(mandatory): [A] Mengabaikan → RUTE NETRAL / [B] Membela Aris → stair fight
(pertarungan real-time) → Bimo terkesan → alur utama.**

### Chapter 3 — Momen Kunci · (netral: Dinding Dingin & Keheningan Kelas)
- **Rute utama:** Bimo memanggil Ren ke rooftop dan menawarkan tempat di gengnya.
  **Choice: [A] ACCEPT BIMO → BAD ROUTE / [B] REJECT BIMO → RESISTANCE ROUTE**.
- **Rute netral (montage):** Scene 1 bangku kosong & kacamata retak (Ais pulang
  dengan lebam; memotong Ren dengan panik) → Scene 2 konfrontasi Siti di
  perpustakaan ("cara hidupmu dingin banget") → Scene 3 pengabaian Bimo ("cuma
  penakut lain yang kebetulan pinter") → Scene 4 surat pengunduran diri Aris
  dibacakan Pak Budi. Ren tetap aman — dan makin sesak.

### Chapter 4 — Cabang Cerita & Penentuan Akhir · (netral: Lulus Tanpa Nama)
- **Bad Route:** status/protection/power → comfortable with violence, academics decline, Aris & Siti distance → warehouse gang confrontation as Bimo's enforcer → escalation → police raid → Bimo escapes and shifts blame → Ren arrested, expelled → **BAD ENDING "Rantai Dendam"** (lesson: violence as identity turns you into what you opposed).
- **Resistance Route:** Bimo retaliates; Aris cornered and beaten outside school; Ren arrives → final moral test → **help** → Siti records the gang's crimes from a safe distance → evidence exposes the gang → **TRUE ENDING "Kebenaran & Solidaritas"** (lesson: strength wins a fight; intelligence, integrity, solidarity change the future) / **walk away** → Aris severely traumatized, leaves school; Siti distances; Ren still graduates and enters university but stands alone on graduation day → **BITTER ENDING "Lulus Tapi Sendirian"** (lesson: you can protect your future and still lose something inside).
- **Neutral Route:** bulan-bulan berlalu; hari kelulusan di gerbang utama — nilai
  Ren tertinggi di angkatan, murid lain berpelukan dengan geng masing-masing;
  Siti berlalu dengan anggukan dingin tanpa ucapan selamat. Ren keluar sebagai
  orang yang kehilangan hatinya → **NETRAL ENDING "Lulus Tanpa Nama"** (lesson:
  melindungi diri sampai tidak menyisakan siapa pun di sampingmu adalah cara
  selamat yang paling sunyi).

### Ending system
`EndingResolver(route, academic, focus, violence, diplomacy, relationships, reputation, storyFlags) → { endingId: 'bad' | 'true' | 'bitter' | 'neutral', title, summary, lesson, stats, nextAction }`. Pure function, unit-tested, never called from UI components.

## 5. Systems

### 5.1 Stats
- **HP** (health, combat) — 100 base.
- **Focus** 0–100 — concentration; boosts combat (dodge/attack recovery); earned by resting/study; spent/buffed in combat; not a cheat code.
- **Academic** 0–100 — studying, class attendance, quests; declines with violence/skipping.
- **Violence / Diplomacy** 0–100 behavioral tendencies — context-sensitive (defending someone ≠ beating a downed opponent).
- **Reputation** states: UNKNOWN → KNOWN → RESPECTED / TROUBLEMAKER / FEARED. Never on the gameplay HUD.
- **Relationships** −100…+100: HOSTILE, SUSPICIOUS, NEUTRAL, ACQUAINTANCE, FRIEND, CLOSE FRIEND. Influence dialogue, quests, events, endings.

### 5.2 Combat (real-time, manual)
- Controls: **LMB** light attack, **Q** heavy attack, **RMB** block, **Shift** dodge, Space jump, movement stays active.
- Player states: IDLE/MOVE/ATTACK/HEAVY/BLOCK/DODGE/HURT/STAGGER/KO.
- Enemy FSM: IDLE/DETECT/APPROACH/ATTACK/HURT/STAGGER/KO/FLEE. Perception radius; AI active only in encounters.
- Feel: hit pause ~60ms, subtle camera shake, impact SFX hook, brief flash VFX, hit reaction. Physical, not cartoonish.
- Hit detection: gameplay-level (range + facing cone), not physics-impulse based.

### 5.3 School life & time
Day/hour/minute/period (07:00 arrival, 08:00 class, 10:00 break, 11:00 class, 12:00 lunch, 14:00 ends — configurable). Time advances via activities/transitions, not constant ticking pressure. NPC schedules per period (Aris: class/break/study/home; Siti: class/OSIS/study; Bimo: class/gang/social area). Generic NPCs cheap waypoints, no expensive AI.

### 5.4 Study mini-game
Short Q&A (question → answer → score → reward: Academic+, Focus+). Takes ~a minute. **[PROPOSED]** 5-question Math/Bahasa/English rounds.

### 5.5 Quests
Types MAIN/SIDE/EVENT. States LOCKED/AVAILABLE/ACTIVE/COMPLETED/FAILED. Data: id, title, description, objectives, conditions, effects, reward.

### 5.6 Inventory
Student belongings (Notebook, Phone, Student Card, Water Bottle, Snack, Medicine, quest items). Categories ALL/CONSUMABLE/QUEST/KEY/MISC. Consumables usable (heal/focus).

### 5.7 Save (v2, localStorage, versioned)
`saveGame/loadGame/deleteSave/hasSave`; v1→v2 migration; validation; corrupted save never crashes.

### 5.8 Audio
WebAudio procedural synth buses: MASTER/MUSIC/SFX/UI/AMBIENT. Hooks: footsteps, jump, land, attack, hit, dodge, dialogue blip, UI hover/click, chapter sting, combat layer. Graceful no-op when unavailable.

## 6. World — SMA Yuson

Playable grounds around the school model: **Main Gate, Courtyard, Main Building (exterior), Canteen area, Field, Back Area/Alley, Parking**. Outside (street/park edge) accessible; Warehouse = Bad Route finale arena (fog + props). Small but dense; every area has purpose + landmark. Areas load as one scene (single area), spawn zones + fog for atmosphere; warehouse/outside scenes are simple set-dressed variants.

**v0.8.0 landmarks:**
- **Gedung B** (kelas bertingkat, timur halaman belakang): 3 lantai, lorong
  terbuka sisi utara, tangga switchback beton yang bisa dinaiki ke semua
  lantai. Kelas 10-A (L1), Ruang OSIS (L1), Kelas 12-A (L2), Ruang UKS (L2),
  Kelas 12-B (L3), Ruang Loker (L3). Zona per lantai (y-aware).
- **Perpustakaan** (antara gedung utama dan parkir): rak buku, meja baca,
  loket pustaka. Lokasi konfrontasi Siti pada rute netral (Bab 3, "Dinding
  Dingin" scene 2) — shot cinematic memakai interior asli; Siti berada di
  perpustakaan pada periode selepas sekolah.

## 7. UI

Cinematic school-life + tactical combat. Palette: charcoal `#141a21`, off-white, amber (objective), crimson (danger/combat), cyan (focus/info), green (positive/social). Normal gameplay HUD is minimal (REN, HP, FOCUS, day/time, objective, [E] INTERACT). Dashboards live in menus. Dialogue: speaker, portrait, typewriter, skip, keyboard nav; ≤ ~40% screen. Queued notifications. Menus fully keyboard navigable (arrows/WASD, Enter, Esc). Responsive via clamp()/relative sizing.

## 8. Controls (keyboard+mouse, primary)

| Input | Action |
|---|---|
| WASD | Move (camera-relative, acceleration) |
| Shift (hold) | Run |
| Space | Jump |
| Mouse | Camera orbit (pointer lock), wheel zoom |
| LMB | Light attack / interact-confirm in dialogue |
| Q | Heavy attack |
| RMB (hold) | Block |
| Shift (tap, in combat) | Dodge |
| E | Interact |
| Tab / R / M / P | Status / Relationships / Map / Phone |
| Esc | Pause / back |
| J/K/L | (Legacy menu-combat removed) |

## 9. Visual direction

Restrained realism: warm morning ambient, ACES tonemapping, subtle fog, soft shadows. Combat: stronger contrast, red accents. Narrative: letterbox, reduced HUD. No constant postprocessing; restrained bloom/vignette only during danger if budget allows.
