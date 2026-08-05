# Entitas Data Game "Tumpuk!"

Dokumen ini mendeskripsikan pemisahan entitas data antara **Data Persisten (Postgres via Prisma)** dan **Data Runtime State (In-Memory PartyKit)** berdasarkan kebutuhan alur bisnis dan arsitektur *Zero Hand Leak*.

---

## 1. Data Persisten (Postgres / Neon DB)

Entitas di bawah ini disimpan secara permanen di database Postgres untuk kebutuhan autentikasi, manajemen room, riwayat pertandingan, dan leaderboard.

| Entitas | Field Utama | Tipe Data / Relasi | Alasan Disimpan Persisten (Postgres) |
|---|---|---|---|
| **User** | `id`<br>`name`<br>`email`<br>`avatarUrl`<br>`provider`<br>`createdAt` | String (UUID)<br>String<br>String (Unique, Optional)<br>String (Optional)<br>Enum / String (`"google"` \| `"guest"`)<br>DateTime | Memungkinkan pemain terdaftar menyimpan data identitas, melacak histori pertandingan, dan mengumpulkan poin/statistis di leaderboard. |
| **Room** | `id`<br>`code`<br>`hostUserId`<br>`status`<br>`houseRules`<br>`maxPlayers`<br>`createdAt` | String (UUID)<br>String (6-digit, Unique)<br>String (FK -> User.id)<br>Enum (`WAITING` \| `PLAYING` \| `FINISHED`)<br>Json (`stacking`, `jumpIn`, `sevenZero`, `drawToMatch`)<br>Int (Default: 6)<br>DateTime | Menyimpan data room untuk koordinasi awal sebelum masuk game, memvalidasi kode room saat pemain bergabung via Next.js, serta menyimpan preferensi *House Rules*. |
| **Match** | `id`<br>`roomId`<br>`winnerId`<br>`startedAt`<br>`endedAt` | String (UUID)<br>String (FK -> Room.id)<br>String (Optional, FK -> User.id)<br>DateTime<br>DateTime (Optional) | Menyimpan catatan permanen dari satu sesi/ronde pertandingan setelah selesai untuk keperluan statistik dan histori. |
| **MatchPlayer** | `id`<br>`matchId`<br>`userId`<br>`guestName`<br>`finalHandSize`<br>`scoreDelta`<br>`seatIndex` | String (UUID)<br>String (FK -> Match.id)<br>String (Optional, FK -> User.id)<br>String (Optional)<br>Int<br>Int<br>Int | Menyimpan hasil individual tiap pemain pada akhir match (skor yang diperoleh/dikurangi dan sisa kartu di tangan) untuk keperluan laporan statistik. |

---

## 2. Data Runtime State (PartyKit / In-Memory Durable Object)

Entitas di bawah ini **hanya ada di memori server PartyKit** selama sesi pertandingan berlangsung. Data ini bersifat sementara (*ephemeral*), berkecepatan tinggi, dan **TIDAK disimpan ke database**.

| Entitas | Field Utama | Tipe Data | Alasan Hanya di Runtime (PartyKit) |
|---|---|---|---|
| **Card** | `id`<br>`color`<br>`type`<br>`value` | String (e.g. `"red-7-a"`)<br>Enum (`red`, `yellow`, `green`, `blue`, `wild`)<br>Enum (`number`, `skip`, `reverse`, `draw2`, `wild`, `wild4`)<br>Int (Optional, 0–9) | Kartu mengalami perubahan state yang sangat cepat (dibagi, dipindah, dibuang, di-draw). Menyimpan tiap kartu di database akan membebankan I/O DB secara tidak perlu. |
| **PlayerState** | `id`<br>`name`<br>`hand`<br>`connected`<br>`calledTumpuk`<br>`disconnectTimer` | String (UserId / GuestId)<br>String<br>Card[]<br>Boolean<br>Boolean<br>Timeout / Epoch MS (Optional) | Menyimpan isi kartu di tangan pemain (`hand`) secara rahasia di memori server. Keberadaan kartu di tangan bersifat ephemeral dan dikirimkan secara terkustomisasi (Zero Hand Leak). |
| **GameState** | `roomId`<br>`players`<br>`deck`<br>`discardPile`<br>`currentPlayerIndex`<br>`direction`<br>`currentColor`<br>`drawStack`<br>`turnDeadline`<br>`status`<br>`houseRules` | String<br>PlayerState[]<br>Card[] (Server-only)<br>Card[]<br>Int<br>`1` \| `-1`<br>Card['color']<br>Int<br>Epoch MS<br>`"waiting"` \| `"playing"` \| `"finished"`<br>HouseRules Object | Single source of truth untuk live game yang menangani siklus giliran, arah perputaran, kalkulasi penalti draw, dan sisa waktu giliran secara real-time melalui koneksi WebSocket. |

---

## 3. Rangkuman Pemisahan Tanggung Jawab

1. **Postgres**: Menyimpan *WHO* (User/Pemain), *WHERE* (Room metadata & House Rules), dan *RESULT* (Match outcomes & scores).
2. **PartyKit**: Menyimpan *LIVE ACTIONS* (Deck, Kartu di tangan, Discard pile, Giliran aktif, Timer, dan event TUMPUK!).
