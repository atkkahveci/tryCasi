'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WithdrawTransaction {
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
    balance: number;
  };
}

export default function AdminWithdrawPage() {
  const [withdraws, setWithdraws] = useState<WithdrawTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles (
            full_name,
            tc_no,
            balance
          )
        `)
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWithdraws(data as any);
      }
    } catch (err) {
      console.error('Çekim talepleri çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Çekim Talebini Onayla
  const handleApprove = async (txId: string) => {
    setProcessingId(txId);
    try {
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', txId);

      fetchWithdraws();
    } catch (err) {
      alert('Onaylama işlemi sırasında bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  // Çekim Talebini Reddet (Parayı Kullanıcının Bakiyesine Geri İade Et)
  const handleReject = async (tx: WithdrawTransaction) => {
    setProcessingId(tx.id);
    try {
      // 1. Kullanıcının mevcut bakiyesini al ve çekim tutarını iade et
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', tx.user_id)
        .single();

      if (profile) {
        const refundedBalance = (profile.balance || 0) + tx.amount;
        await supabase
          .from('profiles')
          .update({ balance: refundedBalance })
          .eq('id', tx.user_id);
      }

      // 2. İşlem durumunu 'rejected' yap
      await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', tx.id);

      fetchWithdraws();
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
          <h1 className="text-xl md:text-2xl font-black text-blue-400 flex items-center gap-2">
            💸 Para Çekme Talepleri
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Kullanıcıların çekim taleplerini ve IBAN/Cüzdan bilgilerini kontrol edip gönderimi onaylayın.
          </p>
        </div>

        <button
          onClick={fetchWithdraws}
          className="bg-[#161821] hover:bg-gray-800 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          🔄 Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Talepler yükleniyor...
        </div>
      ) : withdraws.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Henüz para çekme talebi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {withdraws.map((tx) => (
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
                
                <div className="bg-[#0f1015] p-2.5 rounded-xl border border-gray-800/80 my-1 font-mono text-amber-400">
                  <span className="text-gray-400 font-sans block text-[10px] uppercase font-bold">Ödeme Yapılacak Hesap:</span>
                  {tx.account_info}
                </div>

                <p className="text-[10px] text-gray-500 font-mono">
                  Tarih: {new Date(tx.created_at).toLocaleString('tr-TR')} | Yöntem: <strong className="uppercase text-gray-300">{tx.method}</strong>
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-800/80 pt-2 md:pt-0">
                <div className="text-right">
                  <span className="block font-mono font-black text-base text-blue-400">
                    -{tx.amount.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {tx.status === 'pending' && '⏳ Ödeme Bekliyor'}
                    {tx.status === 'completed' && '✅ Ödendi / Onaylandı'}
                    {tx.status === 'rejected' && '❌ Reddedildi (İade Edildi)'}
                  </span>
                </div>

                {tx.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(tx.id)}
                      disabled={processingId === tx.id}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                    >
                      Ödeme Yapıldı ✓
                    </button>
                    <button
                      onClick={() => handleReject(tx)}
                      disabled={processingId === tx.id}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                    >
                      İptal Et & İade ✕
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