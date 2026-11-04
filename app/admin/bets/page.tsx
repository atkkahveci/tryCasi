'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BetItem {
  id: string;
  user_id: string;
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
  profiles?: {
    full_name: string;
    tc_no: string;
    balance: number;
  };
}

export default function AdminBetsPage() {
  const [bets, setBets] = useState<BetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('pending');

  useEffect(() => {
    fetchAllBets();
  }, []);

  const fetchAllBets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          profiles (
            full_name,
            tc_no,
            balance
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBets(data as any);
      }
    } catch (err) {
      console.error('Kuponlar çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Kuponu KAZANDI Olarak İşaretle ve Kazancı Bakiyeye Yükle
  const handleMarkAsWon = async (bet: BetItem) => {
    setProcessingId(bet.id);
    try {
      // 1. Kullanıcının mevcut bakiyesini al ve kazanç tutarını ekle
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', bet.user_id)
        .single();

      if (profile) {
        const newBalance = (profile.balance || 0) + bet.potential_payout;
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', bet.user_id);
      }

      // 2. Kupon durumunu 'won' yap
      await supabase
        .from('bets')
        .update({ status: 'won' })
        .eq('id', bet.id);

      fetchAllBets();
    } catch (err) {
      alert('Kupon sonuçlandırılırken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  // Kuponu KAYBETTİ Olarak İşaretle
  const handleMarkAsLost = async (betId: string) => {
    setProcessingId(betId);
    try {
      await supabase
        .from('bets')
        .update({ status: 'lost' })
        .eq('id', betId);

      fetchAllBets();
    } catch (err) {
      alert('Kupon sonuçlandırılırken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBets = bets.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
            🎟️ Kupon Yönetimi & Sonuçlandırma
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Oynanan bahisleri inceleyin, sonuçlandırın ve kazançları anında bakiye olarak aktarın.
          </p>
        </div>

        <button
          onClick={fetchAllBets}
          className="bg-[#161821] hover:bg-gray-800 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
        >
          🔄 Yenile
        </button>
      </div>

      {/* FİLTRE SEKMELERİ */}
      <div className="bg-[#161821] border border-gray-800 p-1.5 rounded-xl flex items-center gap-2 max-w-lg">
        {[
          { id: 'pending', label: '⏳ Sonuç Bekleyenler' },
          { id: 'won', label: '✅ Kazananlar' },
          { id: 'lost', label: '❌ Kaybedenler' },
          { id: 'all', label: 'Tümü' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              statusFilter === tab.id ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KUPON LİSTESİ */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Kuponlar yükleniyor...
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Seçilen filtrede kupon bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#161821] border border-gray-800 p-4 md:p-5 rounded-2xl shadow-xl space-y-4"
            >
              {/* Üst Bilgi */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-200">
                    👤 {bet.profiles?.full_name || 'Bilinmeyen Kullanıcı'}
                  </span>
                  <span className="text-gray-500 font-mono">({bet.profiles?.tc_no})</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 font-mono">
                    {new Date(bet.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>

                <div>
                  {bet.status === 'pending' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold text-[11px]">
                      ⏳ Sonuç Bekliyor
                    </span>
                  )}
                  {bet.status === 'won' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold text-[11px]">
                      ✅ Kazandı
                    </span>
                  )}
                  {bet.status === 'lost' && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-bold text-[11px]">
                      ❌ Kaybetti
                    </span>
                  )}
                </div>
              </div>

              {/* Maçlar */}
              <div className="space-y-2">
                {bet.matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0f1015] border border-gray-800/80 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-200">{m.teams}</p>
                      <p className="text-[11px] text-amber-400 mt-0.5">Seçim: <strong>{m.type}</strong></p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      {m.rate.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Alt Finans & Aksiyon Butonları */}
              <div className="bg-[#0f1015] p-3 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex gap-4">
                  <span className="text-gray-400">Yatırılan: <strong className="text-white">{bet.stake.toLocaleString('tr-TR')} ₺</strong></span>
                  <span className="text-gray-400">Oran: <strong className="text-amber-400">{bet.total_odds.toFixed(2)}</strong></span>
                  <span className="text-gray-400">Kazanç: <strong className="text-emerald-400 text-sm font-bold">{bet.potential_payout.toLocaleString('tr-TR')} ₺</strong></span>
                </div>

                {/* Aksiyon Butonları */}
                {bet.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAsWon(bet)}
                      disabled={processingId === bet.id}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
                    >
                      Kazandı Yap ✓
                    </button>
                    <button
                      onClick={() => handleMarkAsLost(bet.id)}
                      disabled={processingId === bet.id}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
                    >
                      Kaybetti Yap ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500 italic">Sonuçlandırıldı</span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}