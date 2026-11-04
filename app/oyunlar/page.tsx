'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface GameItem {
  id: string;
  title: string;
  provider: string;
  category: string;
  image_url: string;
  is_featured: boolean;
  is_popular: boolean;
}

function GamesContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const [games, setGames] = useState<GameItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(filterParam);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filterParam) {
      setSelectedCategory(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGames(data as GameItem[]);
      }
    } catch (err) {
      console.error('Oyunlar çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Benzersiz Sağlayıcı Listesini Çıkar
  const providers = ['all', ...Array.from(new Set(games.map((g) => g.provider)))];

  // Filtreleme Mantığı
  const filteredGames = games.filter((game) => {
    // 1. Arama Filtresi
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.provider.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Sağlayıcı Filtresi
    const matchesProvider = selectedProvider === 'all' || game.provider.toLowerCase() === selectedProvider.toLowerCase();

    // 3. Kategori / Üst Menü Filtresi
    let matchesCategory = true;
    if (selectedCategory === 'popular') matchesCategory = game.is_popular;
    else if (selectedCategory === 'featured') matchesCategory = game.is_featured;
    else if (selectedCategory === 'lucky') matchesCategory = game.is_popular || game.is_featured;
    else if (selectedCategory !== 'all' && selectedCategory !== 'lobi') {
      matchesCategory = game.category === selectedCategory;
    }

    return matchesSearch && matchesProvider && matchesCategory;
  });

  // Rastgele Oyna Butonu Fonksiyonu
  const handleRandomPlay = () => {
    if (filteredGames.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const randomGame = filteredGames[randomIndex];
    alert(`🍀 Rastgele Seçilen Oyun: ${randomGame.title} (${randomGame.provider}) açılıyor!`);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-[#0b0c10] min-h-screen text-gray-200">
      
      {/* ÜST KAYDIRILABİLİR KATEGORİ HAPLARI (PILL MENU) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'lobi', label: '🍒 Lobi' },
          { id: 'all', label: '🎰 Tüm Oyunlar' },
          { id: 'popular', label: '🔥 Popüler Oyunlar' },
          { id: 'featured', label: '⭐ Öne Çıkanlar' },
          { id: 'lucky', label: '🍀 Şanslı Oyunlar' },
          { id: 'slot', label: '🪙 Slotlar' },
          { id: 'live-casino', label: '🎲 Canlı Casino' },
          { id: 'crash', label: '🚀 Aviator / Crash' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSelectedProvider('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              selectedCategory === cat.id
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                : 'bg-[#161821] border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ARAMA VE RASTGELE OYNA BARı */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161821] border border-gray-800 p-3 rounded-2xl shadow-lg">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Oyun ara (Örn: Sweet Bonanza, EGT...)"
            className="w-full bg-[#0f1015] border border-gray-700/80 rounded-xl px-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 font-mono transition"
          />
          <span className="absolute right-3 top-3 text-gray-500 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleRandomPlay}
            className="bg-[#1f2230] hover:bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            🎲 Rastgele Oyna
          </button>
        </div>
      </div>

      {/* SAĞLAYICILAR (PROVIDERS) YATAY FİLTRE BARı */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sağlayıcılar</div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {providers.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap border ${
                selectedProvider === prov
                  ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-lg'
                  : 'bg-[#161821] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {prov === 'all' ? 'Tüm Sağlayıcılar' : prov}
            </button>
          ))}
        </div>
      </div>

      {/* OYUN KARTLARI LİSTESİ */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-gray-100 flex items-center justify-between">
          <span>Slot Oyunları & Lobiler</span>
          <span className="text-xs text-gray-500 font-mono">{filteredGames.length} Oyun Gösteriliyor</span>
        </h2>

        {loading ? (
          <div className="text-center py-20 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
            Oyunlar yükleniyor...
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl space-y-2">
            <p className="text-sm font-bold text-gray-300">Aradığınız kriterlere uygun oyun bulunamadı.</p>
            <p>Filtreleri sıfırlayarak tekrar deneyebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="bg-gradient-to-b from-[#1c1f2e] to-[#13151c] border border-gray-800 rounded-2xl overflow-hidden group hover:border-amber-500/60 transition duration-300 shadow-xl flex flex-col justify-between relative"
              >
                {/* Oyun Görseli & Sağlayıcı Rozeti */}
                <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  
                  {/* Sol Üst Sağlayıcı Rozeti */}
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-amber-400 font-mono font-black text-[9px] px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest shadow">
                    {game.provider}
                  </span>

                  {game.is_popular && (
                    <span className="absolute top-2 right-2 bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                      🔥
                    </span>
                  )}
                </div>

                {/* Alt Kısım: Oyun Adı ve Oyna Butonu */}
                <div className="p-3.5 space-y-2.5 flex flex-col justify-between">
                  <h3 className="font-bold text-xs text-gray-100 truncate text-center group-hover:text-amber-400 transition">
                    {game.title}
                  </h3>

                  <button className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-xl text-xs transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-1">
                    Oyna ▶
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-500">Yükleniyor...</div>}>
      <GamesContent />
    </Suspense>
  );
}