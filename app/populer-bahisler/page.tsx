'use client';

import React, { useState } from 'react';

export default function PopularBetsPage() {
  const [leagueFilter, setLeagueFilter] = useState('all');

  const bets = [
    { id: 1, match: 'Galatasaray - Fenerbahçe', league: 'Süper Lig', pick: 'MS 1', rate: '2.10', players: 14200 },
    { id: 2, match: 'Arsenal - Chelsea', league: 'Premier League', pick: '2.5 Üst', rate: '1.75', players: 11800 },
    { id: 3, match: 'Real Madrid - Barcelona', league: 'La Liga', pick: 'KG Var', rate: '1.62', players: 9500 },
  ];

  const filtered = bets.filter((b) => leagueFilter === 'all' || b.league === leagueFilter);

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400">🔥 Popüler Bahisler (Top 100)</h1>
        
        <select
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="bg-[#161821] border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200"
        >
          <option value="all">Tüm Ligler</option>
          <option value="Süper Lig">Süper Lig</option>
          <option value="Premier League">Premier League</option>
          <option value="La Liga">La Liga</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <div key={item.id} className="bg-[#161821] border border-gray-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-amber-400 font-bold text-sm">#{idx + 1}</span>
              <div>
                <p className="font-bold text-sm text-gray-100">{item.match}</p>
                <p className="text-xs text-gray-400">{item.league} • <span className="text-emerald-400">{item.players.toLocaleString()} Bahis Yapıldı</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{item.pick}</span>
              <button className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-mono font-bold px-4 py-2 rounded-lg text-xs transition">
                {item.rate}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}