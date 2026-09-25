# Changelog

## 0.17.1 — 2026-09-25 (Story Architecture Scalability — StoryDirector bebas konten)

Phase 8 directive: story progression jadi data-driven. Target: "menambah story
beat TIDAK lagi menambah if/switch spesifik-cerita di StoryDirector.tsx" —
TANPA mengubah arsitektur DATA → STORES → SYSTEMS → RUNTIME → UI, tanpa
EventBus/ECS/DI, tanpa menyentuh kanon/ending/save schema.

### STORY TRIGGER registry (data/story/triggers.ts — BARU)
- 15 blok if per-beat di StoryDirector.tsx (366 → ~175 baris, kini NOL id
  cerita) pindah jadi 16 baris `StoryTriggerDef` data: 6 montase
  (bond_lib/pts, netral, osis, bad, res), sergapan parkiran, 3 kelulusan
  (netral/bad/good), SECRET CHOICE POINT 2 cabang (guard flag `neu_secret_done`
  DIKELOLAS BERSAMA — zona mana pun yang kena duluan mengunci keduanya,
  perilaku asli), rooftop intro, kartu BAB II + scene BAB II (dua fase),
  find_aris (satu-shot via `fire` yang menyelesaikan quest-nya sendiri).
- `StoryTriggerDef { id, once?, when, scene?, duringCinematic?, open?, fire? }`:
  kondisi memakai sistem Condition yang ada, efek memakai pipeline
  applyEffects yang ada — tidak ada logika game baru di trigger system.
- Runner generik `systems/storyTriggers.ts` (MURNI, teruji): urutan registry =
  urutan evaluasi (montase dulu), guard once-flag / dialogue-terbuka / mode
  (montase boleh GAMEPLAY+CINEMATIC — perilaku asli montageReady; lainnya
  GAMEPLAY saja) / scene default 'campus' (rooftop_intro scene:'rooftop') —
  semua identik dengan blok engine yang dihapus.
- **SAVE COMPAT terkunci test**: nama `once` = flag historis persis
  (bond_lib_done, ch2_scene_started, neu_secret_done, dst.) — save lama v2
  yang sudah menembus montase tidak akan menyalanya ulang.
- MONTAGE_ROOTS & STORY_TRIGGER_NODES kini DERIVASI dari registry (dua tabel
  manual dihapus) — staging/cinema/storyFlow tests otomatis mengunci semua
  pintu masuk scene punya staging Ren + cameraStage.

### Quest completion jadi data (quest loop yang sama, v0.17.0)
- `explore_school`: completeWhen = beat ch1_explore + `visited` 4 zona;
  onComplete = selesai → lompat jam ke 10:05 (`time-to`) → beat ch1_friendship
  → 2 toast (warna kind:'quest' dipertahankan) → auto-save. Urutan efek persis
  blok engine lama. Konstanta EXPLORE_TARGETS dihapus dari engine.
- `rooftop_meeting`: completeWhen = back_stairs + bab 3; onComplete = selesai →
  beat ch3_rooftop → flag rooftop_arrived → toast "Tujuan: Naik ke atap" →
  scene rooftop. Persis blok engine lama.
- Effect baru: `time-to` (maju ke jam dinding berikutnya, formula identik
  termasuk wrap penuh 1440), `notify.kind` opsional, `quest.silent` (opt-out
  toast standar supaya trigger yang dulu diam tetap diam — nol delta UX).
- Condition baru: `beat` (posisi cerita; ConditionContext.beat kini required —
  kompiler memaksa semua builder mengisi), `visited` (semua zona terkunjungi).

### Jaga-jaga arsitektur
- StoryDirector tinggal mesin generik: interaksi E (registry NPC + hidden
  events), loop trigger, exit scene (SceneDef.exits), zone flavor
  (ZONE_FLAVOR), loop quest completion (QuestDef). Tidak ada EventBus/ECS/DI/
  factory — abstraksi terkecil yang buktinya dibutuhkan (pola "beat +
  kondisi → buka dialog" terulang 14×).
- Kasus khusus yang sengaja tetap engine: TIDAK ADA — semua blok
  spesifik-cerita terkonversi; interaksi E & hidden events memang generic.
- Kanon/ending/rute/dialog teks/save schema/controls: TIDAK berubah.

### Verifikasi
- 290/290 test (267 lama + 23 baru di storyTriggers.test.ts: integritas
  registry, kunci save-compat once-flag, 16 skenario kanon, gating engine,
  secret-pair guard bersama, quest data, kondisi beat/visited).
- tsc -b bersih; vite build sukses; check:cycles 0 siklus.
- QA headless: qa-walk 15/15, qa-face 5/5, qa-nav PASS, qa-mentor PASS —
  CONSOLE_ERRORS none di semua.

## 0.17.0 — 2026-09-24 (Architecture Increment — registries, cycle-free, save hardening)

Fase 0-12 audit + refactor inkremental (user directive: "scalable & maintainable
WITHOUT rewrite"). Prinsip: menambah konten = menambah DATA, bukan mengubah
engine. Tidak ada perubahan cerita/kanon/ending; tidak ada perubahan save
schema (v2 tetap, kompatibel penuh).

### Audit → perbaikan P0
- **CIRCULAR DEPS 2 → 0** (madge, `npm run check:cycles` baru + devDep madge):
  (1) dialogueStore ⇄ effects — cleanup 'ending' dipindah ke ENDING-guard di
  dialogueStore.advance/choose (store yang memiliki reset-nya sendiri);
  (2) save → combat → dialogueStore → effects → save — `loadGame` pindah ke
  `game/loadFlow.ts` (orchestrator baru; save.ts kini modul storage murni).
  Hack dynamic-import lama (App.tsx continueGame, effects.ts 'save') tinggal
  satu (effects 'save' — terdokumentasi).
- **REGISTRI NPC SATU SUMBER** (audit N1/E1): NpcDef + field baru
  `storyCast / relTag / relQuote / hiddenWhen`. Kini turunan otomatis dari
  `data/npcs.ts`: socialStore init+reset (dua tabel literal dihapus),
  save.migrateV1 (V1_CAST eksplisit utk era v1), UI relasi (REL_QUOTES/
  REL_TAGS dihapus), layar ending (span ARIS/SITI/BIMO → registry), visibility
  dunia (branch `def.id === 'aris'` di Npc.tsx → `hiddenWhen` data). Menambah
  NPC: types union + npcs.ts + dialog saja — tidak ada lagi edit engine/UI.
- **SAVE HARDENING + 15 TEST BARU** (audit J1, save.test.ts BARU): route
  divalidasi terhadap `ROUTES` (runtime const di types), chapter terhadap
  registri CHAPTERS, beat type-checked; migrateV1/parseSave/applySave/roundtrip
  save→load + 'Slot kosong' vs corrupt kini terkunci test.

### Audit → perbaikan P1 (data-driven)
- **QUEST**: `QuestDef.waypoint` (12-case switch di waypoint.ts dihapus) +
  `QuestDef.completeWhen/onComplete` — 4 blok penyelesaian side-quest
  hardcode di StoryDirector.tsx jadi data (aturan baru: quest aktif +
  completeWhen true → onComplete sekali per tick).
- **CHAPTER**: `ChapterDef.defaultBeat/subtitleByRoute` — peta beat + 3
  literal subtitle rute keluar dari effects.ts (bab 5 nanti = baris data).
- **SCENE**: `SceneDef.exits` (dua branch exit + koordinat spawn kampus
  terkubur di kode → data, gerbang chapter-3 atap dipertahankan) +
  `SCENE_VIEWS` map deklaratif di World.tsx (pengganti if-chain).
- **CONDITION COMBINATORS**: `any` / `not` / `item` (baru; `and` tetap) —
  switch interpreter tetap exhaustive, jenis baru = error kompilasi.

### P2 (perf & render hygiene)
- Hot path bebas alokasi berulang: `downRay` reuse di Player (1-2
  `new rapier.Ray` per frame dihapus), 4 Vector3 modul di CameraRig
  (oklusi + transisi FP→TP), tulis registry posisi NPC/crowd/actor IN-PLACE
  (bukan objek {x,z} baru per frame), StatusPanel kini field-selectors.

### Verifikasi
- **267 test** (249 → 267: +15 save, +4 kondisi, -1 digabung) · tsc -b ✓ ·
  build ✓ · madge 0 cycles · qa-nav ✓ · qa-walk **15/15** · qa-face **5/5** ·
  CONSOLE_ERRORS none. Simpan lama & otomatis kompatibel (schema v2 tak ubah).

## 0.16.1 — 2026-09-24 (Arah Hadap Karakter Mengikuti Kamera)

User: "arah hadap karakter tidak mengikuti kamera, buat mengikuti kamera".

### Perilaku baru
- **GAMEPLAY diam** (tanpa input gerak): badan Ren berputar halus mengikuti
  arah kamera — `systems/facing.ts` BARU (`camForwardAngle` + `approachFacing`,
  9 rad/s, busur terpendek, snap tanpa overshoot). Konversi yaw kamera → sudut
  badan memakai formula PERSIS sama dengan lokomosi (facing = atan2(dirX,
  dirZ), forward = (−sin yaw, −cos yaw)) — melepas tombol W tidak pernah
  menyentakkan figur. Sambil berjalan tetap menghadap arah gerak (memang
  relatif-kamera sejak awal): putar kamera sambil jalan otomatis mengubah
  arah hadap.
- **COMBAT diam / memblock**: badan otomatis menghadap MUSUH (12 rad/s), bukan
  ke kamera. Percobaan pertama "idle ikut kamera" membuat pukulan berdiri
  MELESAT di qa-walk (cone hit membaca playerPos.facing; badan tertarik ke
  arah kamera yang tidak tepat mengarah musuh — regesi nyata, 14/15). Aturan
  brawler final: diam = menghadapi ancaman → block/pukulan selalu siap; rig
  orbit memang menahan musuh di tengah layar, jadi di praktik arah ini ≈
  arah kamera. Cone hit/block kini tidak pernah gagal karena arah badan.

### Teknis
- `Player.tsx`: cabang idle (hSpeed ≤ 0.4) → `approachFacing(playerPos.facing,
  camForwardAngle(camYaw()), dt)`; cabang gerak tidak berubah.
- `combat.ts`: cabang idle + blok → `approachFacing(facing, atan2(dx, dz),
  dt, COMBAT_TURN_RATE)` dengan dx/dz = musuh − pemain live per tick.
- `main.tsx`: QA handle baru `__csl.camYaw()` + `__csl.camFacingTarget()`.
- `scripts/qa-face.mjs` BARU — drag kamera NYATA (LMB hold + geser), lalu poll
  konvergensi badan: GAMEPLAY drag kanan 2.03 rad + drag kembali, COMBAT badan
  ke musuh walau kamera diseret menjauh. 5/5 PASS, CONSOLE_ERRORS none.
- TEST: `facing.test.ts` BARU (10 — konvensi sudut terkunci ke formula
  lokomosi, jembatan ±π (atan2(−0,−1) = −π), snap tanpa overshoot, dt ≤ 0
  no-op, konvergensi penuh 200 frame) + `combat.test.ts` +2 (diam di COMBAT
  berputar menghadap musuh dari posisi membelakangi; memblock ikut menghadap
  musuh) → **249 hijau** · tsc ✓ · build ✓ · qa-nav ✓ · qa-walk 15/15 ✓.

## 0.16.0 — 2026-09-24 (Collision Karakter + Anti-Softlock Watchdog + Audit Game Penuh)

User: "kasih batas/collision setiap karakter supaya tidak bisa gabung/menumpuk,
dan juga karakter kita belum bisa jalan2" + "test semua rute/alur/ending/scene/
combat, pastikan semuanya aman".

### Fitur baru: collision karakter (v0.16.0)
- `systems/collision.ts` BARU — personal space 0.84 m (2× CHAR_RADIUS 0.42):
  `resolveOverlaps` (dorong keluar dari tumpukan, 2 pass relaksasi),
  `stripIntoVelocity` (slide mengelilingi badan, bukan menembus),
  `nearbyBodies` (shortlist tetangga ≤ 1.4 m; biaya per frame datar).
- Pemain vs NPC jadwal + ambient crowd + musuh: `runtime.crowdPositions` BARU
  (Student kini meregistrasi posisi live + stale-guard unmount); Player.tsx
  GAMEPLAY men-strip komponen kecepatan yang menuju badan lalu dorong keluar.
- COMBAT: ring 0.95 m memotong kecepatan menuju musuh (dodge pun tidak bisa
  menembus) + dorong keras ke ring 0.8 m bila sudah tumpang tindih. BLOK LAMA
  "keep enemy at fair distance" TERNYATA SAMA ARAHNYA TERBALIK — malah
  menyeret musuh LEBIH DEKAT; kini koreksi posisi keras dari posisi terkini.
- NPC & crowd menahan langkah saat terlalu dekat ke pemain (tidak ada lagi
  figur yang menembus Ren saat berjalan).

### Akar "karakter stuck ga bisa jalan" — dua bug fisika + satu crash
1. **Rapier body SLEEP di COMBAT**: `combatTick` memanggil `setLinvel` TANPA
   `wake=true` — badan yang tertidur mengabaikan SEMUA perintah gerak selama
   duel (jalan di GAMEPLAY normal karena branch sana selalu wake). Inilah
   "pemain belum bisa bergerak (wasd, spasi)" yang berulang.
2. **Penembusan lantai saat spawn/teleport**: collider dunia belum solid saat
   body sudah dijatuhkan → tenggelam → respawn y<-2 → tenggelam lagi
   (headless: 4 respawn/15 dtk; di HP lemah terbaca "stuck"). Kini pin
   spawn-settle 2.5 dtk REAL-TIME (lepas cepat saat ground-ray mengenai),
   respawn & teleport memasang ulang pin.
3. **LAYAR PUTIH dari settings korup**: `loadPersisted` hanya cek typeof —
   `quality: "RENDAH"` (label, bukan enum) lolos → `qualityConfig()` undefined
   → crash saat modul dimuat, permanen lintas reload. Kini validasi nilai per
   kunci (enum/range) + `resolveQuality` fallback SEDANG untuk nilai asing.

### Anti-softlock watchdog (App.tsx)
Interval 500 ms: DIALOGUE tanpa node → GAMEPLAY; CINEMATIC tanpa node &
opening_complete → GAMEPLAY; COMBAT dead (`!encounterId`/phase null/fighting
tanpa musuh) → reset + GAMEPLAY; 'won'/'lost' > 4 dtk → resolve seperti owner-
nya (finishCombatWin/reset). Setiap mode perampas kontrol kini punya
pengaman, apa pun bug yang mematikan ownernya.

### Audit game penuh (user: "test semua rute/alur/ending/scene/combat")
- `qa-walk.mjs` BARU — QA INPUT NYATA headless: WASD/strafe/jump/gerak
  combat/musuh mendekat/attack connect/joyistik via `window.__csl` (QA handle
  baru di main.tsx: mode/pos/enemy/combat/teleport/axes). **15/15 PASS**.
- `storyGraph.test.ts` BARU — closure seluruh graf dialog: semua next/choices
  menunjuk node nyata, 5 chain ending terhubung (termasuk lewat __combat__ →
  onWin/onLose), semua ENCOUNTERS punya musuh valid & onWin/onLose ada.
- Test +25: 232 → **237/237** · tsc -b ✓ · build ✓ · qa-nav ✓ (CONSOLE_ERRORS
  none). Simpan lama aman; tidak ada perubahan data cerita.

## 0.15.2 — 2026-09-24 (AI Musuh Mendekat & Menyerang, Pemain Tak Lagi Stuck, UI Anti-Bertumpuk)

User: "bot/ai musuh nya belum bener (malah jalan lurus menjauh dari kita, dan
belum nyerang kita) / karakter stuck ga bisa jalan / uinya masih bertumpuk" —
dan masih terjadi setelah v0.15.1 ("masih sama").

### Root cause (audit)
1. **Musuh menjauh & tak pernah menyerang**: `case 'approach'` menambahkan
   vektor pemain→musuh (`enemyPos += n`) — arahnya MENJAUH dari pemain. Musuh
   berjalan lurus keluar arena sejak spawn, tak pernah sampai radius windup
   (1.7 m) sehingga tidak pernah menyerang. Bug lama; baru terlihat setelah
   v0.15.1 karena sebelumnya pemain tumbang ±2 ayunan sebelum sempat
   mengamati perilaku AI.
2. **Pemain stuck (WASD/spasi mati)**: `dialogueStore` memakai fallback
   `BEAT_ENCOUNTER[beat] ?? 'gate_fight'` — `gate_fight` SUDAH DIHAPUS dari
   ENCOUNTERS sejak v0.7.0. Beat tanpa entri → `start('gate_fight')` gagal
   diam-diam → mode COMBAT TANPA phase 'fighting' dan tanpa musuh → cabang
   freeze di Player.tsx membekukan pemain selamanya; tidak ada UI combat,
   tidak ada jalan keluar kecuali reload.
3. **UI bertumpuk**: notifikasi menimpa panel darah musuh; di layar sentuh
   chip hint keyboard (LMB/Q/RMB/SHIFT) tertimpa tombol ATK/HEV/BLK/DGE; chip
   dekoratif tengah (cb-mid) menjerap panel darah di layar sempit.

### Fix
- `combat.ts` approach: `enemyPos -= n` (mendekat). Anti-kite: saat
  dist > 3.5 m musuh mengejar ≥ 3.6 m/s (di atas jalan pemain 3.4, di bawah
  lari 5.6 — lari tetap jadi opsi memesan jarak); dekat kembali ke speed data.
- `dialogueStore`: guard encounter valid — beat tanpa encounter terdaftar
  TIDAK memulai combat; pulih ke GAMEPLAY + `console.warn` (fail-safe).
- `Player.tsx`: anti-stuck — mode COMBAT tanpa `encounterId` aktif pulih
  sendiri ke GAMEPLAY. Fase transien 'won'/'lost' masih membawa encounterId
  → tetap freeze 1 frame sampai finishCombatWin/onLose memindahkan mode.
- `Hud.tsx` + `styles.css`: `body.in-combat` — notifikasi digeser turun ke
  bawah panel darah musuh; pointer coarse: chip hint keyboard disembunyikan,
  panel darah turun di bawah tombol pause, hud-top diberi padding kanan;
  cb-mid disembunyikan di layar sempit.

### Test
- `combat.test.ts` +4: musuh MENDEKAT lalu masuk windup/strike (dulu kabur
  terus); kejaran ≥ 3.6 m/s saat jauh (anti-kite); speed data saat dekat;
  guard BEAT_ENCOUNTER — semua encounter masih terdaftar di ENCOUNTERS.
  → **216/216** · tsc -b ✓ · build ✓ · qa-nav CONSOLE_ERRORS none.
- Save lama aman; tidak ada perubahan data/story/encounter.

## 0.15.1 — 2026-09-23 (Fix Combat System: Satu Ayunan = Satu Hit + Ekonomi Fokus)

User: "fix combat system". Audit combat runtime menemukan bug yang membuat
pertarungan secara matematis mustahil dimenangkan — terutama secret_fight
v0.15.0 (4 lawan beruntun).

### Root cause (audit)
- **Enemy strike multi-hit**: damage `case 'strike'` tersettle SETIAP frame
  selama jendela aktif (`st.t < 0.12` ≈ 7 frame @60fps) tanpa guard — satu
  ayunan Anak Bimo (dmg 9) membawa ±63 damage; pemain 100 HP tumbang dalam
  2 ayunan. Inilah penyebab pertarungan terasa "tidak adil/cepat mati".
- **Fokus tidak pernah pulih** selama duel: heavy (−10), dodge (−6), block
  (−12/dtk) menguras total → pemain terkunci dari semua aksi utilitas untuk
  sisa pertarungan. Pembulatan `setFocus` per-set juga membuat regen
  fraksional mustahig (+0.11/frame selalu terbulatkan balik).
- **Dodge mengarah KE musuh**: `dir = normalize(musuh − pemain)` — menghempas
  langsung ke jangkauan pukulan berikutnya begitu invuln habis.
- **Enemy advance membatalkan combo pemain**: CombatScene memanggil
  reset runtime penuh tiap ganti lawan (attack/dodge/invuln pemain ikut
  terhapus di tengah pukulan).
- **winTimer 1/60 tetap**: jeda kemenangan memanjang di perangkat low-FPS
  (30 fps ≈ 2.8 dtk menunggu layar menang).

### Fix
1. `combat.ts`: flag `hitDone` pada EnemyState — satu ayunan hanya
   menghubungkan SEKALI (block pun sama; swing tidak terbakar saat pemain
   invuln/di luar jangkauan di awal window).
2. Ekonomi Fokus: regen **+7/dtk** saat bebas gerak (tidak menangkis),
   reward **+4** per pukulan yang menghubungkan; `setFocus` tanpa
   pembulatan (akumulasi fraksional; HUD tetap membulatkan tampilan).
3. Dodge: arah mengikuti input gerak yang ditahan (relatif kamera, konvensi
   lokomosi combat); tanpa input → backstep menjauhi musuh.
4. `CombatScene.tsx`: lawan berikutnya maju → hanya `resetEnemyRuntime()`
   (baru) — state pemain selamat; reset penuh hanya saat encounter baru.
5. winTimer memakai delta frame nyata.
6. Bersih-bersih: `facingDot` (dead code) dihapus; drain block membaca state
   fresh (bukan snapshot usang → release blokir tidak telat 1 frame).

### Test
- `src/test/combat.test.ts` BARU (18 test) — suite pertama yang menyentuh
  combatTick: strike single-hit/block/whiff/invuln, arah & biaya dodge,
  regen & reward fokus, pemisahan reset player vs enemy, KO, onLose
  (secret_fight → cabang cerita, bukan GAME_OVER) vs tanpa onLose
  (→ GAME_OVER). Total **212/212 hijau** (194 + 18).
- tsc -b ✓ · vite build ✓ · qa-nav headless CONSOLE_ERRORS none.

## 0.15.0 — 2026-09-22 (Alur = Laporan Final Project: GARIS MERAH Selaras Penuh)

User: "sesuaikan alur" + lampiran laporan final project (LAPORAN FINAL
PROJECT: SCHOOL LIFE — desain naratif Naufal, "DRAF CERITA UTAMA: GARIS
MERAH"). Audit membandingkan naskah dokumen dengan graph cerita di game;
semua celah struktural ditutup. Dialog konten baru diambil persis dari
dokumen.

### Celah yang ditemukan (audit) & ditutup
1. **5 FLAVOR CHOICE (🔹 dokumen) tidak ada** — semua sekarang pilihan
   dua-opsi, penuh teks dokumen, selalu menyatu kembali (tidak mengubah
   rute; efek kecil rel/stat):
   - CHOICE 1 perkenalan Aris (o2_c1: singkat & praktis / agak ramah)
   - CHOICE 2 respons peringatan Siti (o3_c2: acuh tak acuh / penasaran)
   - CHOICE 3 pembelaan diri Ren rute netral (n2_c3: prinsip / realistis)
   - CHOICE 4 respons ultimatum Bimo (ch3_fc4: sinis / tenang & lugas)
   - CHOICE 5 gertakan sebelum duel final (ch4_fc5: langsung / utamakan Aris)
2. **Doc CH3 "Persahabatan Aris" (perpustakaan) hilang** — ditambah sebagai
   montase otomatis `ch1_lib_1..6` (beat ch1_friendship), kamera library_*,
   Aris distage di meja (spot n2 yang sudah teruji).
3. **Doc CH4 "Ujian Pertama" (PTS, nilai 98) hilang** — montase `ch1_pts_1..5`
   (beat ch1_pts), Pak Budi + Aris distage di kelas. Rantai beat baru:
   `ch1_explore → ch1_friendship → ch1_pts → ch1_break` — bonding arc kini
   SELALU tampil sebelum insiden tangga (doc Ch5 = BAB II), tidak bisa
   terlewat.
4. **Urutan montase netral tidak sesuai dokumen** — diurutkan ulang:
   n3 = surat pengunduran diri Aris (doc CH6 s3), n4 = pengabaian Bimo
   (doc CH7), n5 = bulan-bulan sunyi + tryout lancar (doc CH8+CH9, baru).
5. **SECRET CHOICE POINT + 2 secret endings hilang (doc CH10 & EPILOG)** —
   setelah konfrontasi Siti (dialog penuh dari dokumen), pemain mengontrol
   Ren TANPA popup (beat ch4_neu_secret): keluar lewat gerbang (zona street)
   → standard neutral "LULUS TANPA NAMA"; balik ke gang belakang kantin →
   intro Bimo (teks dokumen) → SECRET BATTLE (encounter `secret_fight`:
   3 anak buah + Bimo, musuh berurutan) — KALAH → Secret Bad Ending A
   "BONYOK TANPA NAMA" (ch4_neu_sbl), MENANG → Secret Bad Ending B
   "KEMENANGAN TERLAMBAT" (ch4_neu_sbw). Total kini 6 ending, resolveEnding
   diperluas (id neutral_lost / neutral_won; flag dicek sebelum route).
6. **onLose encounter** — kalah dalam pertarungan kini bisa menjadi cabang
   cerita yang sah (bukan hanya game over generik): EncounterDef.onLose +
   penanganan kekalahan di combat.ts (khusus secret_fight; semua pertarungan
   lain tetap game over seperti semula — perilaku tabel testing laporan).

### Teknis
- Node baru: bonding 11, netral +5, netral-ending +16, flavor +16 → graph
  DIALOGUE 194 node teruji integritasnya. Semua node baru diberi
  CAM_BY_NODE + SCENE_ACTORS + REN_STAGING (spot teruji dipakai ulang;
  rombongan secret = Bimo + 4 pengikut, sisanya narasi).
- StoryDirector: 2 montase bonding otomatis + 2 zona pemicu secret
  (street/back_alley) dengan flag guard neu_secret_done.
- audio.ts MusicContext.endingId diperluas; secret endings memakai track
  ending_bad.
- Simpan lama aman: beat ch1_break (simpanan lama) melompati bonding dan
  langsung ke tangga; simpanan di gerbang netral tetap mendarat di SECRET
  CHOICE POINT.

### Test
- perf/unit: **194/194 hijau** (17 file) — +13 kasus baru: rantai bonding,
  urutan montase netral (surat → Bimo → bulan sunyi), kelima flavor choice,
  wiring secret battle (onWin/onLose → dua chain ending terisolasi),
  resolveEnding 6 ending + prioritas flag, STORY_PROPS o2_6a/6b.
- tsc -b ✓ · vite build ✓ · qa-nav headless CONSOLE_ERRORS none.

## 0.14.4 — 2026-09-22 (GPU Sniffing: Laptop iGPU Tidak Lagi Dapat TINGGI)

Laporan user via performance audit eksternal (Playwright 60 detik gameplay
aktif, v0.14.3 live): rata-rata 18.3 FPS, 1% low 10 FPS, >1.100 draw call
per frame, preset default TINGGI (DPR 2.0 + MSAA + shadow 2048 + IBL) pada
laptop iGPU "AMD Radeon Graphics". Ini lapisan akar masalah BARU di luar
cakupan v0.14.3 (yang memperbaiki preset RENDAH, bukan default TINGGI).

### Root cause (audit)
1. **Auto preset tidak mengenali iGPU.** classifyTier hanya melihat
   UA/touch/core/RAM — laptop Ryzen 8 core = tier 'high' = default TINGGI.
   Beban TINGGI (DPR 2.0 = 4× fill rate + MSAA + IBL penuh + shadow 2048)
   memang ditujukan untuk kartu diskrit, bukan grafis terintegrasi.
2. **NPC tersembunyi tetap dianimasikan.** `visible=false` (distance hide
   v0.14.3) melewatkan RENDER, tapi useFrame animasi Figure tetap jalan
   penuh (~60 baris lerp/sin) untuk figur-figur yang tertelan fog.
3. **Detail mikro pada massa crowd.** Tombol baju (2 bola r=0.011),
   catchlight mata (2 bola r=0.004), hem band transparan — semuanya mesh
   terpisah per figur, padahal pelajar ambient tidak pernah tampil
   close-up (rekomendasi #4 laporan: matikan shadow/detail mesh kecil).

### Perbaikan (memetakan 4 rekomendasi laporan)
- **GPU sniffing** (mobile.ts): `classifyGpu(renderer)` murni + probe
  `WEBGL_debug_renderer_info` sekali di boot → `mobile.gpu`
  ('dgpu' | 'igpu' | 'soft' | 'unknown'). (fondasi rekomendasi #3)
- **`resolveQuality('auto')` kini GPU-aware** (quality.ts): soft → RENDAH,
  **igpu → SEDANG** (dpr 1.5 + shadow 1024 + refleksi −50%), tier low →
  SEDANG (HP, tidak berubah), dgpu/unknown → TINGGI. Pilihan eksplisit
  user selalu menang — hanya 'auto' yang membaca hardware.
- **`lowSpecProfile` diperluas**: iGPU di SEDANG ikut profil lemah —
  MSAA off (sejak reload), crowd halving 14→7 live, kain tanpa peta
  (rekomendasi #1 crowd + #3 preset sekaligus). Desktop dGPU di SEDANG
  TIDAK ikut; TINGGI eksplisit tetap full-fat (adaptive dpr sebagai jaring).
- **Skip animasi figur tersembunyi** (Character.tsx): useFrame pulang awal
  bila grup owner `visible=false` (distance hide / first-person) — seluruh
  matematika animasi untuk figur di dalam fog tidak dibakar lagi (rekomendasi
  #2: kurangi kerja CPU per-NPC; throttling 10 Hz sengaja TIDAK dipakai
  karena integrasi gerak 10 Hz = NPC patah-patah terlihat).
- **`trim` prop Figure** (Character.tsx): pelajar ambient melepas tombol,
  catchlight, hem band (−5 mesh × 7 figur) pada boot lemah; cast utama,
  Player, dan aktor cerita tetap detail penuh (rekomendasi #4).
- Catatan: instancing penuh (InstancedMesh per bagian tubuh) tetap ditunda —
  refactor rig animasi besar dengan risiko regresi tinggi; kombinasi di atas
  sudah memangkas draw call & CPU jauh lebih murah.

### Test
- perf.test.ts +3 (classifyGpu string nyata D3D11/Mesa, resolveQuality
  GPU-aware, lowSpecProfile iGPU) → **187/187 hijau** (17 file).
- tsc -b ✓ · vite build ✓ · qa-nav headless (SwiftShader → soft → RENDAH
  otomatis — sekalian menguji jalur baru): MAP/ESC/SETTINGS/TIMEFLOW/
  EVENING ok, CONSOLE_ERRORS none.

## 0.14.3 — 2026-09-22 (RENDAH Masih Patah-patah di Laptop: Draw Call & Adaptif)

Lanjutan laporan user: "kenapa kok masih patah-patah di laptopku, padahal
settingnya udah RENDAH". Audit menemukan knob performa yang TIDAK ikut
preset — semuanya mengikuti device tier saja.

### Root cause (audit)
1. **Draw call tidak tersentuh preset.** Tiap figur ≈ 30 mesh; 14 pelajar
   ambient + ~5 NPC utama ≈ 570 draw call — crowd halving hanya jalan untuk
   `mobile.lowSpec` (HP), laptop tier 'high' selalu dapat crowd penuh.
2. **MSAA tidak bisa mati di RENDAH.** `antialias: !mobile.lowSpec` adalah
   atribut context — laptop (tier high) terus membayar MSAA walau preset
   RENDAH; GraphicsManager tidak bisa mengubahnya live.
3. **Bangunan di luar fog tetap dirender.** cullDecision hanya mengenal
   frustum + interiorRange; bundle 150 m+ yang 100% tertelan fog tetap
   masuk draw call setiap frame.
4. **Kain NPC ber-peta penuh.** weave normal+rough map aktif di semua figur
   walau RENDAH (materi cache dibuat tanpa peduli preset).
5. Tidak ada jaring pengaman FPS — dpr mentok di preset walau GPU kewalahan.

### Perbaikan
- **`lowSpecProfile(quality, tier)`** (quality.ts, murni): profil lemah =
  perangkat tier low ATAU user memilih RENDAH. Dipakai:
  - crowd ambient DITURUNKAN LIVE di Npcs (subscribe quality),
  - MSAA off + shadow 'basic' via `BOOT_LOW` (App, berlaku sejak reload —
    atribut context tidak bisa live),
  - peta kain (weave normal/rough) tidak dibangun saat boot (Character).
- **Fog culling** (runtime.cullDecision + opt `farRange`): bundle yang
  tepi terdekatnya melewati fogFar disembunyikan walau di frustum — warna
  pikselnya memang sudah = warna fog. CullingManager mengirim fogFar preset.
- **Adaptive dpr** (quality.adaptiveDpr murni + loop di GraphicsManager):
  1.2 s/window; FPS <42 → dpr turun 15% bertahap (floor 0.55), FPS >56 →
  naik pelan kembali ke dpr preset. Ganti preset me-reset state adaptif.
- NPC/ pelajar: `visible=false` ketika jarak kamera > fogFar−25 (≥45 m) —
  dicek sebelum freeze CINEMATIC; jarak interaksi/dialog (≤3.5 m) jauh di
  dalam radius, jadi gameplay & cutscene kebal.

### Test
- test/perf.test.ts +3 blok: lowSpecProfile (tier vs RENDAH), adaptiveDpr
  (drop/hold/recover/floor), fog culling (hide past farRange, keep di
  tepi fog, perilaku legacy tanpa farRange) → 184/184 hijau.
- Verify: tsc -b ✓ · vite build ✓ · qa-nav (headless): CONSOLE_ERRORS none.

## 0.14.2 — 2026-09-22 (Optimasi PBR: Tekstur & Refleksi Lebih Ringan)

Fix laporan user: "texture pbr terlalu berat apalagi refleksi cahayanya".
Audit dulu, baru coding — knob baru MASUK ke sistem kualitas existing
(v0.9.0 preset + v0.12.0 texScale), bukan sistem paralel.

### Root cause (audit)
1. **Refleksi cahaya** = IBL dari `<Environment frames={1}>` lokal (Lightformer,
   World.tsx ×3 scene) → `scene.environment` → SEMUA material standard
   (~90 `<Pbr>` + puluhan material + badan NPC) menghitung indirect specular +
   indirect diffuse **per piksel**, terus-menerus — istilah PBR termahal.
2. **Tekstur berat** = setiap `<Pbr>` memakai map + normalMap + roughnessMap →
   fragment shader melakukan rebuild TBN + 3 sampel tekstur + GGX per piksel
   di seluruh dunia. VRAM sudah hemat sejak v0.12.0; yang berat adalah biaya
   shader-nya, bukan memorinya.

### Perbaikan (2 knob baru di quality.ts — pola texScale v0.12.0)
- **`pbrMaps: boolean`** — RENDAH melepas normalMap+roughnessMap dari semua
  `<Pbr>` (albedo saja): tanpa TBN rebuild, 2 sampel/px lebih sedikit.
  Roughness tetap skalar hasil art direction (matte/gloss tidak hilang).
  Live: `<Pbr>` subscribe quality; remount material saat fitur berubah
  (program shader baru, aman tanpa trik needsUpdate).
- **`envMul: number`** — pengali global refleksi environment. RENDAH = 0 →
  `<Environment>` TIDAK di-mount (scene.environment null) → semua material
  dikompilasi TANPA blok IBL sama sekali. SEDANG ×0.5, TINGGI ×0.8
  (refleksi default ikut diredam — keluhan utama user).
- WarehouseScene kini membaca `cfg` (hanya envMul; fog/lampu gelap tetap
  quality-independent by design).

### Efek per preset
- RENDAH: tanpa IBL + tanpa normal/rough map + (sudah) tanpa langit/bayangan/
  tekstur 128px — mode paling ringan untuk GPU lemah.
- SEDANG: refleksi −50% (0.5), peta PBR utuh.
- TINGGI: refleksi −20% (0.4 vs 0.5), peta PBR utuh — visual hampir tak
  berubah.

### Test
- test/perf.test.ts +3: envMul menurun TINGGI→RENDAH & RENDAH = 0; envMul
  tidak pernah > 1; RENDAH tanpa pbrMaps, lainnya utuh.
- Verify: tsc -b bersih; 181 unit test hijau (17 file); vite build sukses.

## 0.14.1 — 2026-09-22 (Fix Kamera Sinematik: Mengikuti Story Scene Aktif)

Fix bug user: "story berlangsung di satu lokasi (kelas/tangga), kamera
sinematik malah menyorot area lain (kantin)". Audit dulu, baru coding —
tanpa if/else scene, tanpa hardcode koordinat, tanpa sistem duplikat.

### Root cause (audit)
1. Kamera CINEMATIC memprioritaskan speaker-shot dari posisi LIVE registry
   global (`actorPositions ?? npcPositions`) tanpa memvalidasi entity itu
   bagian dari scene aktif — posisi hantu scene lama (bullies kantin dari
   opening o4, gang tangga dari ch2, Bimo rooftop) menyeret kamera.
2. `StoryActor` tidak membersihkan `actorPositions` saat unmount (hantu
   lintas scene; `ScheduledNpc` sudah punya guard, StoryActor belum).
3. Dua pintu story scene terbuka di mode DIALOGUE (bukan CINEMATIC):
   ch2 (`StoryDirector`) dan 5 lanjutan pasca-kombat (`finishCombatWin`)
   → aktor cerita tak ter-mount, pose authoran tak jalan.
4. Fallback statis `'courtyard_view'` (tebakan lokasi) untuk node tanpa
   CAM_BY_NODE, plus beberapa cameraStage authoran yang menunjuk scene lain.

### Perbaikan arsitektur (story scene memiliki kamera)
- **story/staging.ts** — resolver murni `resolveCinematicCamera(nodeId)`:
  urutan `node.cam` (shot eksplisit dialogue, divalidasi ke cast node) →
  pose authoran `CAM_BY_NODE` → null (caller memframing Ren yang distage).
  Kamera sinematik TIDAK lagi membaca registry live. Helper baru:
  `storyCastSpots()` (ekspansi cast, konvensi id = CinematicActors) +
  `stagedEntityPosition()` (posisi dari DATA staging; 'ren' → playerPos).
- **camera/CameraRig.tsx** — cabang CINEMATIC konsumsi resolver di atas;
  fallback konstanta courtyard dihapus. `shotForNode` live TETAP untuk
  mode DIALOGUE (obrolan NPC ≤2.3 m — posisi live memang scene-nya).
- **npc/Npc.tsx** — `StoryActor` cleanup `actorPositions[id]` saat unmount
  (cermin guard ScheduledNpc) — hantu punah di sumbernya.
- **StoryDirector / combat.finishCombatWin** — ch2 + node onWin kini
  dibuka `cinematic=true` (story scene = CINEMATIC, konsisten semua scene).
- **Data staging (chapters.ts)** — cameraStage lengkap & benar lokasi:
  `ch2_close`→stairs_wide (semula jatuh ke courtyard), `ch4_bad_4/4b`→
  classroom_close (semula warehouse_close; scene masih kelas),
  `ch3_osis_*`→hall_view/hall_close (semula corridor_* yang meleset ±22 m
  dari spot Siti), `ch4_res_1/4`→courtyard_view (semula alley_wide, 53 m
  dari aktor courtyard). ActorStages dipindah ke data: Bimo rooftop
  (10 node ch3), Bimo gudang (ch4_bad_after*), Aris+Siti courtyard
  (ch4_res_1..4) — hardcode CinematicActors di App dihapus (data tunggal).
- Multi-shot per scene TETAP didukung tanpa sistem baru: 1 scene = rantai
  node (tiap node = shot), node bisa memilih preset via `cam:`.

### Test
- **test/cinema.test.ts** baru (15 test): regresi hantu kantin/kelas/
  rooftop, kelengkapan cameraStage semua node sinematik, INVARIANT LOKASI
  (look-target pose wajib dekat entity scene distage), pintu masuk scene
  siap CINEMATIC, node.cam validasi staging. Total 178 test (17 file).
- Verifikasi: `npm test` 178 ✓ · `tsc -b` ✓ · `vite build` ✓.

## 0.14.0 — 2026-09-18 (Story Staging, Modularisasi Cerita, Mission Nav, BGM)

Refactor + fitur atas 12-task brief: staging posisi Ren saat story scene,
pemisahan file cerita per chapter/route/ending, navigasi misi
(TELEPORT/JALAN), transisi fade terpusat, dan sistem BGM. Semua dibangun DI
ATAS sistem existing — tidak ada sistem paralel, tidak ada state duplikat.

### Story staging (prioritas #1 — posisi Ren saat cerita)
- **REN_STAGING** (data/chapters.ts): tabel posisi deterministik Ren per node
  cerita — melengkapi tabel per-node yang sudah ada (SCENE_ACTORS/OPENING_
  ACTORS untuk NPC, CAM_BY_NODE untuk kamera, STORY_PROPS). Story scene kini
  menentukan WHERE/WHO/POSE/CAMERA/DIALOGUE, bukan cuma DIALOGUE.
- **story/staging.ts**: `applyPlayerStaging()` (pindah Ren + hadapkan; guard
  scene; node tanpa data tidak disentuh → free roam utuh) + `startStoryScene()`
  pintu masuk deterministik. Runner `<StoryPlayerStaging/>` di App memicu saat
  node terbuka; input memang terkunci saat DIALOGUE/CINEMATIC, jadi pemain tak
  melihat "Ren teleport".
- **FIX n2**: konfrontasi Siti (rute netral) kini benar-benar di interior
  perpustakaan — kamera library_* sudah memotong ke sana sejak v0.8.0, tapi
  spot Siti masih di hall (tak pernah masuk frame).
- NODE_FX += fade-in untuk scene-start yang distage (ch3_f2_1, ch3_f2_win,
  ch4_bad_1, ch4_good_1) → transisi sinematik out→place→in konsisten.

### Modularisasi cerita (prioritas #2)
- dialogue.ts (781 baris) dipecah mekanis ke **src/data/story/**: opening.ts,
  chapter2.ts, chapter3.ts, routes/{neutral,bad,resistance}.ts, endings/
  {neutralEnding,bad1Ending,goodEnding,bad2Ending}.ts, npc.ts, discoveries.ts,
  ambient.ts + index.ts (perakit graph + tabel runtime). dialogue.ts kini
  re-export shim — semua import lama tak tersentuh.
- **Ending terpisah dari resolver** (Task 5): endingResolver tetap murni
  (state → Ending); scene ending tiap rute kini file sendiri, dijamin
  terisolasi lewat test reachability (pairwise disjoint).

### Mission navigation (Task 1)
- Kartu misi HUD punya tombol **[TELEPORT]** dan **[JALAN]**. Teleport =
  `requestScene('campus', pos_target)` (fade out → pindah → fade in); objektif
  TIDAK otomatis selesai — kondisi objektif tetap dievaluasi sistem existing
  (zona/flag/periode). Jalan = penekanan arah via waypoint ◆ + jarak HUD
  (kontrol pemain tidak pernah diambil alih).
- Target dipakai dari hook `useObjective()` existing — tidak ada schema misi
  baru (aturan "pakai format existing").

### Transition (Task 6/7)
- `requestScene()` same-scene kini juga difade (out → setPos → in) — jadi
  abstraction `transitionToScene` untuk semua perpindahan player (exit
  rooftop/warehouse, teleport misi). sceneLoading mencegah transisi tumpuk.

### BGM / soundtrack (Task 8)
- **MusicDirector + musicDecision()** (audio.ts): satu source of truth musik.
  Track prosedural (tanpa aset): menu, school_day, school_evening, tension,
  combat, neutral, ending_good/ending_neutral/ending_bad. Ganti track selalu
  fade out → ganti → fade in lewat gain sendiri di atas bus MUSIC.
- Pemantau TUNGGAL (interval 1 dtk di App) memanggil `bgm.sync()` — komponen
  lain tidak pernah memainkan musik sendiri (anti-overlap). Keputusan prioritas:
  menu → ending → combat → tension (scene non-kampus / cerita bab 3-4) →
  rute netral → suasana per periode hari.

### Testing (Task 12)
- 25 test baru: staging.test.ts (integritas REN_STAGING: node ada, scene benar,
  bounds, aturan shaft tangga x≥4.4, guard scene; trigger/montage root wajib
  distage), storyStructure.test.ts (komposisi modul == graph tunggal tanpa
  duplikat, kepemilikan id per modul, ISOLASI ending pairwise + pemisahan
  rute, runtime tables lengkap), bgm.test.ts (tabel keputusan + state
  headless MusicDirector). Total 163 unit test hijau.
- Regression: qa-mentor PASS, qa-walkability 12/12 (termasuk "staging bab 2
  bebas tembok"), qa-nav PASS — CONSOLE_ERRORS none di semua skenario.

### Tidak diubah (disengaja)
- Alur cerita, kondisi ending, node text, combat, save/load, jadwal NPC,
  quest conditions — semua graph data dipindah apa adanya (diverifikasi test
  komposisi + storyFlow existing).

## 0.13.0 — 2026-09-18 (Mode Kamera First-Person & Third-Person)

Permintaan user: "kasih mode thirdperson dan firstperson". Kamera gameplay kini
punya dua mode penuh yang bisa diganti kapan saja — saat eksplorasi MAUPUN
kombat — lewat tombol **V** atau dropdown setelan, dan pilihannya persist di
localStorage.

### Added
- **First-person head-cam** (`src/game/camera/mode.ts` + CameraRig): mata kamera
  menempel keras (hard-attach, tanpa lerp) di titik mata Ren (1.52 m di atas
  kaki), arah pandang dari yaw/pitch bersama konvensi orbit — gerakan, lari,
  lompat, dan serangan semua tetap berfungsi. Pitch FP boleh -1.05..1.2 rad
  (bisa melihat ke atas), berbeda dari pita orbit TPS.
- **Toggle V**: ganti FP↔TP instan di GAMEPLAY/COMBAT + notifikasi
  "Kamera: Orang Pertama/Ketiga". Pergantian mode re-clamp pitch (stale look-up
  FP tak bisa lagi menyeret orbit TPS ke bawah lantai) dan CUT instan satu frame
  — kamera tidak "terbang" dari titik mata ke posisi orbit.
- **Setelan MODE KAMERA** (SettingsPanel): ORANG KETIGA (TPS) / ORANG PERTAMA
  (FPS), persist via `settingsStore.camMode` (tipe `CamMode`).
- **Crosshair FP** di HUD saat mode orang pertama aktif (dot tengah layar,
  `.fp-crosshair`), plus chip `<kbd>V</kbd> KAMERA` di footer kontrol.
- Badan Ren **otomatis disembunyikan** saat FP gameplay/kombat (PlayerFigure
  `visible=false`) dan muncul kembali di DIALOGUE/CINEMATIC — shot sinematik
  tetap butuh Ren di frame.
- Unit test baru `src/test/cammode.test.ts` (6 test: clampPitch per-mode,
  reclampOnSwitch, nextMode, konvensi arah fpLookDir, tinggi mata).

### Fixed
- **Kamera TPS ikut ketinggian lantai**: orbit kini mengikuti `playerPos.y`
  (kaki) ter-smoothing — di lantai tanah perilaku identik dengan versi lama,
  di Gedung B L2/L3 kamera tidak lagi tenggelam ke dalam lantai. Jump
  mengangkat kamera dengan halus (lerp 9/s).

### Unchanged (disengaja)
- Opening sinematik tetap pakai pose `fp_gate` authoran + transisi FP→TP
  pembuka; DIALOGUE tetap pakai speaker-shot (shotForNode); wheel zoom hanya
  aktif di TPS dan tetap di-drain tiap frame saat FP agar tak menumpuk.

## 0.12.0 — 2026-09-17 (Cinematic Polish & World Connectivity)

Patch besar dari feedback playtest: kamera scene-cut, posisi cerita bab 2,
konektivitas gedung utama (lorong buntu & papan penutup pintu), jalur kantin,
animasi pendukung cerita (duduk/jongkok/prop tangan/pensil jatuh), penyesuaian
dialog bagian transfer, tekstur dinamis per preset, dan peta blueprint.

### Fixed — kamera & sinematik
- **Hard-cut kamera antar scene**: pose kamera sinematik yang berpindah >6 m
  kini CUT instan (dilindungi fade-in yang sudah ada), bukan lagi lerp fisik
  yang "terbang menembus kelas" saat narasi baru tampil (feedback: cerita baru
  di kantin tapi kamera malah lewat kelas). Dalam satu scene tetap halus.
  Helper murni `isPoseCut` + test.
- **Bab 2 pindah lokasi**: staging "Kesalahan Kecil Aris" keluar dari belakang
  gedung ke **jalur timur tangga menuju kantin belakang** (sesuai naskah
  "Lorong tangga menuju kantin belakang") — karakter utama tidak lagi terlihat
  "di belakang gedung" saat cerita berjalan. Pose `stairs_wide/close/aris/away`
  direkomposisi (bebas tembok shaft & tong sampah), zona pemicu `back_stairs`
  diperluas r 4.5 → 7.5.

### Fixed — dunia & navigasi
- **Lorong lobi → kelas AKHIRNYA TEMBUS** (feedback: "tidak ada pintu/lobang"):
  inti gudang di tengah gedung (z 16..21) tidak lagi menutup celah z=21 —
  kini jadi lorong tembus dengan pintu dobel baru; dinding selatan inti
  dihapus, koridor strip z 14..16 terbuka ke pintu Kelas 1-X & Ruang Guru.
- **Vestibule tangga belakang**: slot tengah gedung (x -2..2, z 4..14) diberi
  lantai/plafon/lampu dan dua bukaan baru (x=±2, z 4..5.4 + lintel) sehingga
  pintu tangga belakang terhubung langsung ke kelas & ruang guru.
- **Papan pengumuman dipindah** dari depan pintu masuk utama (menutupi pintu) ke
  dinding barat lobi (feedback: "pintu gedung utama ketutupan papan tulis").
- **Jalur beton "lorong menuju kantin"** dari halaman belakang ke teras kantin
  (+ lampu taman) — route visual bab 2 → kantin kini terbaca.

### Added — animasi & prop pendukung cerita (feedback user)
- **Pose baru Figure**: `sit` (duduk di kursi/meja) dan `crouch` (jongkok
  memungut barang) dengan blending halus; gesture dialog tetap jalan.
- **Prop di tangan** (HoldProp): map merah, buku catatan, pensil, penghapus,
  tumpukan buku, botol minum, ponsel.
- **Scene 2 (kelas)**: kotak pensil Aris tersenggol → **animasi jatuh dengan
  pantulan** + pensil bergelaran → Aris jongkok memungut → menyodorkan
  penghapus ke Ren (prop tangan) → kotak terkumpul. Data-driven via
  `STORY_PROPS` + komponen `StoryPropFX`.
- **Bab 2**: Aris berjalan **membawa tumpukan buku + botol**, tersandung —
  buku berserakan, botol jatuh, **genangan air** membesar di beton; buku
  terkumpul lagi di ch2_win_3.
- **Rute good**: Siti memegang ponsel (layar menyala) saat merekam geng.
- **Opening first-person**: Ren kini **memegang map merah** (scene 1) dan buku
  catatan (scene 2 & 4) — viewmodel kamera dengan sway halus.
- **NPC duduk jam kelas**: Aris & Siti duduk di kursi mereka (meja baris
  belakang, menghadap papan tulis) selama periode class/class2/class3
  (`sitAt`/`sitFace` di data NPC), berdiri saat berjalan.

### Changed — dialog (bagian transfer)
- o2_5 Aris kini persis naskah: "Kamu murid baru yang **dari kota** itu, kan?"
  (sebelumnya "yang pindahan itu" — dobel dengan o1_3/o3_2).
- Pembuka Pak Budi diganti: "Ren, kan? Mari duduk. Bagaimana Yuson selama
  ini — masih kuat bertahan?" (tidak lagi mengulang "murid pindahan").

### Changed — optimasi ("low texture")
- Preset kualitas kini mengatur **resolusi tekstur prosedural** + anisotropy:
  TINGGI 256px/aniso 4, SEDANG 192px/aniso 2, RENDAH 128px/aniso 1 —
  memangkas VRAM hingga ~4× di RENDAH tanpa menyentuh geometri/culling.
  (`texScale` + `aniso` di quality.ts; pbr membaca saat tekstur dibangun.)

### Improved — UI peta
- **Layer blueprint** di panel PETA: footprint gedung utama/tangga/kantin/
  perpustakaan/Gedung B/gudang/parkir/gang, ring lapangan, jalan depan, halaman,
  dan jalur kantin — node zona kini terbaca sebagai denah sekolah.

### Verify
- 132 unit test hijau (12 baru: isPoseCut, STORY_PROPS, pose/prop data,
  preset tekstur).
- **qa-walkability.mjs (baru): 12/12 PASS** — raycast fisika membuktikan
  lobi→lorong→kelas/ruang guru, tangga→vestibule→kelas, staging bab 2 bebas,
  dan 3 kontrol dinding solid; CONSOLE_ERRORS: none.
- qa-mentor PASS (dialog Aris + pilihan utuh), qa-nav PASS (peta blueprint,
  ESC, setelan, timeflow); tsc bersih; vite build sukses.


## 0.11.0 — 2026-09-17 (Naskah final "GARIS MERAH" — 3 pilihan, 4 ending, panel kredit)

Integrasi lengkap naskah cerita final **GARIS MERAH** (laporan final project):
dialog bergaya anak sekolah (gue/lu) sesuai draf Naufal, struktur **tiga titik
pilihan** dan **empat ending**, plus satu pertarungan baru dan panel kredit tim.

### Changed — struktur cerita (kanon GARIS MERAH)
- **CHOICE 1 (tangga belakang)**: abaikan Aris → rute netral / tolong Aris →
  rute aksi. Dialog FIGHT 1 memakai naskah final ("Lepasin dia." → "Siapa lagi
  nih? Anak baru sok pahlawan?" → "Belagu lo!"), plus dialog pasca-menang
  ("Awas lo ya… kita laporin Bimo!") dan kalimat Ren ke Aris
  ("Catatanmu berguna buat gue.").
- **BAB 3 baru — Pendekatan OSIS + Teror di Parkiran [FIGHT 2]**: Siti
  menghadang Ren di koridor (menawarkan data OSIS), lalu dua letnan geng
  menyergap di area parkir. Encounter baru `parking_fight`, quest baru
  `gang_ambush` (waypoint menunjuk parkiran), kamera baru `pk_ambush`/
  `pk_close`, montase terpicu via beat `ch3_osis` → `ch3_parking`.
- **CHOICE 2 (rooftop)**: tawaran Bimo memakai naskah final ("Dua kali anak
  buah gue lo tumbangin… jadi gue kasih dua penawaran.") — terima → rute bad,
  tolak → rute resistance.
- **RUTE BAD diganti**: bukan lagi razia gudang yang berakhir dipenjara —
  Ren menjadi eksekutor geng (montase pemalakan + pekerjaan gudang), Aris
  mulai takut padanya, lalu **lulus sebagai pemimpin geng baru pengganti
  Bimo** → BAD ENDING 1 **"Tunduk Pada Kekuasaan"** (monolog final persis
  naskah: "Gue selamat dari sistem Yuson, cuma buat jadi bagian dari sistem
  yang gue rusak."). Kartu BAB IV rute bad kini bertajuk "Tunduk Pada
  Kekuasaan".
- **RUTE RESISTANCE diganti**: bukan lagi pilihan tolong/tinggalkan di gang —
  kini **penyanderaan Aris** + taktik OSIS (Siti merekam bukti), Ren
  menumbangkan dua anak buah, lalu **FIGHT 3 FINAL BOSS: Ren vs Bimo**
  (encounter baru `bimo_fight`, boss HP 150) → **CHOICE 3**:
  - [A] Tahan emosi → polisi & Kepala Sekolah datang dengan rekaman Siti,
    Bimo dkk. ditangkap → kelulusan **foto bertiga dengan teh kotak** →
    GOOD ENDING **"Lulus Bersama"** ("gue keluar dari sini tanpa
    kehilangan hati gue").
  - [B] Hajar brutal → Bimo kritis di rumah sakit, Ren dilaporkan,
    dikeluarkan & ditangkap di halaman sekolah → BAD ENDING 2
    **"Rantai Dendam"** ("amarah udah mengubah gue jadi monster yang sama
    mengerikannya").
- Dialog seluruh spine cerita (opening 4 scene, bab 2, kedua rute, kelulusan)
  disesuaikan dengan draf final: Ren gue, Siti lu/gue, Bimo gue/lo, geng lo,
  Aris tetap aku/kamu (jadi lo saat dingin di rute netral — sesuai draf).
  NPC ambient, hidden event & zone flavor ikut diselaraskan.
- Subtitle bab: BAB III "Penawaran di Rooftop", BAB IV "Klimaks Gang
  Belakang" (netral/bad tetap punya judul rute sendiri).
- `endingResolver` dirender ulang ke 4 ending kanon; ending lama "Kebenaran &
  Solidaritas" / "Lulus Tapi Sendirian" / razia gudang digantikan.

### Added — panel kredit tim (menu utama)
- Tombol KREDIT kini membuka panel overlay berisi pembagian peran resmi sesuai
  laporan final project: **Ridho** (Lead Programmer / Integrator), **Naufal**
  (Game Designer / Narrative Designer), **Fadlan** (UI/UX Designer),
  **Marcell** (Game/Level Support & Testing) — siap untuk demo presentasi.

### Technical
- Beat baru: `ch3_osis`, `ch3_parking`, `ch4_bad_grad`, `ch4_res_bimo`,
  `ch4_good_grad`; `BEAT_ENCOUNTER` bertambah 2 pemetaan.
- Node rantai baru: `o2_3b`, `ch2_fight_1b/1c`, `ch2_win_2..6`,
  `ch3_osis_1..6`, `ch3_f2_1..3`, `ch3_f2_win..3`, `ch4_bad_4b`,
  `ch4_bad_after..2`, `ch4_bad_grad_1..3`, `ch4_res_alley_2..4`,
  `ch4_res_goons_win..2`, `ch4_good_1..4`, `ch4_good_grad_1..5`,
  `ch4_bad2_1..5`. Node razia & rute lama dihapus (tanpa orphan — dijaga
  test reachability).
- Checkpoint save baru sebelum setiap klimaks (`ch3_osis_6`, `ch3_f2_win_3`,
  `ch4_good_4`, `ch4_bad_after_2`); trigger StoryDirector baru untuk montase
  OSIS, sergapan parkiran, dan dua scene kelulusan; aktor sinematik penyanderaan
  (sandera + lingkaran geng + Bimo) & kelulusan (Aris kacamata baru + Siti)
  dipasok data `SCENE_ACTORS`.
- Quest: `gang_ambush` (baru), `find_aris`/`warehouse_call`/`graduation_day`
  deskripsi disesuaikan GARIS MERAH; waypoint parkiran untuk FIGHT 2.
- Test: 120 unit test hijau (storyFlow diperluas — rantai FIGHT 1, montase
  OSIS→parkiran→rooftop, kedua cabang CHOICE 3, kedua kelulusan; resolver
  test disesuaikan kanon baru); tsc bersih; vite build sukses.

## 0.10.0 — 2026-09-17 (Siang–malam, waypoint misi, perbaikan peta, setelan kontrol)

Empat permintaan sekaligus: siklus siang–malam, penunjuk objektif, setelan
kontrol & aksesibilitas, dan perbaikan fitur map.

### Added — siklus siang–malam (permintaan user #1)
- Langit kampus & atap kini mengikuti jam sekolah: fajar oranye (05:30) →
  pagi biru → siang putih terang → sore keemasan → golden hour "Pulang
  Sekolah" → maghrib ungu → malam berbulan. Posisi matahari, warna cahaya,
  intensitas ambient/hemisphere, warna langit & fog semuanya di-interpolasi
  halus (chase ~0.5s) oleh `DayNightRig` (file baru `src/game/daynight.ts` —
  keyframe murni, unit-tested). Gudang tetap gelap (interior).
- Waktu mengalir pelan saat menjelajah: `TimeFlow` menambah +1 menit game per
  3 detik di mode GAMEPLAY, **dengan batas keras di akhir periode jam
  sekolah** (mis. istirahat tak akan melewati 11:00). Pemicu quest yang
  bergantung periode (teh untuk Siti butuh 'istirahat siang', latihan senja
  butuh 'pulang sekolah') tetap aman — hanya efek cerita yang bisa
  memotong periode. Cap 19:30 untuk periode pulang agar golden hour
  terkejar tapi tidak gelap gulita.

### Added — waypoint objektif + tracker jarak (permintaan user #2)
- `ObjectiveWaypoint` (file baru `src/game/world/Waypoint.tsx`): marker
  berlian + berkas cahaya melayang di atas zona target misi aktif, terlihat
  **menembus dinding** (depthTest off), memantul lembut, hilang saat 3.5 m
  sebelum target atau saat mode sinematik.
- Pemetaan quest → lokasi di `src/game/waypoint.ts` (murni, unit-tested):
  12 quest punya target; "Jelajahi SMA Yuson" menunjuk ke landmark terdekat
  yang belum dikunjungi (halaman/kantin/lapangan/gang).
- Kartu misi HUD kini menampilkan jarak hidup: "Jelajahi SMA Yuson // 30m"
  ("// DI SINI" saat sampai). Polling 400 ms via getState — tanpa
  re-render per frame.

### Fixed — fitur map (permintaan user #3)
- **Hitungan zona dikunjungi kini per-scene** — sebelumnya global lintas
  scene (di atap bisa muncul "20 / 2").
- **Node zona yang berbagi pusat tidak lagi bertumpuk tak terbaca** —
  Kelas 10-A / 12-A / 12-B Gedung B kini tersusun vertikal rapi dengan chip
  lantai L1/L2/L3.
- Marker **◆ TUJUAN** misi aktif di peta (sejalan dengan waypoint dunia) +
  panel TARGET AKTIF menampilkan lokasi & jarak ("KANTIN · 30 M").
- Zona yang sedang diinjak disorot emas; panah arah hadap Ren di marker
  pemain; tag header mengikuti scene (MAP // GND / ROOF / GUDANG).
- **Bug UX: ESC dari peta (dan semua menu overlay) kini selalu menutup
  overlay** — sebelumnya balapan dengan handler lain sehingga ESC dari peta
  bisa membuka menu JEDA, bukan menutup peta (`App.tsx`).

### Added — setelan kontrol & aksesibilitas (permintaan user #4)
- PENGATURAN kini punya: **SENSITIVITAS KAMERA** (0.4–2×), **INVERT Y**,
  **KECEPATAN TEKS DIALOG** (10–80 karakter/detik), **UKURAN SUBTITLE**
  (0.85–1.5×) — semuanya live-apply dan tersimpan di localStorage.
  Diterapkan di ketiga jalur kamera: pointer-lock, drag-look, dan sentuh.

### QA
- `scripts/qa-nav.mjs` (baru): verifikasi headless end-to-end — waypoint
  HUD 30 m, peta (TUJUAN, DIKUNJUNGI per-scene, chip L2/L3, sorot zona,
  panah hadap), ESC menutup peta, 4 kontrol setelan baru, TimeFlow
  menggeser jam, load sore 17:30 bersih tanpa console error.
- 119 unit test hijau (20 baru: daynight 11 + waypoint 9); build produksi
  bersih; qa-mentor regression PASS.

## 0.9.0 — 2026-09-17 (Optimasi render: kualitas grafik, culling, loading screen)

Tiga permintaan optimasi sekaligus: grafik bisa diturunkan, yang tak terlihat
tak dirender, dan loading screen dengan progres nyata.

### Added — preset kualitas grafik (PENGATURAN → KUALITAS GRAFIK)
- Pilihan **OTOMATIS / TINGGI / SEDANG / RENDAH** di Settings (tersimpan di
  localStorage, dipakai ulang setelah reload). `auto` mengikuti tier perangkat
  (desktop → TINGGI, ponsel kelas bawah → SEDANG).
- Preset mengatur: cap DPR (2 / 1.5 / 1), shadow map (2048 / 1024 / **off**),
  shader Sky (off di RENDAH — flat background + fog), jarak fog/view, dan
  agresivitas culling interior. Diterapkan **live** oleh `GraphicsManager`
  (ganti preset saat bermain langsung berlaku, tanpa restart).
- File baru `src/game/quality.ts` (presets + resolver, unit-tested).

### Added — render culling "yang ga keliatan ga dirender"
- Registry culling di `runtime.ts` + komponen `<Cull>` di `props.tsx`:
  bundle statis dunia didaftarkan dengan sphere (center, radius, mode).
- `CullingManager` (throttle ~8×/detik) menyembunyikan bundle yang **seluruhnya
  di luar frustum kamera** (mode `frustum`) atau di luar jangkauan interior
  (mode `interior` — mebel/lampu ruangan yang terhalang dinding & fog).
  Terpasang pada: shell + interior per ruangan gedung utama, seluruh lantai
  Gedung B (per lantai) + inti tangga, perpustakaan (shell + interior),
  parkir, lapangan, gang, halaman belakang, gudang, pagar, pohon, papan arah,
  street furniture — ratusan mesh drop sekaligus saat kamera membelakangi.
- Aman untuk kamera: raycaster melewatkan objek invisible, dan bundle hanya
  disembunyikan saat sphere-nya keluar frustum — dinding yang mungkin
  menghalangi kamera→pemain selalu tetap dalam frustum → tetap ter-render.
- Bonus CPU: matrixAutoUpdate dimatikan untuk bundle statik (komposisi matriks
  sekali, bukan tiap frame).

### Fixed — dua lampu arah shadow-casting berjalan bersamaan
- Root Canvas lama memasang rig cahaya lengkap (ambient/hemi/sun 2048²) PADAHAL
  tiap scene juga memasang rignya sendiri — shadow map dirender **dua kali**
  sepanjang game sejak v0.3. Rig duplikat dihapus; fallback error-boundary
  kini membawa rig minimalnya sendiri.

### Added — loading screen progres nyata
- Boot tidak lagi timer buta 1,4 detik: **world prewarm** — perangkat kelas
  desktop membangun dunia saat boot/menu sehingga "MULAI" mendarat di scene
  siap main; ponsel kelas bawah tetap lazy-mount.
- `LoadingScreen` menampilkan persentase gabungan nyata: progres aset (drei
  useProgress) + kesiapan dunia (2 frame pertama benar-benar ter-render,
  `WorldReadyProbe`) + window branding minimum.
- `BootGate` fail-open: render loop mati (headless/GPU mati) dideteksi lewat
  heartbeat frame dan gate tetap buka — loading screen tak pernah menggantung.

### Verified
- 99 unit tests hijau (8 baru: preset kualitas, resolusi auto, registry cull,
  keputusan frustum/interior 3D); `tsc -b` bersih; build produksi sukses.
- QA Playwright: qa-mentor PASS penuh (boot → load save → dialog Aris → HUD,
  tanpa console error) pada build v0.9.0; qa-landscape crash headless di iter
  6 **terverifikasi sama pada build v0.8.0** (SwiftShader — bukan regresi).

## 0.8.0 — 2026-09-16 (Gedung Kelas B bertingkat + Perpustakaan)

Dua bangunan kampus baru sesuai permintaan: **Gedung B** (kelas bertingkat
3 lantai, semua lantai bisa dinaiki lewat tangga beton sungguhan) dan
**Perpustakaan** (interior lengkap — sekaligus menepati lokasi konfrontasi
Siti di rute netral yang sebelumnya hanya narasi).

### Added — Gedung B (gedung kelas 3 lantai, x 24..44, z -16..-2)
- Gedung prosedural 3 lantai dengan **lorong terbuka utara + tangga
  switchback internal yang benar-benar walkable** (kollider langkah/landasan/
  lantai per lantai) — gedung bertingkat pertama di game ini yang bisa
  dinaiki, bukan sekadar fasad.
- Tiap lantai: 1 kelas penuh (papan tulis, 12 meja siswa, meja guru, jam,
  lampu) + 1 ruang ekskul (L1 Ruang OSIS dengan papan buletin, L2 Ruang UKS,
  L3 Ruang Loker) + loker lorong + tanaman pot.
- Zona per lantai: `gedung_b` (selubung), `kelas_10a` (L1), `ruang_osis` (L1),
  `kelas_12a` (L2), `kelas_12b` (L3). **`zoneAt` kini y-aware** — zona dengan
  jendela `y` diprioritaskan ketika y pemain cocok, sehingga lantai 2/3
  punya label HUD sendiri meskipun footprint (x, z) identik.
- Trim biru antar lantai, jendela fasad selatan per lantai, plang "GEDUNG B"
  menghadap halaman belakang, plang "LANTAI n" + nama ruang per lantai.
- Flavor zone `zone_gedung_b` + hidden event **"Buku Tamu Ruang OSIS"**
  (`he_osis_guest`, chapter ≥ 2, Fokus +3).

### Added — Perpustakaan (x 23..39, z 16..24)
- Bangunan 1 lantai dengan interior lengkap: 6 rak buku (2 deret × 3 baris,
  gang menyilang di poros pintu), 3 meja baca + kursi, karpet, loket pustaka
  bertanda "LOKET", kotak pengembalian, papan buletin, tanaman sudut,
  pintu dobel terbuka + kanopi, jendela 3 sisi, plang "PERPUSTAKAAN".
- Zona `library` + flavor `zone_library` + hidden event
  **"Foto di Rak Tahunan"** (`he_library_note`, chapter ≥ 2, Diplomasi +1) —
  foreshadowing masa lalu Bimo.
- **Rute netral kini bersetting di perpustakaan sungguhan**: shot cinematic
  scene 2 montage "Dinding Dingin" (n2_1..n2_8) dialihkan dari lorong ke
  pose interior perpustakaan baru (`library_wide/shelf/close/pull`); Siti
  kini dijadwalkan di perpustakaan pada periode `after`.
- Plaza paving + jalur pendekatan dari gedung utama; jalur beton ke pintu
  lorong Gedung B; 3 pohon dipindah/replanting sesuai footprint baru;
  2 siswa ambient baru (area baca perpustakaan, lorong Gedung B).
- **Papan penunjuk arah (signpost) di halaman utama** (11.5, 34.5), dekat
  spawn — papan panah berlabel "PERPUSTAKAAN / KANTIN / GEDUNG B / LAPANGAN"
  dengan teks dua sisi + kepala panah, kollider tiang, agar bangunan baru
  langsung ketahuan arahnya sejak spawn (feedback: "perpustakaan nya dimana?").
- **Pintu ruang kelas** (feedback: "ruang kelas nya dikasih pintu"): komponen
  `Door` reusable di `props.tsx` — dedaungan pintu terbuka ±109° menempel
  ke arah daun pintu sehingga celah tetap full walkable — dipasang di: kelas
  1-X & ruang guru (gedung utama, plus lintel visual di atas celah), dan
  seluruh pintu Kelas 10-A/12-A/12-B + Ruang OSIS/UKS/Loker (Gedung B, 3
  lantai, lintel kini terpasang di semua lantai). Perpustakaan & pintu masuk
  gedung utama sebelumnya sudah berpintu dobel terbuka.

### Changed
- `ZoneDef` bertambah field opsional `y?: [min, max]`; `zoneAt(x, z, scene, y?)`
  dua-tahap (zona lantai spesifik menang atas zona umum). Pemanggil
  (StoryDirector, playerInZone) kini meneruskan `playerPos.y`.
- Map panel kini menampilkan **label zona Indonesia** (`zone.label`, mis.
  "PERPUSTAKAAN", "KELAS 10-A (LANTAI 2)") alih-alih id teknis zona.
- README, GDD, PROJECT_STATE diperbarui; versi 0.8.0.

### Verified
- 91 unit tests hijau (termasuk 3 spesifikasi baru: zona gedung baru,
  resolusi lantai via y-window, registri zona); `tsc -b` bersih;
  build produksi sukses.

## 0.7.0 — 2026-09-16 (slow opening rework + NEUTRAL route)

Implementasi dua bagian GDD baru: **§"Alur yang lebih lambat"** (opening baru)
dan **§"Rute Netral"** (Bab 3–4 netral + Netral Ending). Total ending kini 4:
BAD / TRUE / BITTER / **NEUTRAL**.

### Added — slow opening "Minggu Pertama: Pria Tanpa Wajah" (replaces o1–o7)
- Opening sinematik first-person yang lebih lambat: 4 scene terpisah dengan
  fade-cut antar scene (36 node vs 24 sebelumnya) — Gerbang & Map Merah →
  Meja Baris Belakang (kenalan Aris, penghapus) → Peringatan Pertama di
  Lorong (Siti) → Bisik-Bisik Kantin (gosip SMA 4) & kemunculan Bimo +
  tiga pengikutnya.
- Kamera FP baru per beat: `fp_map_red`, `fp_class*`, `fp_siti_hall*`,
  `fp_canteen*`, `fp_bimo_entry` — termasuk shot interior kelas, lorong,
  dan kantin yang selama ini belum pernah dipakai cinematic.
- OPENING_ACTORS dirombak ke schema Spot `{ pos, face }` + slot `followers`
  (rombongan Bimo) — aktor kini punya arah hadap per node.
- NODE_FX `fade-in` di awal tiap scene untuk ritme lambat.

### Added — NEUTRAL route ("Dinding Dingin" → "Lulus Tanpa Nama")
- Bab 2 dirombak jadi **"Kesalahan Kecil Aris"** (GDD §Bab 2): Aris menumpahkan
  air ke sepatu anak geng inti Bimo di tangga belakang → garis cabang rute:
  - **[A] Mengabaikan** → `route: neutral` → montage 4 scene "Dinding Dingin &
    Keheningan Kelas" (bangku kosong, konfrontasi Siti, pengabaian Bimo,
    surat pengunduran diri Aris) → hari kelulusan di gerbang →
    **Netral Ending "Lulus Tanpa Nama"**.
  - **[B] Membela Aris** → encounter `stair_fight` (2 anak geng inti) →
    Bimo impressed → rooftop → rute bad/resistance (tidak berubah).
- StoryBeat baru: `ch2_key_error`, `ch3_neutral`, `ch4_neutral_grad`.
- Trigger StoryDirector: kartu BAB II dua-fase (card → scene), montage netral,
  dan pemicu graduasi saat pemain kembali ke gerbang.
- `chapterCardText` kini route-aware (BAB III/IV punya judul versi netral).
- EndingScreen punya varian `ending-neutral` (abu-abu pudar).
- Callback NPC rute netral: `bimo_neu_*` dan `siti_neu_*` (chapter ≥ 3).
- Aris tidak lagi muncul sebagai NPC di bab 4 rute netral (sudah pindah sekolah).
- Quest baru: `aris_incident` (bab 2), `graduation_day` (bab 4 netral).
- hidden event "Goresan di Bangku" kini bergantung flag `defended_aris`.

### Changed
- Quest `gate_trouble` dan encounter `gate_fight` diganti `aris_incident` /
  `stair_fight` (arena back_stairs, dua musuh).
- `ch2_win*` ditulis ulang untuk konteks pertarungan tangga belakang.
- Save lama dengan beat `ch2_gate` dinormalisasi ke `ch1_break` saat load —
  tanpa version bump (aman untuk save 0.6.x).
- Versi build chip: BUILD 0.7.0.

### Tests
- storyFlow: 4 test baru (cabang netral, cabang utama, rantai ending netral,
  peta BEAT_ENCOUNTER). Semua 89 test hijau.

## 0.6.0 — 2026-09-12 (dialogue overhaul — mentor feedback P0+P1)

Mentor feedback addressed: (1) natural dialogue, (2) dialogue camera framing the
speaker, (3) believable character behavior in conversations, (4) consequential
story choices, (5) hidden events/secret interactions, (6) side quests.

### Added — dialogue acting system (`systems/acting.ts`)
- Registry keyed by entity id (`ren`, NPC ids, story-actor ids). Every dialogue
  node updates it (via `dialogueStore`) with: who is talking, gaze targets,
  emotional energy (mapped from `Emotion`), gesture/nod timers.
- `Figure` consumes the registry: head yaw toward the conversation partner,
  mouth opens/closes while talking, 3 subtle gesture cycles (open palm /
  emphasis / hand-to-chest) scaled by energy, listening nods every 2–5s,
  breathing idle. Ambient students stay on the cheap idle path.
- Ren turns his body toward the partner during conversations.

### Added — dialogue camera (`systems/shot.ts`, `data/shots.ts`)
- Data-driven shot presets (`close/medium/wide/ots/two`, subject/side/dist/
  height/look/dur). Nodes reference presets via `cam`; speakers without an
  explicit preset get a default per speaker role (narrator → wide, NPC → OTS
  over Ren's shoulder).
- `CameraRig` resolves shots from LIVE speaker/listener positions (new
  `actorPositions` runtime registry + stale-position cleanup on NPC unmount)
  in both CINEMATIC (post-opening) and a new DIALOGUE branch, with per-shot
  occlusion pull-in. Static `CAM_BY_NODE` poses remain as fallback and for the
  untouched first-person opening.

### Added — hidden events (`data/hiddenEvents.ts`, `systems/hiddenEvents.ts`)
- 9 data-driven discoveries (zone / NPC / time-of-day / flag gated): rooftop
  carving, alley gang mark, canteen rumor, field gloves, parking patrol
  schedule, Pak Budi's after-school story, the "tolong" desk carving, the OSIS
  anonymous-report notice, Bimo's personal alley warning.
- Rewards: items (`sarung_tangan`, `coretan_atap`), relationship/focus/stats,
  and info flags that feed NPC dialogue. Discovery persists as a story flag
  (save-compatible, no schema bump) and shows in the agenda journal
  ("TEMUAN TERSEMBUNYI x/9").

### Added — side quests (extends existing quest system, no new store)
- `aris_notes` (borrow → actually study), `canteen_teh` (Siti's lunch favor),
  `field_training` (dusk training: violence/hp), `alley_check` (gang patrol
  evidence for Siti). Activation through condition-gated dialogue choices;
  completion through world state in StoryDirector's existing scan.

### Changed — dialogue rework (canon preserved)
- Per-character voice guide documented in `data/dialogue.ts` (Aris hesitant,
  Siti structured, Bimo minimal/cold, Pak Budi formal, Ren dry).
- Repeat-visit variation via condition-gated choices (first meeting vs. known),
  callbacks to earlier choices (`helped_aris`, `bimo_impressed`, route,
  reputation ≥15, academic >80) — early decisions now echo later.
- New condition kinds: `chapterMin`, `period`, `zone`, `talks`. `socialStore`
  tracks `talkCounts` (persisted, optional in the save schema).

### Fixed — E-interaction regression (latent, caught by new QA)
- `input.endFrame()` ran at the end of the Player's frame — but R3F executes
  frames in mount order and the Player mounts BEFORE `StoryDirector`, so
  `justPressed('interact')` was always read from an already-cleared set.
  Cleanup now lives in an `InputJanitor` mounted after StoryDirector; `wheel`
  moved to explicit-consume only (CameraRig).

### QA
- `scripts/qa-mentor.mjs` (Playwright desktop): seeded mid-game save → gameplay
  → E-interact → ARIS dialogue with speaker-driven framing → condition-gated
  choices verified; 0 console errors.
- Test suite: **85/85** (27 new: shot math 8, acting 10, hidden events 9).

## 0.5.0 — 2026-09-12 (mobile rescue pack + character overhaul)

### Fixed — CRITICAL: blank world on mobile (root cause found)
- **Troika `<Text>` name tags fetched a Roboto webfont from a CDN at runtime.** On phone networks the fetch hangs → the component suspends with no `Suspense` boundary between `<Physics>` and the NPC list → React hides the ENTIRE canvas subtree → sky-colored blank world while the DOM dialogue kept working (exactly the reported screenshot). Name tags are now **canvas-sprite based** (`NameTagSprite`): zero network, zero suspense, amber-bordered dossier style.
- Previously-suspected GPU overload is now ALSO handled (belt & suspenders):
  - `game/mobile.ts` device tiering — phones get dpr ≤1.5, antialias off, `'basic'` shadows, 1024px shadow maps, reduced geometry segments, half the ambient crowd.
  - `webglcontextlost` handler with `preventDefault()` + recovery reporting (was: permanent silent death).
  - Render-loop watchdog (`mobile.markFrame` petted by `CameraRig`): a dead loop surfaces a "RENDER TERHENTI — MUAT ULANG" chip instead of a silent freeze.
  - `DiagnosticsChip`: JS errors / unhandled rejections / context loss print as a small on-screen mono line — blank screens can never be information-less again.

### Added — touch controls
- `game-ui/TouchControls.tsx`: virtual joystick (walk; rim = run), right-half camera drag pad, action cluster (E/↑ in gameplay; ATK/HEV/BLK/DGE in combat), top-right pause, landscape suggestion in portrait.
- `input.ts` extended: touch axes merged into `isDown()` (movement/run read both keyboard and joystick), action injectors, per-frame look-delta consumed by `CameraRig`.

### Changed — character overhaul (stylized-realistic + PBR)
- `npc/Character.tsx`: shared procedural **fabric weave normal + roughness maps** (one 128px texture set cached across all figures), material cache keyed by color/kind, upgraded silhouette (flattened chest capsule, hips block, neck, shoulder caps), detailed face (sclera + iris + catchlight, nose, mouth), pleated skirt with hem band, socks + soled shoes, button details.
- Tier-aware: shadow casting off + reduced segment counts on phones; draw-call budget halved for ambient students (`Npcs` filters every other ambient on low tier).

### QA
- `scripts/qa-mobile.mjs` + `scripts/qa-landscape.mjs` (Playwright, Pixel 7 emulation): menu → prolog → dialogue → world render verified, 0 console errors; landscape choice UI + pause verified.
- Test suite: **58/58** (6 new tier-classification tests).

## 0.4.0 — 2026-09-12 (Stitch-style UI overhaul + cleanup)

### Added
- **Design system "STITCH"** (dark terminal dossier): panel #111319, amber/red/cyan accents, Anton + JetBrains Mono + Space Grotesk, corner brackets, chips, segmented bars — applied to MainMenu, HUD, DialogueUI, all FullMenu panels, loading/game-over/ending screens; UI copy localized to Indonesian.
- FullMenu titles as dual-tone "X // Y" with per-menu eyebrow labels.

### Removed
- Unused assets: old school GLBs (×2), char.glb, all NPC GLB + preview files (14), stitch generator scripts (4).


## 0.3.1 — 2026-09-11 (PBR pass + blank-screen hotfix)

### Fixed
- **CRITICAL blank screen on mobile:** `<Environment preset="city">` downloaded an HDR from an external CDN (`raw.githack.com`) at runtime; on flaky mobile networks the fetch failed and crashed the entire Canvas subtree — the world turned into an empty sky while the dialogue DOM kept working. Replaced with a **local** `<Environment frames={1}>` built from in-scene Lightformers (zero network) for all three scenes.
- **Loaded-game camera hardening:** `CameraRig.fp` was only cleared by the opening's FP→TP transition; continuing a save straight into GAMEPLAY/COMBAT kept the cinematic branch alive and lerped the camera to the campus `fp_gate` pose even in rooftop/warehouse scenes (black screen staring at a wall). The rig now snaps to third-person orbit when `opening_complete` is set.
- **Scene error fallback:** `SceneErrorBoundary` + `Suspense` inside the Canvas — if any world component ever throws, gameplay continues on a lit fallback plane instead of a dead void.
- **Mirrored 3D signs:** `KELUAR` (warehouse) and `TANGGA` (rooftop bulkhead) were seen from their back face; `SchoolSign` gained a `rotY` option and both now read correctly.
- **Opening composition:** `fp_students` had the camera clipped inside the main building's east wall; `fp_end` stared at a blank facade 5 m away beside the door gap. Both re-posed to clear sightlines (canteen walkway / entrance reverse shot).
- **Troika font CDN dependency:** signs now load Carlito from `public/fonts/` instead of the default Roboto fetched from `fonts.gstatic.com`.

### Added — procedural PBR materials (request: "texture nya pake PBR biar lebih realistis")
- `world/pbr.tsx`: zero-network PBR factory — 16 tileable surface sets (concrete, plaster, plaster_in, pavers, asphalt, grass, dirt, brick, wood, tile, terrazzo, metal, corrugated, roof, bark, foliage), each generated at runtime into 256px canvases with **albedo + normal (Sobel) + roughness** maps, wrapped/cached, integer-quantized repeat clones to bound VRAM on mobile.
- `<Pbr>` drop-in `<meshStandardMaterial>` replacement; applied across every scene:
  - **Campus:** grass field, asphalt street/parking/alley, concrete sidewalks/yard/warehouse yard, paver courtyard + paths, plaster facades, standing-seam roofs, concrete gate pillars/steps/stair/bleachers, corrugated warehouse shell + containers + bike shed, wood crates/benches/planters, bark + foliage trees.
  - **Interior:** terrazzo hall/corridor, tiled classroom + canteen, wood teacher room/desks/chairs/benches.
  - **Rooftop:** concrete deck, city blocks, metal AC/tank, wood pallets.
  - **Warehouse:** stained concrete floor, corrugated walls/roof/containers (real ribbing via normal map — the fake stripe meshes are gone), wood crates/pallets/shelf boxes.
- Local `<Environment>` maps for rooftop (sky) and warehouse (dim) so metals keep reflections; warehouse lighting lifted (ambient 0.62, lamps 22) so the duel arena stays readable while keeping the night mood.

## 0.3.0 — 2026-09-11 (world v2: multi-scene rebuild, no school GLB)

### Added
- **Multi-scene world architecture** (`SceneId`: campus / rooftop / warehouse) with `gameStore.requestScene()` — fade-out → scene swap → teleport → fade-in transitions, `sceneLoading` overlay, stale-zone reset between scenes.
- **Campus rebuilt from scratch** (`CampusWorld` + `CampusInterior` + shared `props.tsx` wall-segment system that generates visuals and Rapier colliders from one data array). The 7.3MB `jamalpur_zilla_school_2022.glb` is removed from `public/`; the whole world is now procedural geometry.
- **Accessible school interior:** entrance hall, lockers, bulletin boards, corridor with storage core, classroom 1-X (desks/chairs/blackboard/clock), teacher room (meeting table/cabinets), canteen building with serving counter, display case, tables and stools — all with furniture colliders.
- **Rooftop scene (Bab III):** parapets, stair bulkhead with exit trigger, AC units, water tank, antenna, clotheslines, distant city skyline; Bimo stands at the north parapet for the proposition cinematic.
- **Warehouse scene (Bab IV bad route):** container stacks, crates, shelving, forklift, oil drums, catwalk, hanging lamps + skylight shafts, dim hangar fog; the warehouse duel now happens inside the scene via `{ k: 'scene' }` effect.
- **Scene-aware story wiring:** `back_stairs` zone now transitions into the rooftop scene when `rooftop_meeting` is active (chapter 3 cinematic starts on arrival); accept/reject checkpoints return the player to campus before route montages; rooftop/warehouse exit triggers return to campus; scene field persisted in save v2 snapshots.
- `world.test.ts` (11 specs): scene registry, scene-aware `zoneAt`, zone/bounds integrity, NPC waypoints inside campus bounds, camera-pose coverage, scene-transition effects on story nodes. Suite is now **52/52**.

### Changed
- Stylized-realistic character upgrade (`Figure`): capsule limbs, shaped hair styles (short/wave/ponytail/buzz), facial features (eyes/brows/jaw), collar + tie, optional skirt, per-NPC skin/pants/hair data — animation interface unchanged.
- `zoneAt()` is scene-aware; zones split into per-scene registries (`SCENES`); MapPanel renders the current scene's schematic; NPC schedules repositioned to the new campus layout; opening/cinematic actor coordinates remapped; new `whin`/`whin_close` camera poses for the warehouse interior; new zone-flavor nodes (classroom, warehouse exterior).
- Campus layout plan: street/gate/courtyard south, main building center (x −16..16, z 4..28), canteen east, parking east, field west, rear yard + stair shaft north, back alley north-east, warehouse exterior north-west.
- Fade CSS reworked: `fade-in` now reveals (opacity 1→0) instead of re-darkening; scene transition overlay with spinner added.

## 0.2.1 — 2026-09-11 (story-flow bugfix pass)

### Fixed
- **CRITICAL soft-lock (Resistance route):** the Chapter 4 resistance montage (`ch4_res_1..4`) ended with `end: true` while still in CINEMATIC mode; `close()` only restores `DIALOGUE→GAMEPLAY` and the FP→TP transition is a one-shot opening-only exit, so the game froze on a camera pose with no UI and no input — chapter 4 was unfinishable on this route. CameraRig now returns control when a post-opening cinematic has no dialogue node left to show.
- **Game over wiped the run:** dying in any fight offered only "COBA LAGI" (= full restart to the opening). GameOverScreen now offers "MUAT SAVE TERAKHIR" (load auto slot) next to restart.
- **Ghost combat state after load:** `loadGame` now resets the combat store, procedural anim state (`down`) and `enemyPos.active`, so loading after a KO no longer renders the character lying down or suppresses NPC interaction prompts.
- **Post-ending auto-save corruption:** "MENU UTAMA" from the ending screen overwrote the auto slot with a non-playable post-ending snapshot; it no longer saves once an ending is set.
- **Duplicate unguarded montage trigger:** StoryDirector had a second bad-route montage block without the `bad_montage_done` guard (would replay the montage from a mid-montage save); removed (the guarded block handles entry).

### Added
- `{ k: 'save' }` effect type routed through the central effects pipeline; story checkpoints now auto-save to the auto slot at: start of Chapter 3 (`ch2_close`), start of Chapter 4 bad route (`ch3_accept_2`), start of Chapter 4 resistance route (`ch3_reject_2`), and before the alley search (`ch4_res_3`).
- Story-flow regression suite (`src/test/storyFlow.test.ts`, 11 specs): full node reachability from every runtime entry point (no dead content), canon route/ending effect wiring, montage beat ↔ encounter mapping, checkpoint presence.

### Changed
- Zone-flavor node map moved to `src/data/dialogue.ts` (`ZONE_FLAVOR`) as the single source of truth shared by StoryDirector and tests.

## 0.2.0 — 2026-09-10 (Phase 0–18 full development pass)

### Added
- Project management docs (PROJECT_OVERVIEW, PRD v0.2, GDD v0.2, ARCHITECTURE, DECISIONS, PROJECT_STATE, TODO, README) + git init.
- Modular architecture: `src/data`, `src/stores`, `src/game` (systems/runtime), `src/game-ui`.
- Input abstraction; game-mode state machine (BOOT → MAIN_MENU → OPENING_CINEMATIC → GAMEPLAY → DIALOGUE/CHOICE/COMBAT/menus → ENDING/GAME_OVER/TRANSITION).
- Save system v2: versioned localStorage save with v1→v2 migration and validation.
- Third-person controller (Rapier dynamic body: acceleration, run, jump, ground check) and camera system (orbit/pitch/zoom/shoulder offset/occlusion, cinematic override, first-person opening → third-person transition).
- Data-driven dialogue graph (conditions/effects), typewriter dialogue UI with portraits and keyboard navigation; central notifications queue.
- Opening vertical slice following canon scenes 1–6 (FP arrival, bullying encounter, mandatory first choice Help/Walk Past, Siti intervention, Bimo observation, FP→TP handoff).
- Real-time combat: light/heavy attacks, block, dodge, enemy FSM AI, hit pause, camera shake, damage feedback (replaces legacy menu combat).
- Quest system, school time + periods, NPC schedules, study mini-game, inventory (categories + consumables), school map, diegetic phone (Messages/Contacts/Schedule/Notes).
- Social systems: relationships (−100…+100 + labels), reputation, academic, focus, violence, diplomacy.
- Story chapters 2–4: gate conflict combat, rooftop proposition (ACCEPT/REJECT), Bad route warehouse finale, Resistance route final test, EndingResolver + BAD/TRUE/BITTER endings with canon text.
- WebAudio procedural audio (buses + gameplay/UI hooks), VFX (hit pause, shake, fades), settings (camera, volumes, reduced motion, screen shake), accessibility basics, full keyboard menu navigation.
- Test suites for pure systems (save, endingResolver, relationship, time, effects, study).

### Fixed
- NPC interaction coordinates now share one source of truth with rendering.
- Physics colliders enabled (ground/bounds); player collides and jumps.
- Per-frame input-driven movement replaces per-keypress movement.
- Movement no longer writes the entire save to localStorage every step (throttled + explicit save points).
- HUD values read live state (no hardcoded 485/500, 240/300).
- Duplicate `story.ts` retired; tests target real systems.

### Changed
- Canon roster locked to Ren/Aris/Siti/Bimo (PRD v0.1 roster superseded — see DECISIONS.md #1).

## 0.1.0 — baseline (pre-audit)
- Initial prototype: menu, opening dialogue + first choice, basic camera/NPC/dialogue, menu combat, localStorage save v1.
