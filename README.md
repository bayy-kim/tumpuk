# 🃏 Tumpuk! — Real-time Multiplayer Card Game

"Tumpuk!" adalah game kartu multiplayer online real-time 2–6 pemain bergaya UNO dengan karya seni maskot kartun slime yang lucu. Game ini dibuat menggunakan arsitektur hybrid modern: Next.js untuk antarmuka web & autentikasi, PartyKit (Cloudflare Durable Objects) untuk authoritative game server real-time via WebSocket, dan Neon (Postgres) untuk penyimpanan persistent.

---

## 🌟 Fitur Utama

- 🎮 **Multiplayer Real-time**: Didukung PartyKit dengan sinkronisasi state game di bawah 100ms.
- 🔒 **Prinsip Zero Hand Leak**: Server hanya mengirimkan detail kartu ke pemiliknya saja. Pemain lawan hanya dapat melihat jumlah kartu (`handCount`), menjamin tidak ada manipulasi DevTools.
- 🏠 **House Rules Kustom**: Host room dapat mengaktifkan aturan rumah seperti *Stacking (+2/+4)*, *Jump-In*, *7-0 Rule*, dan *Draw-To-Match*.
- 📱 **Mobile-First & Desktop Friendly**: Antarmuka responsif yang nyaman dimainkan di smartphone maupun laptop dengan *drag-and-drop* & *circular opponent layout*.
- 🔑 **Autentikasi & Guest Play**: Dapat dimainkan secara instan sebagai Guest atau login menggunakan Google Auth (NextAuth.js v5).

---

## 🚀 Perintah Utama (Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server Next.js lokal di `http://localhost:3000` |
| `npm run build` | Melakukan kompilasi produksi Next.js |
| `npm run party:dev` | Menjalankan server game lokal PartyKit |
| `npm run party:deploy` | Mempublikasikan server PartyKit ke Cloudflare |
| `npx prisma db push` | Sinkronisasi schema Prisma ke database Postgres (Neon) |

---

## 🛠️ Stack Teknologi

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Game Server Real-time**: PartyKit, PartySocket
- **Database & ORM**: Neon Serverless Postgres, Prisma ORM 7
- **Autentikasi**: NextAuth.js v5 (Google Provider)
- **Deployment**: Vercel (Frontend & Web API)
