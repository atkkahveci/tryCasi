'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  account_info: string;
  created_at: string;
}

export default function FinanceHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw'>('all');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Güncel Bakiye Çek
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profile) setBalance(profile.balance);

      // 2. İşlem Geçmişi Çek
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data as Transaction[]);
      }
    } catch (err) {
      console.error('Finans verileri çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hesaplamalar
  const totalDeposited = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* ÜST FİNANSAL ÖZET KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161821] border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-gray-400 font-medium">Mevcut Bakiye</span>
          <div className="text-2xl font-mono font-black text-amber-400">
            {balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
        </div>

        <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-gray-400 font-medium">Toplam Başarılı Yatırım</span>
          <div className="text-2xl font-mono font-black text-emerald-400">
            +{totalDeposited.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
        </div>

        <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-gray-400 font-medium">Toplam Başarılı Çekim</span>
          <div className="text-2xl font-mono font-black text-blue-400">
            -{totalWithdrawn.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
        </div>
      </div>

      {/* BAŞLIK VE HIZLI AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100 flex items-center gap-2">
            💳 Finansal Transfer Geçmişi
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Yaptığınız tüm bakiye yatırma ve çekme bildirimlerinin anlık durumları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/deposit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
            + Para Yatır
          </Link>
          <Link href="/withdraw" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
            - Para Çek
          </Link>
        </div>
      </div>

      {/* SEKMELER */}
      <div className="bg-[#161821] border border-gray-800 p-1.5 rounded-xl flex items-center gap-2 max-w-md">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'all' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
          }`}
        >
          Tüm İşlemler ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'deposit' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          💰 Yatırımlar
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'withdraw' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          💸 Çekimler
        </button>
      </div>

      {/* İŞLEM LİSTESİ TABLE/CARD */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Finansal geçmiş yükleniyor...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Henüz finansal bir işlem kaydınız bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-[#161821] border border-gray-800 hover:border-gray-700 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {tx.type === 'deposit' ? '↓' : '↑'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-200 uppercase">
                      {tx.method}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tx.type === 'deposit' ? 'YATIRIM' : 'ÇEKİM'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.account_info || 'Detay girilmedi'}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">
                    {new Date(tx.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-800/80 pt-2 md:pt-0">
                <div className={`text-base font-mono font-black ${
                  tx.type === 'deposit' ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </div>

                <div>
                  {tx.status === 'pending' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                      Onay Bekliyor
                    </span>
                  )}
                  {tx.status === 'completed' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Onaylandı ✓
                    </span>
                  )}
                  {tx.status === 'rejected' && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Reddedildi ✕
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}