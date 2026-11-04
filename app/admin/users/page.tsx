'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  tc_no: string;
  birth_date: string;
  balance: number;
  kyc_status: 'pending' | 'approved' | 'rejected';
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bakiye Düzenleme Modal State
  const [balanceModalUser, setBalanceModalUser] = useState<UserProfile | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [actionType, setActionType] = useState<'add' | 'subtract'>('add');

  // Kullanıcı Bilgisi Düzenleme Modal State
  const [editModalUser, setEditModalUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({ full_name: '', tc_no: '' });

  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
      }
    } catch (err) {
      console.error('Kullanıcılar çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Kullanıcıyı Engelle / Engeli Kaldır (Ban / Unban)
  const handleToggleBan = async (user: UserProfile) => {
    const actionText = user.is_banned ? 'engelini kaldırmak' : 'ENGELLEMEK (BANLAMA)';
    if (!confirm(`${user.full_name || 'Kullanıcı'} kullanıcısını ${actionText} istediğinize emin misiniz?`)) return;

    try {
      await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', user.id);

      fetchUsers();
    } catch (err) {
      alert('Engelleme durumu güncellenirken hata oluştu.');
    }
  };

  // 2. Kullanıcıyı Sil
  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`⚠️ UYARI: ${user.full_name || 'Bu kullanıcıyı'} veritabanından tamamen silmek üzeresiniz. Bu işlem geri alınamaz!`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      fetchUsers();
    } catch (err) {
      alert('Kullanıcı silinirken hata oluştu.');
    }
  };

  // 3. KYC Durumunu Güncelle
  const handleKycStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      await supabase
        .from('profiles')
        .update({ kyc_status: status })
        .eq('id', userId);

      fetchUsers();
    } catch (err) {
      alert('KYC güncellenirken hata oluştu.');
    }
  };

  // 4. Bakiye Güncelleme Submit
  const handleBalanceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;

    setUpdating(true);
    try {
      const changeAmount = parseFloat(amountInput);
      if (isNaN(changeAmount) || changeAmount <= 0) {
        alert('Geçerli bir tutar giriniz.');
        return;
      }

      let newBalance = balanceModalUser.balance || 0;
      if (actionType === 'add') {
        newBalance += changeAmount;
      } else {
        newBalance = Math.max(0, newBalance - changeAmount);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', balanceModalUser.id);

      if (error) throw error;

      setBalanceModalUser(null);
      setAmountInput('');
      fetchUsers();
    } catch (err) {
      alert('Bakiye güncellenirken hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  // 5. Kullanıcı Profil Bilgisi Güncelleme Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          tc_no: editFormData.tc_no,
        })
        .eq('id', editModalUser.id);

      if (error) throw error;

      setEditModalUser(null);
      fetchUsers();
    } catch (err) {
      alert('Kullanıcı bilgileri güncellenirken hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
            👥 Kullanıcı, Ban & KYC Yönetimi
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Kayıtlı tüm kullanıcıları görün, profilleri düzenleyin, engelleyin veya silin.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="bg-[#161821] hover:bg-gray-800 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          🔄 Yenile
        </button>
      </div>

      {/* KULLANICI TABLOSU */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Kullanıcılar yükleniyor...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xs bg-[#161821] border border-gray-800 rounded-2xl">
          Sistemde henüz kullanıcı bulunmuyor.
        </div>
      ) : (
        <div className="bg-[#161821] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f1015] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="p-4">Ad Soyad</th>
                  <th className="p-4">T.C. Kimlik No</th>
                  <th className="p-4">Bakiye</th>
                  <th className="p-4">Durum / Ban</th>
                  <th className="p-4">KYC</th>
                  <th className="p-4 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-[#1a1d2b] transition ${u.is_banned ? 'bg-rose-950/20' : ''}`}>
                    <td className="p-4 font-bold text-gray-100 flex items-center gap-2">
                      {u.full_name || 'İsimsiz'}
                      {u.is_banned && (
                        <span className="bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded">
                          BANLI 🚫
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-gray-300">{u.tc_no || '-'}</td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {(u.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                          u.is_banned
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30'
                        }`}
                      >
                        {u.is_banned ? 'Engeli Kaldır (Unban)' : 'Engelle (Ban)'}
                      </button>
                    </td>
                    <td className="p-4">
                      {u.kyc_status === 'approved' ? (
                        <span className="text-emerald-400 font-bold">✓ Onaylı</span>
                      ) : (
                        <button
                          onClick={() => handleKycStatus(u.id, 'approved')}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Onayla
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Bakiye Düzenle */}
                      <button
                        onClick={() => setBalanceModalUser(u)}
                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition"
                        title="Bakiye Ekle/Düş"
                      >
                        💵 Bakiye
                      </button>

                      {/* Bilgileri Düzenle */}
                      <button
                        onClick={() => {
                          setEditModalUser(u);
                          setEditFormData({ full_name: u.full_name || '', tc_no: u.tc_no || '' });
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition"
                        title="Profil Bilgilerini Düzenle"
                      >
                        ✏️ Düzenle
                      </button>

                      {/* Sil */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition"
                        title="Kullanıcıyı Sil"
                      >
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BAKİYE DÜZENLEME MODALI */}
      {balanceModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161821] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-sm text-amber-400">
                💵 Bakiye Müdahalesi: {balanceModalUser.full_name}
              </h3>
              <button onClick={() => setBalanceModalUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-gray-400 bg-[#0f1015] p-3 rounded-xl border border-gray-800">
              Mevcut Bakiye: <strong className="font-mono text-amber-400 text-sm">{(balanceModalUser.balance || 0).toLocaleString('tr-TR')} ₺</strong>
            </div>

            <form onSubmit={handleBalanceUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">İşlem Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('add')}
                    className={`py-2 rounded-xl font-bold transition ${
                      actionType === 'add' ? 'bg-emerald-600 text-white' : 'bg-[#0f1015] text-gray-400'
                    }`}
                  >
                    + Bakiye Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('subtract')}
                    className={`py-2 rounded-xl font-bold transition ${
                      actionType === 'subtract' ? 'bg-rose-600 text-white' : 'bg-[#0f1015] text-gray-400'
                    }`}
                  >
                    - Bakiye Düş
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Miktar (₺)</label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Örn: 500"
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-bold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 py-2.5 rounded-xl font-bold transition shadow-lg shadow-amber-500/20"
                >
                  {updating ? 'İşleniyor...' : 'Bakiyeyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KULLANICI BİLGİSİ DÜZENLEME MODALI */}
      {editModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161821] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-sm text-blue-400">
                ✏️ Kullanıcı Profili Düzenle
              </h3>
              <button onClick={() => setEditModalUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Ad Soyad</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">T.C. Kimlik No</label>
                <input
                  type="text"
                  maxLength={11}
                  value={editFormData.tc_no}
                  onChange={(e) => setEditFormData({ ...editFormData, tc_no: e.target.value })}
                  className="w-full bg-[#0f1015] border border-gray-800 rounded-xl px-3 py-2 font-mono text-gray-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-bold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-900/30"
                >
                  {updating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}