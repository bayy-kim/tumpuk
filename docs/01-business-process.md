# Alur Bisnis Game "Tumpuk!"

Berikut adalah alur bisnis game "Tumpuk!" yang dirangkum dari perspektif alur interaksi pemain (player journey), dilengkapi dengan penanganan skenario edge case yang krusial untuk real-time multiplayer.

---

## 1. Alur Utama Pemain (Happy Path)

1. **Buat Room (Host)**
   - Pemain (Host) membuka landing page, menekan tombol **"Buat Room"** (bisa bermain sebagai Guest dengan mengisi nama atau masuk menggunakan akun terdaftar).
   - Server Next.js membuat entitas room baru dengan kode acak 6 digit, lalu mengalokasikan instance server PartyKit khusus untuk room berkode tersebut.
   - Host dialihkan ke halaman lobby dan dapat mengatur pilihan aturan rumah (House Rules) seperti *Stacking (+2/+4)*, *Jump-in*, *7-0 Rule*, dan *Draw-to-match*.

2. **Join Room (Players)**
   - Pemain lain (Client) membuka landing page, memasukkan kode room 6 digit, lalu mengisi nama Guest atau masuk via Google Auth.
   - Client melakukan koneksi WebSocket ke instance server PartyKit yang dituju berdasarkan kode room.
   - Server memvalidasi kapasitas room (maksimal 6 pemain). Jika berhasil, pemain didudukkan ke salah satu kursi kosong (seatIndex).

3. **Lobby**
   - Seluruh pemain yang bergabung berkumpul di lobby. Status koneksi (`connected: true`) dari tiap pemain diperbarui dan di-broadcast secara real-time ke semua peserta room.
   - Host menekan tombol **"Mulai Game"** setelah minimal 2 pemain terkumpul.

4. **Main (Playing)**
   - **Pembagian Kartu (Server-side)**: Server PartyKit mengocok (shuffle) 108 kartu secara in-memory, membagikan 7 kartu ke tangan (hand) masing-masing pemain, dan meletakkan sisa kartu ke tumpukan deck serta membuka 1 kartu pertama sebagai discard pile teratas.
   - **Zero Hand Leak**: Server hanya mengirim detail isi kartu tangan pribadi ke masing-masing client bersangkutan. Untuk pemain lain, server hanya mengirimkan metadata `handCount` (jumlah kartu di tangan).
   - **Siklus Giliran**: Pemain bermain secara berurutan sesuai arah jarum jam. Pemain aktif memiliki deadline 20 detik (turnDeadline) untuk membuang kartu yang cocok (angka/warna/simbol) atau mengambil kartu dari tumpukan deck (draw_card).

5. **Menang / Kalah**
   - Pemain membuang kartu terakhirnya dari tangan untuk memenangkan ronde.
   - Game dihentikan sementara, server menghitung total skor pemenang berdasarkan nilai sisa kartu di tangan lawan yang kalah.
   - Skor pemenang di-update ke *match history* persistent di database Postgres via API Next.js.

6. **Rematch**
   - Halaman dialihkan ke End Screen dengan opsi **"Main Lagi"**. Jika host memilih rematch, state room PartyKit di-reset kembali ke lobby/persiapan game baru tanpa perlu membuat room baru dengan kode yang berbeda.

---

## 2. Penanganan Edge Cases

### A. Pemain Disconnect di Tengah Game
- **Grace Period**: Ketika koneksi WebSocket pemain terputus, status pemain tersebut di-set menjadi `connected: false`. Server PartyKit menahan posisi kursi dan tumpukan kartu tangan pemain tersebut selama **60 detik**.
- **Auto-play / Skip**: Selama grace period 60 detik tersebut, setiap kali tiba giliran pemain yang terputus, server akan menunggu hingga *turnDeadline* terlewati (20 detik), lalu secara otomatis melakukan penarikan kartu (auto-draw 1 kartu) dan melimpahkan giliran ke pemain berikutnya (*skip*).
- **Reconnect**: Jika pemain kembali terhubung sebelum 60 detik habis, server menyambungkan kembali socket baru ke state playerState yang lama, mengubah status menjadi `connected: true`, dan mengirimkan in-memory state kartu ter-update ke client tersebut.
- **Expiry / Kick**: Jika 60 detik terlampaui tanpa ada aktivitas reconnect, pemain dianggap gugur. Kartunya dikembalikan ke tumpukan kocokan (deck), kursinya dikosongkan, dan jika giliran permainan sedang berada di tangannya, giliran langsung dialihkan ke pemain aktif berikutnya.

### B. Pemain Lupa Call "TUMPUK!"
- **Aturan Pemicu**: Saat kartu di tangan tersisa tepat 1, pemain harus segera mengirimkan event `call_tumpuk`.
- **Called State**: Server merekam status ini sebagai `calledTumpuk: true`. Jika kartu tersisa 1 namun status `calledTumpuk` masih `false`, pemain tersebut berada dalam status rentan.
- **Challenge Tumpuk**:
  - Pemain lawan dapat memicu event `challenge_tumpuk` dengan target pemain yang memiliki sisa 1 kartu namun belum melakukan panggilan "TUMPUK!".
  - **Window Challenge**: Challenge hanya valid dilakukan semenjak kartu kedua dibuang hingga giliran pemain tersebut berakhir (sebelum giliran pemain berikutnya mulai memainkan/menarik kartu).
  - **Resolusi**: Jika challenge valid, server PartyKit akan membuang status rentan, memaksa target menarik 2 kartu penalti ke tangannya, mengubah `calledTumpuk: false`, dan mengirimkan state permainan yang baru ke semua pemain.

### C. Host Keluar Room saat Game Berjalan
- **Migrasi Host (Server-side)**: Server PartyKit mendeteksi status putusnya koneksi host (`hostUserId` / pemilik room).
- **Lobby State (Status 'waiting')**: Jika game belum dimulai dan host asli keluar secara permanen atau terputus, server PartyKit langsung menunjuk pemain aktif tertua berikutnya di lobby (berdasarkan urutan join / index) sebagai host baru agar game tetap bisa dimulai.
- **Playing State (Status 'playing')**: Jika game sedang berjalan dan koneksi host terputus, game tetap berjalan normal di bawah kendali server PartyKit (karena state in-memory hidup sepenuhnya di server PartyKit). Jika host asli terputus melebihi batas *grace period* 60 detik, server memindahkan hak host/admin room ke pemain aktif dengan koneksi aktif berikutnya di dalam room agar game bisa dilanjutkan atau dihentikan secara manual.
