# Penambahan Fitur Polling Hukuman Pecundang (Challenge Poll)

Fase permainan baru setelah ronde selesai (`game_over`):

## 1. Identifikasi Pecundang & Mulai Polling
- Ketika status game berubah menjadi `finished` (ada pemenang), server akan mencari pemain dengan skor akhir terendah. Pemain ini ditandai sebagai `loserId`.
- Server memulai hitung mundur 10 detik dan memancarkan event `challenge_poll_start` ke semua client.
- Seluruh pemain (termasuk yang menang/kalah) dapat mengirimkan suara hukuman via event `submit_vote` dari daftar opsi bawaan atau custom teks.

## 2. Penghitungan Suara & Hasil Akhir
- Setelah timer 10 detik habis, server mengakhiri pemungutan suara, mengompilasi pilihan suara terbanyak, lalu memancarkan event `challenge_result` berisi nama hukuman terpilih.
- Pemain yang diidentifikasi sebagai pecundang (`loserId`) mendapatkan antarmuka khusus untuk mengunggah video/foto bukti eksekusi hukuman tersebut.

## 3. Unggah Dokumentasi ke Supabase Storage
- Membuat bucket baru di Supabase Storage bernama `challenges`.
- Membuat API Route Next.js di `/api/challenge/upload` untuk menerima file, mengunggahnya secara aman menggunakan `@supabase/supabase-js` ke folder `challenges/[roomId]_[userId]/`, dan mengembalikan URL publik-nya.
- Setelah berhasil, pecundang memberi tahu server game via socket, lalu server memancarkan event `challenge_uploaded` berisi link download bukti.
- Pemain lain mendapatkan tombol unduh interaktif untuk melihat bukti hukuman tersebut.
