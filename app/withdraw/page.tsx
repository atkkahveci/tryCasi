'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PaymentMethod {
  id: string;
  name: string;
  category: string;
  min_amount: number;
  max_amount: number;
}

export default function WithdrawPage() {
  const [activeCategory, setActiveCategory] = useState<'bank' | 'papara' | 'crypto' | 'e-wallet'>('bank');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('1000');
  const [accountInfo, setAccountInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Veritabanından Aktif Çekim Yöntemlerini Çek
  useEffect(() => {
    fetchActiveMethods();
  }, []);

  const fetchActiveMethods = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', 'withdraw')
        .eq('is_active', true);

      if (!error && data) {
        setMethods(data as PaymentMethod[]);
        const firstInCat = data.find((m: any) => m.category === activeCategory);
        if (firstInCat) setSelectedMethod(firstInCat);
      }
    } catch (err) {
      console.error('Çekim yöntemleri çekilemedi:', err);
    } finally {
      setFetching(false);
    }
  };

  // Sekme Değiştiğinde Uygun Çekim Kanalını Seç
  const handleCategoryChange = (cat: 'bank' | 'papara' | 'crypto' | 'e-wallet') => {
    setActiveCategory(cat);
    const available = methods.filter((m) => m.category === cat);
    if (available.length > 0) {
      setSelectedMethod(available[0]);
    } else {
      setSelectedMethod(null);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Para çekebilmek için lütfen önce giriş yapın.');
      }

      if (!selectedMethod) {
        throw new Error('Lütfen geçerli bir çekim yöntemi seçin.');
      }

      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount < selectedMethod.min_amount || withdrawAmount > selectedMethod.max_amount) {
        throw new Error(`Çekim tutarı limit dışı! Min: ${selectedMethod.min_amount} ₺ - Max: ${selectedMethod.max_amount} ₺ olmalıdır.`);
      }

      // Kullanıcının Mevcut Bakiyesini Kontrol Et
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (!profile || profile.balance < withdrawAmount) {
        throw new Error(`Yetersiz bakiye! Mevcut bakiyeniz: ${profile?.balance ? profile.balance.toLocaleString('tr-TR') : 0} ₺`);
      }

      // Çekim Talebi Oluştur
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'withdraw',
          method: selectedMethod.name,
          amount: withdrawAmount,
          status: 'pending',
          account_info: `${selectedMethod.name} - ${accountInfo}`,
        },
      ]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `✅ ${amount} ₺ tutarındaki ${selectedMethod.name} para çekme talebiniz işleme alındı. Yönetici onayından sonra aktarılacaktır.`,
      });
      setAccountInfo('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Para çekme talebi oluşturulurken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryMethods = methods.filter((m) => m.category === activeCategory);

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-blue-400 flex items-center gap-2">
        💸 Para Çekme Paneli
      </h1>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* KATEGORİ SEKMELERİ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'bank', label: '🏛️ Banka IBAN', desc: 'Tüm Bankalar 7/24' },
          { id: 'papara', label: '💳 Papara', desc: 'Anında Çekim' },
          { id: 'crypto', label: '🪙 Kripto (USDT)', desc: 'TRC20 Cüzdan' },
          { id: 'e-wallet', label: '📱 Dijital Cüzdan', desc: 'PayFix vb.' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleCategoryChange(tab.id as any)}
            className={`p-4 rounded-2xl border text-left transition ${
              activeCategory === tab.id
                ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold shadow-lg'
                : 'bg-[#161821] border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className="text-sm font-semibold">{tab.label}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* İÇERİK ALANI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AKTİF KANAL SEÇİMİ */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Çekim Kanalı</h3>
          {fetching ? (
            <div className="text-xs text-gray-500 py-4">Yöntemler yükleniyor...</div>
          ) : currentCategoryMethods.length === 0 ? (
            <div className="bg-[#161821] border border-gray-800 p-4 rounded-xl text-xs text-gray-500">
              Bu kategoride aktif çekim yöntemi bulunmuyor.
            </div>
          ) : (
            currentCategoryMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m)}
                className={`w-full p-3.5 rounded-xl border text-left transition text-xs ${
                  selectedMethod?.id === m.id
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-[#161821] border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm">{m.name}</div>
                <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                  Min: {m.min_amount} ₺ - Max: {m.max_amount.toLocaleString('tr-TR')} ₺
                </div>
              </button>
            ))
          )}
        </div>

        {/* ÇEKİM FORM ALANI */}
        <div className="md:col-span-2 bg-[#161821] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          {selectedMethod ? (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold">
                  Çekmek İstediğiniz Tutar (₺)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0f1015] border border-gray-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500 transition"
                  required
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Limitler: {selectedMethod.min_amount} ₺ - {selectedMethod.max_amount.toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold">
                  Ödemenin Gönderileceği Hesap / IBAN / Adres
                </label>
                <input
                  type="text"
                  value={accountInfo}
                  onChange={(e) => setAccountInfo(e.target.value)}
                  placeholder={
                    activeCategory === 'bank'
                      ? 'TR00 0000 0000... - Alıcı Ad Soyad'
                      : activeCategory === 'crypto'
                      ? 'USDT TRC20 Cüzdan Adresiniz'
                      : 'Hesap / Papara Numarası'
                  }
                  className="w-full bg-[#0f1015] border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-blue-900/30 mt-4"
              >
                {loading ? 'Talep Gönderiliyor...' : `${amount} ₺ Para Çekme Talebi Gönder`}
              </button>
            </form>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              Çekim işlemi yapmak için sol taraftan aktif bir kanal seçin.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}