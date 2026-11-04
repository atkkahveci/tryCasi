'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    tcNo: '',
    birthDate: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Supabase Auth ile Kullanıcı Oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Profiles Tablosuna KYC ve Profil Bilgilerini Kaydet
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: formData.fullName,
            tc_no: formData.tcNo,
            birth_date: formData.birthDate,
            username: formData.username,
            phone: formData.phone,
            balance: 0.00,
            kyc_status: 'approved',
          },
        ]);

        if (profileError) throw profileError;

        setMessage({
          type: 'success',
          text: '🎉 Kayıt ve KYC doğrulaması başarılı! Giriş yapabilirsiniz.',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Kayıt sırasında bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 my-8">
      <div className="bg-[#161821] border border-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
        
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-100">Yeni Üyelik Formu</h1>
          <p className="text-xs text-gray-400 mt-1">Bilgilerinizi kimlikte yazıldığı gibi giriniz.</p>
        </div>

        {/* Geribildirim Mesajı */}
        {message && (
          <div className={`p-3.5 rounded-xl text-xs mb-4 font-semibold text-center border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Kimlik Doğrulama Grubu */}
          <div className="bg-[#0f1015] border border-gray-800/80 p-4 rounded-xl space-y-3">
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
              🆔 Kimlik Bilgileri (KYC Zorunlu)
            </span>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ad Soyad (Kimlikteki Gibi)
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ahmet Yılmaz"
                className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  T.C. Kimlik Numarası
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={formData.tcNo}
                  onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                  placeholder="12345678901"
                  className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-200 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hesap Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="kullaniciadi"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XX XXX XX XX"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">E-posta</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@email.com"
              className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition pr-10"
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

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
              className="accent-amber-500 rounded cursor-pointer mt-0.5"
              required
            />
            <label htmlFor="terms" className="text-[11px] text-gray-400 leading-tight cursor-pointer">
              18 yaşından büyük olduğumu ve şartları kabul ettiğimi onaylıyorum.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-emerald-900/30 mt-2"
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Hesap Oluştur ve Katıl'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-800 text-center text-xs text-gray-400">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-amber-400 hover:underline font-bold">
            Giriş Yapın
          </Link>
        </div>

      </div>
    </main>
  );
}