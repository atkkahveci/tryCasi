'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './globals.css';

interface UserProfile {
  full_name: string;
  balance: number;
  kyc_status: string;
  tc_no: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Real Supabase Auth State
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Oturum ve Profil Bilgisi Çekme
  useEffect(() => {
    // 1. Mevcut Session Bilgisini Al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // 2. Auth Durumu Değişikliğini Dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Database'den Profil Bilgisini Getir
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, balance, kyc_status, tc_no')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  // Çıkış İşlemi
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  // Dışarı tıklayınca menüyü kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#0f1015] text-white font-sans selection:bg-amber-500 selection:text-gray-950 flex flex-col justify-between overflow-x-hidden">
        
        {/* --- ORTAK HEADER --- */}
        <header className="bg-[#161821] border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white focus:outline-none"
            >
              ☰
            </button>
            <Link href="/" className="text-xl md:text-2xl font-black tracking-wider text-amber-400">
              by<span className="text-white">LOGAN</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/deposit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition shadow-lg shadow-emerald-900/25">
              Yatırım Yap
            </Link>

            <Link href="/withdraw" className="hidden sm:block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition shadow-lg shadow-blue-900/25">
              Para Çek
            </Link>

            {!session ? (
              /* --- ZİYARETÇİ BUTONLARI --- */
              <>
                <Link href="/login" className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition">
                  Giriş Yap
                </Link>
                <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition shadow-lg shadow-amber-500/20">
                  Kayıt Ol
                </Link>
              </>
            ) : (
              /* --- GERÇEK KULLANICI AÇILIR MENÜSÜ --- */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="bg-[#0f1015] border border-amber-500/40 hover:border-amber-500 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition flex items-center gap-2.5 shadow-lg shadow-amber-500/10"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-bold text-gray-200 truncate max-w-[100px] md:max-w-none">
                    {profile?.full_name || 'Kullanıcı'}
                  </span>
                  <span className="font-mono text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {profile?.balance ? profile.balance.toLocaleString('tr-TR') : '0,00'} ₺
                  </span>
                  <span className="text-xs text-gray-400">▾</span>
                </button>

                {/* Açılır Dropdown Menü */}
                {/* Açılır Dropdown Menü (Sadece Giriş Yapmış Kullanıcı Görür) */}
{userDropdownOpen && (
  <div className="absolute right-0 mt-2 w-56 bg-[#161821] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
    <div className="px-4 py-2 border-b border-gray-800">
      <p className="text-gray-400 text-[11px] truncate">{session.user.email}</p>
      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
        KYC Onaylı ({profile?.kyc_status === 'approved' ? '✓' : 'Beklemede'})
      </p>
    </div>

    {/* KUPONLARIM MENÜSÜ */}
    <Link 
      href="/kuponlarim" 
      onClick={() => setUserDropdownOpen(false)} 
      className="block px-4 py-2.5 text-gray-300 hover:bg-[#1f2230] hover:text-amber-400 transition flex items-center justify-between"
    >
      <span>🎟️ Bahis Kuponlarım</span>
      <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">Aktif</span>
    </Link>

    <Link href="/deposit" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2.5 text-gray-300 hover:bg-[#1f2230] hover:text-amber-400 transition flex items-center justify-between">
      <span>💰 Para Yatır</span>
      <span className="text-emerald-400 font-mono text-[11px]">+</span>
    </Link>

    <Link href="/withdraw" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2.5 text-gray-300 hover:bg-[#1f2230] hover:text-amber-400 transition flex items-center justify-between">
      <span>💸 Para Çek</span>
      <span className="text-blue-400 font-mono text-[11px]">-</span>
    </Link>
    <Link 
  href="/finans-gecmisi" 
  onClick={() => setUserDropdownOpen(false)} 
  className="block px-4 py-2.5 text-gray-300 hover:bg-[#1f2230] hover:text-amber-400 transition flex items-center justify-between"
>
  <span>💳 Finansal Geçmiş</span>
</Link>

    <Link href="/bonuslar" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2.5 text-gray-300 hover:bg-[#1f2230] hover:text-amber-400 transition flex items-center justify-between">
      <span>🎁 Bonus Yönetimi</span>
    </Link>

    <div className="border-t border-gray-800 my-1"></div>

    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition font-semibold"
    >
      🚪 Çıkış Yap
    </button>
  </div>
)}
              </div>
            )}

            <div className="hidden sm:block text-xs md:text-sm text-gray-400 cursor-pointer hover:text-white pl-2 border-l border-gray-700">
              TR ▾
            </div>
          </div>
        </header>

        {/* --- ORTAK KATEGORİ MENÜSÜ --- */}
        <nav className={`bg-[#13151c] border-b border-gray-800 px-4 md:px-6 py-2.5 md:flex items-center gap-8 text-sm font-medium ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
          <Link href="/etkinlikler" className="block py-1.5 md:py-0 text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5">🔥 Canlı Bahis</Link>
          <Link href="/oyunlar" className="block py-1.5 md:py-0 text-gray-300 hover:text-white transition">🎰 Slot & Casino</Link>
          <Link href="/etkinlikler" className="block py-1.5 md:py-0 text-gray-300 hover:text-white transition">⚽ Sanal Sporlar</Link>
          <Link href="/bonuslar" className="block py-1.5 md:py-0 text-amber-400 hover:text-amber-300 transition flex items-center gap-1">🎁 Bonuslar</Link>
        </nav>

        {/* --- DİNAMİK SAYFA İÇERİKLERİ --- */}
        <div className="flex-1">
          {children}
        </div>

        {/* --- ORTAK FOOTER --- */}
        <footer className="border-t border-gray-800/60 py-4 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
         <div>
         © 2026 atkkahveci@gmail.com. Tüm hakları saklıdır.
         </div>
  
        <div>
        <a 
         href="https://wa.me/905411203779" 
         target="_blank" 
         rel="noopener noreferrer"
         className="inline-flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition"
        >
       <span>💬</span> WhatsApp
       </a>
       </div>
      </footer>
        

      </body>
    </html>
  );
}
