'use client';

import React, { useState } from 'react';

export default function WinnersPage() {
  const [filter, setFilter] = useState<'instant' | 'daily' | 'weekly' | 'monthly'>('instant');

  const winnersData = [
    { user: 'Taha***', game: 'Sweet Bonanza', amount: '85.250 ₺', time: '2 dk önce', type: 'instant' },
    { user: 'Burak**', game: 'Gates of Olympus', amount: '72.100 ₺', time: '4 dk önce', type: 'instant' },
    { user: 'Mehmet***', game: 'Aviator', amount: '120.000 ₺', time: 'Bugün 14:20', type: 'daily' },
    { user: 'Ayşe***', game: 'Crazy Time', amount: '450.000 ₺', time: 'Bu Hafta', type: 'weekly' },
    { user: 'Can***', game: 'Lightning Roulette', amount: '1.250.000 ₺', time: 'Bu Ay', type: 'monthly' },
  ];

  const filtered = winnersData.filter((w) => filter === 'instant' || w.type === filter);

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-2">
          🏆 En Çok Kazananlar
        </h1>

        <div className="flex gap-2 bg-[#161821] p-1.5 rounded-xl border border-gray-800">
          {[
            { id: 'instant', label: 'Anlık (Son 5 dk)' },
            { id: 'daily', label: 'Günlük' },
            { id: 'weekly', label: 'Haftalık' },
            { id: 'monthly', label: 'Aylık' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === tab.id
                  ? 'bg-amber-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161821] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-gray-800">
          {filtered.map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-[#1f2230] transition">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold text-sm text-gray-200">{item.user}</p>
                  <p className="text-xs text-gray-400">{item.game} • <span className="text-gray-500">{item.time}</span></p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold font-mono text-base">{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}