'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BetItem {
  id: string;
  matches: Array<{
    matchId: number;
    teams: string;
    type: string;
    rate: number;
  }>;
  total_odds: number;
  stake: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export default function MyBetsPage() {
  const [bets, setBets] = useState<BetItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtre State'leri
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchMyBets();
  }, []);

  const fetchMyBets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBets(data as BetItem[]);
      }
    } catch (err) {
      console.error('Kuponlar çekilirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme Mantığı
  const filteredBets = bets.filter((bet) => {
    // 1. Durum Filtresi (Devam Eden, Kazanan, Kaybeden)
    const matchStatus = statusFilter === 'all' || bet.status === statusFilter;

    // 2. Tarih Filtresi
    let matchDate = true;
    const betDate = new Date(bet.created_at);
    const now = new Date();

    if (dateFilter === 'today') {
      matchDate = betDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      matchDate = betDate >= oneWeekAgo;
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      matchDate = betDate >= oneMonthAgo;
    }

    return matchStatus && matchDate;
  });

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Üst Başlık & İstatistik Özeti */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-2">
            🎟️ Bahis Kuponlarım
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Geçmiş ve aktif kuponlarınızın detaylarını buradan takip edebilirsiniz.
          </p>
        </div>

        <button 
          onClick={fetchMyBets}
          className="self-start md:self-auto bg-[#161821] hover:bg-gray-800 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          🔄 Yenile
        </button>
      </div>

      {/* FİLTRE BARLARI */}
      <div className="bg-[#161821] border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        
        {/* Durum Filtresi Sekmeleri */}
        <div className="flex items-center gap-1.5 bg-[#0f1015] p-1 rounded-xl border border-gray-800/80 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'pending', label: '⏳ Devam Edenler' },
            { id: 'won', label: '✅ Kazananlar' },
            { id: 'lost', label: '❌ Kaybedenler' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-gray-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tarih Filtresi Dropdown */}
        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          <span className="text-xs text-gray-400 font-medium">Tarih:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-[#0f1015] border border-gray-800 text-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son 30 Gün</option>
          </select>
        </div>

      </div>

      {/* KUPON LİSTESİ */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Kuponlar yükleniyor...
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl space-y-2">
          <p className="text-base font-semibold text-gray-400">Seçilen filtreye uygun kupon bulunamadı.</p>
          <p>Henüz bir bahis yapmadıysanız canlı bültenden kupon oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#161821] border border-gray-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4 hover:border-gray-700 transition"
            >
              {/* Kupon Üst Başlığı */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-400">ID: #{bet.id.slice(0, 8)}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">
                    {new Date(bet.created_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Kupon Rozeti */}
                <div>
                  {bet.status === 'pending' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                      Devam Ediyor
                    </span>
                  )}
                  {bet.status === 'won' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold text-[11px]">
                      KAZANDI ✓
                    </span>
                  )}
                  {bet.status === 'lost' && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-bold text-[11px]">
                      KAYBETTİ ✕
                    </span>
                  )}
                </div>
              </div>

              {/* Kupon İçindeki Maçlar */}
              <div className="space-y-2">
                {bet.matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0f1015] border border-gray-800/80 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-200">{m.teams}</p>
                      <p className="text-[11px] text-amber-400 mt-0.5">
                        Seçim: <strong className="text-gray-300">{m.type}</strong>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      {m.rate.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Kupon Alt Özet Alanı */}
              <div className="bg-[#0f1015] p-3 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between text-xs gap-3 font-mono">
                <div className="flex gap-4">
                  <span className="text-gray-400">
                    Yatırılan: <strong className="text-white font-bold">{bet.stake.toLocaleString('tr-TR')} ₺</strong>
                  </span>
                  <span className="text-gray-400">
                    Toplam Oran: <strong className="text-amber-400 font-bold">{bet.total_odds.toFixed(2)}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">
                    Potansiyel Kazanç:{' '}
                    <strong className="text-emerald-400 text-sm font-bold">
                      {bet.potential_payout.toLocaleString('tr-TR')} ₺
                    </strong>
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </main>
  );
}