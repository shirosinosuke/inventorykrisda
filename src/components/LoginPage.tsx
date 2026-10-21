import React, { useState } from 'react';
import { QrCode, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  onBackToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Check custom users in localStorage
    try {
      const storedUsers = localStorage.getItem('sistem_inventaris_users');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        const matched = usersList.find((u: any) => u.email.toLowerCase() === trimmedEmail);
        if (matched) {
          if (matched.status === 'Nonaktif') {
            setErrorMsg('Akun pengguna ini sedang dinonaktifkan oleh Administrator.');
            return;
          }
          if (matched.password && matched.password !== trimmedPass) {
            setErrorMsg('Kata sandi salah. Silakan coba lagi.');
            return;
          }
          onLoginSuccess({
            name: matched.name,
            email: matched.email,
            role: matched.role || 'Staf Inventaris',
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading stored users:', e);
    }

    // Default built-in credentials
    if (trimmedEmail === 'admin@inventaris.id' && trimmedPass === 'admin123') {
      onLoginSuccess({
        name: 'Administrator Logistik',
        email: 'admin@inventaris.id',
        role: 'Admin Utama',
      });
      return;
    }

    if (trimmedEmail === 'staf@inventaris.id' && trimmedPass === 'staf123') {
      onLoginSuccess({
        name: 'Ahmad Fauzi',
        email: 'staf@inventaris.id',
        role: 'Staf Gudang',
      });
      return;
    }

    if (trimmedEmail === 'operator@inventaris.id' && trimmedPass === 'operator123') {
      onLoginSuccess({
        name: 'Siti Rahma',
        email: 'operator@inventaris.id',
        role: 'Operator Lapangan',
      });
      return;
    }

    // Flexible fallback for other credentials with at least 4 chars
    if (trimmedEmail && trimmedPass.length >= 4) {
      const generatedName = trimmedEmail.split('@')[0];
      const capitalized = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
      onLoginSuccess({
        name: `${capitalized} (Staf Inventaris)`,
        email: trimmedEmail,
        role: 'Staf Administrasi',
      });
      return;
    }

    setErrorMsg('Email atau password tidak sesuai. Anda dapat memilih salah satu Akun Demo di bawah.');
  };

  const handleQuickDemoLogin = (role: 'admin' | 'staf' | 'operator') => {
    if (role === 'admin') {
      setEmail('admin@inventaris.id');
      setPassword('admin123');
      onLoginSuccess({
        name: 'Administrator Logistik',
        email: 'admin@inventaris.id',
        role: 'Admin Utama',
      });
    } else if (role === 'staf') {
      setEmail('staf@inventaris.id');
      setPassword('staf123');
      onLoginSuccess({
        name: 'Ahmad Fauzi',
        email: 'staf@inventaris.id',
        role: 'Staf Gudang',
      });
    } else {
      setEmail('operator@inventaris.id');
      setPassword('operator123');
      onLoginSuccess({
        name: 'Siti Rahma',
        email: 'operator@inventaris.id',
        role: 'Operator Lapangan',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle ambient backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Depan</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Mark */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Masuk ke Sistem Inventaris
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Silakan masukkan kredensial akun administrasi Anda untuk mengakses dashboard manajemen barang.
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-200 mb-1.5">
                Email / ID Staf
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="admin@inventaris.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-200 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ingat sesi saya</span>
              </label>
              <span className="text-slate-400 text-[11px]">Enkripsi TLS Aktif</span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Masuk ke Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-700/80 space-y-3">
            <span className="block text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Akses Cepat Akun Demo (1-Klik)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Admin
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1-Klik</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">admin@inventaris.id</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pass: admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staf')}
                className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Staf
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1-Klik</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">staf@inventaris.id</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pass: staf123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('operator')}
                className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Operator
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1-Klik</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">operator@inventaris.id</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pass: operator123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
