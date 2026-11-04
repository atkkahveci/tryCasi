'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface GameItem {
  id: string;
  title: string;
  provider: string;
  category: string;
  image_url: string;
  game_code: string;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni Oyun Ekleme Form State'i
  const [formData, setFormData] = useState({
    title: '',
    provider: 'Pragmatic Play',
    category: 'slot',
    image_url: '',
    game_code: '',
  });

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGames(data as GameItem[]);
      }
    } catch (err) {
      console.error('Oyunlar çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Yeni Oyun Ekle Submit
  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const { error } = await supabase.from('games').insert([
        {
          title: formData.title,
          provider: formData.provider,
          category: formData.category,
          image_url: formData.image_url || 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400',
          game_code: formData.game_code || formData.title.toLowerCase().replace(/\s+/g, '-'),
          is_active: true,
          is_featured: false,
          is_popular: false,
        },
      ]);

      if (error) throw error;

      setFormData({
        title: '',
        provider: 'Pragmatic Play',
        category: 'slot',
        image_url: '',
        game_code: '',
      });
      fetchGames();
    } catch (err) {
      alert('Oyun eklenirken hata oluştu.');
    } finally {
      setAdding(false);
    }
  };

  // Aktif/Pasif Toggle
  const toggleStatus = async (id: string, field: 'is_active' | 'is_featured' | 'is_popular', currentValue: boolean) => {
    try {
      await supabase
        .from('games')
        .update({ [field]: !currentValue })
        .eq('id', id);

      fetchGames();
    } catch (err) {
      alert('Güncelleme sırasında hata oluştu.');
    }
  };

  // Oyun Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu oyunu kaldırmak istediğinize emin misiniz?')) return;
    try {
      await supabase.from('games').delete().eq('id', id);
      fetchGames();
    } catch (err) {
      alert('Silme hatası.');
    }
  };

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
          🎰 Casino & Slot Oyun Yönetimi
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Sitede yayınlanan casino oyunlarını kontrol edin, öne çıkarın veya pasife alın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* YENİ OYUN EKLEME FORMU */}
        <div className="bg-[#161821] border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-gray-100 border-b border-gray-800 pb-3">
            ➕ Yeni Oyun Ekle
          </h2>

          <form onSubmit={handleAddGame} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Oyun Adı</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Sweet Bonanza"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Sağlayıcı (Provider)</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Pragmatic Play">Pragmatic Play</option>
                  <option value="Evolution Gaming">Evolution</option>
                  <option value="EGT Interactive">EGT</option>
                  <option value="NetEnt">NetEnt</option>
                  <option value="Hacksaw Gaming">Hacksaw</option>
                  <option value="Spribe">Spribe (Aviator)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="slot">🎰 Slot Games</option>
                  <option value="live-casino">🎲 Canlı Casino</option>
                  <option value="crash">🚀 Crash / Aviator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Görsel URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://... (Boş kalırsa varsayılan atanır)"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">API Oyun Kodu (Code/ID)</label>
              <input
                type="text"
                value={formData.game_code}
                onChange={(e) => setFormData({ ...formData, game_code: e.target.value })}
                placeholder="vs20sweetbonz"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 font-mono text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 mt-2"
            >
              {adding ? 'Ekleniyor...' : 'Oyunu Sisteme Kaydet'}
            </button>
          </form>
        </div>

        {/* OYUN KARTLARI VE VİTRİN DÜZENİ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-100">Kayıtlı Oyun Vitrini ({games.length})</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Oyunlar yükleniyor...
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
              Henüz oyun tanımlanmadı. Soldaki formdan oyun ekleyin.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`bg-[#161821] border p-4 rounded-2xl flex items-center gap-4 transition shadow-lg relative ${
                    game.is_active ? 'border-gray-800 hover:border-gray-700' : 'border-rose-900/50 opacity-60'
                  }`}
                >
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-800 shrink-0"
                  />

                  <div className="space-y-1 flex-1 min-w-0 text-xs">
                    <h3 className="font-bold text-gray-100 truncate text-sm">{game.title}</h3>
                    <p className="text-amber-400 text-[11px] font-semibold">{game.provider}</p>
                    <span className="inline-block bg-[#0f1015] px-2 py-0.5 rounded text-[10px] text-gray-400 uppercase font-mono">
                      {game.category}
                    </span>

                    {/* VİTRİN BUTONLARI */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      <button
                        onClick={() => toggleStatus(game.id, 'is_active', game.is_active)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          game.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {game.is_active ? '● Aktif' : '○ Pasif'}
                      </button>

                      <button
                        onClick={() => toggleStatus(game.id, 'is_featured', game.is_featured)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          game.is_featured
                            ? 'bg-amber-500 text-gray-950'
                            : 'bg-[#0f1015] text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        ⭐ Öne Çıkan
                      </button>

                      <button
                        onClick={() => toggleStatus(game.id, 'is_popular', game.is_popular)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          game.is_popular
                            ? 'bg-rose-600 text-white'
                            : 'bg-[#0f1015] text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        🔥 Popüler
                      </button>

                      <button
                        onClick={() => handleDelete(game.id)}
                        className="text-gray-500 hover:text-rose-400 text-xs pl-1 transition"
                      >
                        🗑️
                      </button>
                    </div>

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