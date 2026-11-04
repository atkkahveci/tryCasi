'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PaymentMethod {
  id: string;
  name: string;
  category: string;
  account_number: string;
  account_holder: string;
  min_amount: number;
  max_amount: number;
}

export default function DepositPage() {
  const [activeCategory, setActiveCategory] = useState<'bank' | 'papara' | 'crypto' | 'e-wallet'>('papara');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Veritabanından Aktif Ödeme Yöntemlerini Çek
  useEffect(() => {
    fetchActiveMethods();
  }, []);

  const fetchActiveMethods = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', 'deposit')
        .eq('is_active', true);

      if (!error && data) {
        setMethods(data as PaymentMethod[]);
        // Varsayılan ilk yöntemi seç
        const firstInCat = data.find((m: any) => m.category === activeCategory);
        if (firstInCat) setSelectedMethod(firstInCat);
      }
    } catch (err) {
      console.error('Yöntemler çekilemedi:', err);
    } finally {
      setFetching(false);
    }
  };

  // Sekme Değiştiğinde Uygun Yöntemi Otomatik Seç
  const handleCategoryChange = (cat: 'bank' | 'papara' | 'crypto' | 'e-wallet') => {
    setActiveCategory(cat);
    const available = methods.filter((m) => m.category === cat);
    if (available.length > 0) {
      setSelectedMethod(available[0]);
    } else {
      setSelectedMethod(null);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Yatırım yapabilmek için lütfen önce giriş yapın.');
      }

      if (!selectedMethod) {
        throw new Error('Lütfen geçerli bir ödeme yöntemi seçin.');
      }

      const depAmount = parseFloat(amount);
      if (depAmount < selectedMethod.min_amount || depAmount > selectedMethod.max_amount) {
        throw new Error(`Tutar limitsizdir! Min: ${selectedMethod.min_amount} ₺ - Max: ${selectedMethod.max_amount} ₺ olmalıdır.`);
      }

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'deposit',
          method: selectedMethod.name,
          amount: depAmount,
          status: 'pending',
          account_info: `${selectedMethod.name} - ${selectedMethod.account_number}`,
        },
      ]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `🎉 ${amount} ₺ tutarındaki ${selectedMethod.name} yatırım bildiriminiz alındı! Kontrol edildikten sonra bakiyenize yüklenecektir.`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Yatırım bildirimi oluşturulurken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryMethods = methods.filter((m) => m.category === activeCategory);

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-2">
        💰 Para Yatırma Paneli
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
          { id: 'papara', label: '💳 Papara', desc: 'Anında 7/24 Transfer' },
          { id: 'bank', label: '🏛️ Banka Havalesi', desc: 'EFT / FAST Geçerli' },
          { id: 'crypto', label: '🪙 Kripto (USDT)', desc: 'TRC20 Komisyonsuz' },
          { id: 'e-wallet', label: '📱 Dijital Cüzdan', desc: 'PayFix vb.' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleCategoryChange(tab.id as any)}
            className={`p-4 rounded-2xl border text-left transition ${
              activeCategory === tab.id
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-lg'
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
        
        {/* AKTİF KATEGORİYE AİT KANALLAR */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kanal Seçin</h3>
          {fetching ? (
            <div className="text-xs text-gray-500 py-4">Yöntemler yükleniyor...</div>
          ) : currentCategoryMethods.length === 0 ? (
            <div className="bg-[#161821] border border-gray-800 p-4 rounded-xl text-xs text-gray-500">
              Bu kategoride şu an aktif ödeme yöntemi bulunmuyor.
            </div>
          ) : (
            currentCategoryMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m)}
                className={`w-full p-3.5 rounded-xl border text-left transition text-xs ${
                  selectedMethod?.id === m.id
                    ? 'bg-amber-500 text-gray-950 font-bold shadow-md'
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

        {/* DETAY VE YATIRIM BİLDİRİM FORMU */}
        <div className="md:col-span-2 bg-[#161821] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          {selectedMethod ? (
            <>
              {/* ADMININ TANIMLADIĞI HESAP DETAYLARI KUTUSU */}
              <div className="bg-[#0f1015] border border-amber-500/30 p-4 rounded-xl space-y-2">
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                  📌 Ödeme Yapacağınız Hesap Bilgisi
                </span>
                
                <div className="font-mono text-sm font-bold text-gray-100 selection:bg-amber-500 selection:text-gray-950">
                  {selectedMethod.account_number}
                </div>

                {selectedMethod.account_holder && (
                  <div className="text-xs text-gray-400">
                    Alıcı: <strong className="text-gray-200">{selectedMethod.account_holder}</strong>
                  </div>
                )}
                
                <p className="text-[11px] text-gray-500 italic pt-1">
                  * Lütfen yukarıdaki hesaba ödemeyi yaptıktan sonra aşağıdaki formu doldurup bildirimi gönderin.
                </p>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold">
                    Yatırdığınız Tutar (₺)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0f1015] border border-gray-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 transition"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  {['250', '500', '1000', '2500', '5000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="flex-1 bg-[#0f1015] hover:bg-gray-800 border border-gray-800 py-1.5 rounded-lg text-xs font-mono text-gray-300 transition"
                    >
                      +{val}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-emerald-900/30 mt-4"
                >
                  {loading ? 'İşlem Gönderiliyor...' : `${amount} ₺ Yatırım Bildirimini Gönder`}
                </button>
              </form>
            </>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              Ödeme yapmak için sol taraftan aktif bir yöntem seçin.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}