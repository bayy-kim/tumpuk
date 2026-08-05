# BUILD-PROMPTS.md — "Tumpuk!"
Urutan prompt buat OpenCode (model `ag/gemini-3-flash-agent` via 9router), mengikuti metodologi 9 langkah lo. Jangan skip urutan — tiap prompt sengaja dikasih konteks minimal biar model gak overload dan hasilnya predictable.

> **Catatan folder:** setiap prompt di bawah yang nyebut "simpan sebagai `docs/xxx.md`" atau path lain yang foldernya belum ada (`docs/`, `party/`, `components/game/`, dst) — itu dibuat OTOMATIS sama OpenCode pas nulis file ke sana, sama kayak `mkdir -p` sebelum nulis. Lo gak perlu bikin folder apapun manual sebelum jalanin prompt manapun di dokumen ini.

Sebelum mulai: setup project Next.js 15 + PartyKit dulu manual (bukan lewat OpenCode), karena ini keputusan arsitektur sekali jalan, bukan sesuatu yang perlu di-generate.

**Penting — dua jebakan umum:**
1. Jalankan `create-next-app` dari folder **parent** (misal `D:\coding\GAMEBYY`), BUKAN dari dalam folder yang namanya udah "tumpuk" — karena command ini bikin subfolder baru pakai nama yang lo kasih, kalau dijalankan dari dalam folder senama hasilnya nested dobel (`tumpuk\tumpuk`).
2. JANGAN pakai `npx partykit init` — itu scaffold project baru yang berdiri sendiri (package.json & git terpisah), bukan nambah config ke project yang ada. Akibatnya `lib/events.ts` gak bisa di-share antara Next.js dan PartyKit server (lihat Prompt 4). Buat `partykit.json` dan `party/server.ts` manual sebagai gantinya.

```bash
npx create-next-app@latest tumpuk --typescript --tailwind --app
cd tumpuk
npm install partykit partysocket
# JANGAN: npx partykit init
# Ganti dengan bikin manual: partykit.json di root + folder party/server.ts (placeholder,
# diisi beneran di Prompt 9). Lihat template di README project atau minta OpenCode generate
# stub minimal PartyKit server di langkah ini.
npm install prisma @prisma/client @prisma/adapter-pg next-auth@beta framer-motion
npx prisma init
```

### Kalau udah kejadian kena masalah nested folder + tumpuk-party terpisah

Jangan benerin manual satu-satu di terminal — kasih prompt ini ke OpenCode, biar dia yang eksekusi semua langkahnya sekaligus dan lapor balik ke lo:

```
Project Next.js ini kena masalah struktur folder dari setup awal, tolong perbaiki.

STRUKTUR SEKARANG (salah):
D:\coding\GAMEBYY\tumpuk\tumpuk\                     <- project Next.js asli (app/, package.json,
                                                          node_modules/, prisma/, .git/, dst)
D:\coding\GAMEBYY\tumpuk\tumpuk\tumpuk-party\        <- project PartyKit terpisah yang gak
                                                          sengaja ke-scaffold sendiri (punya
                                                          package.json & .git sendiri)

TARGET STRUKTUR (benar):
D:\coding\GAMEBYY\tumpuk\                <- project Next.js, isi dari tumpuk\tumpuk pindah ke sini
D:\coding\GAMEBYY\tumpuk\party\server.ts <- file baru, stub PartyKit server
D:\coding\GAMEBYY\tumpuk\partykit.json   <- file baru, config PartyKit

Lakukan berurutan, VERIFIKASI tiap langkah sebelum lanjut, dan STOP + laporkan ke saya kalau
ada yang gak sesuai ekspektasi di bawah (misal ternyata ada kode custom yang udah gue tulis
di tumpuk-party, jangan dihapus kalau begitu, tanya dulu):

1. Cek isi folder tumpuk\tumpuk\tumpuk-party -- pastikan itu masih starter template default
   PartyKit (belum ada kode custom), baru hapus folder itu sepenuhnya.
2. Pindahkan SELURUH isi tumpuk\tumpuk\ (app/, prisma/, package.json, node_modules/, .git/,
   dst) naik satu level jadi langsung di dalam tumpuk\.
3. Hapus folder tumpuk\tumpuk\ yang sekarang kosong.
4. Buat file partykit.json di root project:
   { "name": "tumpuk-party", "main": "party/server.ts" }
5. Buat folder party/ dengan file server.ts, isi stub minimal:
   import type * as Party from "partykit/server";
   export default class Server implements Party.Server {
     constructor(readonly room: Party.Room) {}
   }
   Server satisfies Party.Worker;
6. Tambahkan di package.json bagian "scripts":
   "party:dev": "partykit dev",
   "party:deploy": "partykit deploy"
7. Jalankan `npm run dev` sebentar buat mastiin Next.js masih jalan normal setelah folder
   dipindah (gak ada broken path), lalu stop lagi.
8. Tampilkan struktur folder akhir (tree 2 level dari root project) biar saya bisa cross-check.
```

---

## Prompt 1 — Business Process
```
Baca PRD.md di root project ini. Sebelum nulis kode apapun, tuliskan ringkasan alur bisnis
game "Tumpuk!" dalam bentuk numbered steps dari sisi pemain (buat room -> join -> lobby ->
main -> menang/kalah -> rematch). Sertakan juga edge case yang harus dihandle: pemain
disconnect di tengah game, pemain lupa call "TUMPUK!", host keluar room saat game berjalan.
JANGAN tulis kode. Simpan sebagai docs/01-business-process.md.
```

## Prompt 2 — Data
```
Berdasarkan docs/01-business-process.md dan PRD.md, tuliskan entitas data yang dibutuhkan:
mana yang persisten (Postgres) dan mana yang cuma runtime state (PartyKit). Jangan tulis
schema Prisma dulu -- cukup daftar entitas + field + alasan kenapa persisten/tidak, dalam
bentuk tabel markdown. Simpan sebagai docs/02-data-entities.md.
```

## Prompt 3 — DB Schema
```
Berdasarkan docs/02-data-entities.md, tulis schema.prisma lengkap di prisma/schema.prisma.
Pakai struktur yang sudah ada di PRD.md section 5.1 sebagai referensi, tapi validasi ulang
relasinya. Setelah itu jalankan `npx prisma generate` (jangan `db push` dulu, tunggu konfirmasi).
```

## Prompt 4 — API/Event Contract
```
Berdasarkan PRD.md section 6, buat file lib/events.ts yang mendefinisikan semua tipe
TypeScript untuk event client->server dan server->client (pakai discriminated union biar
type-safe di kedua sisi). Ini file yang akan di-import baik dari kode Next.js maupun kode
PartyKit server, jadi taruh di lokasi yang bisa diakses keduanya (shared package atau
lib/ yang di-import PartyKit config).
```

## Prompt 5 — Sample JSON
```
Berdasarkan lib/events.ts, buat file docs/05-sample-payloads.json berisi contoh payload
untuk SETIAP event yang didefinisikan -- termasuk contoh game_state yang personalized
(bedakan payload untuk "you" vs "opponents", pastikan opponents TIDAK punya field hand,
cuma handCount, sesuai prinsip Zero Hand Leak di PRD.md section 3). Ini dipakai buat testing
manual sebelum UI jadi.
```

## Prompt 6 — UI Template (Mobile-First, WAJIB)
```
Buat static UI (belum ada logic/state management) untuk 4 screen: Landing, Lobby, GameTable,
EndScreen. Pakai data dummy dari docs/05-sample-payloads.json buat populate tampilan.

WAJIB mobile-first -- desain & test di viewport 375-428px dulu (portrait), JANGAN pikirin
desktop sama sekali di prompt ini. Ikuti spesifikasi layout PRD.md section 7 persis:
- Tangan kartu sendiri di zona bawah (thumb zone), horizontal scroll kalau kartu > 7,
  tap untuk main kartu (BUKAN drag).
- Lawan ditampilkan sebagai strip horizontal di zona atas (bukan melingkar -- itu jatah
  Prompt 10 nanti).
- Modal pilih warna Wild = bottom sheet full-width, tombol besar.
- Semua target tap minimal 44px.
- Pakai default Tailwind classes (mobile) TANPA prefix `lg:` sama sekali dulu.

Style: kartun playful, warna cerah per warna kartu (merah/kuning/hijau/biru), card dengan
sedikit rotasi random di tangan pemain (fan layout) pakai Framer Motion, card back pattern
yang konsisten. Taruh di app/room/[code]/page.tsx dan komponen terpisah di components/game/.
```

## Prompt 7 — Frontend Service (koneksi PartyKit)
```
Buat lib/usePartySocket.ts -- custom hook yang connect ke PartyKit room berdasarkan room
code, handle reconnect otomatis, dan expose function untuk emit tiap event dari
lib/events.ts (playCard, drawCard, callTumpuk, dst). Jangan taruh game logic di sini --
murni komunikasi.
```

## Prompt 8 — Composable/Store
```
Buat store client-side (Zustand atau React Context, pilih yang lebih ringan) yang nyimpen
game_state terbaru dari server dan expose selector-selector siap pakai untuk komponen:
myHand, opponents, currentColor, isMyTurn, turnSecondsLeft. Store ini yang jadi jembatan
antara usePartySocket.ts dan komponen UI di Prompt 6.
```

## Prompt 9 — Integration
```
Sambungkan semua: komponen UI dari Prompt 6, store dari Prompt 8, socket hook dari Prompt 7.
Implementasikan party/server.ts (PartyKit server) yang jadi authoritative game logic:
validasi giliran, validasi kartu valid dimainkan, shuffle & deal, generate personalized
payload per player (JANGAN lupa filter hand pemain lain sebelum broadcast -- ini poin
paling gampang bocor kalau ceroboh). Test end-to-end dengan 2 browser tab sebagai 2 pemain
berbeda.
```

## Prompt 10 — Desktop Enhancement (jalankan PALING BELAKANGAN, setelah mobile solid dan dites beneran)
```
Mobile version udah solid dan udah dites. Sekarang tambahkan breakpoint desktop (lg: prefix,
>=1024px) TANPA mengubah struktur mobile yang udah jalan -- ini murni override tambahan:
- Strip lawan horizontal di atas (mobile) -> circular layout di sekeliling discard pile (desktop).
- Tangan kartu: hilangkan horizontal scroll, tampilkan semua kartu sekaligus (layar cukup lebar).
- Tambahkan drag-and-drop sebagai ALTERNATIF cara main kartu, tap tetap harus berfungsi
  (jangan hapus interaksi tap yang udah ada).
Referensi PRD.md section 7.5.
```

---

## Prompt Card Art — Template Terkunci

Ini bagian penting: 108 kartu kalau di-generate satu-satu tanpa template terkunci, hasilnya bakal beda gaya tiap panggilan (rentan gonta-ganti proporsi karakter, palet warna, ketebalan outline). Sama kayak character lock di sistem Ciko & Bonbon lo — kunci dulu gaya visualnya, baru generate variasi.

**Rekomendasi teknis dulu sebelum generate:** jangan generate ke-108 kartu sebagai 108 gambar unik dari AI. Lebih efisien dan konsisten:
1. Generate ~4-6 base illustration per warna (misal karakter/motif lucu yang beda pose tiap warna, atau 1 motif konsisten × 4 palet warna) via `ag/gemini-3-flash-agent`.
2. Angka dan simbol (Skip/Reverse/+2/Wild) di-overlay pakai kode (SVG text/icon di atas base illustration), bukan di-generate ulang tiap kartu. Ini juga bikin lo gampang ganti tipografi angka tanpa re-generate gambar.

**Prompt template (isi placeholder sebelum jalankan):**
```
Ilustrasi kartun flat vector, gaya playful dan ramah anak, untuk kartu permainan warna [WARNA].
Karakter/motif: [DESKRIPSI_KARAKTER_ATAU_MOTIF -- kunci di sini, jangan ganti antar generate].
Outline tebal konsisten 3px, warna solid tanpa gradient rumit, komposisi simetris dengan
ruang kosong di bagian atas-bawah untuk overlay angka/simbol nanti. Background transparan
atau warna solid [KODE_WARNA_PALET]. Rasio 2:3 (portrait card). JANGAN sertakan teks,
angka, atau tulisan apapun di gambar -- itu ditambahkan terpisah lewat kode.
```

Isi `[DESKRIPSI_KARAKTER_ATAU_MOTIF]` sekali di awal dan pakai persis sama di semua 4 warna + card back, supaya seluruh deck terasa satu keluarga visual — persis prinsip yang udah lo pakai buat Ciko & Bonbon (deskripsi karakter terkunci, cuma setting yang berubah).

---

## Urutan Eksekusi Ringkas
1. Setup manual (Next.js + PartyKit + Prisma) — sekali jalan, di luar OpenCode.
2. Prompt 1 → 9 berurutan, jangan lompat. **Prompt 6 wajib mobile-only** — jangan biarkan model "sekalian" mikirin desktop di step ini, itu yang biasanya bikin layout mobile setengah hati.
3. Card art bisa paralel jalan kapan aja setelah Prompt 6 (UI template) selesai, biar langsung keliatan hasilnya di context yang benar.
4. Baru `npx prisma db push` setelah schema di-review manual (Prompt 3 sengaja nahan step ini).
5. Test full alur di HP beneran (bukan cuma resize browser desktop) sebelum lanjut ke Prompt 10.
6. **Prompt 10 (desktop) paling akhir**, setelah mobile udah dites dan lo puas — jangan dikerjain bareng Prompt 6.
