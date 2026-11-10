import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, CheckCircle2, RefreshCw, X, Send, AlertTriangle } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  senderEmail?: string;
  username: string;
  verificationCode: string;
  userTypedCode: string;
  setUserTypedCode: (code: string) => void;
  otpDeliveryStatus: 'idle' | 'sending' | 'success' | 'smtp_not_configured' | 'error';
  otpErrorMessage?: string;
  onConfirm: () => void;
  onResend: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  senderEmail = 'pirmasiahaan1234@gmail.com',
  username,
  verificationCode,
  userTypedCode,
  setUserTypedCode,
  otpDeliveryStatus,
  otpErrorMessage,
  onConfirm,
  onResend
}) => {
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, verificationCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#091731]/65 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative overflow-hidden space-y-5">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F2447]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#0F2447] rounded-lg hover:bg-[#EDF2F9] transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start space-x-3.5 pt-1">
          <div className="p-3 bg-[#EDF2F9] border border-[#CBD7EA] rounded-xl text-[#0F2447]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F2447] tracking-tight">Verifikasi Email Akun</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Konfirmasi alamat email untuk akun <span className="font-bold text-slate-800">{username}</span>
            </p>
          </div>
        </div>

        {/* Recipient and Sender Info Box */}
        <div className="bg-[#F4F6FA] rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-semibold">Tujuan Email:</span>
            <span className="font-bold text-slate-900 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 truncate">
              {email}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-semibold">Pengirim (SMTP):</span>
            <span className="font-bold text-[#0F2447] font-mono bg-white px-2.5 py-0.5 rounded-lg border border-[#CBD7EA] truncate">
              {senderEmail}
            </span>
          </div>
        </div>

        {/* Delivery Status Indicator */}
        {otpDeliveryStatus === 'sending' && (
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F2447] bg-[#EDF2F9] p-3 rounded-xl border border-[#CBD7EA]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F2447]" />
            <span>Sedang memverifikasi email &amp; mengirim kode ke email Anda...</span>
          </div>
        )}

        {/* Error Status (Email tidak aktif / tidak ditemukan / dibatalkan) */}
        {otpDeliveryStatus === 'error' && (
          <div className="flex items-start space-x-3 text-xs font-semibold text-slate-800 bg-[#F4F6FA] p-3.5 rounded-xl border border-slate-300">
            <AlertTriangle className="w-5 h-5 text-[#0F2447] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold text-[#0F2447]">Pengiriman Kode Dibatalkan</p>
              <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                {otpErrorMessage || 'Email tidak aktif atau tidak ditemukan. Pengiriman kode dibatalkan.'}
              </p>
            </div>
          </div>
        )}

        {/* Status Pengiriman: Kode sudah dikirim silahkan cek email anda */}
        {otpDeliveryStatus === 'success' && (
          <div className="flex items-start space-x-3 text-xs font-semibold text-[#0F2447] bg-[#EDF2F9] p-3.5 rounded-xl border border-[#CBD7EA]">
            <CheckCircle2 className="w-5 h-5 text-[#0F2447] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold text-[#0F2447]">Kode sudah di kirim silahkan cek email anda</p>
              <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                Periksa kotak masuk (Inbox) atau folder Spam pada email <span className="font-semibold underline">{email}</span>.
              </p>
            </div>
          </div>
        )}

        {/* 6 Digit Input Field */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700" htmlFor="otp_code_input">
            Masukkan 6-Digit Kode Verifikasi:
          </label>
          <input
            id="otp_code_input"
            type="text"
            maxLength={6}
            value={userTypedCode}
            onChange={(e) => setUserTypedCode(e.target.value.replace(/\D/g, ''))}
            placeholder=""
            className="w-full text-center text-2xl font-mono font-bold tracking-widest py-2.5 px-4 bg-[#F4F6FA] border border-slate-300 focus:border-[#0F2447] focus:bg-white rounded-xl outline-none transition text-[#0F2447]"
            autoFocus
          />
          <p className="text-[11px] text-slate-400 text-center">
            Periksa folder Inbox atau Spam email Anda.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={userTypedCode.trim().length !== 6 || otpDeliveryStatus === 'error' || otpDeliveryStatus === 'sending'}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
              userTypedCode.trim().length === 6 && otpDeliveryStatus !== 'error' && otpDeliveryStatus !== 'sending'
                ? 'bg-[#0F2447] hover:bg-[#173361] text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verifikasi &amp; Simpan Akun</span>
          </button>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onResend}
              disabled={resendCooldown > 0 || otpDeliveryStatus === 'sending'}
              className={`font-semibold transition cursor-pointer flex items-center space-x-1 ${
                resendCooldown > 0 || otpDeliveryStatus === 'sending'
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[#0F2447] hover:underline'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Kirim Ulang Kode {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-[#0F2447] font-semibold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
