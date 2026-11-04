'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'deposit' | 'withdraw';
  category: 'bank' | 'papara' | 'crypto' | 'e-wallet';
  account_number: string;
  account_holder: string;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    type: 'deposit',
    category: 'bank',
    account_number: '',
    account_holder: '',
    min_amount: '50',
    max_amount: '50000',
  });

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMethods(data as PaymentMethod[]);
      }
    } catch (err) {
      console.error('Yöntemler çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const { error } = await supabase.from('payment_methods').insert([
        {
          name: formData.name,
          type: formData.type,
          category: formData.category,
          account_number: formData.account_number,
          account_holder: formData.account_holder,
          min_amount: parseFloat(formData.min_amount),
          max_amount: parseFloat(formData.max_amount),
          is_active: true,
        },
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        type: 'deposit',
        category: 'bank',
        account_number: '',
        account_holder: '',
        min_amount: '50',
        max_amount: '50000',
      });
      fetchMethods();
    } catch (err) {
      alert('Yöntem eklenirken hata oluştu.');
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      fetchMethods();
    } catch (err) {
      alert('Durum güncellenirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ödeme yöntemini silmek istediğinize emin misiniz?')) return;
    try {
      await supabase.from('payment_methods').delete().eq('id', id);
      fetchMethods();
    } catch (err) {
      alert('Silme sırasında hata oluştu.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
          💳 Ödeme Yöntemleri Yönetimi
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Sitedeki aktif yatırım/çekim kanallarını ekleyin ve kategorilere ayırın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM */}
        <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-gray-100 border-b border-gray-800 pb-3">
            ➕ Yeni Yöntem Tanımla
          </h2>

          <form onSubmit={handleAddMethod} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Yöntem Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Garanti Bankası Havale / TRC20 USDT"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">İşlem Türü</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="deposit">💰 Yatırım</option>
                  <option value="withdraw">💸 Çekim</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Kategori Sekmesi</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                >
                  <option value="bank">🏛️ Banka Havalesi</option>
                  <option value="papara">💳 Papara</option>
                  <option value="crypto">🪙 Kripto (USDT)</option>
                  <option value="e-wallet">📱 Dijital Cüzdan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">IBAN / Cüzdan Adresi</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="TR00 0000 0000... Veya Cüzdan Adresi"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 font-mono text-gray-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Alıcı Ad Soyad</label>
              <input
                type="text"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                placeholder="Ahmet Yılmaz (Varsa)"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Min (₺)</label>
                <input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 font-mono text-gray-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Max (₺)</label>
                <input
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 font-mono text-gray-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 mt-2"
            >
              {adding ? 'Kaydediliyor...' : 'Yöntemi Ekle & Yayınla'}
            </button>
          </form>
        </div>

        {/* LİSTE */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-gray-100 mb-3">Sistemde Aktif Yöntemler ({methods.length})</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Yöntemler yükleniyor...
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Henüz yöntem eklenmedi. Soldaki formdan ekleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161821] border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-sm">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.type === 'deposit' ? 'YATIRIM' : 'ÇEKİM'}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                        {item.category}
                      </span>
                    </div>

                    <div className="font-mono text-amber-400 bg-[#0f1015] px-2.5 py-1 rounded-lg border border-gray-800/80 inline-block my-1">
                      {item.account_number} {item.account_holder && `(${item.account_holder})`}
                    </div>

                    <p className="text-[10px] text-gray-400 font-mono">
                      Limitler: {item.min_amount.toLocaleString('tr-TR')} ₺ - {item.max_amount.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 border-gray-800/80 pt-2 sm:pt-0">
                    <button
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                        item.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                    >
                      {item.is_active ? '● Aktif' : '○ Pasif'}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-gray-800 hover:bg-rose-600/80 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl transition text-[11px]"
                    >
                      Sil 🗑️
                    </button>
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