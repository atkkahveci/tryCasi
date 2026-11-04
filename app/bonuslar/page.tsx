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
}

export default function UserBonusesPage() {
  const [bonuses, setBonuses] = useState<BonusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBonuses();
  }, []);

  const fetchMyBonuses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bonuses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBonuses(data as BonusItem[]);
      }
    } catch (err) {
      console.error('Bonuslar çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-2">
          🎁 Aktif Bonuslarım & Kampanyalar
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Hesabınıza tanımlanan bonusları ve çevrim şartı durumunuzu buradan takip edebilirsiniz.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Bonuslar yükleniyor...
        </div>
      ) : bonuses.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-gray-300">Hesabınıza tanımlanmış aktif bonus bulunmuyor.</p>
          <p>Yatırım yaparak güncel kampanyalardan yararlanabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bonuses.map((b) => (
            <div
              key={b.id}
              className="bg-[#161821] border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="font-bold text-sm text-gray-100">{b.title}</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Aktif ⚡
                </span>
              </div>

              <div className="flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 block">Bonus Tutarı</span>
                  <span className="text-xl font-black text-amber-400">+{b.amount.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Çevrim Şartı</span>
                  <span className="text-sm font-bold text-gray-200">{b.rollover_requirement.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-800/80">
                Tanımlanma Tarihi: {new Date(b.created_at).toLocaleString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}