'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

interface LandingHeroProps {
  actionForm: React.ReactNode;
}

export default function LandingHero({ actionForm }: LandingHeroProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
      {/* Floating background blur blobs */}
      <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl flex flex-col items-center text-center gap-8 relative z-10">
        {/* Animated 3D card teaser fan */}
        <div className="flex gap-4 justify-center items-center h-44 relative [perspective:1000px]">
          {/* Card 1: Red Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -12, x: -30 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateY: [0, 360, 0], // Rotasi 3D ke samping
              y: [0, -6, 0],
            }}
            transition={{
              rotateY: {
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
                delay: 0,
                repeatDelay: 4, // Jeda sebelum giliran berputar lagi
              },
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              default: { duration: 0.8, ease: 'easeOut' },
            }}
            className="w-16 h-24 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative rotate-[-12deg] [transform-style:preserve-3d]"
          >
            <Image src="/cards/red_base.png" alt="Red Card" fill className="object-cover" sizes="96px" />
          </motion.div>

          {/* Card 2: Wild Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -2, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1.05,
              rotateY: [0, 360, 0], // Rotasi 3D ke samping
              y: [0, -10, 0],
            }}
            transition={{
              rotateY: {
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
                delay: 2, // Berputar bergantian setelah kartu 1 selesai
                repeatDelay: 4,
              },
              y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 },
              default: { duration: 0.8, ease: 'easeOut', delay: 0.1 },
            }}
            className="w-18 h-28 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative z-10 rotate-[-2deg] [transform-style:preserve-3d]"
          >
            <Image src="/cards/wild_base.png" alt="Wild Card" fill className="object-cover" sizes="100px" />
          </motion.div>

          {/* Card 3: Blue Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10, x: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateY: [0, 360, 0], // Rotasi 3D ke samping
              y: [0, -7, 0],
            }}
            transition={{
              rotateY: {
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
                delay: 4, // Berputar bergantian setelah kartu 2 selesai
                repeatDelay: 4,
              },
              y: { repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 0.2 },
              default: { duration: 0.8, ease: 'easeOut' },
            }}
            className="w-16 h-24 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative rotate-[10deg] [transform-style:preserve-3d]"
          >
            <Image src="/cards/blue_base.png" alt="Blue Card" fill className="object-cover" sizes="96px" />
          </motion.div>
        </div>

        {/* Staggered text layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none"
          >
            TUMPUK KARTUNYA, <br />
            <span className="text-yellow-400">REBUT KEMENANGAN!</span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base leading-relaxed px-4"
          >
            Main game kartu online real-time multiplayer bergaya UNO bersama teman. Nikmati desain kartu unik lucu slime monster dan aturan kustomisasi seru!
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="w-full flex justify-center"
        >
          {actionForm}
        </motion.div>
      </div>
    </main>
  );
}
