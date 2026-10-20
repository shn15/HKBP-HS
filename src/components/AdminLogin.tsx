import React, { useState } from 'react';
import { Shield, Key, Mail, User, Eye, EyeOff, Building, Database } from 'lucide-react';
import { AdminCredentials } from '../types';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // First-time special account registration states
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNamaGereja, setRegNamaGereja] = useState('HKBP Hinalang Silalahi');
  const [regStatus, setRegStatus] = useState<'ruas' | 'parhalado'>('parhalado');
  const [showRegPassword, setShowRegPassword] = useState(false);

  React.useEffect(() => {
    fetch('/api/db')
      .then(res => res.json())
      .then(db => {
        if (db && db.hkbp_registered_admins) {
          localStorage.setItem('hkbp_registered_admins', JSON.stringify(db.hkbp_registered_admins));
          setIsDbEmpty(db.hkbp_registered_admins.length === 0);
          if (db.hkbp_registered_admins.length === 0) {
            setIsRegisterMode(true);
          }
        } else {
          setIsDbEmpty(true);
          setIsRegisterMode(true);
        }
      })
      .catch(err => {
        console.error('Failed to load registered admins from server:', err);
        try {
          const localData = localStorage.getItem('hkbp_registered_admins');
          const parsed = localData ? JSON.parse(localData) : [];
          setIsDbEmpty(parsed.length === 0);
          if (parsed.length === 0) {
            setIsRegisterMode(true);
          }
        } catch (e) {
          setIsDbEmpty(true);
          setIsRegisterMode(true);
        }
      });
  }, []);

  const getRegisteredAdmins = (): AdminCredentials[] => {
    try {
      const data = localStorage.getItem('hkbp_registered_admins');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password) {
      setError('Harap isi semua kolom login.');
      setSuccessMsg('');
      return;
    }

    const registeredAdmins = getRegisteredAdmins();

    const matchedAdmin = registeredAdmins.find(
      (admin) =>
        admin.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        admin.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        admin.password === password
    );

    if (matchedAdmin) {
      setError('');
      setSuccessMsg('');
      // Save login state in sessionStorage
      sessionStorage.setItem('hkbp_admin_logged', 'true');

      const loggedUser = {
        username: matchedAdmin.username || username,
        email: matchedAdmin.email || email,
        namaGereja: matchedAdmin.namaGereja || 'HKBP Hinalang Silalahi',
        status: matchedAdmin.status || 'parhalado'
      };
      sessionStorage.setItem('hkbp_admin_user', JSON.stringify(loggedUser));

      onLoginSuccess();
    } else {
      setError('Ooops!!! Ada Yang Salah Silakan periksa kembali.');
      setSuccessMsg('');
    }
  };

  const handleRegisterFirstAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regUsername || !regEmail || !regPassword || !regNamaGereja) {
      setError('Harap isi semua kolom registrasi.');
      setSuccessMsg('');
      return;
    }

    const emailTrimmed = regEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Format email tidak valid! Mohon masukkan email aktif.');
      setSuccessMsg('');
      return;
    }

    const newAccount: AdminCredentials = {
      username: regUsername.trim(),
      email: emailTrimmed,
      password: regPassword,
      namaGereja: regNamaGereja.trim(),
      status: regStatus
    };

    try {
      const accountList = [newAccount];

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hkbp_registered_admins', value: accountList })
      });

      if (res.ok) {
        localStorage.setItem('hkbp_registered_admins', JSON.stringify(accountList));
        setIsDbEmpty(false);
        setIsRegisterMode(false);
        setError('');
        setSuccessMsg('Akun Khusus Pertama Berhasil Dibuat! Silakan masuk dengan akun tersebut.');
        
        // Autofill login form
        setUsername(newAccount.username);
        setEmail(newAccount.email);
        setPassword(newAccount.password || '');
      } else {
        setError('Gagal menyimpan akun ke server. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Failed to register first account:', err);
      setError('Terjadi kesalahan koneksi saat mendaftarkan akun.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Glow decorative bubbles for the glassmorphism effect */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
        <span>Sistem Administrasi Parhalado HKBP</span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 p-1 mb-3 items-center justify-center shadow-sm">
            <img
              src="/hkbp.png"
              alt="HKBP Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          
          {isRegisterMode && isDbEmpty ? (
            <>
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-2">
                <Database className="w-3 h-3" />
                <span>Database Akun Kosong</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Registrasi Akun Utama
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Silakan daftarkan akun khusus pertama (Primary Admin) untuk mulai mengelola database dan sistem gereja.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Login Portal Admin
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Masuk untuk mengubah warta, keuangan, liturgi, dan daftar jemaat.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-bold">
            {successMsg}
          </div>
        )}

        {/* REGISTRATION FORM (FOR EMPTY DATABASE) */}
        {isRegisterMode && isDbEmpty ? (
          <form onSubmit={handleRegisterFirstAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg_username">
                Username Akun Khusus
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="reg_username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Contoh: Pirma Admin"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-slate-50/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg_email">
                E-mail Akun
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="reg_email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@gmail.com atau admin@hkbp.or.id"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-slate-50/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg_password">
                Password Keamanan
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="reg_password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-slate-50/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg_namagereja">
                Nama Instansi / Gereja
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="reg_namagereja"
                  type="text"
                  value={regNamaGereja}
                  onChange={(e) => setRegNamaGereja(e.target.value)}
                  placeholder="HKBP Hinalang Silalahi"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-slate-50/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status / Hak Akses Pengguna
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setRegStatus('parhalado')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    regStatus === 'parhalado'
                      ? 'bg-amber-500 border-transparent text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Pengurus (Parhalado)
                </button>
                <button
                  type="button"
                  onClick={() => setRegStatus('ruas')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    regStatus === 'ruas'
                      ? 'bg-amber-500 border-transparent text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Jemaat (Ruas)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl py-3.5 transition-all shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/40 mt-3 cursor-pointer"
            >
              Buat Akun Utama & Masuk
            </button>
            
            {!isDbEmpty && (
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 block"
              >
                Kembali ke Login Portal
              </button>
            )}
          </form>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (contoh: Pirma)"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-50/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="administrator@hkbp.or.id"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-50/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                Password 
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-50/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white font-bold text-sm rounded-xl py-3 transition-all shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40 mt-2 cursor-pointer"
            >
              Masuk
            </button>

            {isDbEmpty && (
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="w-full text-center text-xs font-bold text-amber-600 hover:text-amber-700 transition py-1 block mt-2"
              >
                Mendeteksi DB Kosong: Daftarkan Akun Pertama
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
