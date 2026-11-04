'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DepositTransaction {
  id: string;
  user_id: string;
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  account_info: string;
  created_at: string;
  profiles?: {
    full_name: string;
    tc_no: string;
  };
}

export default function AdminDepositPage() {
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles (
            full_name,
            tc_no
          )
        `)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDeposits(data as any);
      }
    } catch (err) {
      console.error('Yatırımlar çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Yatırımı Onayla ve Kullanıcı Bakiyesine Otomatik Ekle
  const handleApprove = async (tx: DepositTransaction) => {
    setProcessingId(tx.id);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', tx.user_id)
        .single();

      if (profile) {
        const updatedBalance = (profile.balance || 0) + tx.amount;
        await supabase
          .from('profiles')
          .update({ balance: updatedBalance })
          .eq('id', tx.user_id);
      }

      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', tx.id);

      fetchDeposits();
    } catch (err) {
      alert('Onaylama işlemi sırasında bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  // Yatırımı Reddet
  const handleReject = async (txId: string) => {
    setProcessingId(txId);
    try {
      await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', txId);

      fetchDeposits();
    } catch (err) {
      alert('Reddetme işlemi sırasında bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
            💰 Para Yatırma Onayları
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Kullanıcıların gönderdiği yatırım bildirimlerini inceleyip onaylayın.
          </p>
        </div>

        <button
          onClick={fetchDeposits}
          className="bg-[#161821] hover:bg-gray-800 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          🔄 Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Yatırımlar yükleniyor...
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Henüz yatırım bildirimi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((tx) => (
            <div
              key={tx.id}
              className="bg-[#161821] border border-gray-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-100 text-sm">
                    {tx.profiles?.full_name || 'Bilinmeyen Kullanıcı'}
                  </span>
                  <span className="text-gray-500 font-mono">({tx.profiles?.tc_no})</span>
                </div>
                <p className="text-gray-400">
                  Yöntem: <strong className="text-amber-400 uppercase">{tx.method}</strong> | Not: <span className="text-gray-300 font-mono">{tx.account_info}</span>
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  Tarih: {new Date(tx.created_at).toLocaleString('tr-TR')}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-800/80 pt-2 md:pt-0">
                <div className="text-right">
                  <span className="block font-mono font-black text-base text-emerald-400">
                    +{tx.amount.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {tx.status === 'pending' && '⏳ Bekliyor'}
                    {tx.status === 'completed' && '✅ Onaylandı'}
                    {tx.status === 'rejected' && '❌ Reddedildi'}
                  </span>
                </div>

                {tx.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(tx)}
                      disabled={processingId === tx.id}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                    >
                      Onayla ✓
                    </button>
                    <button
                      onClick={() => handleReject(tx.id)}
                      disabled={processingId === tx.id}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                    >
                      Reddet ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500 italic">İşlem Tamamlandı</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}