'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Apa itu game "Tumpuk!"?',
    answer: 'Tumpuk! adalah game kartu online multiplayer real-time yang terinspirasi dari aturan klasik permainan kartu sejenis UNO. Anda bisa bermain bersama teman menggunakan kode room unik di HP maupun laptop.',
  },
  {
    id: 'faq-2',
    question: 'Bagaimana cara bermain bersama teman?',
    answer: 'Cukup masukkan nama Anda di halaman depan, lalu buat room baru untuk mendapatkan 6 digit kode room. Bagikan kode tersebut kepada teman Anda agar mereka bisa langsung bergabung melalui menu "Gabung Room" di halaman utama.',
  },
  {
    id: 'faq-3',
    question: 'Apakah pemain lain bisa mencurangi isi kartu di tangan saya?',
    answer: 'Tidak bisa. Game ini dirancang menggunakan prinsip "Zero Hand Leak". Server PartyKit menyimpan seluruh informasi kartu secara in-memory dan hanya mengirimkan detail kartu Anda ke layar Anda sendiri. Pemain lawan hanya akan menerima jumlah kartu (handCount) Anda.',
  },
  {
    id: 'faq-4',
    question: 'Apa itu aturan rumah (House Rules)?',
    answer: 'Aturan rumah adalah pengaturan tambahan yang bisa diaktifkan oleh host room di lobby sebelum permainan dimulai, meliputi penumpukan denda (+2/+4 Stacking), pemotongan giliran (Jump-in), efek tukar kartu (7-0 Rule), dan penarikan kartu terus-menerus (Draw-to-match).',
  },
];

export default function FaqAccordion() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {faqs.map((faq) => {
        const isExpanded = faq.id === expandedId;

        return (
          <div
            key={faq.id}
            className="border border-zinc-800 bg-zinc-900/50 rounded-2xl overflow-hidden transition-colors"
          >
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none select-none cursor-pointer"
            >
              <span className="text-white text-xs font-black uppercase tracking-tight">
                {faq.question}
              </span>
              
              {/* Inline SVG Chevron Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 text-zinc-400 transform transition-transform duration-300 ${
                  isExpanded ? 'rotate-180 text-yellow-400' : ''
                }`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-5 pb-5 pt-1 text-zinc-400 text-xs leading-relaxed border-t border-zinc-800/40">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
