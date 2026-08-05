import React from 'react';
import Link from 'next/link';

export default function PanduanPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Navbar */}
      <header className="w-full bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center border-2 border-white shadow rotate-6 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-white text-base font-black">T!</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
            Tumpuk!
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
        >
          &larr; KEMBALI
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col gap-8 text-left">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">PANDUAN BERMAIN</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Selamat datang di Tumpuk! Game kartu multiplayer real-time yang mudah dipelajari tapi penuh dengan strategi licik. Berikut adalah aturan main dasarnya.
          </p>
        </div>

        {/* Setup Rules Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-yellow-400 text-lg font-black uppercase tracking-tight">1. ATURAN DASAR</h2>
          <ul className="flex flex-col gap-3 text-zinc-300 text-xs leading-relaxed list-disc pl-5">
            <li>Setiap pemain dibagikan <strong>7 kartu</strong> di awal ronde.</li>
            <li>Tujuan utama permainan adalah menjadi pemain pertama yang <strong>menghabiskan seluruh kartu</strong> di tangan Anda.</li>
            <li>Pada giliran Anda, Anda harus mencocokkan kartu teratas di tumpukan buangan (Discard Pile) berdasarkan <strong>warna, angka, atau simbol</strong>.</li>
            <li>Jika Anda tidak memiliki kartu yang cocok, Anda wajib menarik <strong>1 kartu</strong> dari tumpukan dek.</li>
          </ul>
        </div>

        {/* Special Cards */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-indigo-400 text-lg font-black uppercase tracking-tight">2. KARTU SPESIAL (AKSI)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col gap-1.5">
              <span className="text-red-400 font-black text-sm uppercase">SKIP (∅)</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Pemain berikutnya dilewati gilirannya.
              </p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col gap-1.5">
              <span className="text-yellow-400 font-black text-sm uppercase">REVERSE (⇆)</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Membalikkan arah putaran giliran pemain.
              </p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col gap-1.5">
              <span className="text-green-400 font-black text-sm uppercase">DRAW TWO (+2)</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Pemain berikutnya harus menarik 2 kartu dan gilirannya dilewati.
              </p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col gap-1.5">
              <span className="text-blue-400 font-black text-sm uppercase">WILD (W)</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Mengubah warna kartu aktif di tumpukan buangan sesuai pilihan Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Tumpuk Rule */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-red-400 text-lg font-black uppercase tracking-tight">3. ATURAN &ldquo;TUMPUK!&rdquo;</h2>
          <p className="text-zinc-300 text-xs leading-relaxed">
            Ketika kartu di tangan Anda <strong>tersisa 1 kartu</strong>, Anda harus segera menekan tombol <strong>&ldquo;TUMPUK!&rdquo;</strong> sebelum giliran Anda selesai.
          </p>
          <p className="text-zinc-400 text-[11px] leading-relaxed border-l-4 border-red-500 pl-3 py-1 bg-red-950/20">
            <strong>Challenge:</strong> Jika Anda lupa menekan tombol <strong>&ldquo;TUMPUK!&rdquo;</strong> dan pemain lain mengetahuinya (menekan Challenge), Anda akan dikenakan denda menarik <strong>2 kartu penalti</strong>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider border-t border-zinc-900/60 bg-zinc-950">
        &copy; {new Date().getFullYear()} Tumpuk! Card Game. All rights reserved.
      </footer>
    </div>
  );
}
