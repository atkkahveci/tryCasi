'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Kullanıcının profiles tablosundaki rolünü kontrol ediyoruz
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || (profile?.role !== 'admin' && session.user.email !== 'atkkahveci@gmail.com')) {
        alert('Bu alana erişim yetkiniz yok!');
        router.push('/');
        return;
      }

      setAuthorized(true);
    } catch (err) {
      console.error('Yetki kontrolü hatası:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { href: '/admin', label: '📊 Genel Bakış', exact: true },
    { href: '/admin/deposit', label: '💰 Yatırım Talepleri' },
    { href: '/admin/withdraw', label: '💸 Çekim Talepleri' },
    { href: '/admin/payment-methods', label: '💳 Ödeme Yöntemleri' },
    { href: '/admin/bets', label: '🎟️ Kupon Yönetimi' },
    { href: '/admin/users', label: '👥 Kullanıcılar & KYC' },
    { href: '/admin/games', label: '🎰 Oyun Yönetimi' },
    { href: '/admin/bonuses', label: '🎁 Bonus Yönetimi' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-amber-400 font-mono text-sm">
        🔒 Güvenlik doğrulanıyor...
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-200 flex flex-col md:flex-row">
      {/* ADMİN SOL MENÜ (SIDEBAR) */}
      <aside className="w-full md:w-64 bg-[#12141d] border-r border-gray-800/80 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <Link href="/admin" className="text-lg font-black text-amber-400 tracking-wider">
              CASINO<span className="text-white">ADMIN</span>
            </Link>
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
              SECURE
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                      : 'text-gray-400 hover:bg-[#1a1d2b] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <Link
            href="/"
            className="block text-center bg-[#1a1d2b] hover:bg-gray-800 text-gray-300 py-2 rounded-xl text-xs font-semibold transition"
          >
            🌐 Ana Siteye Dön
          </Link>
        </div>
      </aside>

      {/* İÇERİK ALANI */}
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </section>
    </div>
  );
}