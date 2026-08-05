'use client';

import React from 'react';
import { CardColor } from '@/lib/events';

interface ColorPickerBottomSheetProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
  onClose: () => void;
}

export default function ColorPickerBottomSheet({
  isOpen,
  onSelectColor,
  onClose,
}: ColorPickerBottomSheetProps) {
  if (!isOpen) return null;

  const colors: { name: CardColor; bg: string; text: string; label: string }[] = [
    { name: 'red', bg: 'bg-red-500 hover:bg-red-600 active:bg-red-700', text: 'text-white', label: 'Merah' },
    { name: 'yellow', bg: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600', text: 'text-zinc-900', label: 'Kuning' },
    { name: 'green', bg: 'bg-green-500 hover:bg-green-600 active:bg-green-700', text: 'text-white', label: 'Hijau' },
    { name: 'blue', bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700', text: 'text-white', label: 'Biru' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
      {/* Tap outside area */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Bottom Sheet wrapper */}
      <div className="bg-zinc-900 border-t-4 border-zinc-800 rounded-t-3xl p-6 flex flex-col gap-6 w-full max-w-md mx-auto shadow-2xl pb-8">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-white text-lg font-black tracking-tight">PILIH WARNA BARU</h2>
          <p className="text-zinc-400 text-xs">Pemain setelahmu harus membuang kartu warna ini!</p>
        </div>

        {/* Big accessible colors buttons (min 44px) */}
        <div className="grid grid-cols-2 gap-4">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => onSelectColor(color.name)}
              className={`h-16 rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-wider shadow-lg transform transition active:scale-95 border-2 border-white/10 ${color.bg} ${color.text}`}
            >
              {color.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="h-12 w-full rounded-xl bg-zinc-800 text-zinc-300 font-extrabold text-xs tracking-wider border border-zinc-700 active:bg-zinc-800/85"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
