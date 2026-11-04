'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- ADMIN PANELİNDEN YÖNETİLEBİLİR HERO BANNER SLIDER ---
function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Gelecekte Admin Paneli / Database üzerinden çekilecek Banner Listesi
  const banners = [
    {
      id: 1,
      title: '5.000 ₺ HOŞ GELDİN BONUSU',
      subtitle: 'İlk yatırımınıza özel %100 çevrimsiz bonus anında hesabınızda!',
      badge: 'YENİ ÜYELERE ÖZEL',
      buttonText: 'Bonus Al 🎁',
      buttonLink: '/deposit',
      bgColor: 'from-amber-600/30 via-amber-900/20 to-[#161821]',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 2,
      title: '%20 ANLIK CASINO KAYIP İADESİ',
      subtitle: 'Kayıplarınız için üzülmeyin, %20 nakit iade her gece yarısı otomatik tanımlanır.',
      badge: 'KESİNTİSİZ CASİNO',
      buttonText: 'Şimdi Oyna 🎰',
      buttonLink: '/oyunlar',
      bgColor: 'from-emerald-600/30 via-emerald-900/20 to-[#161821]',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 3,
      title: 'ŞAMPİYONLAR LİGİNE ÖZEL 3.00 ORAN',
      subtitle: 'Günün derbi karşılaşmalarına en yüksek oranlar ve kombineler CasinoPro’da!',
      badge: 'FUTBOL ŞÖLENİ',
      buttonText: 'Bahis Yap ⚽',
      buttonLink: '/etkinlikler',
      bgColor: 'from-blue-600/30 via-blue-900/20 to-[#161821]',
      borderColor: 'border-blue-500/30',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 shadow-2xl my-4">
      {/* Slide Kartları */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            className={`w-full shrink-0 bg-gradient-to-r ${b.bgColor} border ${b.borderColor} p-6 md:p-10 flex flex-col justify-center min-h-[200px] md:min-h-[240px] relative`}
          >
            <div className="max-w-xl space-y-3 z-10">
              <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-md border border-amber-500/30 tracking-wider">
                {b.badge}
              </span>
              <h2 className="text-xl md:text-3xl font-black text-white tracking-wide leading-tight">
                {b.title}
              </h2>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                {b.subtitle}
              </p>
              <div className="pt-2">
                <Link
                  href={b.buttonLink}
                  className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition shadow-lg shadow-amber-500/20"
                >
                  {b.buttonText}
                </Link>
              </div>
            </div>

            {/* Arka Plan Dekoratif Efekt */}
            <div className="absolute right-4 bottom-0 opacity-10 text-8xl md:text-9xl select-none pointer-events-none font-black">
              byLOGAN
            </div>
          </div>
        ))}
      </div>

      {/* Gezinme Noktaları (Pagination Dots) */}
      <div className="absolute bottom-3 right-4 flex gap-2 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === idx ? 'w-6 bg-amber-400' : 'w-2 bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Otomatik, Oksuz ve Pürüzsüz Sonsuz Slide Carousel
function AutoInfiniteCarousel<T>({
  items,
  desktop,
  tablet,
  mobile,
  intervalSec,
  renderItem,
  title,
  targetPage,
  titleClass = 'text-base md:text-lg font-bold flex items-center gap-2',
  wrapperClass = '',
}: {
  items: T[];
  desktop: number;
  tablet: number;
  mobile: number;
  intervalSec: number;
  renderItem: (item: T, idx: number) => React.ReactNode;
  title: React.ReactNode;
  targetPage: string;
  titleClass?: string;
  wrapperClass?: string;
}) {
  const [cols, setCols] = useState(desktop);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setCols(w < 640 ? mobile : w < 1024 ? tablet : desktop);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [desktop, tablet, mobile]);

  const [list, setList] = useState<T[]>(items);
  const [isSliding, setIsSliding] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || list.length === 0) return;

    const timer = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setList((prev) => {
          const copy = [...prev];
          const first = copy.shift();
          if (first) copy.push(first);
          return copy;
        });
        setIsSliding(false);
      }, 600);
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [paused, list, intervalSec]);

  return (
    <section className={wrapperClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={titleClass}>{title}</h3>
        <Link href={targetPage} className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">
          Tümü &gt;
        </Link>
      </div>

      <div
        className="overflow-hidden w-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={`flex ${isSliding ? 'transition-transform duration-600 ease-in-out' : ''}`}
          style={{
            transform: isSliding ? `translateX(-${100 / cols}%)` : 'translateX(0%)',
          }}
        >
          {list.map((item, i) => (
            <div key={i} className="shrink-0 px-1.5" style={{ width: `${100 / cols}%` }}>
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Marquee Slider (En Çok Kazananlar)
function MarqueeSlider({ children, speed = 45 }: { children: React.ReactNode; speed?: number }) {
  return (
    <div className="marquee overflow-hidden w-full relative">
      <div className="marquee-track flex gap-4" style={{ animationDuration: `${speed}s` }}>
        {children}
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const matches = [
    { id: 1, league: 'Süper Lig', team1: 'Galatasaray', team2: 'Fenerbahçe', minute: "78'", o1: '1.85', oX: '3.20', o2: '4.10' },
    { id: 2, league: 'Premier League', team1: 'Arsenal', team2: 'Chelsea', minute: "42'", o1: '2.10', oX: '3.40', o2: '2.90' },
    { id: 3, league: 'La Liga', team1: 'Real Madrid', team2: 'Barcelona', minute: "15'", o1: '2.05', oX: '3.30', o2: '3.10' },
    { id: 4, league: 'Serie A', team1: 'Juventus', team2: 'AC Milan', minute: "60'", o1: '2.40', oX: '3.10', o2: '2.80' },
  ];

  const winners = [
    { user: 'Taha***', game: 'Sweet Bonanza', amount: '85.250 ₺' },
    { user: 'Burak**', game: 'Gates of Olympus', amount: '72.100 ₺' },
    { user: 'Mert****', game: 'Aviator', amount: '64.400 ₺' },
    { user: 'Hakan**', game: 'Roulette', amount: '58.850 ₺' },
  ];

  const luckyGames = [
    'Gates of Olympus', 'Sweet Bonanza', 'Aviator', 'Starburst',
    'Book of Dead', 'Crazy Time', 'Plinko', 'Spaceman'
  ];

  const recommended = [
    'Lightning Roulette', 'Mega Wheel', 'Monopoly Live', 'Gonzos Quest',
    'Buffalo King', 'The Dog House', 'Madame Destiny', 'Hand of Midas'
  ];

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">

      {/* --- HERO BANNER SLIDER (GÜNCEL EKLEME) --- */}
      <HeroBannerSlider />

      {/* 1. Öne Çıkan Etkinlikler */}
      <AutoInfiniteCarousel
        items={matches}
        desktop={3}
        tablet={2}
        mobile={1}
        intervalSec={4}
        targetPage="/etkinlikler"
        title={
          <>
            <span className="w-2 h-5 bg-amber-500 rounded-sm"></span>
            Öne Çıkan Etkinlikler
          </>
        }
        titleClass="text-lg md:text-xl font-bold tracking-wide flex items-center gap-2"
        renderItem={(match) => (
          <div className="bg-[#161821] border border-gray-800/80 rounded-xl p-4 hover:border-amber-500/40 transition shadow-md">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{match.league}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Canlı
              </span>
            </div>
            <div className="flex justify-between font-semibold mb-4 text-sm">
              <span>{match.team1} - {match.team2}</span>
              <span className="text-amber-400 font-mono">{match.minute}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <button className="bg-gray-900/85 hover:bg-amber-500/10 py-2 rounded-lg text-xs border border-gray-800 transition">
                <span className="text-gray-500 block text-[10px] font-sans">1</span> {match.o1}
              </button>
              <button className="bg-gray-900/85 hover:bg-amber-500/10 py-2 rounded-lg text-xs border border-gray-800 transition">
                <span className="text-gray-500 block text-[10px] font-sans">X</span> {match.oX}
              </button>
              <button className="bg-gray-900/85 hover:bg-amber-500/10 py-2 rounded-lg text-xs border border-gray-800 transition">
                <span className="text-gray-500 block text-[10px] font-sans">2</span> {match.o2}
              </button>
            </div>
          </div>
        )}
      />

      {/* 2. En Çok Kazananlar */}
      <section className="bg-[#13151c] border border-gray-800 rounded-2xl p-4 md:p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-amber-400">
            🏆 En Çok Kazananlar
          </h3>
          <Link href="/kazananlar" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">
            Tümü &gt;
          </Link>
        </div>

        <MarqueeSlider speed={45}>
          {winners.map((win, idx) => (
            <div key={idx} className="bg-[#161821] border border-gray-800/80 p-3 rounded-xl flex items-center justify-between w-72 shrink-0 shadow">
              <div>
                <p className="text-xs font-semibold text-gray-200">{win.user}</p>
                <p className="text-[11px] text-gray-400">{win.game}</p>
              </div>
              <span className="text-emerald-400 font-bold font-mono text-sm ml-4">{win.amount}</span>
            </div>
          ))}
        </MarqueeSlider>
      </section>

      {/* 3. Şanslı Oyunlar */}
      <AutoInfiniteCarousel
        items={luckyGames}
        desktop={4}
        tablet={3}
        mobile={2}
        intervalSec={3.5}
        targetPage="/oyunlar"
        title="🍀 Şanslı Oyunlar"
        renderItem={(game) => (
          <div className="bg-[#161821] hover:bg-[#1f2230] border border-gray-800 h-24 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition group shadow">
            <span className="text-[11px] text-gray-400 group-hover:text-amber-400 transition">Slot / Casino</span>
            <span className="font-bold text-sm text-gray-200">{game}</span>
          </div>
        )}
      />

      {/* 4. Senin İçin Önerdiklerimiz */}
      <AutoInfiniteCarousel
        items={recommended}
        desktop={4}
        tablet={3}
        mobile={2}
        intervalSec={4}
        targetPage="/oyunlar"
        title="⭐ Senin İçin Önerdiklerimiz"
        renderItem={(rec) => (
          <div className="bg-gradient-to-br from-[#161821] to-[#1e2029] border border-gray-800 h-24 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gray-600 transition shadow">
            <span className="font-semibold text-sm">{rec}</span>
            <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">▶</span>
          </div>
        )}
      />

      {/* 5. Popüler Oyunlar & Bahisler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#13151c] border border-gray-800 rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm text-amber-400">🔥 Popüler Oyunlar</h4>
            <Link href="/oyunlar?filter=popular" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">Tümü &gt;</Link>
          </div>
          <div className="space-y-2">
            {['Plinko', 'Mining Madness', 'Blackjack VIP', 'Baccarat'].map((item, idx) => (
              <div key={idx} className="bg-[#161821] p-2.5 rounded-lg flex justify-between items-center text-xs hover:bg-[#1a1d28] cursor-pointer transition">
                <span className="text-gray-300 font-medium">{item}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">Aktif</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#13151c] border border-gray-800 rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm text-amber-400">⚽ Popüler Bahisler</h4>
            <Link href="/populer-bahisler" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">Tümü &gt;</Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-[#161821] p-3 rounded-lg flex justify-between items-center">
              <span>Şampiyonlar Ligi - Toplam Gol 2.5 Üst</span>
              <span className="font-bold text-amber-400 font-mono">1.75</span>
            </div>
            <div className="bg-[#161821] p-3 rounded-lg flex justify-between items-center">
              <span>Derbi - Karşılıklı Gol Var</span>
              <span className="font-bold text-amber-400 font-mono">1.62</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Günün Kombinesi */}
      <section className="bg-[#13151c] border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base md:text-lg font-bold text-amber-400 flex items-center gap-2">
            ⚡ Günün Kombinesi
          </h3>
          <Link href="/kombineler" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition">Tümü &gt;</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500/10 via-[#161821] to-[#161821] border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">Kombine #1</span>
                <span className="text-[10px] bg-amber-500 text-gray-950 font-extrabold px-2 py-0.5 rounded">Özel Oran</span>
              </div>
              <div className="space-y-2 text-xs mb-4 text-gray-200">
                <div className="flex justify-between"><span>Real Madrid Kazanır</span> <span className="font-mono text-amber-400">1.70</span></div>
                <div className="flex justify-between"><span>Arsenal - Chelsea 2.5 Üst</span> <span className="font-mono text-amber-400">1.80</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-xs">Toplam: <strong className="text-amber-400 font-mono text-sm">3.06</strong></span>
              <button className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow">Kombineyi Yatır</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-[#161821] to-[#161821] border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">Kombine #2</span>
                <span className="text-[10px] bg-amber-500 text-gray-950 font-extrabold px-2 py-0.5 rounded">Günün Bankosu</span>
              </div>
              <div className="space-y-2 text-xs mb-4 text-gray-200">
                <div className="flex justify-between"><span>Bayern Munich ve Var</span> <span className="font-mono text-amber-400">2.10</span></div>
                <div className="flex justify-between"><span>Juventus Kazanır</span> <span className="font-mono text-amber-400">1.65</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-xs">Toplam: <strong className="text-amber-400 font-mono text-sm">3.46</strong></span>
              <button className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow">Kombineyi Yatır</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-[#161821] to-[#161821] border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">Kombine #3</span>
                <span className="text-[10px] bg-amber-500 text-gray-950 font-extrabold px-2 py-0.5 rounded">Yüksek Oran</span>
              </div>
              <div className="space-y-2 text-xs mb-4 text-gray-200">
                <div className="flex justify-between"><span>PSG - Marsilya İY 1.5 Üst</span> <span className="font-mono text-amber-400">2.40</span></div>
                <div className="flex justify-between"><span>Ajax Kazanır</span> <span className="font-mono text-amber-400">1.75</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-xs">Toplam: <strong className="text-amber-400 font-mono text-sm">4.20</strong></span>
              <button className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow">Kombineyi Yatır</button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}