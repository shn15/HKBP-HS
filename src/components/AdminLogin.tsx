import React, { useState } from 'react';
import { Key, Mail, User, Eye, EyeOff, Building, Database } from 'lucide-react';
import { AdminCredentials } from '../types';
import { fetchDbFromServer, saveDbKey } from '../services/dbClient';
import { OtpVerificationModal } from './OtpVerificationModal';

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

  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [userTypedCode, setUserTypedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAccountToSave, setPendingAccountToSave] = useState<AdminCredentials | null>(null);
  const [otpDeliveryStatus, setOtpDeliveryStatus] = useState<'idle' | 'sending' | 'success' | 'smtp_not_configured' | 'error'>('idle');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  React.useEffect(() => {
    fetchDbFromServer()
      .then(db => {
        let admins: AdminCredentials[] = [];
        if (db && Array.isArray(db.hkbp_registered_admins) && db.hkbp_registered_admins.length > 0) {
          admins = db.hkbp_registered_admins;
        } else {
          const localData = localStorage.getItem('hkbp_registered_admins');
          if (localData) {
            try {
              admins = JSON.parse(localData);
            } catch {}
          }
        }

        if (!admins || admins.length === 0) {
          admins = [
            {
              username: 'Pirma 15',
              email: 'pirmasiahaan12342@gmail.com',
              password: 'Pirma 08',
              namaGereja: 'HKBP Hinalang Silalahi',
              status: 'ruas',
              isActive: true
            },
            {
              username: 'admin',
              email: 'admin@hkbp.or.id',
              password: 'adminpassword123',
              namaGereja: 'HKBP Hinalang Silalahi',
              status: 'parhalado',
              isActive: true
            }
          ];
          saveDbKey('hkbp_registered_admins', admins).catch(() => {});
        }

        localStorage.setItem('hkbp_registered_admins', JSON.stringify(admins));
        setIsDbEmpty(admins.length === 0);
      })
      .catch(err => {
        console.error('Failed to load registered admins:', err);
        const parsed = getRegisteredAdmins();
        setIsDbEmpty(parsed.length === 0);
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
      if (matchedAdmin.isActive === false) {
        setError('Akun ini telah dinonaktifkan. Silakan hubungi Parhalado / Administrator gereja untuk mengaktifkan kembali.');
        setSuccessMsg('');
        return;
      }

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

    // Generate 6-digit OTP code & request OTP email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setUserTypedCode('');
    setPendingAccountToSave(newAccount);
    setIsVerifying(true);
    setOtpDeliveryStatus('sending');
    setOtpErrorMessage('');

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAccount.email,
          code: code,
          username: newAccount.username
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpDeliveryStatus('success');
      } else {
        if (data.reason === 'SMTP_NOT_CONFIGURED') {
          setOtpDeliveryStatus('smtp_not_configured');
        } else {
          setOtpDeliveryStatus('error');
          setOtpErrorMessage(data.message || 'Email tidak aktif atau tidak ditemukan. Pengiriman kode dibatalkan.');
        }
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setOtpDeliveryStatus('error');
      setOtpErrorMessage('Koneksi ke server gagal.');
    }
  };

  const handleConfirmVerificationCode = async () => {
    if (!userTypedCode.trim()) {
      alert('Mohon masukkan kode verifikasi 6 digit!');
      return;
    }
    const isValid = userTypedCode.trim() === verificationCode.trim();

    if (!isValid) {
      alert('Kode verifikasi yang Anda masukkan tidak cocok!');
      return;
    }
    if (!pendingAccountToSave) return;

    try {
      const existing = getRegisteredAdmins();
      const accountList = existing.length > 0 ? [...existing, pendingAccountToSave] : [pendingAccountToSave];
      await saveDbKey('hkbp_registered_admins', accountList);
      localStorage.setItem('hkbp_registered_admins', JSON.stringify(accountList));
      setIsDbEmpty(false);
      setIsRegisterMode(false);
      setIsVerifying(false);
      setError('');
      setSuccessMsg('Akun Berhasil Diverifikasi & Dibuat! Silakan masuk dengan akun tersebut.');
      setUsername(pendingAccountToSave.username);
      setEmail(pendingAccountToSave.email);
      setPassword(pendingAccountToSave.password || '');
    } catch (err) {
      console.error('Failed to register first account:', err);
      const existing = getRegisteredAdmins();
      const accountList = existing.length > 0 ? [...existing, pendingAccountToSave] : [pendingAccountToSave];
      localStorage.setItem('hkbp_registered_admins', JSON.stringify(accountList));
      setIsDbEmpty(false);
      setIsRegisterMode(false);
      setIsVerifying(false);
      setError('');
      setSuccessMsg('Akun Berhasil Diverifikasi & Dibuat! Silakan masuk dengan akun tersebut.');
      setUsername(pendingAccountToSave.username);
      setEmail(pendingAccountToSave.email);
      setPassword(pendingAccountToSave.password || '');
    }
  };

  const handleResendOtp = async () => {
    if (!pendingAccountToSave) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(newCode);
    setUserTypedCode('');
    setOtpDeliveryStatus('sending');
    setOtpErrorMessage('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingAccountToSave.email,
          code: newCode,
          username: pendingAccountToSave.username
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpDeliveryStatus('success');
      } else {
        if (data.reason === 'SMTP_NOT_CONFIGURED') {
          setOtpDeliveryStatus('smtp_not_configured');
        } else {
          setOtpDeliveryStatus('error');
          setOtpErrorMessage(data.message || 'Email tidak aktif atau tidak ditemukan. Pengiriman kode dibatalkan.');
        }
      }
    } catch (err: any) {
      setOtpDeliveryStatus('error');
      setOtpErrorMessage('Koneksi ke server gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs text-[#0F2447]/70 font-semibold">
        <span>Sistem Administrasi Parhalado HKBP</span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 shadow-sm relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex w-20 h-20 bg-white rounded-2xl border border-slate-200 p-2 mb-3.5 items-center justify-center shadow-xs">
            <img
              src="/hkbp.png"
              alt="HKBP Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          
          {isRegisterMode && isDbEmpty ? (
            <>
              <div className="text-[11px] text-[#0F2447] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-center space-x-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Registrasi Akun Utama</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#0F2447]">
                Registrasi Akun
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Silakan daftarkan akun (Primary Admin) untuk mulai mengelola database dan sistem gereja.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2447]">
                Login Portal Admin
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Masuk untuk mengubah warta, keuangan, liturgi, dan daftar jemaat.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#EDF2F9] border border-[#B8C7DF] text-[#0F2447] text-xs rounded-xl text-center font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#EDF2F9] border border-[#0F2447]/30 text-[#0F2447] text-xs rounded-xl text-center font-bold">
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
                  placeholder="User Admin"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#0F2447] transition-colors cursor-pointer"
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
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
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    regStatus === 'parhalado'
                      ? 'bg-[#0F2447] border-[#0F2447] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-[#EDF2F9] hover:text-[#0F2447]'
                  }`}
                >
                  Pengurus (Parhalado)
                </button>
                <button
                  type="button"
                  onClick={() => setRegStatus('ruas')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    regStatus === 'ruas'
                      ? 'bg-[#0F2447] border-[#0F2447] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-[#EDF2F9] hover:text-[#0F2447]'
                  }`}
                >
                  Jemaat (Ruas)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F2447] hover:bg-[#173361] active:bg-[#091731] text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0F2447]/30 mt-3 cursor-pointer"
            >
              Buat Akun Utama & Masuk
            </button>
            
            {!isDbEmpty && (
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#0F2447] transition py-1 block cursor-pointer"
              >
                Kembali ke login
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2447] focus:ring-1 focus:ring-[#0F2447]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#0F2447] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F2447] hover:bg-[#173361] active:bg-[#091731] text-white font-bold text-sm rounded-xl py-3 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0F2447]/30 mt-2 cursor-pointer"
            >
              Masuk
            </button>

            {isDbEmpty && (
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="w-full text-center text-xs font-bold text-[#0F2447] hover:underline transition py-1 block mt-2 cursor-pointer"
              >
                Mendeteksi DB Kosong: Daftarkan Akun Pertama
              </button>
            )}
          </form>
        )}
      </div>

      {/* OTP EMAIL VERIFICATION MODAL */}
      <OtpVerificationModal
        isOpen={isVerifying}
        onClose={() => {
          setIsVerifying(false);
          setPendingAccountToSave(null);
          setUserTypedCode('');
        }}
        email={pendingAccountToSave?.email || regEmail}
        senderEmail="pirmasiahaan1234@gmail.com"
        username={pendingAccountToSave?.username || regUsername}
        verificationCode={verificationCode}
        userTypedCode={userTypedCode}
        setUserTypedCode={setUserTypedCode}
        otpDeliveryStatus={otpDeliveryStatus}
        otpErrorMessage={otpErrorMessage}
        onConfirm={handleConfirmVerificationCode}
        onResend={handleResendOtp}
      />
    </div>
  );
}
