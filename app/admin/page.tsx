'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdraws: 0,
    pendingBets: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('balance');
      const totalUsers = profiles?.length || 0;
      const totalBalance = profiles?.reduce((acc, p) => acc + (p.balance || 0), 0) || 0;

      const { count: depCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending');

      const { count: witCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'withdraw')
        .eq('status', 'pending');

      const { count: betCount } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers,
        pendingDeposits: depCount || 0,
        pendingWithdraws: witCount || 0,
        pendingBets: betCount || 0,
        totalBalance,
      });
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#161821] border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-amber-400">
            👋 Hoş Geldin, Patron!
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Casino platformunun anlık finansal ve operasyonel özet panindesin.
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition self-start"
        >
          🔄 Verileri Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Yönetici verileri hesaplanıyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-xs text-gray-400 font-semibold">Toplam Kullanıcı</span>
            <div className="text-2xl font-mono font-black text-gray-100">
              {stats.totalUsers} Kişi
            </div>
            <Link href="/admin/users" className="text-[11px] text-amber-400 hover:underline block pt-1">
              Kullanıcıları Yönet →
            </Link>
          </div>

          <div className="bg-[#161821] border border-amber-500/40 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-xs text-gray-400 font-semibold">Onay Bekleyen Yatırımlar</span>
            <div className="text-2xl font-mono font-black text-emerald-400">
              {stats.pendingDeposits} İşlem
            </div>
            <Link href="/admin/deposit" className="text-[11px] text-emerald-400 hover:underline block pt-1">
              Yatırımları İncele →
            </Link>
          </div>

          <div className="bg-[#161821] border border-blue-500/40 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-xs text-gray-400 font-semibold">Ödeme Bekleyen Çekimler</span>
            <div className="text-2xl font-mono font-black text-blue-400">
              {stats.pendingWithdraws} İşlem
            </div>
            <Link href="/admin/withdraw" className="text-[11px] text-blue-400 hover:underline block pt-1">
              Çekimleri Onayla →
            </Link>
          </div>

          <div className="bg-[#161821] border border-rose-500/40 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-xs text-gray-400 font-semibold">Sonuç Bekleyen Kuponlar</span>
            <div className="text-2xl font-mono font-black text-amber-400">
              {stats.pendingBets} Kupon
            </div>
            <Link href="/admin/bets" className="text-[11px] text-amber-400 hover:underline block pt-1">
              Kuponları Sonuçlandır →
            </Link>
          </div>

        </div>
      )}

      <div className="bg-[#161821] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-gray-200">🚀 Hızlı Yönetim Kısayolları</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/admin/payment-methods" className="bg-[#0f1015] hover:bg-gray-800 border border-gray-800 p-4 rounded-xl text-center transition">
            <span className="text-lg block mb-1">💳</span>
            <span className="text-xs font-bold text-gray-200">Ödeme Kanalları</span>
          </Link>
          <Link href="/admin/games" className="bg-[#0f1015] hover:bg-gray-800 border border-gray-800 p-4 rounded-xl text-center transition">
            <span className="text-lg block mb-1">🎰</span>
            <span className="text-xs font-bold text-gray-200">Casino Oyunları</span>
          </Link>
          <Link href="/admin/bonuses" className="bg-[#0f1015] hover:bg-gray-800 border border-gray-800 p-4 rounded-xl text-center transition">
            <span className="text-lg block mb-1">🎁</span>
            <span className="text-xs font-bold text-gray-200">Bonus Tanımla</span>
          </Link>
          <Link href="/" className="bg-[#0f1015] hover:bg-gray-800 border border-gray-800 p-4 rounded-xl text-center transition">
            <span className="text-lg block mb-1">🌐</span>
            <span className="text-xs font-bold text-gray-200">Ana Siteye Git</span>
          </Link>
        </div>
      </div>
    </div>
  );
}