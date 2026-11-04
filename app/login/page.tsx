'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // app/login/page.tsx içindeki handleLogin fonksiyonuna küçük ekleme:

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg(null);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setErrorMsg('📧 Lütfen e-posta adresinize gönderilen doğrulama bağlantısını onaylayın.');
      } else if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('❌ E-posta adresi veya şifre hatalı.');
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    if (data?.session) {
      // --- BAN KONTROLÜ ---
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', data.session.user.id)
        .single();

      if (profile?.is_banned) {
        await supabase.auth.signOut(); // Oturumu kapat
        setErrorMsg('🚫 Hesabınız yönetici tarafından engellenmiştir. Lütfen destek ekibi ile iletişime geçin.');
        return;
      }

      router.push('/');
      router.refresh();
    }
  } catch (err: any) {
    setErrorMsg('Giriş yapılırken bir hata oluştu.');
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="flex-1 flex items-center justify-center p-4 my-8">
      <div className="bg-[#161821] border border-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
        
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-100">Hesabınıza Giriş Yapın</h1>
          <p className="text-xs text-gray-400 mt-1">Kazanmaya kaldığınız yerden devam edin.</p>
        </div>

        {/* Hata ve Uyarı Mesajı */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl text-xs mb-4 font-semibold text-center bg-amber-500/10 border border-amber-500/40 text-amber-400 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@email.com"
              className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Şifre
              </label>
              <a href="#" className="text-[11px] text-amber-400 hover:underline">
                Şifremi Unuttum?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-amber-500/20 mt-2"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-400">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-amber-400 hover:underline font-bold">
            Hemen Kayıt Olun
          </Link>
        </div>

      </div>
    </main>
  );
}