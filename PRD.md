# PRD — "Tumpuk!" (Working Title)
Game kartu multiplayer real-time bergaya UNO, dengan card art kartun yang di-generate via `ag/gemini-3-flash-agent` (9router, dijalankan dari OpenCode).

> Catatan nama: "Tumpuk!" cuma working title (artinya "stack/tumpuk kartu"). Ganti bebas — cukup find-and-replace di seluruh dokumen ini + kode. Mekanik kartu boleh mirip UNO (mekanik gak bisa di-hak-cipta), tapi hindari pakai nama "UNO" atau desain kartu resmi mereka kalau nanti mau di-publish ke publik luas.

---

## 1. Ringkasan

Web app multiplayer real-time, 2–6 pemain per room, join via kode room 6 digit (pola yang sama kayak Duel Mode di Ketakomik). Setiap room punya host yang bisa toggle house rules sebelum game mulai. Server jadi single source of truth untuk seluruh state — client cuma render apa yang dikirim server.

**Target pengalaman:** buka link/kode room dari HP, main bareng temen real-time, kartu kartun yang lucu jadi daya tarik visual utama (bukan cuma game generik).

---

## 2. Kenapa Stack Next.js + Vercel Serverless Biasa GAK Cocok

Ini bagian paling penting sebelum eksekusi. Semua project lo sebelumnya (Ketakomik, Shopby, M2A, Kulak) jalan di atas request-response model: user hit API route, server balikin response, koneksi selesai. **Real-time multiplayer butuh koneksi yang tetap terbuka** (WebSocket) supaya server bisa push update ke semua pemain begitu ada yang main kartu — dan Vercel serverless function itu didesain untuk mati setelah beberapa detik, gak bisa nahan koneksi lama.

**Solusi: PartyKit** (jalan di Cloudflare Durable Objects).
- Satu "Party" (instance) = satu room game. State-nya hidup di memory instance itu selama room aktif.
- Next.js tetap dipakai penuh untuk semua yang bukan real-time: landing page, lobby, auth, riwayat match, leaderboard.
- PartyKit cuma nangani: room state, validasi giliran, broadcast update ke semua pemain di room itu.

```
┌─────────────────┐         ┌──────────────────────┐
│  Next.js (Vercel) │ ◄────► │  Postgres (Neon)      │
│  - Landing, Lobby  │        │  - User, Match history│
│  - Auth (NextAuth) │        │  - Leaderboard         │
└────────┬───────────┘        └──────────────────────┘
         │
         │ WebSocket
         ▼
┌──────────────────────┐
│  PartyKit (Cloudflare) │
│  - Live game state      │
│  - Turn validation       │
│  - Broadcast ke players  │
└──────────────────────┘
```

---

## 3. Prinsip Keamanan: "Zero Hand Leak"

Sama filosofinya kayak "Zero Text Leak" di Ketakomik (jawaban gak pernah dikirim ke client sebelum waktunya) — di sini:

- **Kartu pemain lain TIDAK PERNAH dikirim ke client kamu.** Server cuma kirim `handCount` (jumlah kartu) untuk pemain lain, bukan isinya.
- Kartu di deck (belum dibagi) juga gak pernah ada di client — shuffle & draw 100% di server (PartyKit).
- Setiap `play_card` divalidasi server-side: apakah memang giliran pemain itu, apakah kartu yang dimainkan valid (warna/angka/simbol cocok dengan discard pile teratas), sebelum state di-update dan di-broadcast.
- Kalau nanti mau nambah room privat berbayar/leaderboard kompetitif, prinsip ini yang mencegah cheat via DevTools/network inspector.

---

## 4. Gameplay & Aturan

### 4.1 Komposisi Kartu (108 kartu, 4 warna: Merah/Kuning/Hijau/Biru)
| Tipe | Jumlah per warna | Total |
|---|---|---|
| Angka 0 | 1 | 4 |
| Angka 1–9 | 2 masing-masing | 72 |
| Skip / Reverse / +2 | 2 masing-masing | 24 |
| Wild | – | 4 |
| Wild +4 | – | 4 |
| **Total** | | **108** |

### 4.2 Alur Dasar
1. Tiap pemain dibagi 7 kartu (configurable).
2. Kartu pertama dari deck jadi discard pile awal.
3. Giliran berjalan searah jarum jam (bisa dibalik dengan Reverse).
4. Pemain harus main kartu yang cocok warna/angka/simbol dengan kartu teratas, atau kartu Wild, atau draw 1 kartu kalau gak ada yang cocok.
5. Pemain dengan sisa 1 kartu wajib klik tombol "TUMPUK!" (UNO call) — kalau lupa dan ketahuan pemain lain (challenge), kena penalti draw 2 kartu.
6. Pemain pertama yang habis kartunya menang ronde. Skor dihitung dari total nilai kartu di tangan pemain lain.

### 4.3 House Rules (toggle oleh host sebelum game mulai)
- **Stacking +2/+4**: boleh nimpuk penalti draw ke pemain berikutnya.
- **Jump-in**: pemain lain boleh potong giliran kalau punya kartu identik persis.
- **7-0 Rule**: kartu angka 7 = tukar tangan dengan pemain lain, angka 0 = semua pemain geser tangan searah putaran.
- **Draw-to-match**: kalau draw kartu dan langsung cocok, wajib/boleh langsung dimainkan (pilih salah satu mode).

Ini fitur yang bikin game-nya gak generik — banyak game UNO-clone online cuma punya 1 ruleset kaku, sedangkan grup temen biasanya punya "aturan rumah" masing-masing.

### 4.4 Turn Timer & Disconnect Handling
- Tiap giliran punya timer (default 20 detik). Timeout → auto-draw 1 kartu, skip ke giliran berikutnya.
- Pemain disconnect: kursi & kartu ditahan 60 detik (reconnect grace period). Lewat itu → auto-skip terus tiap giliran sampai reconnect atau host kick.

---

## 5. Data Model

### 5.1 Postgres (Neon) — persistent, via Prisma
```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  avatarUrl     String?
  email         String?  @unique
  provider      String   // "google" | "guest"
  createdAt     DateTime @default(now())
  matches       MatchPlayer[]
}

model Room {
  id            String   @id @default(uuid())
  code          String   @unique // 6 digit
  hostUserId    String
  status        RoomStatus @default(WAITING) // WAITING | PLAYING | FINISHED
  houseRules    Json      // { stacking: bool, jumpIn: bool, sevenZero: bool, drawToMatch: bool }
  maxPlayers    Int       @default(6)
  createdAt     DateTime  @default(now())
  matches       Match[]
}

model Match {
  id            String   @id @default(uuid())
  roomId        String
  room          Room     @relation(fields: [roomId], references: [id])
  winnerId      String?
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  players       MatchPlayer[]
}

model MatchPlayer {
  id            String   @id @default(uuid())
  matchId       String
  match         Match    @relation(fields: [matchId], references: [id])
  userId        String?
  guestName     String?
  user          User?    @relation(fields: [userId], references: [id])
  finalHandSize Int      // 0 kalau menang
  scoreDelta    Int      // poin dari sisa kartu lawan (kalau menang)
  seatIndex     Int
}

enum RoomStatus {
  WAITING
  PLAYING
  FINISHED
}
```

> Kartu (Card) **sengaja gak ada di schema Postgres** — itu murni runtime construct di PartyKit, gak perlu dipersist. Yang dipersist cuma hasil akhir match.

### 5.2 In-Memory Game State (PartyKit Durable Object — TIDAK di database)
```ts
interface Card {
  id: string;        // e.g. "red-7-a"
  color: 'red' | 'yellow' | 'green' | 'blue' | 'wild';
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
  value?: number;     // 0-9, khusus type "number"
}

interface PlayerState {
  id: string;
  name: string;
  hand: Card[];        // hanya dikirim ke pemilik kartu ini
  connected: boolean;
  calledTumpuk: boolean; // sudah klik "TUMPUK!" saat sisa 1 kartu?
}

interface GameState {
  roomId: string;
  players: PlayerState[];
  deck: Card[];              // server-only, gak pernah dikirim ke client
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: Card['color'];
  drawStack: number;         // akumulasi +2/+4 kalau stacking aktif
  turnDeadline: number;      // epoch ms
  status: 'waiting' | 'playing' | 'finished';
  houseRules: { stacking: boolean; jumpIn: boolean; sevenZero: boolean; drawToMatch: boolean };
}
```

---

## 6. Kontrak Event (WebSocket via PartyKit)

### 6.1 Client → Server
| Event | Payload | Keterangan |
|---|---|---|
| `join_room` | `{ code, userId? , guestName? }` | Masuk room, guest boleh tanpa login |
| `start_game` | `{}` (host only) | Mulai game, shuffle & bagi kartu |
| `play_card` | `{ cardId, chosenColor? }` | `chosenColor` wajib kalau kartu Wild |
| `draw_card` | `{}` | Ambil 1 kartu dari deck |
| `call_tumpuk` | `{}` | Klaim "TUMPUK!" saat sisa 1 kartu |
| `challenge_tumpuk` | `{ targetPlayerId }` | Tuduh pemain lain lupa call |
| `leave_room` | `{}` | Keluar room |

### 6.2 Server → Client
| Event | Payload | Keterangan |
|---|---|---|
| `room_update` | `{ players[], hostId, status, houseRules }` | Broadcast tiap ada perubahan lobby |
| `game_state` | **personalized per player** — lihat contoh di bawah | Broadcast tiap ada aksi valid |
| `invalid_move` | `{ reason }` | Cuma dikirim ke pemain yang gagal aksi |
| `turn_timeout` | `{ playerId }` | Notifikasi giliran auto-skip |
| `game_over` | `{ winnerId, scores: {playerId: number}[] }` | Akhir ronde |

### 6.3 Contoh Payload `game_state` (personalized — ini kunci dari prinsip Zero Hand Leak)
Server generate payload BEDA untuk tiap pemain dari GameState yang sama:

```json
{
  "roomId": "abc123",
  "you": {
    "id": "player_1",
    "hand": [
      { "id": "red-7-a", "color": "red", "type": "number", "value": 7 },
      { "id": "wild-2", "color": "wild", "type": "wild" }
    ]
  },
  "opponents": [
    { "id": "player_2", "name": "Dimas", "handCount": 6, "connected": true },
    { "id": "player_3", "name": "Rani", "handCount": 1, "connected": true, "calledTumpuk": true }
  ],
  "discardTop": { "id": "blue-4-b", "color": "blue", "type": "number", "value": 4 },
  "currentColor": "blue",
  "currentPlayerIndex": 0,
  "direction": 1,
  "turnDeadline": 1754467200000,
  "drawStack": 0
}
```

Perhatikan: `opponents[].hand` **tidak ada di payload sama sekali** — cuma `handCount`. Ini yang harus dijaga ketat di kode server-side saat generate payload per-socket.

---

## 7. Alur UI/UX — Mobile-First

### 7.0 Strategi Responsive
- Base design ditarget viewport **~375–428px** (iPhone SE s/d Pro Max), **portrait**, sebagai default. Ini yang dikerjain duluan, penuh, sampai solid.
- Breakpoint desktop (≥1024px) ditambahkan **belakangan** sebagai enhancement terpisah — bukan didesain paralel dari awal, biar gak ada waktu kebuang mikirin layout desktop yang kemungkinan besar berubah begitu mobile-nya udah jalan.
- Pola Tailwind: default classes = mobile, prefix `lg:` cuma dipakai buat override di step desktop (lihat Prompt 10 di BUILD-PROMPTS.md).

### 7.1 Landing
- Full-height single column, dua tombol besar (min tinggi 48px, thumb-friendly): "Buat Room" / "Gabung Room".
- Input kode room: `inputmode="numeric"` biar keypad angka otomatis muncul, auto-focus & auto-advance tiap digit.

### 7.2 Lobby
- List pemain di scroll area, avatar + nama, compact.
- Toggle house rules pakai switch yang gampang di-tap (bukan checkbox kecil).
- Tombol "Mulai Game" sticky di bawah layar (thumb zone).

### 7.3 Meja Game (paling kompleks — ini prioritas utama)
- **Zona bawah (thumb zone)**: tangan kartu sendiri. Horizontal scroll/swipe kalau kartu > ~7 — jangan paksa muat semua kartu di lebar layar, itu bikin tiap kartu kekecilan buat di-tap presisi. **Tap = main kartu** (bukan drag — drag susah presisi di layar kecil dan gampang salah target), pakai micro-confirmation animation biar gak ke-tap gak sengaja.
- **Zona tengah**: discard pile + deck (tap deck = draw), ukuran cukup besar biar simbol/angka kartu jelas kebaca.
- **Zona atas — strip horizontal** (bukan melingkar): avatar semua lawan + jumlah kartu (card back) + indikator giliran. Layout meja melingkar ala fisik disimpan buat versi desktop nanti — di layar mobile sempit, maksa 6 avatar melingkar bikin semuanya kekecilan.
- Modal pilih warna (main kartu Wild) = **bottom sheet full-width**, 4 tombol warna besar, satu jempol cukup.
- Tombol "TUMPUK!": floating, posisi thumb-reachable, pulse warning saat kartu tersisa 2.
- Timer giliran: progress bar tipis nempel di avatar pemain aktif — jangan modal/overlay besar yang nutupin pandangan meja.
- Semua target tap minimal **44px** (standar accessibility touch target).

### 7.4 End Screen
- Pemenang + breakdown skor tiap pemain, scroll kalau pemain banyak, tombol "Main Lagi" sticky di bawah.

### 7.5 Desktop Enhancement (setelah mobile solid, bukan bareng)
- Breakpoint ≥1024px: strip lawan berubah jadi circular layout beneran di sekeliling discard pile, tangan sendiri gak perlu horizontal scroll lagi (lebar layar cukup buat muat semua kartu), drag-and-drop bisa ditambah sebagai **alternatif** tap (bukan gantiin tap).

---

## 8. Fitur Bertahap

**MVP (v1)**
- Room via kode, 2–6 pemain, guest play (tanpa login)
- Aturan standar UNO + toggle house rules dasar (stacking, jump-in)
- Turn timer + disconnect grace period
- Card art kartun (generate via gemini-3-flash-agent)

**V2**
- Login Google (NextAuth) + riwayat match & leaderboard di Postgres
- Public quick-match (gak perlu kode, auto-match sama pemain lain yang lagi cari room)
- Bot sederhana buat isi slot kosong (kalau pemain kurang dari minimal)
- Emote/reaction cepat antar pemain saat main (biar berasa "rame")

---

## 9. Next Steps

Lanjut ke `BUILD-PROMPTS.md` — urutan prompt buat OpenCode (mapping ke metodologi 9 langkah lo: business process → data → DB schema → API contract → sample JSON → UI template → frontend service → composable/store → integration) plus template prompt buat generate card art yang konsisten.
