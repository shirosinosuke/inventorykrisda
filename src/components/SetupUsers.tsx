import React, { useState } from 'react';
import { UserAccount } from '../types.ts';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Phone,
  X,
  AlertTriangle,
  CheckCircle2,
  Key
} from 'lucide-react';

interface SetupUsersProps {
  users: UserAccount[];
  currentLoggedInEmail?: string;
  onSaveUsers: (updated: UserAccount[]) => void;
  showToast: (msg: string) => void;
}

export const SetupUsers: React.FC<SetupUsersProps> = ({
  users,
  currentLoggedInEmail,
  onSaveUsers,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staf Gudang');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const ROLE_OPTIONS = [
    'Admin Utama',
    'Staf Gudang',
    'Operator Lapangan',
    'Supervisor',
    'Auditor Logistik',
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Staf Gudang');
    setStatus('Aktif');
    setPhone('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || '');
    setRole(u.role);
    setStatus(u.status);
    setPhone(u.phone || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    // Check duplicate email
    const duplicate = users.some(
      u => u.email.toLowerCase() === trimmedEmail && u.id !== editingUser?.id
    );
    if (duplicate) {
      setErrorMsg('Pengguna dengan alamat email ini sudah terdaftar.');
      return;
    }

    if (editingUser) {
      const updatedList = users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              name: trimmedName,
              email: trimmedEmail,
              role,
              status,
              phone: phone.trim(),
              password: password.trim() || u.password,
            }
          : u
      );
      onSaveUsers(updatedList);
      showToast(`Data pengguna "${trimmedName}" berhasil diperbarui.`);
    } else {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password: password.trim() || 'password123',
        role,
        status,
        phone: phone.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveUsers([...users, newUser]);
      showToast(`Pengguna baru "${trimmedName}" berhasil didaftarkan.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (u: UserAccount) => {
    if (currentLoggedInEmail && u.email.toLowerCase() === currentLoggedInEmail.toLowerCase()) {
      alert('Anda tidak dapat menghapus akun yang sedang digunakan untuk login saat ini.');
      return;
    }

    if (window.confirm(`Hapus akun pengguna "${u.name}" (${u.email})?`)) {
      const updated = users.filter(item => item.id !== u.id);
      onSaveUsers(updated);
      showToast(`Akun "${u.name}" berhasil dihapus.`);
    }
  };

  const toggleUserStatus = (u: UserAccount) => {
    if (currentLoggedInEmail && u.email.toLowerCase() === currentLoggedInEmail.toLowerCase()) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan.');
      return;
    }

    const nextStatus: 'Aktif' | 'Nonaktif' = u.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = users.map(item =>
      item.id === u.id ? { ...item, status: nextStatus } : item
    );
    onSaveUsers(updated);
    showToast(`Status pengguna "${u.name}" diubah menjadi ${nextStatus}.`);
  };

  const getRoleBadge = (r: string) => {
    if (r.includes('Admin')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (r.includes('Supervisor') || r.includes('Auditor')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Setup Master Pengguna & Hak Akses</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola staf, operator gudang, dan administrator yang memiliki akses untuk menginput data, mencetak label, dan audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, atau peran staf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="sm:col-span-4 flex items-center justify-start sm:justify-end gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredUsers.length}</span> Pengguna Terdaftar
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const isCurrent = currentLoggedInEmail && u.email.toLowerCase() === currentLoggedInEmail.toLowerCase();
          const initial = u.name.charAt(0).toUpperCase();

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-4.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4 ${
                isCurrent ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{u.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Pengguna"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadge(u.role)}`}>
                    <ShieldCheck className="w-3 h-3" />
                    <span>{u.role}</span>
                  </span>

                  <button
                    onClick={() => toggleUserStatus(u)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                      u.status === 'Aktif'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Klik untuk ubah status aktif/nonaktif"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{u.status}</span>
                  </button>
                </div>

                {u.phone && (
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{u.phone}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Terdaftar: {u.createdAt || '2026-10-01'}</span>
                <span className="font-mono text-slate-400">Password: {u.password ? '••••••' : 'Default'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Ahmad Fauzi, S.Kom"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email (Akun Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="nama@inventaris.id"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hak Akses / Peran
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi (Password)
                </label>
                <input
                  type="text"
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password login'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Pengguna dapat login dengan email dan password ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
