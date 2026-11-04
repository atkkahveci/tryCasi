'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface BetSelection {
  matchId: number;
  teams: string;
  type: string;
  rate: number;
}

export default function EventsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [coupon, setCoupon] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<string>('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const matches = [
    {
      id: 1,
      league: 'Süper Lig',
      team1: 'Galatasaray',
      team2: 'Fenerbahçe',
      score: '1 - 1',
      minute: "78'",
      isLive: true,
      odds: { ms1: 2.10, msX: 3.20, ms2: 3.50, over25: 1.85, under25: 1.95 }
    },
    {
      id: 2,
      league: 'Premier League',
      team1: 'Arsenal',
      team2: 'Chelsea',
      score: '2 - 0',
      minute: "42'",
      isLive: true,
      odds: { ms1: 1.65, msX: 3.80, ms2: 5.20, over25: 1.60, under25: 2.20 }
    },
    {
      id: 3,
      league: 'La Liga',
      team1: 'Real Madrid',
      team2: 'Barcelona',
      score: '0 - 0',
      minute: "15'",
      isLive: true,
      odds: { ms1: 2.05, msX: 3.40, ms2: 3.25, over25: 1.70, under25: 2.10 }
    },
    {
      id: 4,
      league: 'Serie A',
      team1: 'Juventus',
      team2: 'AC Milan',
      score: '1 - 2',
      minute: "60'",
      isLive: true,
      odds: { ms1: 2.80, msX: 3.10, ms2: 2.45, over25: 1.90, under25: 1.80 }
    },
    {
      id: 5,
      league: 'Şampiyonlar Ligi',
      team1: 'Bayern München',
      team2: 'PSG',
      score: '0 - 0',
      minute: 'Bugün 22:00',
      isLive: false,
      odds: { ms1: 1.90, msX: 3.60, ms2: 3.80, over25: 1.55, under25: 2.30 }
    }
  ];

  const toggleSelection = (match: any, type: string, rate: number) => {
    const teams = `${match.team1} - ${match.team2}`;
    const exists = coupon.find(item => item.matchId === match.id && item.type === type);

    if (exists) {
      setCoupon(coupon.filter(item => !(item.matchId === match.id && item.type === type)));
    } else {
      const filtered = coupon.filter(item => item.matchId !== match.id);
      setCoupon([...filtered, { matchId: match.id, teams, type, rate }]);
    }
  };

  const isSelected = (matchId: number, type: string) => {
    return coupon.some(item => item.matchId === matchId && item.type === type);
  };

  const totalOdds = coupon.reduce((acc, item) => acc * item.rate, 1);
  const potentialPayout = (parseFloat(stake) || 0) * totalOdds;

  const filteredMatches = selectedLeague === 'all' 
    ? matches 
    : matches.filter(m => m.league === selectedLeague);

  const handlePlaceBet = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Bahis yapabilmek için lütfen önce giriş yapın.');
      }

      const betStake = parseFloat(stake);
      if (isNaN(betStake) || betStake <= 0) {
        throw new Error('Geçerli bir bahis tutarı giriniz.');
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        throw new Error('Kullanıcı bakiyesi alınamadı.');
      }

      if (profile.balance < betStake) {
        throw new Error(`Yetersiz bakiye! Mevcut bakiyeniz: ${profile.balance.toLocaleString('tr-TR')} ₺`);
      }

      const { error: betErr } = await supabase.from('bets').insert([
        {
          user_id: user.id,
          matches: coupon,
          total_odds: parseFloat(totalOdds.toFixed(2)),
          stake: betStake,
          potential_payout: parseFloat(potentialPayout.toFixed(2)),
          status: 'pending',
        },
      ]);

      if (betErr) throw betErr;

      const newBalance = profile.balance - betStake;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      setMessage({
        type: 'success',
        text: `🎉 Kuponunuz başarıyla yatırıldı! Kalan Bakiyeniz: ${newBalance.toLocaleString('tr-TR')} ₺`,
      });

      setCoupon([]);
      window.location.reload();

    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Kupon yatırılırken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6">
      
      {/* ÜST BAŞLIK & KUPONLARIM BUTONU & LİG FİLTRELERİ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-2">
            ⚽ Canlı Bahis & Maç Bülteni
          </h1>
          <p className="text-xs text-gray-400 mt-1">Anlık değişen oranlarla kuponunuzu hazırlayın.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/kuponlarim"
            className="bg-[#161821] hover:bg-gray-800 border border-amber-500/40 hover:border-amber-500 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0"
          >
            <span>🎟️ Kuponlarım</span>
          </Link>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {['all', 'Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Şampiyonlar Ligi'].map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedLeague === league
                    ? 'bg-amber-500 text-gray-950 font-bold'
                    : 'bg-[#161821] border border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                {league === 'all' ? 'Tüm Ligler' : league}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAÇ LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#161821] border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between text-xs border-b border-gray-800/80 pb-2">
                <span className="text-gray-400 font-medium">{match.league}</span>
                {match.isLive ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Canlı {match.minute}
                  </span>
                ) : (
                  <span className="text-gray-400 font-mono">{match.minute}</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-1 font-bold text-sm md:text-base">
                  <div className="text-gray-100">{match.team1}</div>
                  <div className="text-gray-100">{match.team2}</div>
                </div>
                {match.isLive && (
                  <div className="bg-[#0f1015] px-3 py-1.5 rounded-xl border border-gray-800 text-amber-400 font-mono font-bold text-base">
                    {match.score}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                <button
                  onClick={() => toggleSelection(match, 'MS 1', match.odds.ms1)}
                  className={`py-2 px-1 rounded-xl text-xs border flex flex-col items-center justify-center transition font-mono ${
                    isSelected(match.id, 'MS 1')
                      ? 'bg-amber-500 border-amber-400 text-gray-950 font-extrabold shadow-md'
                      : 'bg-[#0f1015] border-gray-800 hover:border-amber-500/50 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] font-sans opacity-70">MS 1</span>
                  <span>{match.odds.ms1.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => toggleSelection(match, 'MS X', match.odds.msX)}
                  className={`py-2 px-1 rounded-xl text-xs border flex flex-col items-center justify-center transition font-mono ${
                    isSelected(match.id, 'MS X')
                      ? 'bg-amber-500 border-amber-400 text-gray-950 font-extrabold shadow-md'
                      : 'bg-[#0f1015] border-gray-800 hover:border-amber-500/50 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] font-sans opacity-70">MS X</span>
                  <span>{match.odds.msX.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => toggleSelection(match, 'MS 2', match.odds.ms2)}
                  className={`py-2 px-1 rounded-xl text-xs border flex flex-col items-center justify-center transition font-mono ${
                    isSelected(match.id, 'MS 2')
                      ? 'bg-amber-500 border-amber-400 text-gray-950 font-extrabold shadow-md'
                      : 'bg-[#0f1015] border-gray-800 hover:border-amber-500/50 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] font-sans opacity-70">MS 2</span>
                  <span>{match.odds.ms2.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => toggleSelection(match, '2.5 Üst', match.odds.over25)}
                  className={`py-2 px-1 rounded-xl text-xs border flex flex-col items-center justify-center transition font-mono ${
                    isSelected(match.id, '2.5 Üst')
                      ? 'bg-amber-500 border-amber-400 text-gray-950 font-extrabold shadow-md'
                      : 'bg-[#0f1015] border-gray-800 hover:border-amber-500/50 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] font-sans opacity-70">2.5 Üst</span>
                  <span>{match.odds.over25.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => toggleSelection(match, '2.5 Alt', match.odds.under25)}
                  className={`py-2 px-1 rounded-xl text-xs border flex flex-col items-center justify-center transition font-mono ${
                    isSelected(match.id, '2.5 Alt')
                      ? 'bg-amber-500 border-amber-400 text-gray-950 font-extrabold shadow-md'
                      : 'bg-[#0f1015] border-gray-800 hover:border-amber-500/50 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] font-sans opacity-70">2.5 Alt</span>
                  <span>{match.odds.under25.toFixed(2)}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* KUPON KARTI */}
        <div className="space-y-4">
          <div className="bg-[#161821] border border-gray-800 rounded-2xl p-5 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                🎟️ Bahis Kuponum
              </h3>
              <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                {coupon.length} Maç
              </span>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs mb-4 font-semibold border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500 text-rose-400'
              }`}>
                {message.text}
              </div>
            )}

            {coupon.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs leading-relaxed">
                Kuponunuza maç eklemek için oranların üzerine tıklayın.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {coupon.map((item, idx) => (
                    <div key={idx} className="bg-[#0f1015] border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-200">{item.teams}</p>
                        <p className="text-[11px] text-amber-400 mt-0.5">Seçim: <strong>{item.type}</strong></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400 text-sm">{item.rate.toFixed(2)}</span>
                        <button
                          onClick={() => setCoupon(coupon.filter((_, i) => i !== idx))}
                          className="text-gray-500 hover:text-rose-400 text-sm transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right">
                  <button
                    onClick={() => setCoupon([])}
                    className="text-[11px] text-gray-500 hover:text-rose-400 underline transition"
                  >
                    Kuponu Temizle
                  </button>
                </div>

                <div className="bg-[#0f1015] border border-gray-800 p-4 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Bahis Tutarı (₺)</label>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      className="w-full bg-[#161821] border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 pt-1">
                    <span>Toplam Oran:</span>
                    <strong className="font-mono text-white text-sm">{totalOdds.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 border-t border-gray-800 pt-2">
                    <span>Tahmini Kazanç:</span>
                    <strong className="font-mono text-emerald-400 text-base">{potentialPayout.toFixed(2)} ₺</strong>
                  </div>
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-900/30"
                >
                  {loading ? 'Kupon Yatırılıyor...' : 'Kuponu Onayla ve Bahis Yap'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}