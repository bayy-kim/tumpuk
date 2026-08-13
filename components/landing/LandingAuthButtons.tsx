'use client';

import React, { useState } from 'react';

interface LandingAuthButtonsProps {
  signInAction: () => Promise<void>;
  signInAdminAction: (formData: FormData) => Promise<void>;
}

export default function LandingAuthButtons({ signInAction, signInAdminAction }: LandingAuthButtonsProps) {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setErrorMsg('Email dan Password wajib diisi.');
      return;
    }

    try {
      await signInAdminAction(formData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Login gagal! Pastikan email & password admin benar.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <form action={signInAction} className="w-full flex flex-col sm:flex-row gap-4 justify-center max-w-md">
        <button
          type="submit"
          className="w-full sm:w-56 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
        >
          MAIN SEKARANG
        </button>
        <button
          type="button"
          onClick={() => setIsAdminModalOpen(true)}
          className="w-full sm:w-56 h-14 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer"
        >
          LOGIN ADMIN
        </button>
      </form>

      {/* Admin Login Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col gap-5 w-full max-w-sm shadow-2xl text-center">
            <div className="flex flex-col gap-1">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">PORTAL UTAMA</span>
              <h4 className="text-white text-lg font-black uppercase font-sans">Login Admin</h4>
              <p className="text-zinc-400 text-xs font-sans">Khusus untuk admin Muhammad Ai Bayu</p>
            </div>

            <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@email.com"
                  className="h-12 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white text-sm font-sans focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="h-12 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white text-sm font-sans focus:outline-none focus:border-yellow-400"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 font-extrabold uppercase bg-red-950/40 border border-red-900/60 p-2.5 rounded-lg text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="h-12 w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition transform active:scale-95 cursor-pointer mt-2"
              >
                MASUK SEBAGAI ADMIN
              </button>
            </form>

            <button
              onClick={() => {
                setIsAdminModalOpen(false);
                setErrorMsg('');
              }}
              className="text-zinc-500 hover:text-white text-[10px] font-extrabold uppercase tracking-wider mt-1 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
