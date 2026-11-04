'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BonusItem {
  id: string;
  title: string;
  amount: number;
  rollover_requirement: number;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    tc_no: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  tc_no: string;
}

export default function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<BonusItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('🎁 %100 Yatırım Bonusu');
  const [amount, setAmount] = useState('500');
  const [rollover, setRollover] = useState('1500');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Verilen Bonusları Çek
      const { data: bonusData } = await supabase
        .from('bonuses')
        .select(`
          *,
          profiles (
            full_name,
            tc_no
          )
        `)
        .order('created_at', { ascending: false });

      if (bonusData) setBonuses(bonusData as any);

      // 2. Kullanıcı Listesini Çek (Bonus verebilmek için)
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, tc_no');

      if (userData) {
        setUsers(userData);
        if (userData.length > 0) setSelectedUserId(userData[0].id);
      }
    } catch (err) {
      console.error('Veriler çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Lütfen bir kullanıcı seçin.');
      return;
    }

    setSubmitting(true);
    try {
      const bonusAmount = parseFloat(amount);
      const rolloverAmount = parseFloat(rollover);

      // 1. Bonuses tablosuna ekle
      const { error: bonusErr } = await supabase.from('bonuses').insert([
        {
          user_id: selectedUserId,
          title,
          amount: bonusAmount,
          rollover_requirement: rolloverAmount,
          status: 'active',
        },
      ]);

      if (bonusErr) throw bonusErr;

      // 2. Kullanıcının nakit bakiyesine de bonus tutarını ekle (veya bakiye güncellemesi yap)
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', selectedUserId)
        .single();

      if (profile) {
        const newBalance = (profile.balance || 0) + bonusAmount;
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', selectedUserId);
      }

      alert('🎁 Bonus başarıyla kullanıcıya tanımlandı ve bakiyesine eklendi!');
      setTitle('🎁 %100 Yatırım Bonusu');
      setAmount('500');
      setRollover('1500');
      fetchData();
    } catch (err: any) {
      alert('Bonus tanımlanırken hata oluştu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
          🎁 Bonus Yönetimi & Tanımlama
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Kullanıcılara özel bonuslar tanımlayın, çevrim şartı belirleyin ve hesaplarına yükleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BONUS TANIMLAMA FORMU */}
        <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-gray-100 border-b border-gray-800 pb-3">
            ✨ Kullanıcıya Bonus Tanımla
          </h2>

          <form onSubmit={handleGiveBonus} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Kullanıcı Seçin</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500 font-bold"
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || 'İsimsiz'} ({u.tc_no || 'T.C. Yok'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Bonus Başlığı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: %100 Hoş Geldin Bonusu"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Bonus Tutar (₺)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Çevrim Şartı (₺)</label>
                <input
                  type="number"
                  value={rollover}
                  onChange={(e) => setRollover(e.target.value)}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 mt-2"
            >
              {submitting ? 'Tanımlanıyor...' : 'Bonusu Hesaba Tanımla 🎁'}
            </button>
          </form>
        </div>

        {/* VERİLEN BONUSLAR LİSTESİ */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-gray-100 mb-3">Tarihsel Tanımlanan Bonuslar ({bonuses.length})</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Bonuslar yükleniyor...
            </div>
          ) : bonuses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Henüz kimseye bonus tanımlanmadı.
            </div>
          ) : (
            <div className="space-y-3">
              {bonuses.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#161821] border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-sm">{b.title}</span>
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      Kullanıcı: <strong className="text-gray-200">{b.profiles?.full_name || 'Bilinmeyen'}</strong> ({b.profiles?.tc_no})
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Çevrim Şartı: {b.rollover_requirement.toLocaleString('tr-TR')} ₺ | Tarih: {new Date(b.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="block font-mono font-black text-base text-emerald-400">
                      +{b.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}