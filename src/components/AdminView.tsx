import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { fetchDbFromServer, saveDbKey } from '../services/dbClient';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  FileText,
  User,
  DollarSign,
  TrendingUp,
  Mail,
  LogOut,
  Calendar,
  AlertCircle,
  Check,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Upload,
  Download,
  ExternalLink,
  FolderOpen,
  Archive,
  Search,
  Users,
  Coins,
  Heart,
  Building,
  Activity,
  Clock,
  Database,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Music
} from 'lucide-react';
import { Liturgi, Warta, Transaksi, Jemaat, WartaKategori, TransaksiTipe, LiturgiSection, PetugasMingguRow, PartangianganAttendanceRow, PetugasPartangianganRow, JadwalIbadah, ParhaladoMember, AdminCredentials, TentangGerejaItem, WeeklyAttendanceTrend, PartangianganMode } from '../types';
import { INITIAL_ATTENDANCE_TRENDS } from '../data/mockData';
import { BukuSong, INITIAL_BUKU_NYANYIAN_DB, parseSongFromLabel, findSongAndFormatLyrics, parseVerseRange, normalizeSongImport, fetchOfficialSongFromHkbp, BUKU_ENDE_CATALOG, BUKU_NYANYIAN_CATALOG } from '../data/bukuNyanyianData';
import { fetchSongFromApi, fetchBatchFromApi } from '../services/bukuEndeService';
import { fetchAndFormatScriptureFromLabel, parseAlkitabReference, ALKITAB_BOOKS_CATALOG, fetchDualAlkitabChapter } from '../services/alkitabService';

interface AdminViewProps {
  liturgiMinggu: Liturgi[];
  liturgiPartangiangan: Liturgi[];
  petugasMinggu: PetugasMingguRow[];
  partangianganAttendance: PartangianganAttendanceRow[];
  petugasPartangiangan: PetugasPartangianganRow[];
  partangianganAttendanceDate: string;
  petugasPartangianganDate: string;
  petugasMingguDate: string;
  wartaList: Warta[];
  transaksiList: Transaksi[];
  jemaatList: Jemaat[];
  attendanceTrends?: WeeklyAttendanceTrend[];
  
  onUpdateLiturgiMinggu: (data: Liturgi[]) => void;
  onUpdateLiturgiPartangiangan: (data: Liturgi[]) => void;
  onUpdatePetugasMinggu: (data: PetugasMingguRow[]) => void;
  onUpdatePartangianganAttendance: (data: PartangianganAttendanceRow[]) => void;
  onUpdatePetugasPartangiangan: (data: PetugasPartangianganRow[]) => void;
  onUpdatePartangianganAttendanceDate: (date: string) => void;
  onUpdatePetugasPartangianganDate: (date: string) => void;
  onUpdatePetugasMingguDate: (date: string) => void;
  onUpdateWarta: (data: Warta[]) => void;
  onUpdateTransaksi: (data: Transaksi[]) => void;
  onUpdateJemaat: (data: Jemaat[]) => void;
  onLogout: () => void;
  customBalanceTitle: string;
  customBalanceValue: number;
  onUpdateCustomBalanceTitle: (title: string) => void;
  onUpdateCustomBalanceValue: (value: number) => void;

  jadwalIbadah: JadwalIbadah;
  tentangGerejaList: TentangGerejaItem[];
  parhaladoList: ParhaladoMember[];
  partangianganMode?: PartangianganMode;
  onUpdateJadwalIbadah: (data: JadwalIbadah) => void;
  onUpdateTentangGerejaList: (data: TentangGerejaItem[]) => void;
  onUpdateParhaladoList: (data: ParhaladoMember[]) => void;
  onUpdatePartangianganMode?: (mode: PartangianganMode) => void;
  onUpdateAttendanceTrends?: (data: WeeklyAttendanceTrend[]) => void;
}

export default function AdminView({
  liturgiMinggu,
  liturgiPartangiangan,
  petugasMinggu,
  partangianganAttendance,
  petugasPartangiangan,
  partangianganAttendanceDate,
  petugasPartangianganDate,
  petugasMingguDate,
  wartaList,
  transaksiList,
  jemaatList,
  customBalanceTitle,
  customBalanceValue,
  attendanceTrends = [],
  onUpdateLiturgiMinggu,
  onUpdateLiturgiPartangiangan,
  onUpdatePetugasMinggu,
  onUpdatePartangianganAttendance,
  onUpdatePetugasPartangiangan,
  onUpdatePartangianganAttendanceDate,
  onUpdatePetugasPartangianganDate,
  onUpdatePetugasMingguDate,
  onUpdateWarta,
  onUpdateTransaksi,
  onUpdateJemaat,
  onUpdateCustomBalanceTitle,
  onUpdateCustomBalanceValue,
  onLogout,
  jadwalIbadah,
  tentangGerejaList,
  parhaladoList,
  partangianganMode = 'normal',
  onUpdateJadwalIbadah,
  onUpdateTentangGerejaList,
  onUpdateParhaladoList,
  onUpdatePartangianganMode,
  onUpdateAttendanceTrends
}: AdminViewProps) {
  // Sidebar Sub-navigation for Desktop Admin Panels with refresh persistence
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'liturgi' | 'petugas' | 'warta' | 'keuangan' | 'jemaat' | 'arsip_pdf' | 'jadwal' | 'sejarah' | 'parhalado' | 'database_akun' | 'buku_nyanyian'>(() => {
    const urlTab = new URLSearchParams(window.location.search).get('admin_tab');
    const valid = ['dashboard', 'liturgi', 'petugas', 'warta', 'keuangan', 'jemaat', 'arsip_pdf', 'jadwal', 'sejarah', 'parhalado', 'database_akun', 'buku_nyanyian'];
    if (urlTab && valid.includes(urlTab)) return urlTab as any;
    const local = localStorage.getItem('hkbp_admin_subtab');
    if (local && valid.includes(local)) return local as any;
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('hkbp_admin_subtab', activeSubTab);
    const url = new URL(window.location.href);
    url.searchParams.set('admin_tab', activeSubTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeSubTab]);

  // Get logged admin info
  const [loggedAdmin, setLoggedAdmin] = useState<{ username: string; email: string; namaGereja?: string; status?: string } | null>(null);

  // Database Akun (Excel/CSV) states
  const [accountsList, setAccountsList] = useState<AdminCredentials[]>([]);
  const [showPasswordMap, setShowPasswordMap] = useState<{[key: string]: boolean}>({});
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountIdx, setEditingAccountIdx] = useState<number | null>(null);
  
  const [accountFormUsername, setAccountFormUsername] = useState('');
  const [accountFormEmail, setAccountFormEmail] = useState('');
  const [accountFormPassword, setAccountFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [accountFormNamaGereja, setAccountFormNamaGereja] = useState('');
  const [accountFormStatus, setAccountFormStatus] = useState<'ruas' | 'parhalado'>('ruas');

  // Email verification states for admin database
  const [verificationCode, setVerificationCode] = useState('');
  const [userTypedCode, setUserTypedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAccountToSave, setPendingAccountToSave] = useState<AdminCredentials | null>(null);
  const [otpDeliveryStatus, setOtpDeliveryStatus] = useState<'idle' | 'sending' | 'success' | 'smtp_not_configured' | 'error'>('idle');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  const saveRegisteredAdminsToServer = (data: AdminCredentials[]) => {
    saveDbKey('hkbp_registered_admins', data).catch(err => console.error('Failed to sync registered admins to server:', err));
  };

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hkbp_admin_user');
      if (stored) {
        setLoggedAdmin(JSON.parse(stored));
      }
      const rawAccounts = localStorage.getItem('hkbp_registered_admins');
      if (rawAccounts) {
        setAccountsList(JSON.parse(rawAccounts));
      } else {
        const defaultAdmins: AdminCredentials[] = [
          {
            username: 'Pirma 15',
            email: 'pirmasiahaan12342@gmail.com',
            password: 'Pirma 08',
            namaGereja: 'HKBP Hinalang Silalahi',
            status: 'ruas'
          }
        ];
        localStorage.setItem('hkbp_registered_admins', JSON.stringify(defaultAdmins));
        setAccountsList(defaultAdmins);
      }

      // Sync with server/Firestore DB on mount
      fetchDbFromServer()
        .then(db => {
          if (db) {
            if (db.hkbp_registered_admins) {
              setAccountsList(db.hkbp_registered_admins);
              localStorage.setItem('hkbp_registered_admins', JSON.stringify(db.hkbp_registered_admins));
            } else {
              // Seed server
              const currentAdmins = rawAccounts ? JSON.parse(rawAccounts) : [
                {
                  username: 'Pirma 15',
                  email: 'pirmasiahaan12342@gmail.com',
                  password: 'Pirma 08',
                  namaGereja: 'HKBP Hinalang Silalahi',
                  status: 'ruas'
                }
              ];
              saveRegisteredAdminsToServer(currentAdmins);
            }

            if (db.hkbp_arsip_pdf) {
              setArsipPdfs(db.hkbp_arsip_pdf);
              localStorage.setItem('hkbp_arsip_pdf', JSON.stringify(db.hkbp_arsip_pdf));
            } else {
              // Seed server
              const defaultArsip = [
                {
                  id: 'arsip-1',
                  judul: 'Tata Gereja HKBP (Amanat & Peraturan)',
                  keterangan: 'Aturan, Peraturan, dan Konfesi resmi HKBP sebagai landasan pelayanan gerejawi.',
                  tanggalUpload: '2026-06-15',
                  fileName: 'tata_gereja_hkbp_2026.pdf',
                  fileSize: '1.24 MB',
                  pdfUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
                },
                {
                  id: 'arsip-2',
                  judul: 'Kumpulan Lagu Koor Huria Batak',
                  keterangan: 'Daftar lagu koor koor Batak populer untuk latihan Koor Ama, Ina, dan Remaja.',
                  tanggalUpload: '2026-06-20',
                  fileName: 'kumpulan_koor_batak.pdf',
                  fileSize: '3.12 MB',
                  pdfUrl: ''
                }
              ];
              saveDbKey('hkbp_arsip_pdf', defaultArsip).catch(e => console.error(e));
            }

            const songMap = new Map<string, BukuSong>();
            if (db.hkbp_buku_nyanyian_db && Array.isArray(db.hkbp_buku_nyanyian_db)) {
              db.hkbp_buku_nyanyian_db.forEach((s: any) => {
                if (s && s.id) songMap.set(s.id, s);
              });
            }
            // Official songs from https://hkbp.or.id/buku-ende take precedence
            INITIAL_BUKU_NYANYIAN_DB.forEach(s => songMap.set(s.id, s));
            const mergedDb = Array.from(songMap.values()).sort((a, b) => {
              if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
              return a.nomor - b.nomor;
            });
            setBukuNyanyianDb(mergedDb);
            localStorage.setItem('hkbp_buku_nyanyian_db', JSON.stringify(mergedDb));
            saveDbKey('hkbp_buku_nyanyian_db', mergedDb).catch(e => console.error(e));
          }
        })
        .catch(err => console.error('Failed to load registered admins/PDFs:', err));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Custom Balance Editing States
  const [isEditingCustomBalance, setIsEditingCustomBalance] = useState(false);
  const [tempCustomTitle, setTempCustomTitle] = useState(customBalanceTitle);
  const [tempCustomValue, setTempCustomValue] = useState(customBalanceValue);

  // Sync temp states if prop changes
  useEffect(() => {
    setTempCustomTitle(customBalanceTitle);
    setTempCustomValue(customBalanceValue);
  }, [customBalanceTitle, customBalanceValue]);

  // Jadwal state variables
  const [editSekolahMinggu, setEditSekolahMinggu] = useState(jadwalIbadah.sekolahMinggu || '');
  const [editShift1, setEditShift1] = useState(jadwalIbadah.shift1 || '');
  const [editShift2, setEditShift2] = useState(jadwalIbadah.shift2 || '');

  // Tentang state variables
  const [editingTentangId, setEditingTentangId] = useState<string | null>(null);
  const [tentangFormJudul, setTentangFormJudul] = useState('');
  const [tentangFormIsi, setTentangFormIsi] = useState('');
  const [tentangFormGambar, setTentangFormGambar] = useState('');
  const [tentangFormJudulGambar, setTentangFormJudulGambar] = useState('');
  const [tentangFormKeteranganGambar, setTentangFormKeteranganGambar] = useState('');
  const [isAddingTentang, setIsAddingTentang] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran berkas gambar terlalu besar! Maksimal ukuran adalah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTentangFormGambar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Parhalado state variables
  const [editingParhaladoId, setEditingParhaladoId] = useState<string | null>(null);
  const [parhaladoFormNama, setParhaladoFormNama] = useState('');
  const [parhaladoFormJabatan, setParhaladoFormJabatan] = useState('');
  const [parhaladoFormNoTelp, setParhaladoFormNoTelp] = useState('');
  const [isAddingParhalado, setIsAddingParhalado] = useState(false);

  // Sync state values when props change
  useEffect(() => {
    setEditSekolahMinggu(jadwalIbadah.sekolahMinggu || '');
    setEditShift1(jadwalIbadah.shift1 || '');
    setEditShift2(jadwalIbadah.shift2 || '');
  }, [jadwalIbadah]);


  // Helper functions for cash classification
  const getTipeKasOfTransaction = (t: Transaksi, customTitle: string): 'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom' => {
    if (t.tipeKas) {
      if (t.tipeKas === 'Kas Huria') return 'Kas Huria';
      if (t.tipeKas === 'Kas Pembangunan') return 'Kas Pembangunan';
      if (t.tipeKas === 'Kas Diakonia') return 'Kas Diakonia';
      if (t.tipeKas === 'Kas Kustom') return 'Kas Kustom';
    }
    
    // Legacy parsing:
    const cat = t.kategori.toLowerCase();
    const ket = t.keterangan.toLowerCase();
    if (cat.includes('pembangunan')) {
      return 'Kas Pembangunan';
    }
    if (cat.includes('diakonia') || ket.includes('diakonia') || cat.includes('pelayanan jemaat')) {
      return 'Kas Diakonia';
    }
    return 'Kas Huria';
  };

  const getTipeKasLabel = (resolved: 'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom', customTitle: string) => {
    if (resolved === 'Kas Huria') return 'Kas Huria (Umum)';
    if (resolved === 'Kas Pembangunan') return 'Kas Pembangunan';
    if (resolved === 'Kas Diakonia') return 'Kas Diakonia (Sosial)';
    return customTitle || 'Kas Kustom';
  };

  const getTipeKasDisplayClass = (resolved: 'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom') => {
    if (resolved === 'Kas Huria') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (resolved === 'Kas Pembangunan') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (resolved === 'Kas Diakonia') return 'bg-pink-50 text-pink-700 border-pink-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Computed financial metrics
  const totalPemasukan = useMemo(() => {
    return transaksiList
      .filter((t) => t.tipe === 'pemasukan')
      .reduce((sum, t) => {
        const pct = t.sentralisasiPersen || 0;
        return sum + (t.jumlah * (1 - pct / 100));
      }, 0);
  }, [transaksiList]);

  const totalPengeluaran = useMemo(() => {
    return transaksiList
      .filter((t) => t.tipe === 'pengeluaran')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transaksiList]);

  const saldoKasHuria = useMemo(() => {
    const pemasukan = transaksiList
      .filter((t) => t.tipe === 'pemasukan' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Huria')
      .reduce((sum, t) => {
        const pct = t.sentralisasiPersen || 0;
        return sum + (t.jumlah * (1 - pct / 100));
      }, 0);
    const pengeluaran = transaksiList
      .filter((t) => t.tipe === 'pengeluaran' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Huria')
      .reduce((sum, t) => sum + t.jumlah, 0);
    return pemasukan - pengeluaran;
  }, [transaksiList, customBalanceTitle]);

  const saldoKasPembangunan = useMemo(() => {
    const pemasukan = transaksiList
      .filter((t) => t.tipe === 'pemasukan' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Pembangunan')
      .reduce((sum, t) => {
        const pct = t.sentralisasiPersen || 0;
        return sum + (t.jumlah * (1 - pct / 100));
      }, 0);
    const pengeluaran = transaksiList
      .filter((t) => t.tipe === 'pengeluaran' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Pembangunan')
      .reduce((sum, t) => sum + t.jumlah, 0);
    return pemasukan - pengeluaran;
  }, [transaksiList, customBalanceTitle]);

  const saldoDiakoniaSosial = useMemo(() => {
    const pemasukan = transaksiList
      .filter((t) => t.tipe === 'pemasukan' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Diakonia')
      .reduce((sum, t) => {
        const pct = t.sentralisasiPersen || 0;
        return sum + (t.jumlah * (1 - pct / 100));
      }, 0);
    const pengeluaran = transaksiList
      .filter((t) => t.tipe === 'pengeluaran' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Diakonia')
      .reduce((sum, t) => sum + t.jumlah, 0);
    return pemasukan - pengeluaran;
  }, [transaksiList, customBalanceTitle]);

  const activeCustomBalanceValue = useMemo(() => {
    const pemasukan = transaksiList
      .filter((t) => t.tipe === 'pemasukan' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Kustom')
      .reduce((sum, t) => {
        const pct = t.sentralisasiPersen || 0;
        return sum + (t.jumlah * (1 - pct / 100));
      }, 0);
    const pengeluaran = transaksiList
      .filter((t) => t.tipe === 'pengeluaran' && getTipeKasOfTransaction(t, customBalanceTitle) === 'Kas Kustom')
      .reduce((sum, t) => sum + t.jumlah, 0);
    return customBalanceValue + pemasukan - pengeluaran;
  }, [transaksiList, customBalanceValue, customBalanceTitle]);
  
  // Save Feedback state
  const [savedSuccessMessage, setSavedSuccessMessage] = useState('');

  // ----------------------------------------------------
  // STATE & MEMO FOR WEEKLY ATTENDANCE TRENDS DASHBOARD
  // ----------------------------------------------------
  const [tempAttendanceTrends, setTempAttendanceTrends] = useState<WeeklyAttendanceTrend[]>([]);
  const [chartTab, setChartTab] = useState<'total' | 'minggu' | 'partangiangan'>('total');

  useEffect(() => {
    if (attendanceTrends && attendanceTrends.length > 0) {
      setTempAttendanceTrends(attendanceTrends);
    } else {
      setTempAttendanceTrends(INITIAL_ATTENDANCE_TRENDS);
    }
  }, [attendanceTrends]);

  // AUTO SYNC PARTANGIANGAN TOTALS TO ATTENDANCE TRENDS
  useEffect(() => {
    if (activeSubTab === 'dashboard' && partangianganAttendance && partangianganAttendance.length > 0) {
      const ama = partangianganAttendance.reduce((sum, r) => sum + (Number(r.ama) || 0), 0);
      const ina = partangianganAttendance.reduce((sum, r) => sum + (Number(r.ina) || 0), 0);
      const sm = partangianganAttendance.reduce((sum, r) => sum + (Number(r.sm) || 0), 0);
      const rena = partangianganAttendance.reduce((sum, r) => sum + (Number(r.rena) || 0), 0);
      const parhalado = partangianganAttendance.reduce((sum, r) => sum + (Number(r.parhalado) || 0), 0);

      setTempAttendanceTrends(prev => {
        if (prev.length === 0) return prev;
        const targetIdx = prev.length - 1;
        const latest = prev[targetIdx];
        if (
          latest.partangianganAma === ama &&
          latest.partangianganIna === ina &&
          latest.partangianganSm === sm &&
          latest.partangianganRena === rena &&
          latest.partangianganParhalado === parhalado
        ) {
          return prev;
        }
        const updated = [...prev];
        updated[targetIdx] = {
          ...updated[targetIdx],
          partangianganAma: ama,
          partangianganIna: ina,
          partangianganSm: sm,
          partangianganRena: rena,
          partangianganParhalado: parhalado
        };
        return updated;
      });
    }
  }, [activeSubTab, partangianganAttendance]);

  const chartData = useMemo(() => {
    const dataToUse = tempAttendanceTrends.length > 0 ? tempAttendanceTrends : attendanceTrends.length > 0 ? attendanceTrends : INITIAL_ATTENDANCE_TRENDS;
    return dataToUse.map(item => {
      // Minggu is now Shift 1 (mingguAma) + Shift 2 (mingguIna) + Sekolah Minggu (mingguSm)
      const totalMinggu = (item.mingguAma || 0) + (item.mingguIna || 0) + (item.mingguSm || 0);
      const totalPartangiangan = (item.partangianganAma || 0) + (item.partangianganIna || 0) + (item.partangianganSm || 0) + (item.partangianganRena || 0) + (item.partangianganParhalado || 0);
      return {
        ...item,
        "Total Kebaktian Minggu": totalMinggu,
        "Total Partangiangan": totalPartangiangan,
        // Breakdown Minggu
        "Shift 1 (Minggu)": item.mingguAma || 0,
        "Shift 2 (Minggu)": item.mingguIna || 0,
        "Sekolah Minggu (Minggu)": item.mingguSm || 0,
        // Breakdown Partangiangan
        "Ama (Partangiangan)": item.partangianganAma || 0,
        "Ina (Partangiangan)": item.partangianganIna || 0,
        "Sekolah Minggu (Partangiangan)": item.partangianganSm || 0,
        "Remaja/Naposo (Partangiangan)": item.partangianganRena || 0,
        "Parhalado (Partangiangan)": item.partangianganParhalado || 0,
      };
    });
  }, [tempAttendanceTrends, attendanceTrends]);

  const kpis = useMemo(() => {
    if (chartData.length === 0) return {
      latestSunday: 0, sundayGrowth: 0,
      latestPartangiangan: 0, partangianganGrowth: 0,
      avgSunday: 0, avgPartangiangan: 0
    };

    const latest = chartData[chartData.length - 1];
    const prev = chartData.length > 1 ? chartData[chartData.length - 2] : null;

    const latestSunday = latest["Total Kebaktian Minggu"];
    const prevSunday = prev ? prev["Total Kebaktian Minggu"] : 0;
    const sundayGrowth = prevSunday > 0 ? ((latestSunday - prevSunday) / prevSunday) * 100 : 0;

    const latestPartangiangan = latest["Total Partangiangan"];
    const prevPartangiangan = prev ? prev["Total Partangiangan"] : 0;
    const partangianganGrowth = prevPartangiangan > 0 ? ((latestPartangiangan - prevPartangiangan) / prevPartangiangan) * 100 : 0;

    const avgSunday = Math.round(chartData.reduce((sum, item) => sum + item["Total Kebaktian Minggu"], 0) / chartData.length);
    const avgPartangiangan = Math.round(chartData.reduce((sum, item) => sum + item["Total Partangiangan"], 0) / chartData.length);

    return {
      latestSunday,
      sundayGrowth,
      latestPartangiangan,
      partangianganGrowth,
      avgSunday,
      avgPartangiangan
    };
  }, [chartData]);

  const handleTrendCellChange = (index: number, field: keyof WeeklyAttendanceTrend, value: number | string) => {
    const updated = [...tempAttendanceTrends];
    if (field === 'weekLabel' || field === 'tanggalRange') {
      updated[index] = { ...updated[index], [field]: value } as any;
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 } as any;
    }
    setTempAttendanceTrends(updated);
  };

  const handleSaveAttendanceTrends = () => {
    if (onUpdateAttendanceTrends) {
      onUpdateAttendanceTrends(tempAttendanceTrends);
      setSavedSuccessMessage('Tren Kehadiran Berhasil Disimpan!');
      setTimeout(() => setSavedSuccessMessage(''), 3000);
    }
  };

  // ----------------------------------------------------
  // EXPORT KEUANGAN TO EXCEL
  // ----------------------------------------------------
  const handleExportKeuanganExcel = () => {
    try {
      const getBreakdownForKas = (kasType: 'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom') => {
        const pemasukan = transaksiList
          .filter((t) => t.tipe === 'pemasukan' && getTipeKasOfTransaction(t, customBalanceTitle) === kasType)
          .reduce((sum, t) => {
            const pct = t.sentralisasiPersen || 0;
            return sum + (t.jumlah * (1 - pct / 100));
          }, 0);
        const pengeluaran = transaksiList
          .filter((t) => t.tipe === 'pengeluaran' && getTipeKasOfTransaction(t, customBalanceTitle) === kasType)
          .reduce((sum, t) => sum + t.jumlah, 0);
        return { pemasukan, pengeluaran };
      };

      const huriaBreakdown = getBreakdownForKas('Kas Huria');
      const pembangunanBreakdown = getBreakdownForKas('Kas Pembangunan');
      const diakoniaBreakdown = getBreakdownForKas('Kas Diakonia');
      const kustomBreakdown = getBreakdownForKas('Kas Kustom');

      const namaGereja = loggedAdmin?.namaGereja || "HKBP Hinalang Silalahi";
      const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

      // Sheet 1: Ringkasan Laporan
      const sheet1Data: any[][] = [
        [namaGereja],
        ["LAPORAN RINGKASAN BUKU KAS KEUANGAN GEREJA"],
        [`Diekspor pada: ${timestamp} WIB`],
        [],
        ["Nama Kas / Alokasi", "Saldo Basis (IDR)", "Total Pemasukan Bersih (IDR)", "Total Pengeluaran (IDR)", "Saldo Akhir Saat Ini (IDR)"],
        ["Kas Huria (Umum)", 0, huriaBreakdown.pemasukan, huriaBreakdown.pengeluaran, saldoKasHuria],
        ["Kas Pembangunan", 0, pembangunanBreakdown.pemasukan, pembangunanBreakdown.pengeluaran, saldoKasPembangunan],
        ["Kas Diakonia (Sosial)", 0, diakoniaBreakdown.pemasukan, diakoniaBreakdown.pengeluaran, saldoDiakoniaSosial],
        [customBalanceTitle || "Kas Kustom", customBalanceValue, kustomBreakdown.pemasukan, kustomBreakdown.pengeluaran, activeCustomBalanceValue],
        [
          "TOTAL KAS KESELURUHAN",
          customBalanceValue,
          huriaBreakdown.pemasukan + pembangunanBreakdown.pemasukan + diakoniaBreakdown.pemasukan + kustomBreakdown.pemasukan,
          huriaBreakdown.pengeluaran + pembangunanBreakdown.pengeluaran + diakoniaBreakdown.pengeluaran + kustomBreakdown.pengeluaran,
          saldoKasHuria + saldoKasPembangunan + saldoDiakoniaSosial + activeCustomBalanceValue
        ],
        [],
        ["Statistik Alur Transaksi Kas"],
        ["Total Akumulasi Pemasukan (Kotor)", totalPemasukan],
        ["Total Akumulasi Pengeluaran", totalPengeluaran]
      ];

      // Sheet 2: Rincian Transaksi
      const sheet2Data: any[][] = [
        ["LAPORAN DETIL TRANSAKSI BUKU KAS GEREJA"],
        [`Diekspor pada: ${timestamp} WIB`],
        [],
        [
          "No",
          "Tanggal",
          "Tipe Transaksi",
          "Alokasi Kas",
          "Kategori",
          "Keterangan",
          "Jumlah Kotor (IDR)",
          "Sentralisasi (%)",
          "Potongan Sentralisasi (IDR)",
          "Jumlah Bersih (IDR)"
        ]
      ];

      transaksiList.forEach((t, index) => {
        const resolved = getTipeKasOfTransaction(t, customBalanceTitle);
        const kasLabel = getTipeKasLabel(resolved, customBalanceTitle);
        const sentralisasiPersen = t.sentralisasiPersen || 0;
        const potongan = t.tipe === 'pemasukan' ? (t.jumlah * sentralisasiPersen / 100) : 0;
        const jumlahBersih = t.tipe === 'pemasukan' ? (t.jumlah - potongan) : t.jumlah;

        sheet2Data.push([
          index + 1,
          t.tanggal,
          t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
          kasLabel,
          t.kategori,
          t.keterangan,
          t.jumlah,
          sentralisasiPersen > 0 ? `${sentralisasiPersen}%` : '0%',
          potongan,
          jumlahBersih
        ]);
      });

      // Create worksheets
      const wsRingkasan = XLSX.utils.aoa_to_sheet(sheet1Data);
      const wsDetail = XLSX.utils.aoa_to_sheet(sheet2Data);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan Laporan");
      XLSX.utils.book_append_sheet(wb, wsDetail, "Daftar Transaksi");

      // Save to file
      XLSX.writeFile(wb, `Laporan_Keuangan_Kas_Gereja_${namaGereja.replace(/\s+/g, '_')}.xlsx`);
      setSavedSuccessMessage('Laporan Keuangan Berhasil Diekspor ke Excel!');
      setTimeout(() => setSavedSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data keuangan ke Excel');
    }
  };

  // ----------------------------------------------------
  // STATE FOR PDF ARCHIVE & CUSTOM DOCUMENTS
  // ----------------------------------------------------
  const [arsipPdfs, setArsipPdfs] = useState<any[]>(() => {
    const local = localStorage.getItem('hkbp_arsip_pdf');
    return local ? JSON.parse(local) : [
      {
        id: 'arsip-1',
        judul: 'Tata Gereja HKBP (Amanat & Peraturan)',
        keterangan: 'Aturan, Peraturan, dan Konfesi resmi HKBP sebagai landasan pelayanan gerejawi.',
        tanggalUpload: '2026-06-15',
        fileName: 'tata_gereja_hkbp_2026.pdf',
        fileSize: '1.24 MB',
        pdfUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...' // brief placeholder representation
      },
      {
        id: 'arsip-2',
        judul: 'Kumpulan Lagu Koor Huria Batak',
        keterangan: 'Daftar lagu koor koor Batak populer untuk latihan Koor Ama, Ina, dan Remaja.',
        tanggalUpload: '2026-06-20',
        fileName: 'kumpulan_koor_batak.pdf',
        fileSize: '3.12 MB',
        pdfUrl: ''
      }
    ];
  });

  const [newArsipJudul, setNewArsipJudul] = useState('');
  const [newArsipKet, setNewArsipKet] = useState('');
  const [newArsipFileName, setNewArsipFileName] = useState('');
  const [newArsipFileSize, setNewArsipFileSize] = useState('');
  const [newArsipPdfUrl, setNewArsipPdfUrl] = useState('');
  const [newArsipKategori, setNewArsipKategori] = useState<'acara' | 'petugas' | 'warta' | 'keuangan'>('acara');
  const [newArsipTanggalMinggu, setNewArsipTanggalMinggu] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  });
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveCategoryFilter, setArchiveCategoryFilter] = useState<string>('all');
  const [isAddingArsip, setIsAddingArsip] = useState(false);
  

  // Safe Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [previewManualLit, setPreviewManualLit] = useState<Liturgi | null>(null);

  const saveArsipPdfs = (data: any[]) => {
    setArsipPdfs(data);
    saveDbKey('hkbp_arsip_pdf', data).catch(err => console.error('Failed to sync arsip PDF:', err));
  };

  // ----------------------------------------------------
  // STATE FOR DATABASE BUKU NYANYIAN (BE & BN)
  // ----------------------------------------------------
  const [bukuNyanyianDb, setBukuNyanyianDb] = useState<BukuSong[]>(() => {
    const local = localStorage.getItem('hkbp_buku_nyanyian_db');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, BukuSong>();
          parsed.forEach((s: any) => {
            if (s && s.id) map.set(s.id, s);
          });
          // Official songs from https://hkbp.or.id/buku-ende take precedence
          INITIAL_BUKU_NYANYIAN_DB.forEach(s => map.set(s.id, s));
          return Array.from(map.values()).sort((a, b) => {
            if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
            return a.nomor - b.nomor;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_BUKU_NYANYIAN_DB;
  });

  const saveBukuNyanyianDb = (data: BukuSong[]) => {
    setBukuNyanyianDb(data);
    localStorage.setItem('hkbp_buku_nyanyian_db', JSON.stringify(data));
    saveDbKey('hkbp_buku_nyanyian_db', data).catch(err => console.error('Failed to sync Buku Nyanyian:', err));
  };

  // Helper Modal: Quick Picker for Step Row
  const [songPickerStepIndex, setSongPickerStepIndex] = useState<number | null>(null);
  const [songPickerKategori, setSongPickerKategori] = useState<'BE' | 'BN' | 'KJ'>('BE');
  const [songPickerNomor, setSongPickerNomor] = useState<string>('10');
  const [songPickerAyat, setSongPickerAyat] = useState<string>('1-2');

  // Modal: Add New Song to Catalog
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [newSongKategori, setNewSongKategori] = useState<'BE' | 'BN' | 'KJ'>('BE');
  const [newSongNomor, setNewSongNomor] = useState<string>('');
  const [newSongJudul, setNewSongJudul] = useState<string>('');
  const [newSongRawLyrics, setNewSongRawLyrics] = useState<string>('');

  // Subtab Catalog Search & Filter
  const [songCatalogSearch, setSongCatalogSearch] = useState<string>('');
  const [songCatalogFilter, setSongCatalogFilter] = useState<'ALL' | 'BE' | 'BN' | 'KJ'>('ALL');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [testSongVerseRange, setTestSongVerseRange] = useState<{[key: string]: string}>({});

  // Modal: Import / Provide Song Database
  const [isImportDbModalOpen, setIsImportDbModalOpen] = useState(false);
  const [importDbJsonText, setImportDbJsonText] = useState('');
  const [importDbMode, setImportDbMode] = useState<'merge' | 'replace'>('merge');

  // Modal: Sync from Portal Resmi HKBP (Buku Ende, Buku Nyanyian & Kidung Jemaat)
  const [isSyncApiModalOpen, setIsSyncApiModalOpen] = useState(false);
  const [syncBook, setSyncBook] = useState<'BE' | 'BN' | 'KJ'>('BE');
  const [syncStart, setSyncStart] = useState('1');
  const [syncEnd, setSyncEnd] = useState('50');
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  // Modal: Scripture Picker ("Pilih Kitab & Ayat Alkitab")
  const [scripturePickerTarget, setScripturePickerTarget] = useState<{
    type: 'epistel' | 'khotbah' | 'step';
    index?: number;
  } | null>(null);
  const [pickerBookId, setPickerBookId] = useState<string>('40'); // default Matius / Mateus
  const [pickerChapter, setPickerChapter] = useState<number>(1);
  const [pickerVerseRange, setPickerVerseRange] = useState<string>('1-5');
  const [pickerLangMode, setPickerLangMode] = useState<'indo' | 'batak'>('indo');
  const [pickerPreviewText, setPickerPreviewText] = useState<string>('');
  const [isFetchingPickerPreview, setIsFetchingPickerPreview] = useState<boolean>(false);

  const handleUpdateScripturePickerPreview = async (
    bId: string,
    chap: number,
    vRange: string,
    langMode: 'indo' | 'batak' = pickerLangMode
  ) => {
    const selectedBook = ALKITAB_BOOKS_CATALOG.find(b => b.id === bId) || ALKITAB_BOOKS_CATALOG[39];
    setIsFetchingPickerPreview(true);
    const langLabel = langMode === 'indo' ? 'Bahasa Indonesia' : 'Bahasa Batak';
    setPickerPreviewText(`Mengambil teks Alkitab (${langLabel})...`);
    
    try {
      const labelQuery = `${selectedBook.indonesia} ${chap}:${vRange}`;
      const res = await fetchAndFormatScriptureFromLabel(labelQuery, langMode);
      if (res.found && res.formattedText) {
        setPickerPreviewText(res.formattedText);
      } else {
        const dualVerses = await fetchDualAlkitabChapter(selectedBook, chap);
        if (dualVerses.length > 0) {
          const indoLines = dualVerses.map(v => `${v.verse}. ${v.textIndo}`).join('\n');
          const batakLines = dualVerses.map(v => `${v.verse}. ${v.textBatak}`).join('\n');
          setPickerPreviewText(langMode === 'batak' ? batakLines : indoLines);
        } else {
          setPickerPreviewText('⚠️ Tidak ditemukan ayat Alkitab untuk pasal ini.');
        }
      }
    } catch (err) {
      setPickerPreviewText('⚠️ Terjadi kesalahan saat mengambil ayat Alkitab.');
    } finally {
      setIsFetchingPickerPreview(false);
    }
  };

  const handleApplyScriptureFromPicker = () => {
    if (!scripturePickerTarget) return;

    const selectedBook = ALKITAB_BOOKS_CATALOG.find(b => b.id === pickerBookId) || ALKITAB_BOOKS_CATALOG[39];
    const referenceLabel = pickerLangMode === 'batak'
      ? `${selectedBook.batak} ${pickerChapter}:${pickerVerseRange}`
      : `${selectedBook.indonesia} ${pickerChapter}:${pickerVerseRange}`;

    if (scripturePickerTarget.type === 'epistel') {
      setLitRef(referenceLabel);
      const stepIdx = litSteps.findIndex(s => s.label.toLowerCase().includes('epistel'));
      if (stepIdx !== -1) {
        const updated = [...litSteps];
        updated[stepIdx] = { ...updated[stepIdx], isi: pickerPreviewText };
        setLitSteps(updated);
      } else {
        setLitSteps(prev => [
          ...prev,
          { id: `step-epistel-${Date.now()}`, label: `Epistel: ${referenceLabel}`, isi: pickerPreviewText, pembaca: 'Parhalado' }
        ]);
      }
      setSavedSuccessMessage(`✓ Epistel: ${referenceLabel}`);
      setTimeout(() => setSavedSuccessMessage(''), 3000);
    } else if (scripturePickerTarget.type === 'khotbah') {
      setLitBacaan(referenceLabel);
      const stepIdx = litSteps.findIndex(s => s.label.toLowerCase().includes('khotbah') || s.label.toLowerCase().includes('jamita'));
      if (stepIdx !== -1) {
        const updated = [...litSteps];
        updated[stepIdx] = { ...updated[stepIdx], isi: pickerPreviewText };
        setLitSteps(updated);
      } else {
        setLitSteps(prev => [
          ...prev,
          { id: `step-khotbah-${Date.now()}`, label: `Khotbah: ${referenceLabel}`, isi: pickerPreviewText, pembaca: 'Pendeta' }
        ]);
      }
      setSavedSuccessMessage(`✓ Khotbah: ${referenceLabel}`);
      setTimeout(() => setSavedSuccessMessage(''), 3000);
    } else if (scripturePickerTarget.type === 'step' && scripturePickerTarget.index !== undefined) {
      const idx = scripturePickerTarget.index;
      const updated = [...litSteps];
      const existingLabel = updated[idx]?.label || '';
      const prefixMatch = existingLabel.match(/^(\d+[\.\s]*)?([^:]+[\:]\s*)?/);
      let newLabel = referenceLabel;
      if (prefixMatch && prefixMatch[0] && prefixMatch[0].trim().length > 0) {
        const prefix = prefixMatch[0].trim();
        if (prefix.match(/^\d+[\.\s]*/)) {
          newLabel = `${prefix} ${referenceLabel}`;
        }
      }
      updated[idx] = { ...updated[idx], label: newLabel, isi: pickerPreviewText };
      setLitSteps(updated);
      setSavedSuccessMessage(`✓ Baris ${idx + 1} diisi: ${referenceLabel}`);
      setTimeout(() => setSavedSuccessMessage(''), 3000);
    }

    setScripturePickerTarget(null);
  };

  // ----------------------------------------------------
  // STATE FOR LITURGI EDITING
  // ----------------------------------------------------
  const [editingLiturgyId, setEditingLiturgyId] = useState<string | null>(null);
  const [liturgiEditMode, setLiturgiEditMode] = useState<'minggu' | 'partangiangan'>('minggu');
  const [litType, setLitType] = useState<'minggu' | 'partangiangan'>('minggu');
  const [litTitle, setLitTitle] = useState('');
  const [litDate, setLitDate] = useState('');
  const [litTopik, setLitTopik] = useState('');
  const [litRef, setLitRef] = useState('');
  const [litBacaan, setLitBacaan] = useState('');
  const [litSteps, setLitSteps] = useState<LiturgiSection[]>([]);
  // PDF values
  const [litPdfMode, setLitPdfMode] = useState(false);
  const [litPdfUrl, setLitPdfUrl] = useState('');
  const [litUploadedPdfName, setLitUploadedPdfName] = useState<string | null>(null);
  const [litUploadedPdfSize, setLitUploadedPdfSize] = useState<string | null>(null);

  // ----------------------------------------------------
  // STATE FOR PETUGAS EDITING (SPREADSHEET FOR MINGGU)
  // ----------------------------------------------------
  const [adminPetugasSubTab, setAdminPetugasSubTab] = useState<'minggu' | 'partangiangan'>('minggu');
  const [tempSteps, setTempSteps] = useState<LiturgiSection[]>([]);
  const [tempPetugasMinggu, setTempPetugasMinggu] = useState<PetugasMingguRow[]>([]);
  const [tempPartangianganAttendance, setTempPartangianganAttendance] = useState<PartangianganAttendanceRow[]>([]);
  const [tempPetugasPartangiangan, setTempPetugasPartangiangan] = useState<PetugasPartangianganRow[]>([]);

  // Synchronize from props
  useEffect(() => {
    if (petugasMinggu) {
      setTempPetugasMinggu(petugasMinggu);
    }
  }, [petugasMinggu]);

  useEffect(() => {
    if (partangianganAttendance) {
      setTempPartangianganAttendance(partangianganAttendance);
    }
  }, [partangianganAttendance]);

  useEffect(() => {
    if (petugasPartangiangan) {
      setTempPetugasPartangiangan(petugasPartangiangan);
    }
  }, [petugasPartangiangan]);

  useEffect(() => {
    const liturgiList = adminPetugasSubTab === 'minggu' ? liturgiMinggu : liturgiPartangiangan;
    const activeLit = liturgiList?.[0] || null;
    if (activeLit) {
      setTempSteps(activeLit.teksLiturgi || []);
    } else {
      setTempSteps([]);
    }
  }, [adminPetugasSubTab, liturgiMinggu, liturgiPartangiangan]);

  const handleUpdateTempPetugas = (index: number, value: string) => {
    const updated = [...tempSteps];
    updated[index] = { ...updated[index], pembaca: value };
    setTempSteps(updated);
  };

  const handleCellChange = (rowIndex: number, colKey: 'tugas' | 'shift1' | 'shift2' | 'sekolahMinggu', value: string) => {
    const updated = [...tempPetugasMinggu];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [colKey]: value
    };
    setTempPetugasMinggu(updated);
  };

  const handleAddPetugasMingguRow = () => {
    setTempPetugasMinggu(prev => [
      ...prev,
      { tugas: 'Tugas Baru', shift1: '', shift2: '', sekolahMinggu: '' }
    ]);
  };

  const handleDeletePetugasMingguRow = (index: number) => {
    setTempPetugasMinggu(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePetugasMinggu = () => {
    onUpdatePetugasMinggu(tempPetugasMinggu);
    setSavedSuccessMessage('Data Petugas Minggu berhasil diperbarui!');
    setTimeout(() => setSavedSuccessMessage(''), 3000);
  };

  const handleSavePetugasPartangiangan = () => {
    const liturgiList = liturgiPartangiangan;
    const activeLit = liturgiList?.[0] || null;
    if (!activeLit) return;

    const updatedLit: Liturgi = {
      ...activeLit,
      teksLiturgi: tempSteps
    };

    const updatedList = [...liturgiPartangiangan];
    updatedList[0] = updatedLit;
    onUpdateLiturgiPartangiangan(updatedList);

    setSavedSuccessMessage('Petugas Partangiangan berhasil diperbarui!');
    setTimeout(() => setSavedSuccessMessage(''), 3000);
  };

  // ----------------------------------------------------
  // HANDLERS FOR NEW PARTANGIANGAN TABLES (2 TABLES)
  // ----------------------------------------------------
  const handleAttendanceCellChange = (index: number, field: keyof PartangianganAttendanceRow, value: any) => {
    const updated = [...tempPartangianganAttendance];
    updated[index] = {
      ...updated[index],
      [field]: (field === 'hari' || field === 'lunggu') ? value : (Number(value) || 0)
    };
    setTempPartangianganAttendance(updated);
  };

  const handleAddPartangianganAttendanceRow = () => {
    setTempPartangianganAttendance(prev => [
      ...prev,
      { hari: 'Selasa', lunggu: 'Lunggu Baru', ama: 0, ina: 0, sm: 0, rena: 0, parhalado: 0 }
    ]);
  };

  const handleDeletePartangianganAttendanceRow = (index: number) => {
    setTempPartangianganAttendance(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePartangianganAttendance = () => {
    onUpdatePartangianganAttendance(tempPartangianganAttendance);
    setSavedSuccessMessage('Tabel Kehadiran Partangiangan berhasil disimpan!');
    setTimeout(() => setSavedSuccessMessage(''), 3000);
  };

  const handlePetugasPartangianganCellChange = (index: number, field: keyof PetugasPartangianganRow, value: string) => {
    const updated = [...tempPetugasPartangiangan];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTempPetugasPartangiangan(updated);
  };

  const handleSavePetugasPartangianganTable = () => {
    onUpdatePetugasPartangiangan(tempPetugasPartangiangan);
    setSavedSuccessMessage('Tabel Petugas Partangiangan berhasil disimpan!');
    setTimeout(() => setSavedSuccessMessage(''), 3000);
  };

  const handleAddPetugasPartangianganRow = () => {
    setTempPetugasPartangiangan([
      ...tempPetugasPartangiangan,
      { hari: 'Selasa', lunggu: '', keluarga: '', alamat: '', jamita: '', agenda: '', ende: '' }
    ]);
  };

  const handleRemovePetugasPartangianganRow = (index: number) => {
    const updated = tempPetugasPartangiangan.filter((_, i) => i !== index);
    setTempPetugasPartangiangan(updated);
  };

  // ----------------------------------------------------
  // STATE FOR WARTA EDITING
  // ----------------------------------------------------
  const [editingWartaId, setEditingWartaId] = useState<string | null>(null);
  const [wartaTitle, setWartaTitle] = useState('');
  const [wartaIsi, setWartaIsi] = useState('');
  const [wartaKategori, setWartaKategori] = useState<WartaKategori>('umum');
  const [wartaPenulis, setWartaPenulis] = useState('');
  const [wartaPrioritas, setWartaPrioritas] = useState(false);

  // ----------------------------------------------------
  // STATE FOR TRANSAKSI EDITING
  // ----------------------------------------------------
  const [editingTransaksiId, setEditingTransaksiId] = useState<string | null>(null);
  const [txTipe, setTxTipe] = useState<TransaksiTipe>('pemasukan');
  const [txKategori, setTxKategori] = useState('');
  const [txJumlah, setTxJumlah] = useState<number>(0);
  const [txTanggal, setTxTanggal] = useState('');
  const [txKeterangan, setTxKeterangan] = useState('');
  const [txTipeKas, setTxTipeKas] = useState<'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom'>('Kas Huria');
  const [txSentralisasiPersen, setTxSentralisasiPersen] = useState<number>(0);

  // ----------------------------------------------------
  // STATE FOR JEMAAT EDITING
  // ----------------------------------------------------
  const [editingJemaatId, setEditingJemaatId] = useState<string | null>(null);
  const [jmNama, setJmNama] = useState('');
  const [jmTglLahir, setJmTglLahir] = useState('');
  const [jmSektor, setJmSektor] = useState('Sektor III');
  const [jmNoHP, setJmNoHP] = useState('');
  const [jmCustomFields, setJmCustomFields] = useState<Record<string, string>>({});

  // Dynamically computed column headers for Jemaat table
  const jemaatColumns = useMemo(() => {
    const columns = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'sektor', label: 'Sektor / Wijk' },
      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
      { key: 'noHP', label: 'No. WhatsApp' },
    ];
    
    const standardKeys = ['id', 'nama', 'sektor', 'tanggalLahir', 'noHP', 'no', 'No', 'no.', 'No.', 'nomor', 'Nomor'];
    const customKeysSet = new Set<string>();
    
    jemaatList.forEach((j) => {
      Object.keys(j).forEach((k) => {
        if (!standardKeys.includes(k) && j[k] !== undefined && j[k] !== null && j[k] !== '') {
          customKeysSet.add(k);
        }
      });
    });
    
    customKeysSet.forEach((k) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      columns.push({ key: k, label });
    });
    
    return columns;
  }, [jemaatList]);

  // ----------------------------------------------------
  // STATE FOR JEMAAT EXCEL IMPORT
  // ----------------------------------------------------
  const [showJemaatExcelModal, setShowJemaatExcelModal] = useState(false);
  const [jemaatImportMode, setJemaatImportMode] = useState<'append' | 'overwrite'>('append');
  const [parsedJemaatList, setParsedJemaatList] = useState<Jemaat[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelErrorMsg, setExcelErrorMsg] = useState('');

  // ----------------------------------------------------
  // STATE FOR SEARCH FILTERING
  // ----------------------------------------------------
  const [searchKeuangan, setSearchKeuangan] = useState('');
  const [searchJemaat, setSearchJemaat] = useState('');

  // ----------------------------------------------------
  // INITIALIZER FOR SUNDAY LITURGY STATE
  // ----------------------------------------------------
  const [didInitSunday, setDidInitSunday] = useState(false);
  if (!didInitSunday && liturgiMinggu && liturgiMinggu.length > 0) {
    const lit = liturgiMinggu[0];
    setLitTitle(lit.judul);
    setLitDate(lit.tanggal);
    setLitTopik(lit.topik || '');
    setLitRef(lit.ayatReferensi || '');
    setLitBacaan(lit.ayatBacaan || '');
    setLitSteps([...(lit.teksLiturgi || [])]);
    setLitPdfMode(lit.isPdfMode);
    setLitPdfUrl(lit.pdfUrl || '');
    setLitUploadedPdfName(lit.uploadedPdfName || null);
    setLitUploadedPdfSize(lit.uploadedPdfSize || null);
    setDidInitSunday(true);
  }

  // ----------------------------------------------------
  // HELPER TO SHOW RE-USABLE TOASTS
  // ----------------------------------------------------
  const showToast = (message: string) => {
    setSavedSuccessMessage(message);
    setTimeout(() => {
      setSavedSuccessMessage('');
    }, 3000);
  };

  // Convert number to Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // ----------------------------------------------------
  // CRUD HANDLERS - LITURGI (ACARA)
  // ----------------------------------------------------
  const startEditLiturgy = (lit: Liturgi, tipe: 'minggu' | 'partangiangan') => {
    setEditingLiturgyId(lit.id);
    setLitType(tipe);
    setLitTitle(lit.judul);
    setLitDate(lit.tanggal);
    setLitTopik(lit.topik || '');
    setLitRef(lit.ayatReferensi || '');
    setLitBacaan(lit.ayatBacaan || '');
    setLitSteps([...lit.teksLiturgi]);
    setLitPdfMode(lit.isPdfMode);
    setLitPdfUrl(lit.pdfUrl || '');
    setLitUploadedPdfName(lit.uploadedPdfName || null);
    setLitUploadedPdfSize(lit.uploadedPdfSize || null);
  };

  const startNewLiturgy = (tipe: 'minggu' | 'partangiangan') => {
    setEditingLiturgyId('new');
    setLitType(tipe);
    setLitTitle(tipe === 'minggu' ? 'Ibadah Minggu Baru (HKBP)' : 'Ibadah Partangiangan Baru');
    setLitDate(new Date().toISOString().split('T')[0]);
    setLitTopik('');
    setLitRef('');
    setLitBacaan('');
    setLitSteps([
      { id: 'step-1', label: '01. Bernyanyi BE No. ...', isi: 'Lirik Lagu Ende...', pembaca: 'Song Leader' },
      { id: 'step-2', label: '02. Votum - Introitus - Doa', isi: 'Marhitehite Goar ni Debata Ama...', pembaca: 'Pendeta' }
    ]);
    setLitPdfMode(false);
    setLitPdfUrl('');
    setLitUploadedPdfName(null);
    setLitUploadedPdfSize(null);
  };

  const handleApplyPartangianganToMain = (lit: Liturgi) => {
    const filtered = liturgiPartangiangan.filter(item => item.id !== lit.id);
    const updated = [lit, ...filtered];
    onUpdateLiturgiPartangiangan(updated);
    showToast(`✓ Acara "${lit.judul}" sekarang aktif di Halaman Utama!`);
  };

  const handleSaveLiturgy = () => {
    const list = litType === 'minggu' ? [...liturgiMinggu] : [...liturgiPartangiangan];
    const newLiturgy: Liturgi = {
      id: editingLiturgyId === 'new' ? `liturgi-custom-${Date.now()}` : editingLiturgyId!,
      judul: litTitle,
      tanggal: litDate,
      topik: litType === 'minggu' ? (litTopik || undefined) : undefined,
      ayatReferensi: litRef || undefined,
      ayatBacaan: litBacaan || undefined,
      teksLiturgi: litSteps,
      isPdfMode: false,
      pdfUrl: null,
      uploadedPdfName: null,
      uploadedPdfSize: null
    };

    let updatedList: Liturgi[];
    if (editingLiturgyId === 'new') {
      // Prepend so newly created acara is at index 0 and immediately live on main page
      updatedList = [newLiturgy, ...list];
    } else {
      const filtered = list.filter((l) => l.id !== editingLiturgyId);
      // Promote edited acara to index 0 so changes are immediately live on main page
      updatedList = [newLiturgy, ...filtered];
    }

    if (litType === 'minggu') {
      onUpdateLiturgiMinggu(updatedList);
    } else {
      onUpdateLiturgiPartangiangan(updatedList);
    }

    // Automatically store in arsipPdfs (Arsip Berkas)
    const archiveId = `arsip-liturgi-${newLiturgy.id}`;
    const descText = newLiturgy.isPdfMode 
      ? `Tata Ibadah ${litType === 'minggu' ? 'Minggu' : 'Partangiangan'} (Berkas PDF) untuk tanggal ${newLiturgy.tanggal}.`
      : `Tata Ibadah ${litType === 'minggu' ? 'Minggu' : 'Partangiangan'} (Teks Manual) untuk tanggal ${newLiturgy.tanggal}.`;

    const archiveItem = {
      id: archiveId,
      judul: newLiturgy.judul,
      keterangan: descText,
      tanggalUpload: new Date().toISOString().split('T')[0],
      fileName: newLiturgy.isPdfMode ? (newLiturgy.uploadedPdfName || 'tata_ibadah.pdf') : undefined,
      fileSize: newLiturgy.isPdfMode ? (newLiturgy.uploadedPdfSize || '1.5 MB') : undefined,
      pdfUrl: newLiturgy.isPdfMode ? (newLiturgy.pdfUrl || '') : '',
      isPdfMode: newLiturgy.isPdfMode,
      teksLiturgi: !newLiturgy.isPdfMode ? newLiturgy.teksLiturgi : undefined,
      ayatReferensi: newLiturgy.ayatReferensi,
      ayatBacaan: newLiturgy.ayatBacaan,
      category: litType
    };

    const existingIndex = arsipPdfs.findIndex(item => item.id === archiveId);
    let updatedArsip = [...arsipPdfs];
    if (existingIndex !== -1) {
      updatedArsip[existingIndex] = archiveItem;
    } else {
      updatedArsip = [archiveItem, ...updatedArsip];
    }
    saveArsipPdfs(updatedArsip);

    setEditingLiturgyId(null);
    showToast('✓ Acara Berhasil Disimpan & Langsung Diterapkan ke Halaman Utama!');
  };

  const handleDeleteLiturgy = (id: string, tipe: 'minggu' | 'partangiangan') => {
    triggerConfirm(
      'Hapus Tata Ibadah',
      'Apakah Anda yakin ingin menghapus tata ibadah ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      () => {
        const list = tipe === 'minggu' ? [...liturgiMinggu] : [...liturgiPartangiangan];
        const filtered = list.filter((l) => l.id !== id);

        if (tipe === 'minggu') {
          onUpdateLiturgiMinggu(filtered);
        } else {
          onUpdateLiturgiPartangiangan(filtered);
        }
        showToast('Liturgi Berhasil Dihapus.');
      }
    );
  };

  const addStepRow = () => {
    setLitSteps([
      ...litSteps,
      {
        id: `step-row-${Date.now()}`,
        label: `${String(litSteps.length + 1).padStart(2, '0')}. Acara Baru`,
        isi: '',
        pembaca: 'Jemaat'
      }
    ]);
  };

  const updateStepRow = (index: number, field: keyof LiturgiSection, value: any) => {
    const updated = [...litSteps];
    updated[index] = { ...updated[index], [field]: value };
    setLitSteps(updated);
  };

  const deleteStepRow = (index: number) => {
    const updated = [...litSteps];
    updated.splice(index, 1);
    setLitSteps(updated);
  };

  // ----------------------------------------------------
  // AUTO-READ & AUTO-FILL NYANYIAN DARI PORTAL RESMI HKBP (https://hkbp.or.id/buku-ende)
  // ----------------------------------------------------
  const handleAutoFillSongLyrics = async (index: number, labelValue?: string, forceOverwrite = false) => {
    const targetLabel = labelValue !== undefined ? labelValue : litSteps[index]?.label;
    if (!targetLabel) return;

    const parsed = parseSongFromLabel(targetLabel);
    if (!parsed) return;

    let result = findSongAndFormatLyrics(bukuNyanyianDb, parsed.kategori, parsed.nomor, parsed.ayatNumbers, parsed.verseString);

    // If not found in local catalog or lyrics missing, fetch on demand from official HKBP API (https://hkbp.or.id)
    if ((!result.found || !result.lyrics) && (parsed.kategori === 'BE' || parsed.kategori === 'BN' || parsed.kategori === 'KJ')) {
      try {
        const fetchedSong = await fetchOfficialSongFromHkbp(parsed.nomor, parsed.kategori);
        if (fetchedSong && fetchedSong.ayatList && fetchedSong.ayatList.length > 0) {
          const updatedDb = [...bukuNyanyianDb.filter(s => !(s.kategori === parsed.kategori && s.nomor === fetchedSong.nomor)), fetchedSong].sort((a, b) => {
            if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
            return a.nomor - b.nomor;
          });
          saveBukuNyanyianDb(updatedDb);
          result = findSongAndFormatLyrics(updatedDb, parsed.kategori, parsed.nomor, parsed.ayatNumbers, parsed.verseString);
        }
      } catch (e) {
        console.error('Failed to auto-fetch from official HKBP portal:', e);
      }
    }

    if (result.found && result.lyrics) {
      const updated = [...litSteps];
      const currentStep = updated[index];
      const currentIsi = currentStep?.isi || '';

      const isPlaceholder = !currentIsi.trim() || 
        currentIsi.includes('Ketik isi liturgi') || 
        currentIsi.includes('Lirik Lagu Ende...');

      const isSongLyrics = /^\s*\d+\./.test(currentIsi) || currentIsi.includes('\n2.') || currentIsi.includes('\n3.');

      if (forceOverwrite || isPlaceholder || isSongLyrics) {
        updated[index] = {
          ...currentStep,
          isi: result.lyrics
        };
        setLitSteps(updated);
        showToast(`✓ Lirik resmi ${result.formattedLabel} dari hkbp.or.id otomatis diisi!`);
      }
    }
  };

  // ----------------------------------------------------
  // AUTO-READ & AUTO-FILL ALKITAB & BIBEL DARI CDN HKBP (https://hkbp.or.id/alkitab)
  // ----------------------------------------------------
  const handleAutoFillScriptureVerse = async (index: number, labelValue?: string, forceOverwrite = false) => {
    const targetLabel = labelValue !== undefined ? labelValue : litSteps[index]?.label;
    if (!targetLabel) return;

    const res = await fetchAndFormatScriptureFromLabel(targetLabel);
    if (res.found && res.formattedText) {
      const updated = [...litSteps];
      const currentStep = updated[index];
      const currentIsi = currentStep?.isi || '';

      const isPlaceholder = !currentIsi.trim() || 
        currentIsi.includes('Ketik isi liturgi') || 
        currentIsi.includes('Lirik Lagu Ende...');

      const isScriptureText = currentIsi.includes('[Bahasa Indonesia') || currentIsi.includes('[Biblia Bahasa Batak');

      if (forceOverwrite || isPlaceholder || isScriptureText) {
        updated[index] = {
          ...currentStep,
          isi: res.formattedText
        };
        setLitSteps(updated);
        showToast(`✓ Nats Alkitab ${res.referenceLabel} dari hkbp.or.id/alkitab otomatis diisi!`);
      }
    } else {
      showToast(`⚠️ Nats Alkitab tidak ditemukan untuk "${targetLabel}"`);
    }
  };

  const handleAutoDetectAndFillStep = async (index: number, labelValue?: string) => {
    const targetLabel = labelValue !== undefined ? labelValue : litSteps[index]?.label;
    if (!targetLabel) return;

    // Check if it matches a song reference (BE/BN/KJ)
    const parsedSong = parseSongFromLabel(targetLabel);
    if (parsedSong) {
      await handleAutoFillSongLyrics(index, targetLabel, true);
      return;
    }

    // Check if it matches a Bible scripture reference
    const parsedBible = parseAlkitabReference(targetLabel);
    if (parsedBible) {
      await handleAutoFillScriptureVerse(index, targetLabel, true);
      return;
    }
  };

  const handleApplySongFromPicker = async () => {
    if (songPickerStepIndex === null) return;
    const nomorNum = parseInt(songPickerNomor, 10);
    if (isNaN(nomorNum) || nomorNum <= 0) {
      alert('Mohon masukkan nomor lagu yang valid!');
      return;
    }

    const ayatNumbers = parseVerseRange(songPickerAyat);
    let result = findSongAndFormatLyrics(bukuNyanyianDb, songPickerKategori, nomorNum, ayatNumbers, songPickerAyat);

    // Auto fetch from official HKBP API if not yet in catalog
    if ((!result.found || !result.lyrics) && (songPickerKategori === 'BE' || songPickerKategori === 'BN' || songPickerKategori === 'KJ')) {
      try {
        const fetchedSong = await fetchOfficialSongFromHkbp(nomorNum, songPickerKategori);
        if (fetchedSong && fetchedSong.ayatList && fetchedSong.ayatList.length > 0) {
          const updatedDb = [...bukuNyanyianDb.filter(s => !(s.kategori === songPickerKategori && s.nomor === fetchedSong.nomor)), fetchedSong].sort((a, b) => {
            if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
            return a.nomor - b.nomor;
          });
          saveBukuNyanyianDb(updatedDb);
          result = findSongAndFormatLyrics(updatedDb, songPickerKategori, nomorNum, ayatNumbers, songPickerAyat);
        }
      } catch (e) {
        console.error('Failed to fetch from official HKBP portal:', e);
      }
    }

    const updated = [...litSteps];
    const currentStep = updated[songPickerStepIndex];

    let prefix = '';
    const matchPrefix = currentStep?.label?.match(/^(\d+[\s.]+\w+[\s.]+)/i);
    if (matchPrefix) {
      prefix = matchPrefix[1];
    } else {
      prefix = `${String(songPickerStepIndex + 1).padStart(2, '0')}. Marende `;
    }

    let versePart = '';
    if (songPickerAyat && songPickerAyat.trim()) {
      versePart = ` : ${songPickerAyat.trim()}`;
    } else if (ayatNumbers.length === 1) {
      versePart = ` : ${ayatNumbers[0]}`;
    } else if (ayatNumbers.length > 1) {
      versePart = ` : ${ayatNumbers.join(' + ')}`;
    }

    const songTitle = result.found ? ` "${result.title}"` : '';
    const newLabel = `${prefix}${songPickerKategori} No. ${nomorNum}${versePart}${songTitle}`;

    updated[songPickerStepIndex] = {
      ...currentStep,
      label: newLabel,
      isi: result.found ? result.lyrics : currentStep.isi
    };

    setLitSteps(updated);
    setSongPickerStepIndex(null);

    if (result.found) {
      showToast(`Lirik ${songPickerKategori} No. ${nomorNum} berhasil diisi otomatis!`);
    } else {
      showToast(`Nomor ${songPickerKategori} ${nomorNum} belum ada di DB lokal. Anda dapat menambahkannya.`);
    }
  };

  const handleSaveNewSongToDb = () => {
    const nomorNum = parseInt(newSongNomor, 10);
    if (isNaN(nomorNum) || nomorNum <= 0) {
      alert('Mohon masukkan nomor lagu yang valid!');
      return;
    }
    if (!newSongJudul.trim()) {
      alert('Mohon masukkan judul lagu!');
      return;
    }
    if (!newSongRawLyrics.trim()) {
      alert('Mohon masukkan bait / lirik lagu!');
      return;
    }

    const blocks = newSongRawLyrics.trim().split(/\n\s*\n/);
    const ayatList: { ayat: number; teks: string }[] = [];

    blocks.forEach((block, idx) => {
      const trimmedBlock = block.trim();
      const numMatch = trimmedBlock.match(/^(\d+)[\.\)]\s*([\s\S]+)/);
      if (numMatch) {
        ayatList.push({
          ayat: parseInt(numMatch[1], 10),
          teks: numMatch[2].trim()
        });
      } else {
        ayatList.push({
          ayat: idx + 1,
          teks: trimmedBlock
        });
      }
    });

    const songId = `${newSongKategori}-${nomorNum}`;
    const newSong: BukuSong = {
      id: songId,
      kategori: newSongKategori,
      nomor: nomorNum,
      judul: newSongJudul.trim(),
      ayatList
    };

    const existingIdx = bukuNyanyianDb.findIndex(s => s.id === songId);
    let updated: BukuSong[] = [];
    if (existingIdx !== -1) {
      updated = [...bukuNyanyianDb];
      updated[existingIdx] = newSong;
    } else {
      updated = [...bukuNyanyianDb, newSong].sort((a, b) => {
        if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
        return a.nomor - b.nomor;
      });
    }

    saveBukuNyanyianDb(updated);
    setIsAddSongModalOpen(false);
    showToast(`Lagu ${newSongKategori} No. ${nomorNum} "${newSongJudul}" berhasil disimpan!`);

    if (songPickerStepIndex !== null) {
      const ayatNumbers = parseVerseRange(songPickerAyat);
      const res = findSongAndFormatLyrics([newSong], newSongKategori, nomorNum, ayatNumbers);
      const st = [...litSteps];
      st[songPickerStepIndex] = {
        ...st[songPickerStepIndex],
        label: `${String(songPickerStepIndex + 1).padStart(2, '0')}. Marende ${newSongKategori} No. ${nomorNum} "${newSongJudul}"`,
        isi: res.lyrics
      };
      setLitSteps(st);
      setSongPickerStepIndex(null);
    }
  };

  const handleDeleteSongFromDb = (songId: string) => {
    triggerConfirm(
      'Hapus Lagu dari Database',
      'Apakah Anda yakin ingin menghapus lagu ini dari database buku nyanyian?',
      () => {
        const updated = bukuNyanyianDb.filter(s => s.id !== songId);
        saveBukuNyanyianDb(updated);
        showToast('Lagu berhasil dihapus dari database.');
      }
    );
  };

  const handleProcessImportDb = () => {
    if (!importDbJsonText.trim()) {
      alert('Mohon masukkan atau tempel format data JSON database lagu.');
      return;
    }
    const songs = normalizeSongImport(importDbJsonText);
    if (songs.length === 0) {
      alert('Tidak ada lagu yang valid dikenali. Pastikan struktur data JSON berisi kategori, nomor, judul, dan ayatList atau lirik.');
      return;
    }

    let finalDb: BukuSong[] = [];
    if (importDbMode === 'replace') {
      finalDb = songs;
    } else {
      const map = new Map<string, BukuSong>();
      bukuNyanyianDb.forEach(s => map.set(s.id, s));
      songs.forEach(s => map.set(s.id, s));
      finalDb = Array.from(map.values()).sort((a, b) => {
        if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
        return a.nomor - b.nomor;
      });
    }

    saveBukuNyanyianDb(finalDb);
    setIsImportDbModalOpen(false);
    setImportDbJsonText('');
    showToast(`Berhasil menyimpan ${songs.length} lagu ke database buku nyanyian!`);
  };

  const handleExportDb = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bukuNyanyianDb, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `database_buku_nyanyian_hkbp_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Database buku nyanyian berhasil diekspor!');
  };

  const handleResetToDefaultDb = () => {
    triggerConfirm(
      'Reset ke Katalog Standar HKBP',
      'Apakah Anda yakin ingin mengatur ulang database ke katalog bawaan awal?',
      () => {
        saveBukuNyanyianDb(INITIAL_BUKU_NYANYIAN_DB);
        showToast('Database buku nyanyian diatur ulang ke standar HKBP.');
      }
    );
  };

  const handleSyncFromApi = async () => {
    const s = parseInt(syncStart, 10);
    const e = parseInt(syncEnd, 10);
    const maxVal = syncBook === 'BN' ? 865 : syncBook === 'KJ' ? 478 : 867;
    const bookTitle = syncBook === 'BN' ? 'Buku Nyanyian (BN)' : syncBook === 'KJ' ? 'Kidung Jemaat (KJ)' : 'Buku Ende (BE)';
    const bookPath = syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung' : 'buku-ende';

    if (isNaN(s) || isNaN(e) || s <= 0 || e < s || e > maxVal) {
      alert(`Mohon masukkan rentang nomor lagu yang valid antara 1 hingga ${maxVal}.`);
      return;
    }

    setIsSyncingApi(true);
    setSyncProgress(`Mengambil lagu ${bookTitle} No. ${s} sampai ${e} dari portal resmi HKBP (hkbp.or.id/${bookPath})...`);

    try {
      const fetchedSongs = await fetchBatchFromApi(s, e, syncBook);
      if (fetchedSongs.length === 0) {
        alert(`Gagal mengambil lagu dari portal resmi HKBP (hkbp.or.id/${bookPath}). Pastikan server terhubung ke internet.`);
        setIsSyncingApi(false);
        return;
      }

      // Merge with existing
      const map = new Map<string, BukuSong>();
      bukuNyanyianDb.forEach(song => map.set(song.id, song));
      fetchedSongs.forEach(song => map.set(song.id, song));

      const updated = Array.from(map.values()).sort((a, b) => {
        if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
        return a.nomor - b.nomor;
      });

      saveBukuNyanyianDb(updated);
      showToast(`✓ Berhasil menyinkronkan ${fetchedSongs.length} lagu ${syncBook} dari hkbp.or.id!`);
      setIsSyncApiModalOpen(false);
    } catch (err: any) {
      alert(`Terjadi kesalahan saat sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncingApi(false);
      setSyncProgress('');
    }
  };

  // ----------------------------------------------------
  // CRUD HANDLERS - WARTA JEMAAT
  // ----------------------------------------------------
  const startEditWarta = (w: Warta) => {
    setEditingWartaId(w.id);
    setWartaTitle(w.judul);
    setWartaIsi(w.isi);
    setWartaKategori(w.kategori);
    setWartaPenulis(w.penulis || '');
    setWartaPrioritas(w.prioritas);
  };

  const startNewWarta = () => {
    setEditingWartaId('new');
    setWartaTitle('Warta Kebaktian - ');
    setWartaIsi('');
    setWartaKategori('umum');
    setWartaPenulis('Sekretaris Huria');
    setWartaPrioritas(false);
  };

  const handleSaveWarta = () => {
    const list = [...wartaList];
    const newW: Warta = {
      id: editingWartaId === 'new' ? `warta-custom-${Date.now()}` : editingWartaId!,
      judul: wartaTitle,
      isi: wartaIsi,
      tanggal: new Date().toISOString().split('T')[0],
      kategori: wartaKategori,
      penulis: wartaPenulis || undefined,
      prioritas: wartaPrioritas
    };

    if (editingWartaId === 'new') {
      list.unshift(newW); // Put newest announcements on top
    } else {
      const idx = list.findIndex((w) => w.id === editingWartaId);
      if (idx !== -1) list[idx] = newW;
    }

    onUpdateWarta(list);
    setEditingWartaId(null);
    showToast('Warta Jemaat Berhasil Disimpan!');
  };

  const handleDeleteWarta = (id: string) => {
    triggerConfirm(
      'Hapus Warta Jemaat',
      'Apakah Anda yakin ingin menghapus pengumuman warta jemaat ini?',
      () => {
        const filtered = wartaList.filter((w) => w.id !== id);
        onUpdateWarta(filtered);
        showToast('Warta Dihapus.');
      }
    );
  };

  // ----------------------------------------------------
  // CRUD HANDLERS - KEUANGAN JEMAAT
  // ----------------------------------------------------
  const startEditTransaksi = (t: Transaksi) => {
    setEditingTransaksiId(t.id);
    setTxTipe(t.tipe);
    setTxKategori(t.kategori);
    setTxJumlah(t.jumlah);
    setTxTanggal(t.tanggal);
    setTxKeterangan(t.keterangan);
    setTxTipeKas(t.tipeKas || getTipeKasOfTransaction(t, customBalanceTitle));
    setTxSentralisasiPersen(t.sentralisasiPersen || 0);
  };

  const startNewTransaksi = () => {
    setEditingTransaksiId('new');
    setTxTipe('pemasukan');
    setTxKategori('Pelean IA (Umum)');
    setTxJumlah(0);
    setTxTanggal(new Date().toISOString().split('T')[0]);
    setTxKeterangan('');
    setTxTipeKas('Kas Huria');
    setTxSentralisasiPersen(0);
  };

  const handleSaveTransaksi = () => {
    const list = [...transaksiList];
    const newT: Transaksi = {
      id: editingTransaksiId === 'new' ? `tx-custom-${Date.now()}` : editingTransaksiId!,
      tipe: txTipe,
      kategori: txKategori,
      jumlah: Number(txJumlah),
      tanggal: txTanggal,
      keterangan: txKeterangan,
      tipeKas: txTipeKas,
      sentralisasiPersen: txTipe === 'pemasukan' ? Number(txSentralisasiPersen) : undefined
    };

    if (editingTransaksiId === 'new') {
      list.unshift(newT);
    } else {
      const idx = list.findIndex((t) => t.id === editingTransaksiId);
      if (idx !== -1) list[idx] = newT;
    }

    onUpdateTransaksi(list);
    setEditingTransaksiId(null);
    showToast('Transaksi Keuangan Tersimpan!');
  };

  const handleDeleteTransaksi = (id: string) => {
    triggerConfirm(
      'Hapus Transaksi Keuangan',
      'Apakah Anda yakin ingin menghapus transaksi ini? Saldo akhir kas akan disesuaikan secara otomatis.',
      () => {
        const filtered = transaksiList.filter((t) => t.id !== id);
        onUpdateTransaksi(filtered);
        showToast('Transaksi Berhasil Dihapus.');
      }
    );
  };

  // ----------------------------------------------------
  // CRUD HANDLERS - BIRTHDAY LISTS
  // ----------------------------------------------------
  const startEditJemaat = (j: Jemaat) => {
    setEditingJemaatId(j.id);
    setJmNama(j.nama);
    setJmTglLahir(j.tanggalLahir);
    setJmSektor(j.sektor);
    setJmNoHP(j.noHP || '');
    
    // Extracted custom fields
    const standardKeys = ['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'];
    const customs: Record<string, string> = {};
    
    // Ensure all custom columns currently in jemaatColumns are represented
    jemaatColumns.forEach((col) => {
      if (!standardKeys.includes(col.key)) {
        customs[col.key] = j[col.key] !== undefined && j[col.key] !== null ? j[col.key].toString() : '';
      }
    });
    
    setJmCustomFields(customs);
  };

  const startNewJemaat = () => {
    setEditingJemaatId('new');
    setJmNama('');
    setJmTglLahir('1990-06-12');
    setJmSektor('Sektor III');
    setJmNoHP('0812');
    
    // Initialize custom fields from current jemaatColumns
    const standardKeys = ['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'];
    const customs: Record<string, string> = {};
    jemaatColumns.forEach((col) => {
      if (!standardKeys.includes(col.key)) {
        customs[col.key] = '';
      }
    });
    setJmCustomFields(customs);
  };

  const handleSaveJemaat = () => {
    const list = [...jemaatList];
    const newJ: Jemaat = {
      id: editingJemaatId === 'new' ? `jm-custom-${Date.now()}` : editingJemaatId!,
      nama: jmNama,
      tanggalLahir: jmTglLahir,
      sektor: jmSektor,
      noHP: jmNoHP || undefined,
      ...jmCustomFields
    };

    if (editingJemaatId === 'new') {
      list.push(newJ);
    } else {
      const idx = list.findIndex((j) => j.id === editingJemaatId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...newJ };
      }
    }

    onUpdateJemaat(list);
    setEditingJemaatId(null);
    showToast('Data Jemaat Berhasil Disimpan!');
  };

  const handleDeleteJemaat = (id: string) => {
    triggerConfirm(
      'Hapus Data Jemaat',
      'Apakah Anda yakin ingin menghapus data biodata jemaat ini?',
      () => {
        const filtered = jemaatList.filter((j) => j.id !== id);
        onUpdateJemaat(filtered);
        showToast('Biodata Jemaat Dihapus.');
      }
    );
  };

  const handleDeleteAllJemaat = () => {
    triggerConfirm(
      'Hapus Semua Data Jemaat',
      'Apakah Anda yakin ingin menghapus seluruh data biodata jemaat? Tindakan ini tidak dapat dibatalkan.',
      () => {
        onUpdateJemaat([]);
        showToast('Semua data biodata jemaat berhasil dihapus.');
      }
    );
  };

  // ----------------------------------------------------
  // EXCEL IMPORTERS FOR JEMAAT
  // ----------------------------------------------------
  const downloadJemaatExcelTemplate = () => {
    const wsData = [
      ["Nama Lengkap", "Sektor / Wijk", "Tanggal Lahir (YYYY-MM-DD)", "No HP / WhatsApp"],
      ["Ronal Siahaan", "Sektor I", "1990-08-15", "081234567890"],
      ["Tiara Situmorang", "Sektor IV", "1995-12-03", "082198765432"],
      ["Marihot Silalahi", "Sektor VII", "1984-03-24", "085299887766"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Jemaat");
    XLSX.writeFile(wb, "Template_Impor_Jemaat_HKBP.xlsx");
    showToast('Template Excel berhasil diunduh!');
  };

  const handleJemaatExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelErrorMsg('');
    setParsedJemaatList([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (rawRows.length === 0) {
          setExcelErrorMsg('Berkas Excel kosong.');
          return;
        }

        let headerRowIdx = 0;
        let foundHeader = false;

        // Try to find a row in the first 15 rows that has a cell containing some variation of "nama" or "name"
        for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
          const row = rawRows[r];
          if (row && Array.isArray(row) && row.length > 0) {
            const hasNama = row.some((cell: any) => {
              if (cell === undefined || cell === null) return false;
              const s = cell.toString().toLowerCase().trim();
              return s === 'nama' || s === 'nama lengkap' || s === 'name' || s.includes('nama');
            });
            if (hasNama) {
              headerRowIdx = r;
              foundHeader = true;
              break;
            }
          }
        }

        // Fallback: search for first non-empty row with at least 2 non-empty values
        if (!foundHeader) {
          for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
            const row = rawRows[r];
            if (row && Array.isArray(row) && row.filter(cell => cell !== undefined && cell !== null && cell.toString().trim() !== '').length >= 2) {
              headerRowIdx = r;
              break;
            }
          }
        }

        const headers = rawRows[headerRowIdx] as any[];
        if (!headers || headers.length === 0) {
          setExcelErrorMsg('Tidak dapat mendeteksi baris header kolom di berkas Excel Anda.');
          return;
        }

        const findColIdx = (aliases: string[]) => {
          return headers.findIndex(h => {
            if (!h) return false;
            const s = h.toString().toLowerCase().trim();
            return aliases.some(alias => s.includes(alias.toLowerCase()));
          });
        };

        const namaIdx = findColIdx(['nama lengkap', 'nama', 'name']);
        const sektorIdx = findColIdx(['sektor', 'wijk', 'sector']);
        const tglLahirIdx = findColIdx(['tanggal lahir', 'tgl lahir', 'lahir', 'birth']);
        const noHpIdx = findColIdx(['no hp', 'whatsapp', 'wa', 'no. hp', 'no. whatsapp', 'no.hp', 'no.whatsapp', 'phone', 'telepon', 'telp']);

        // System automatically adjusts to whatever columns exist, using fallbacks if standard ones are missing.
        const actualNamaIdx = namaIdx !== -1 ? namaIdx : 0;

        const formatExcelDate = (val: any) => {
          if (!val) return '';
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
          }
          
          const str = val.toString().trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
          }

          const parsedDate = new Date(str);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }

          const parts = str.split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              const y = parts[0];
              const m = parts[1].padStart(2, '0');
              const d = parts[2].padStart(2, '0');
              return `${y}-${m}-${d}`;
            } else {
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              const y = parts[2];
              if (y.length === 4) {
                return `${y}-${m}-${d}`;
              }
            }
          }
          return str;
        };

        const result: Jemaat[] = [];
        for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const nama = row[actualNamaIdx]?.toString().trim() || '';
          if (!nama) continue;

          const sektorRaw = (sektorIdx !== -1 && row[sektorIdx]) ? row[sektorIdx].toString().trim() : 'Sektor III';
          let sektor = sektorRaw;
          const numMatch = sektorRaw.match(/\d+/);
          if (numMatch) {
            const num = parseInt(numMatch[0]);
            const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            if (num >= 1 && num <= 10) {
              sektor = `Sektor ${romanNumerals[num]}`;
            }
          }

          const tanggalLahir = tglLahirIdx !== -1 ? formatExcelDate(row[tglLahirIdx]) : '1990-01-01';
          const noHP = noHpIdx !== -1 && row[noHpIdx] ? row[noHpIdx].toString().trim() : '';

          const item: Jemaat = {
            id: `jm-excel-${Date.now()}-${i}`,
            nama,
            sektor,
            tanggalLahir: tanggalLahir || '1990-01-01',
            noHP: noHP || undefined
          };

          // Capture other custom columns!
          headers.forEach((header, colIdx) => {
            if (!header) return;
            if (colIdx !== actualNamaIdx && colIdx !== sektorIdx && colIdx !== tglLahirIdx && colIdx !== noHpIdx) {
              const key = header.toString().trim();
              const val = row[colIdx];
              if (val !== undefined && val !== null && val !== '') {
                item[key] = val.toString().trim();
              }
            }
          });

          result.push(item);
        }

        if (result.length === 0) {
          setExcelErrorMsg('Tidak ada baris data jemaat valid yang berhasil diproses.');
        } else {
          setParsedJemaatList(result);
        }
      } catch (err: any) {
        console.error(err);
        setExcelErrorMsg(`Gagal membaca berkas: ${err?.message || 'Format tidak valid'}`);
      }
    };

    reader.onerror = () => {
      setExcelErrorMsg('Gagal membaca berkas.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveImportedJemaat = () => {
    if (parsedJemaatList.length === 0) return;

    let updatedList: Jemaat[] = [];
    if (jemaatImportMode === 'append') {
      updatedList = [...jemaatList, ...parsedJemaatList];
    } else {
      updatedList = [...parsedJemaatList];
    }

    onUpdateJemaat(updatedList);
    setShowJemaatExcelModal(false);
    setParsedJemaatList([]);
    setExcelFileName('');
    setExcelErrorMsg('');
    showToast(`Berhasil mengimpor ${parsedJemaatList.length} data jemaat dari Excel!`);
  };

  // Database Akun (Excel/CSV) helper functions
  const handleExportAccountsCSV = () => {
    const listToExport = accountsList.length > 0 ? accountsList : [
      {
        username: 'Pirma 15',
        email: 'pirmasiahaan12342@gmail.com',
        password: 'Pirma 08',
        namaGereja: 'HKBP Hinalang Silalahi',
        status: 'ruas' as const
      }
    ];

    const headers = ['Username', 'Email', 'Password', 'Nama Gereja', 'Status'];
    const csvRows = [headers.join(',')];

    listToExport.forEach(admin => {
      const row = [
        `"${admin.username.replace(/"/g, '""')}"`,
        `"${admin.email.replace(/"/g, '""')}"`,
        `"${(admin.password || '').replace(/"/g, '""')}"`,
        `"${(admin.namaGereja || 'HKBP Hinalang Silalahi').replace(/"/g, '""')}"`,
        `"${admin.status || 'parhalado'}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'database_akun_hkbp.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Berhasil mengekspor database akun ke format Excel (.csv)!');
  };

  const handleImportAccountsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          alert('File CSV kosong atau tidak memiliki data.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const usernameIndex = headers.indexOf('username');
        const emailIndex = headers.indexOf('email');
        const passwordIndex = headers.indexOf('password');
        const namaGerejaIndex = headers.indexOf('nama gereja') !== -1 ? headers.indexOf('nama gereja') : headers.indexOf('namagereja');
        const statusIndex = headers.indexOf('status');

        if (usernameIndex === -1 || emailIndex === -1 || passwordIndex === -1) {
          alert('Format CSV salah. Header wajib: Username, Email, Password, Nama Gereja, Status');
          return;
        }

        const parsedAdmins: AdminCredentials[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = line.split(',').map(col => {
            return col.trim().replace(/^["']|["']$/g, '');
          });

          if (columns.length < 3) continue;

          const username = columns[usernameIndex];
          const email = columns[emailIndex];
          const password = columns[passwordIndex];
          const namaGereja = namaGerejaIndex !== -1 ? columns[namaGerejaIndex] : 'HKBP Hinalang Silalahi';
          const statusRaw = statusIndex !== -1 ? columns[statusIndex].toLowerCase() : 'ruas';
          const status: 'ruas' | 'parhalado' = (statusRaw === 'parhalado' || statusRaw === 'admin') ? 'parhalado' : 'ruas';

          if (username && email && password) {
            parsedAdmins.push({
              username,
              email,
              password,
              namaGereja: namaGereja || 'HKBP Hinalang Silalahi',
              status
            });
          }
        }

        if (parsedAdmins.length === 0) {
          alert('Tidak ada data akun valid yang ditemukan di file CSV.');
          return;
        }

        const existing = [...accountsList];
        let addedCount = 0;
        let updatedCount = 0;

        parsedAdmins.forEach(parsed => {
          const existingIdx = existing.findIndex(admin => admin.email.toLowerCase() === parsed.email.toLowerCase() || admin.username.toLowerCase() === parsed.username.toLowerCase());
          if (existingIdx !== -1) {
            existing[existingIdx] = parsed;
            updatedCount++;
          } else {
            existing.push(parsed);
            addedCount++;
          }
        });

        localStorage.setItem('hkbp_registered_admins', JSON.stringify(existing));
        setAccountsList(existing);
        saveRegisteredAdminsToServer(existing);
        showToast(`Impor Excel Berhasil! ${addedCount} baru, ${updatedCount} diperbarui.`);
        
        if (e.target) {
          e.target.value = '';
        }
      } catch (err) {
        alert('Gagal membaca file CSV. Pastikan format file sesuai.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAccount = async () => {
    if (!accountFormUsername || !accountFormEmail || !accountFormPassword || !accountFormNamaGereja) {
      alert('Mohon isi seluruh data akun!');
      return;
    }

    const emailTrimmed = accountFormEmail.trim().toLowerCase();

    // Email format validation (standard RFC 5322 regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      alert('Format email tidak valid! Mohon masukkan email aktif yang benar (contoh: nama@domain.com).');
      return;
    }

    // Check for throwaway/fake email domains
    const fakeDomains = [
      'mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com', 
      'dispostable.com', 'sharklasers.com', 'getairmail.com', 'maildrop.cc'
    ];
    const emailDomain = emailTrimmed.split('@')[1];
    if (fakeDomains.includes(emailDomain)) {
      alert('Maaf, pendaftaran menggunakan email sementara tidak diizinkan. Mohon gunakan email aktif Anda yang sesungguhnya (misal Gmail, Yahoo, Outlook, dll).');
      return;
    }

    const newAccount: AdminCredentials = {
      username: accountFormUsername.trim(),
      email: emailTrimmed,
      password: accountFormPassword,
      namaGereja: accountFormNamaGereja.trim(),
      status: accountFormStatus
    };

    // If it's a new account, check for duplicates
    if (editingAccountIdx === null) {
      const isDuplicate = accountsList.some(
        (a) =>
          a.username.toLowerCase() === newAccount.username.toLowerCase() ||
          a.email.toLowerCase() === newAccount.email.toLowerCase()
      );
      if (isDuplicate) {
        alert('Username atau Email sudah terdaftar!');
        return;
      }
    }

    // Direct save to localStorage
    const updated = [...accountsList];
    if (editingAccountIdx !== null) {
      // Update existing
      updated[editingAccountIdx] = newAccount;
      showToast('Akun berhasil diperbarui!');
    } else {
      // Add new
      updated.push(newAccount);
      showToast('Akun baru berhasil ditambahkan!');
    }

    localStorage.setItem('hkbp_registered_admins', JSON.stringify(updated));
    setAccountsList(updated);
    saveRegisteredAdminsToServer(updated);

    // Reset Form
    setAccountFormUsername('');
    setAccountFormEmail('');
    setAccountFormPassword('');
    setAccountFormNamaGereja('');
    setAccountFormStatus('ruas');
    setIsAddingAccount(false);
    setEditingAccountIdx(null);
  };

  const handleDeleteAccount = (idx: number) => {
    const target = accountsList[idx];
    if (target.username === 'admin') {
      alert('Akun admin utama tidak boleh dihapus demi keamanan!');
      return;
    }

    triggerConfirm(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus akun "${target.username}"? Akun ini tidak akan bisa digunakan lagi untuk login.`,
      () => {
        const updated = accountsList.filter((_, i) => i !== idx);
        localStorage.setItem('hkbp_registered_admins', JSON.stringify(updated));
        setAccountsList(updated);
        saveRegisteredAdminsToServer(updated);
        showToast('Akun berhasil dihapus!');
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans overflow-x-hidden relative">
      {/* Decorative ambiance blur circles */}
      <div className="absolute top-10 left-12 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* SIDEBAR NAVIGATION - Optimized for Desktop as requested */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-5 relative z-10 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-start space-x-3 pb-5 border-b border-slate-200">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5 shadow-sm shrink-0">
              <img
                src="/hkbp.png"
                alt="HKBP Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-none truncate">
                {loggedAdmin?.username || 'Admin'}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-tight truncate">
                {loggedAdmin?.namaGereja || 'HKBP Hinalang Silalahi'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mt-1.5 leading-none">
                {loggedAdmin?.status === 'ruas' ? 'Ruas Jemaat' : 'Parhalado'}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveSubTab('dashboard');
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Dashboard Tren</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('liturgi');
                setEditingLiturgyId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'liturgi'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Acara Ibadah</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('petugas');
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'petugas'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Petugas Ibadah</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('warta');
                setEditingWartaId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'warta'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>Warta Jemaat</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('keuangan');
                setEditingTransaksiId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'keuangan'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Keuangan</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('jemaat');
                setEditingJemaatId(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'jemaat'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 shrink-0" />
                <span>Daftar Jemaat</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                activeSubTab === 'jemaat' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {jemaatList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('arsip_pdf');
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all text-left cursor-pointer border ${
                activeSubTab === 'arsip_pdf'
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Arsip Berkas & PDF</span>
            </button>
          </nav>
        </div>

        {/* EDITABLE CHURCH PROFILE ITEMS */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider pl-4 mb-2">Profil & Info Gereja</p>
          
          <button
            onClick={() => setActiveSubTab('jadwal')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all text-left cursor-pointer border ${
              activeSubTab === 'jadwal'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Edit Jadwal Ibadah</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sejarah')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all text-left cursor-pointer border ${
              activeSubTab === 'sejarah'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Tentang Gereja</span>
          </button>

          <button
            onClick={() => setActiveSubTab('parhalado')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all text-left cursor-pointer border ${
              activeSubTab === 'parhalado'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Edit Daftar Parhalado</span>
          </button>

          <button
            onClick={() => setActiveSubTab('database_akun')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all text-left cursor-pointer border ${
              activeSubTab === 'database_akun'
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-transparent text-white shadow shadow-blue-500/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Database Akun Pengguna</span>
          </button>
        </div>

        {/* LOGOUT FOOTER BUTTON */}
        <div className="pt-4 border-t border-slate-250">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 font-bold text-xs rounded-xl uppercase tracking-wide transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto h-screen relative z-10">
        
        {/* RE-USABLE TOAST FEEDBACK ALERT */}
        {savedSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 border border-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-2xl animate-bounce">
            <Check className="w-4 h-4" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}

        {/* HEADER BRAND */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div>
            <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-widest bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              Sistem Pengelola Data Huria (CRUD)
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2.5 tracking-tight">
              {activeSubTab === 'dashboard' && 'Dashboard Analisis & Tren Kehadiran'}
              {activeSubTab === 'liturgi' && 'Manajemen Liturgi & Tata Ibadah'}
              {activeSubTab === 'petugas' && 'Manajemen Petugas & Pelayan Ibadah'}
              {activeSubTab === 'warta' && 'Manajemen Warta Jemaat (Tingting)'}
              {activeSubTab === 'keuangan' && 'Manajemen Keuangan Buku Kas'}
              {activeSubTab === 'jemaat' && 'Manajemen Database Jemaat'}
              {activeSubTab === 'arsip_pdf' && 'Perpustakaan & Arsip Dokumen PDF'}
              {activeSubTab === 'jadwal' && 'Manajemen Jadwal Ibadah Hari Minggu'}
              {activeSubTab === 'sejarah' && 'Manajemen Tentang Gereja'}
              {activeSubTab === 'parhalado' && 'Manajemen Daftar Parhalado Huria'}
              {activeSubTab === 'database_akun' && 'Sistem Manajemen & Database Akun Pengguna'}
              {activeSubTab === 'buku_nyanyian' && 'Database Buku Nyanyian & Kidung HKBP'}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              {activeSubTab === 'dashboard' && 'Pantau grafik perkembangan dan statistik tingkat kehadiran jemaat dalam kebaktian Minggu dan Partangiangan Sektor selama 4 minggu terakhir.'}
              {activeSubTab === 'petugas' && 'Kelola pembagian petugas liturgi, operator, song leader, dan pelayan jemaat untuk kebaktian Minggu dan Partangiangan.'}
              {activeSubTab === 'liturgi' && 'Merubah data liturgi dan tata ibadah yang tampil di layar aplikasi mobile jemaat gereja secara riil-time.'}
              {activeSubTab === 'warta' && 'Tulis, perbarui, dan kelola lembaran warta jemaat (tingting) mingguan.'}
              {activeSubTab === 'keuangan' && 'Catat dan kelola pembukuan pemasukan dan pengeluaran kas keuangan gereja.'}
              {activeSubTab === 'jemaat' && 'Lihat dan kelola database registrasi serta biodata jemaat HKBP Hinalang Silalahi.'}
              {activeSubTab === 'arsip_pdf' && 'Unggah, hapus, dan kelola dokumen PDF tata acara ibadah resmi.'}
              {activeSubTab === 'jadwal' && 'Ubah jam pelaksanaan ibadah Sekolah Minggu, Shift 1, dan Shift 2 yang berlaku.'}
              {activeSubTab === 'sejarah' && 'Kelola konten informasi, profil, visi & misi, serta unggah dokumentasi gambar tentang HKBP Hinalang Silalahi.'}
              {activeSubTab === 'parhalado' && 'Tambah, ubah, atau hapus susunan nama pelayan parhalado beserta nomor telepon/WA.'}
              {activeSubTab === 'database_akun' && 'Kelola database otentikasi akun jemaat (ruas) dan pengurus (parhalado).'}
              {activeSubTab === 'buku_nyanyian' && 'Katalog lagu Buku Ende HKBP. Terintegrasi langsung dengan portal resmi https://hkbp.or.id/buku-ende untuk pengisian nomor, ayat, dan lirik asli otentik secara otomatis.'}
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANEL 0: DASHBOARD & TRENS                               */}
        {/* ======================================================== */}
        {activeSubTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* KPI STATS CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CARD 1: SUNDAY ATTENDANCE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Kebaktian Minggu Terbaru</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
                    {kpis.latestSunday} <span className="text-xs font-semibold text-slate-500">Jemaat</span>
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Rata-rata: {kpis.avgSunday}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${kpis.sundayGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {kpis.sundayGrowth >= 0 ? '+' : ''}{kpis.sundayGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CARD 2: PARTANGIANGAN ATTENDANCE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Partangiangan Sektor Terbaru</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
                    {kpis.latestPartangiangan} <span className="text-xs font-semibold text-slate-500">Jemaat</span>
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Rata-rata: {kpis.avgPartangiangan}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${kpis.partangianganGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {kpis.partangianganGrowth >= 0 ? '+' : ''}{kpis.partangianganGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CARD 3: COMBINED AVERAGE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rata-rata Kebaktian Minggu</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {kpis.avgSunday} <span className="text-xs font-semibold text-slate-500">Jemaat / Minggu</span>
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Periode: 4 Minggu Terakhir</span>
                  <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">Aktif</span>
                </div>
              </div>

              {/* CARD 4: COMBINED AVERAGE PARTANGIANGAN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rata-rata Partangiangan Sektor</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {kpis.avgPartangiangan} <span className="text-xs font-semibold text-slate-500">Jemaat / Minggu</span>
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Periode: 4 Minggu Terakhir</span>
                  <span className="text-[10px] text-teal-600 font-extrabold bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100">Sektor I-VI</span>
                </div>
              </div>
            </div>

            {/* CHART VIEW CARD */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-105 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                    <span>Tren Tingkat Kehadiran Jemaat</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Grafik interaktif membandingkan kehadiran kebaktian Minggu dan Partangiangan Sektor.
                  </p>
                </div>

                {/* CHART TAB SELECTOR */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setChartTab('total')}
                    className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${chartTab === 'total' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Ikhtisar Tren
                  </button>
                  <button
                    onClick={() => setChartTab('minggu')}
                    className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${chartTab === 'minggu' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Detail Minggu
                  </button>
                  <button
                    onClick={() => setChartTab('partangiangan')}
                    className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${chartTab === 'partangiangan' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Detail Partangiangan
                  </button>
                </div>
              </div>

              {/* RECHARTS CANVAS AREA */}
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartTab === 'total' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMinggu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPartangiangan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="weekLabel" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" name="Kebaktian Minggu (Total)" dataKey="Total Kebaktian Minggu" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorMinggu)" />
                      <Area type="monotone" name="Partangiangan Sektor (Total)" dataKey="Total Partangiangan" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorPartangiangan)" />
                    </AreaChart>
                  ) : chartTab === 'minggu' ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="weekLabel" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="Shift 1 (Minggu)" name="Shift 1" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Shift 2 (Minggu)" name="Shift 2" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Sekolah Minggu (Minggu)" name="Sekolah Minggu" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="weekLabel" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="Ama (Partangiangan)" name="Ama" stackId="b" fill="#0284c7" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Ina (Partangiangan)" name="Ina" stackId="b" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Sekolah Minggu (Partangiangan)" name="Sekolah Minggu" stackId="b" fill="#eab308" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Remaja/Naposo (Partangiangan)" name="Remaja/Naposo" stackId="b" fill="#a855f7" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Parhalado (Partangiangan)" name="Parhalado" stackId="b" fill="#475569" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* SPREADSHEET EDITOR SECTION */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-105 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                    <span>Atur & Input Data Tren Kehadiran (Lembar Kerja 4 Minggu)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Modifikasi data kehadiran setiap minggu secara langsung untuk merubah grafik tren di atas.
                  </p>
                </div>

                <button
                  onClick={handleSaveAttendanceTrends}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-black text-white rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer self-start md:self-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>

              {/* GRID EDITOR SPREADSHEET */}
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-150">
                      <th className="px-3 py-3 font-black text-slate-900 bg-slate-100/50 w-[16%]">Kategori / Minggu</th>
                      <th className="px-2 py-3 text-center bg-blue-50/50 text-blue-800 font-extrabold w-[10%]">Minggu: Shift 1</th>
                      <th className="px-2 py-3 text-center bg-blue-50/50 text-blue-800 font-extrabold w-[10%]">Minggu: Shift 2</th>
                      <th className="px-2 py-3 text-center bg-blue-50/50 text-blue-800 font-extrabold w-[10%]">Minggu: Sek. Minggu</th>
                      <th className="px-2 py-3 text-center bg-emerald-50/30 text-emerald-800 font-extrabold w-[10%] border-l border-slate-200">Part.: Ama</th>
                      <th className="px-2 py-3 text-center bg-emerald-50/30 text-emerald-800 font-extrabold w-[8%]">Part.: Ina</th>
                      <th className="px-2 py-3 text-center bg-emerald-50/30 text-emerald-800 font-extrabold w-[8%]">Part.: SM</th>
                      <th className="px-2 py-3 text-center bg-emerald-50/30 text-emerald-800 font-extrabold w-[8%]">Part.: ReNa</th>
                      <th className="px-2 py-3 text-center bg-emerald-50/30 text-emerald-800 font-extrabold w-[8%]">Part.: Prhd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {tempAttendanceTrends.map((trend, idx) => {
                      const isLatestWeek = idx === tempAttendanceTrends.length - 1;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                          {/* WEEKS LABELS & DATE */}
                          <td className="px-3 py-2 bg-slate-50/30">
                            <input
                              type="text"
                              value={trend.weekLabel}
                              onChange={(e) => handleTrendCellChange(idx, 'weekLabel', e.target.value)}
                              className="w-full bg-transparent font-black text-slate-800 text-[11px] focus:bg-white border-0 focus:border border-slate-250 focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 outline-none"
                              placeholder="Minggu Ke-X"
                            />
                            <input
                              type="text"
                              value={trend.tanggalRange}
                              onChange={(e) => handleTrendCellChange(idx, 'tanggalRange', e.target.value)}
                              className="w-full bg-transparent text-[9px] text-slate-500 focus:bg-white border-0 focus:border border-slate-250 focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 outline-none font-medium mt-0.5"
                              placeholder="Tgl: Contoh 14 Juni 2026"
                            />
                            {isLatestWeek && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-850 font-extrabold text-[8px] uppercase tracking-wider rounded-md border border-emerald-200">
                                Minggu Terbaru
                              </span>
                            )}
                          </td>

                          {/* MINGGU BREAKDOWN INPUTS */}
                          <td className="px-1.5 py-2 text-center bg-blue-50/10">
                            <input
                              type="number"
                              value={trend.mingguAma || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'mingguAma', e.target.value)}
                              className="w-16 bg-white border border-slate-200/80 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-1.5 py-2 text-center bg-blue-50/10">
                            <input
                              type="number"
                              value={trend.mingguIna || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'mingguIna', e.target.value)}
                              className="w-16 bg-white border border-slate-200/80 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-1.5 py-2 text-center bg-blue-50/10">
                            <input
                              type="number"
                              value={trend.mingguSm || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'mingguSm', e.target.value)}
                              className="w-16 bg-white border border-slate-200/80 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </td>

                          {/* PARTANGIANGAN BREAKDOWN INPUTS */}
                          <td className="px-1.5 py-2 text-center bg-emerald-50/5 border-l border-slate-200">
                            <div className="relative inline-block">
                              <input
                                type="number"
                                value={trend.partangianganAma || 0}
                                onChange={(e) => handleTrendCellChange(idx, 'partangianganAma', e.target.value)}
                                className={`w-16 border rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 outline-none transition ${
                                  isLatestWeek
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-550'
                                    : 'bg-white border-slate-200/80 focus:border-teal-500 focus:ring-teal-500'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="px-1.5 py-2 text-center bg-emerald-50/5">
                            <input
                              type="number"
                              value={trend.partangianganIna || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'partangianganIna', e.target.value)}
                              className={`w-16 border rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 outline-none transition ${
                                isLatestWeek
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-550'
                                  : 'bg-white border-slate-200/80 focus:border-teal-500 focus:ring-teal-500'
                              }`}
                            />
                          </td>
                          <td className="px-1.5 py-2 text-center bg-emerald-50/5">
                            <input
                              type="number"
                              value={trend.partangianganSm || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'partangianganSm', e.target.value)}
                              className={`w-16 border rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 outline-none transition ${
                                isLatestWeek
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-550'
                                  : 'bg-white border-slate-200/80 focus:border-teal-500 focus:ring-teal-500'
                              }`}
                            />
                          </td>
                          <td className="px-1.5 py-2 text-center bg-emerald-50/5">
                            <input
                              type="number"
                              value={trend.partangianganRena || 0}
                              onChange={(e) => handleTrendCellChange(idx, 'partangianganRena', e.target.value)}
                              className={`w-16 border rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 outline-none transition ${
                                isLatestWeek
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-550'
                                  : 'bg-white border-slate-200/80 focus:border-teal-500 focus:ring-teal-500'
                              }`}
                            />
                          </td>
                          <td className="px-1.5 py-2 text-center bg-emerald-50/5">
                            <div className="flex flex-col items-center space-y-1">
                              <input
                                type="number"
                                value={trend.partangianganParhalado || 0}
                                onChange={(e) => handleTrendCellChange(idx, 'partangianganParhalado', e.target.value)}
                                className={`w-14 border rounded px-1.5 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 outline-none transition ${
                                  isLatestWeek
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-550'
                                    : 'bg-white border-slate-200/80 focus:border-teal-500 focus:ring-teal-500'
                                }`}
                              />
                              {isLatestWeek && (
                                <span className="text-[8px] text-emerald-800 font-extrabold uppercase bg-emerald-100 px-1 py-0.5 rounded leading-none">
                                  ✓ Auto
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PANEL 1: MANAGING LITURGI                               */}
        {/* ======================================================== */}
        {activeSubTab === 'liturgi' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 bg-slate-200/60 p-1.5 rounded-lg border border-slate-200 inline-block">
              <button
                onClick={() => {
                  setLiturgiEditMode('minggu');
                  if (liturgiMinggu && liturgiMinggu.length > 0) {
                    const lit = liturgiMinggu[0];
                    setLitTitle(lit.judul);
                    setLitDate(lit.tanggal);
                    setLitRef(lit.ayatReferensi || '');
                    setLitSteps([...(lit.teksLiturgi || [])]);
                    setLitPdfMode(lit.isPdfMode);
                    setLitPdfUrl(lit.pdfUrl || '');
                    setLitUploadedPdfName(lit.uploadedPdfName || null);
                    setLitUploadedPdfSize(lit.uploadedPdfSize || null);
                  }
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                  liturgiEditMode === 'minggu' ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ibadah Minggu
              </button>
              <button
                onClick={() => {
                  setLiturgiEditMode('partangiangan');
                  setEditingLiturgyId(null);
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                  liturgiEditMode === 'partangiangan' ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ibadah Partangiangan
              </button>
            </div>

            {liturgiEditMode === 'minggu' ? (
              /* ONE SINGLE INTEGRATED CONTROLLER FOR SUNDAY LITURGY */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-200 pb-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pengaturan Kebaktian Minggu Jemaat</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Satu panel utama untuk mengunggah PDF dan menyusun langkah acara liturgi manual secara real-time.</p>
                  </div>
                  <span className="text-[9px] bg-blue-50 border border-blue-200 text-blue-700 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Satu Pengaturan Utama
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Ibadah Minggu</label>
                    <input
                      type="text"
                      value={litTitle}
                      onChange={(e) => setLitTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Contoh: Ibadah Minggu V Dung Trinitatis"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Ibadah</label>
                    <input
                      type="date"
                      value={litDate}
                      onChange={(e) => setLitDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Topik Minggu / Tema</label>
                    <input
                      type="text"
                      value={litTopik}
                      onChange={(e) => setLitTopik(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Contoh: Menjadi Terang dan Garam bagi Dunia"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Epistel</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={litRef}
                        onChange={(e) => setLitRef(e.target.value)}
                        onBlur={async (e) => {
                          const val = e.target.value;
                          if (!val.trim()) return;
                          const res = await fetchAndFormatScriptureFromLabel(val);
                          if (res.found && res.formattedText) {
                            const stepIdx = litSteps.findIndex(s => s.label.toLowerCase().includes('epistel'));
                            if (stepIdx !== -1) {
                              const updated = [...litSteps];
                              updated[stepIdx] = { ...updated[stepIdx], isi: res.formattedText };
                              setLitSteps(updated);
                              showToast(`✓ Teks Epistel (${res.referenceLabel}) otomatis diisi ke baris acara!`);
                            }
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="Contoh: Mateus 5 : 13 - 16 atau Yohanes 3:16"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseAlkitabReference(litRef);
                          const bId = parsed?.book?.id || '40';
                          const chap = parsed?.chapter || 1;
                          const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                          setPickerBookId(bId);
                          setPickerChapter(chap);
                          setPickerVerseRange(vRange);
                          setScripturePickerTarget({ type: 'epistel' });
                          handleUpdateScripturePickerPreview(bId, chap, vRange);
                        }}
                        className="px-3 py-2.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0 flex items-center space-x-1"
                        title="Pilih Kitab, Pasal, dan Ayat Alkitab untuk Epistel"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                        <span>📖 Pilih Kitab</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Khotbah / Jamita</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={litBacaan}
                        onChange={(e) => setLitBacaan(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="Contoh: Johanes 3 : 16 atau 1 Musa 1:1-3"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseAlkitabReference(litBacaan);
                          const bId = parsed?.book?.id || '40';
                          const chap = parsed?.chapter || 1;
                          const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                          setPickerBookId(bId);
                          setPickerChapter(chap);
                          setPickerVerseRange(vRange);
                          setScripturePickerTarget({ type: 'khotbah' });
                          handleUpdateScripturePickerPreview(bId, chap, vRange);
                        }}
                        className="px-3 py-2.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0 flex items-center space-x-1"
                        title="Pilih Kitab, Pasal, dan Ayat Alkitab untuk Khotbah"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                        <span>📖 Pilih Kitab</span>
                      </button>
                    </div>
                  </div>

                  </div>

                {/* STEPS LIST EDITING */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Susunan Acara Minggu</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ketik judul acara/lagu/nats Alkitab di kolom, teks/lirik akan terisi otomatis!</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                    {litSteps.map((step, index) => (
                      <div key={step.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <label className="text-[11px] text-slate-700 font-bold">Acara</label>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseSongFromLabel(step.label);
                                  setSongPickerStepIndex(index);
                                  if (parsed) {
                                    setSongPickerKategori(parsed.kategori);
                                    setSongPickerNomor(String(parsed.nomor));
                                    setSongPickerAyat(parsed.verseString || '1-2');
                                  } else {
                                    setSongPickerNomor('10');
                                    setSongPickerAyat('1-2');
                                  }
                                }}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition"
                                title="Pilih nomor & ayat lagu dari Buku Ende / Buku Nyanyian"
                              >
                                <Music className="w-3 h-3 text-blue-600" />
                                <span>Pilih Lagu</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseAlkitabReference(step.label);
                                  const bId = parsed?.book?.id || '40';
                                  const chap = parsed?.chapter || 1;
                                  const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                                  setPickerBookId(bId);
                                  setPickerChapter(chap);
                                  setPickerVerseRange(vRange);
                                  setScripturePickerTarget({ type: 'step', index });
                                  handleUpdateScripturePickerPreview(bId, chap, vRange);
                                }}
                                className="px-2 py-1 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 rounded text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                title="Pilih Kitab, Pasal, dan Ayat Alkitab"
                              >
                                <BookOpen className="w-3 h-3 text-blue-200" />
                                <span>📖 Pilih Kitab</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteStepRow(index)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                              title="Hapus Baris Acara Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={step.label}
                            onChange={(e) => updateStepRow(index, 'label', e.target.value)}
                            onBlur={(e) => handleAutoDetectAndFillStep(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAutoDetectAndFillStep(index, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                            placeholder="Ketik lagu/nats (contoh: 'BE No. 10:1-2', 'Yohanes 3:16', '1 Musa 1:1-3', 'Psalmen 23:1-6')..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] text-slate-500 font-semibold">Isi Acara</label>
                          </div>
                          <textarea
                            rows={Math.max(2, (step.isi || '').split('\n').length)}
                            value={step.isi}
                            onChange={(e) => updateStepRow(index, 'isi', e.target.value)}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium font-mono outline-none focus:border-blue-500 leading-relaxed overflow-hidden resize-none"
                            placeholder="Isi lirik lagu atau ayat Alkitab (Bahasa Indonesia & Batak Toba) akan otomatis terisi saat memasukkan judul di atas..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={addStepRow}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Baris Acara</span>
                  </button>

                  <button
                    onClick={() => {
                      const mainSunday = liturgiMinggu[0] || { id: 'liturgi-minggu-1' };
                      const updatedSunday: Liturgi = {
                        ...mainSunday,
                        judul: litTitle,
                        tanggal: litDate,
                        topik: litTopik || undefined,
                        ayatReferensi: litRef || undefined,
                        ayatBacaan: litBacaan || undefined,
                        teksLiturgi: litSteps,
                        isPdfMode: false,
                        pdfUrl: null,
                        uploadedPdfName: null,
                        uploadedPdfSize: null
                      };
                      const rest = liturgiMinggu.length > 0 ? liturgiMinggu.slice(1) : [];
                      onUpdateLiturgiMinggu([updatedSunday, ...rest]);
                      showToast('✓ Acara Ibadah Minggu Berhasil Disimpan & Diterapkan ke Halaman Utama!');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow shadow-blue-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DETAILED LIST / EDITING FOR LITURGI PARTANGIANGAN */
              !editingLiturgyId ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liturgiPartangiangan.map((lit, pIdx) => (
                      <div key={lit.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition shadow-sm font-sans">
                        <div>
                          <div className="flex items-center justify-between mb-3 text-sans">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="text-[9px] bg-blue-50 border border-blue-200 text-blue-700 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                                Partangiangan
                              </span>
                              {pIdx === 0 && (
                                <span className="text-[9px] bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold px-2 py-0.5 rounded tracking-wide flex items-center space-x-1 shadow-2xs">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Aktif di Halaman Utama</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">{lit.tanggal}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{lit.judul}</h4>
                        </div>

                        <div className="space-y-2 mt-5 pt-4 border-t border-slate-200">
                          {pIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApplyPartangianganToMain(lit)}
                              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
                              title="Terapkan acara ini agar langsung tampil di Halaman Utama"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Terapkan ke Halaman Utama</span>
                            </button>
                          )}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditLiturgy(lit, 'partangiangan')}
                              className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 hover:brightness-105 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Ubah Acara</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLiturgy(lit.id, 'partangiangan')}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition shrink-0 cursor-pointer"
                              title="Hapus Liturgi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => startNewLiturgy('partangiangan')}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-600 shrink-0 mb-2 transition" />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-blue-700 transition uppercase">
                        Tambah Partangiangan Baru
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* DETAILED FORM FOR PARTANGIANGAN EDITING */
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                      {editingLiturgyId === 'new' ? 'Buat Partangiangan Baru' : 'Modifikasi Partangiangan'}
                    </h3>
                    <button
                      onClick={() => setEditingLiturgyId(null)}
                      className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Ibadah Partangiangan</label>
                      <input
                        type="text"
                        value={litTitle}
                        onChange={(e) => setLitTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="Contoh: Partangiangan Sektor I"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Ibadah</label>
                      <input
                        type="date"
                        value={litDate}
                        onChange={(e) => setLitDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Epistel</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={litRef}
                          onChange={(e) => setLitRef(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                          placeholder="Contoh: Mateus 5 : 13 - 16"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseAlkitabReference(litRef);
                            const bId = parsed?.book?.id || '40';
                            const chap = parsed?.chapter || 1;
                            const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                            setPickerBookId(bId);
                            setPickerChapter(chap);
                            setPickerVerseRange(vRange);
                            setScripturePickerTarget({ type: 'epistel' });
                            handleUpdateScripturePickerPreview(bId, chap, vRange);
                          }}
                          className="px-3 py-2.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0 flex items-center space-x-1"
                          title="Pilih Kitab, Pasal, dan Ayat Alkitab untuk Epistel"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                          <span>📖 Pilih Kitab</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Khotbah</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={litBacaan}
                          onChange={(e) => setLitBacaan(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all font-semibold"
                          placeholder="Contoh: Johanes 3 : 16"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseAlkitabReference(litBacaan);
                            const bId = parsed?.book?.id || '40';
                            const chap = parsed?.chapter || 1;
                            const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                            setPickerBookId(bId);
                            setPickerChapter(chap);
                            setPickerVerseRange(vRange);
                            setScripturePickerTarget({ type: 'khotbah' });
                            handleUpdateScripturePickerPreview(bId, chap, vRange);
                          }}
                          className="px-3 py-2.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0 flex items-center space-x-1"
                          title="Pilih Kitab, Pasal, dan Ayat Alkitab untuk Khotbah"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                          <span>📖 Pilih Kitab</span>
                        </button>
                      </div>
                    </div>
                  </div>



                  {/* STEPS LIST EDITING */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Susunan Acara</h4>
                    </div>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                      {litSteps.map((step, index) => (
                        <div key={step.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <label className="text-[11px] text-slate-700 font-bold">Acara</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsed = parseSongFromLabel(step.label);
                                    setSongPickerStepIndex(index);
                                    if (parsed) {
                                      setSongPickerKategori(parsed.kategori);
                                      setSongPickerNomor(String(parsed.nomor));
                                      setSongPickerAyat(parsed.verseString || '1-2');
                                    } else {
                                      setSongPickerNomor('10');
                                      setSongPickerAyat('1-2');
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition"
                                  title="Pilih nomor & ayat lagu dari Buku Ende"
                                >
                                  <Music className="w-3 h-3 text-blue-600" />
                                  <span>Pilih Lagu & Ayat</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsed = parseAlkitabReference(step.label);
                                    const bId = parsed?.book?.id || '40';
                                    const chap = parsed?.chapter || 1;
                                    const vRange = parsed?.startVerse ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}` : '1-5';

                                    setPickerBookId(bId);
                                    setPickerChapter(chap);
                                    setPickerVerseRange(vRange);
                                    setScripturePickerTarget({ type: 'step', index });
                                    handleUpdateScripturePickerPreview(bId, chap, vRange);
                                  }}
                                  className="px-2 py-1 bg-gradient-to-r from-blue-950 via-indigo-950 to-rose-950 hover:from-blue-900 hover:to-rose-900 text-white border border-blue-800/80 rounded text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                  title="Pilih Kitab, Pasal, dan Ayat Alkitab"
                                >
                                  <BookOpen className="w-3 h-3 text-blue-200" />
                                  <span>📖 Pilih Kitab</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteStepRow(index)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Hapus Baris Acara Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={step.label}
                              onChange={(e) => updateStepRow(index, 'label', e.target.value)}
                              onBlur={(e) => handleAutoFillSongLyrics(index, e.target.value, true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAutoFillSongLyrics(index, (e.target as HTMLInputElement).value, true);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                              placeholder="Contoh: 01. Marende BE No. 93 : 1+3 atau 1,2+5..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] text-slate-500 font-semibold">Isi Acara</label>
                            </div>
                            <textarea
                              rows={Math.max(2, (step.isi || '').split('\n').length)}
                              value={step.isi}
                              onChange={(e) => updateStepRow(index, 'isi', e.target.value)}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                              }}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = `${el.scrollHeight}px`;
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium font-mono outline-none focus:border-blue-500 leading-relaxed overflow-hidden resize-none"
                              placeholder="Ketik isi liturgi, doa responsif, atau lirik ayat lagu di sini..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={addStepRow}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Baris Acara</span>
                    </button>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setEditingLiturgyId(null)}
                        className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveLiturgy}
                        className="px-5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-lg transition flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL: MANAGING PETUGAS IBADAH                           */}
        {/* ======================================================== */}
        {activeSubTab === 'petugas' && (
          <div className="space-y-6">
            {/* Segmented Sub-tab Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <button
                onClick={() => setAdminPetugasSubTab('minggu')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  adminPetugasSubTab === 'minggu'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Petugas Minggu</span>
              </button>
              <button
                onClick={() => setAdminPetugasSubTab('partangiangan')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  adminPetugasSubTab === 'partangiangan'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Petugas Partangiangan</span>
              </button>
            </div>

            {adminPetugasSubTab === 'minggu' ? (
              /* SPREADSHEET / FILE-LIKE STRUCTURE FOR PETUGAS MINGGU */
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Spreadsheet header banner */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Petugas Ibadah Minggu </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                       Ketik langsung nama petugas di sel tabel, lalu tekan simpan.
                    </p>

                    {/* EDIT DATE INPUT FOR PETUGAS MINGGU */}
                    <div className="mt-3 flex items-center space-x-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase shrink-0">Tanggal Petugas Minggu:</label>
                      <input
                        type="text"
                        value={petugasMingguDate}
                        onChange={(e) => onUpdatePetugasMingguDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-emerald-400 outline-none max-w-xs"
                        placeholder="Contoh: Minggu, 14 Juni 2026"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={handleAddPetugasMingguRow}
                      className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tugas</span>
                    </button>
                    <button
                      onClick={handleSavePetugasMinggu}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-[0.99] text-xs font-black text-white rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>

                {/* Spreadsheet Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-b border-blue-800">
                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-800 min-w-[160px] bg-blue-900 text-white">
                          Tugas
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-black uppercase tracking-wider border-b border-blue-800 bg-blue-900 text-white">
                          Petugas Ibadah
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider bg-blue-900 text-white min-w-[60px]">
                          Aksi
                        </th>
                      </tr>
                      <tr className="bg-blue-800 text-blue-100 border-b border-blue-700">
                        <th className="px-4 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider border-r border-blue-700 bg-blue-800 text-blue-100">
                          Shift 1
                        </th>
                        <th className="px-4 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider border-r border-blue-700 bg-blue-800 text-blue-100">
                          Shift 2
                        </th>
                        <th className="px-4 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider bg-blue-800 text-blue-100">
                          Sekolah Minggu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tempPetugasMinggu.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          {/* Column 1: Tugas (Editable) */}
                          <td className="p-1 border-r border-slate-200 bg-slate-50/80">
                            <input
                              type="text"
                              value={row.tugas || ''}
                              onChange={(e) => handleCellChange(index, 'tugas', e.target.value)}
                              className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 font-extrabold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg transition"
                              placeholder="Nama tugas/peran..."
                            />
                          </td>
                          {/* Column 2: Shift 1 */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.shift1 || ''}
                              onChange={(e) => handleCellChange(index, 'shift1', e.target.value)}
                              className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 font-semibold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg transition"
                              placeholder="Ketik nama petugas..."
                            />
                          </td>
                          {/* Column 3: Shift 2 */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.shift2 || ''}
                              onChange={(e) => handleCellChange(index, 'shift2', e.target.value)}
                              className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 font-semibold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg transition"
                              placeholder="Ketik nama petugas..."
                            />
                          </td>
                          {/* Column 4: Sekolah Minggu */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.sekolahMinggu || ''}
                              onChange={(e) => handleCellChange(index, 'sekolahMinggu', e.target.value)}
                              className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 font-semibold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg transition"
                              placeholder="Ketik nama petugas..."
                            />
                          </td>
                          {/* Column 5: Action (Delete row) */}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePetugasMingguRow(index)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                              title="Hapus Tugas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* DUAL TABLES WORKSPACE FOR PARTANGIANGAN */
              <div className="space-y-8">
                
                {/* TABEL 1 EDITOR: TOROP NARO MANDOHOTI PARTANGIANGAN */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></span>
                        <span>Torop Naro Mandohoti Partangiangan di Minggu Naung Salpu</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Kelola data kehadiran partangiangan per sektor (Lunggu). Baris total "Torop Naro" akan dihitung otomatis.
                      </p>

                      {/* EDIT DATE INPUT FOR TABEL 1 */}
                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase shrink-0">Hari/Tanggal:</label>
                        <input
                          type="text"
                          value={partangianganAttendanceDate}
                          onChange={(e) => onUpdatePartangianganAttendanceDate(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-teal-400 outline-none max-w-xs"
                          placeholder="Contoh: Selasa 09 Juni & Rabu 10 Juni 2026"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={handleAddPartangianganAttendanceRow}
                        className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Baris</span>
                      </button>
                      <button
                        onClick={handleSavePartangianganAttendance}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-105 active:scale-[0.99] text-xs font-black text-white rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white border-b border-teal-950">
                          <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[110px]">
                            Hari
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[150px]">
                            Lunggu
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[80px]">
                            Ama
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[80px]">
                            Ina
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[80px]">
                            SM
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[80px]">
                            ReNa
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[95px]">
                            Parhalado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 bg-teal-950/40 min-w-[100px]">
                            Naro (Total)
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider bg-teal-950/40 min-w-[60px]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tempPartangianganAttendance.map((row, index) => {
                          const rowTotal = (Number(row.ama) || 0) + 
                                           (Number(row.ina) || 0) + 
                                           (Number(row.sm) || 0) + 
                                           (Number(row.rena) || 0) + 
                                           (Number(row.parhalado) || 0);
                          return (
                            <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                              {/* 1. Hari Dropdown */}
                              <td className="p-1 border-r border-slate-200 text-center">
                                <select
                                  value={row.hari}
                                  onChange={(e) => handleAttendanceCellChange(index, 'hari', e.target.value)}
                                  className="bg-transparent px-2 py-1.5 text-xs text-slate-800 font-bold border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg cursor-pointer"
                                >
                                  <option value="Selasa">Selasa</option>
                                  <option value="Rabu">Rabu</option>
                                </select>
                              </td>
                              {/* 2. Lunggu Input */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={row.lunggu || ''}
                                  onChange={(e) => handleAttendanceCellChange(index, 'lunggu', e.target.value)}
                                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 font-bold border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                  placeholder="Nama lunggu..."
                                />
                              </td>
                              {/* 3. Ama */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="number"
                                  value={row.ama}
                                  min={0}
                                  onChange={(e) => handleAttendanceCellChange(index, 'ama', e.target.value)}
                                  className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-800 font-semibold text-center border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                />
                              </td>
                              {/* 4. Ina */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="number"
                                  value={row.ina}
                                  min={0}
                                  onChange={(e) => handleAttendanceCellChange(index, 'ina', e.target.value)}
                                  className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-800 font-semibold text-center border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                />
                              </td>
                              {/* 5. SM */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="number"
                                  value={row.sm}
                                  min={0}
                                  onChange={(e) => handleAttendanceCellChange(index, 'sm', e.target.value)}
                                  className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-800 font-semibold text-center border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                />
                              </td>
                              {/* 6. ReNa */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="number"
                                  value={row.rena}
                                  min={0}
                                  onChange={(e) => handleAttendanceCellChange(index, 'rena', e.target.value)}
                                  className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-800 font-semibold text-center border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                />
                              </td>
                              {/* 7. Parhalado */}
                              <td className="p-1 border-r border-slate-200">
                                <input
                                  type="number"
                                  value={row.parhalado}
                                  min={0}
                                  onChange={(e) => handleAttendanceCellChange(index, 'parhalado', e.target.value)}
                                  className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-800 font-semibold text-center border-none outline-none focus:bg-teal-50/60 focus:ring-1 focus:ring-teal-400 rounded-lg"
                                />
                              </td>
                              {/* 8. Total Naro */}
                              <td className="px-4 py-3 text-xs font-extrabold text-teal-800 text-center border-r border-slate-200 bg-teal-50/30">
                                {rowTotal}
                              </td>
                              {/* 9. Aksi Delete */}
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePartangianganAttendanceRow(index)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                                  title="Hapus Baris Lunggu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* ROW 7 (BOTTOM): TOROP NARO AUTOMATIC CALCULATION */}
                        {(() => {
                          const totalAma = tempPartangianganAttendance.reduce((sum, r) => sum + (Number(r.ama) || 0), 0);
                          const totalIna = tempPartangianganAttendance.reduce((sum, r) => sum + (Number(r.ina) || 0), 0);
                          const totalSM = tempPartangianganAttendance.reduce((sum, r) => sum + (Number(r.sm) || 0), 0);
                          const totalReNa = tempPartangianganAttendance.reduce((sum, r) => sum + (Number(r.rena) || 0), 0);
                          const totalParhalado = tempPartangianganAttendance.reduce((sum, r) => sum + (Number(r.parhalado) || 0), 0);
                          const grandTotalNaro = totalAma + totalIna + totalSM + totalReNa + totalParhalado;

                          return (
                            <tr className="bg-teal-50/80 border-t-2 border-teal-300 font-extrabold text-slate-900">
                              <td colSpan={2} className="px-4 py-3.5 text-xs font-black text-teal-950 uppercase tracking-wide border-r border-teal-250 text-left bg-teal-100/60">
                                Torop Naro (Total Jumlah)
                              </td>
                              <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 text-teal-950">
                                {totalAma}
                              </td>
                              <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 text-teal-950">
                                {totalIna}
                              </td>
                              <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 text-teal-950">
                                {totalSM}
                              </td>
                              <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 text-teal-950">
                                {totalReNa}
                              </td>
                              <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 text-teal-950">
                                {totalParhalado}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-center bg-teal-600 text-white font-black border-r border-teal-700">
                                {grandTotalNaro}
                              </td>
                              <td className="bg-teal-100/60"></td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABEL 2 EDITOR: PETUGAS PELAYANAN PARTANGIANGAN */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                        <span>Petugas Partangiangan</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Daftar petugas ibadah partangiangan. Anda dapat menambah, menghapus, atau merubah peranan tugas.
                      </p>

                      {/* EDIT DATE INPUT FOR TABEL 2 */}
                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase shrink-0">Hari/Tanggal:</label>
                        <input
                          type="text"
                          value={petugasPartangianganDate}
                          onChange={(e) => onUpdatePetugasPartangianganDate(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-indigo-400 outline-none max-w-xs"
                          placeholder="Contoh: Selasa 16 Juni & Rabu 17 Juni 2026"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-start md:self-auto">
                      <button
                        onClick={handleAddPetugasPartangianganRow}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Jadwal</span>
                      </button>
                      <button
                        onClick={handleSavePetugasPartangianganTable}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-black text-white rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-b border-blue-950">
                          <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[100px]">
                            Hari
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[130px]">
                            Lunggu
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[150px]">
                            Dibagas Ni Keluarga
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[170px]">
                            Alamat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[140px] bg-indigo-950/20">
                            Jamita
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[140px] bg-indigo-950/20">
                            Agenda
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[140px] bg-indigo-950/20">
                            Ende
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider min-w-[80px]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tempPetugasPartangiangan.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            {/* 1. Hari select dropdown */}
                            <td className="p-1 border-r border-slate-200 text-center">
                              <select
                                value={row.hari}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'hari', e.target.value as any)}
                                className="bg-transparent px-2 py-1.5 text-xs text-slate-800 font-bold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg cursor-pointer"
                              >
                                <option value="Selasa">Selasa</option>
                                <option value="Rabu">Rabu</option>
                              </select>
                            </td>
                            {/* 2. Lunggu input */}
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.lunggu || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'lunggu', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 font-bold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Nama lunggu..."
                              />
                            </td>
                            {/* 3. Dibagas Ni Keluarga input */}
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.keluarga || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'keluarga', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 font-bold border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Keluarga..."
                              />
                            </td>
                            {/* 4. Alamat input */}
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.alamat || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'alamat', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-600 font-medium border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Alamat rumah..."
                              />
                            </td>
                            {/* 5. Jamita input */}
                            <td className="p-1 border-r border-slate-200 bg-blue-50/5">
                              <input
                                type="text"
                                value={row.jamita || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'jamita', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-indigo-950 font-black border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Khotbah..."
                              />
                            </td>
                            {/* 6. Agenda input */}
                            <td className="p-1 border-r border-slate-200 bg-blue-50/5">
                              <input
                                type="text"
                                value={row.agenda || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'agenda', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-indigo-950 font-black border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Liturgis..."
                              />
                            </td>
                            {/* 7. Ende input */}
                            <td className="p-1 border-r border-slate-200 bg-blue-50/5">
                              <input
                                type="text"
                                value={row.ende || ''}
                                onChange={(e) => handlePetugasPartangianganCellChange(index, 'ende', e.target.value)}
                                className="w-full bg-transparent px-2.5 py-1.5 text-xs text-indigo-950 font-black border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded-lg"
                                placeholder="Lagu / Musik..."
                              />
                            </td>
                            {/* Actions */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemovePetugasPartangianganRow(index)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                                title="Hapus baris ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {tempPetugasPartangiangan.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                              Belum ada petugas ditambahkan. Silakan tambah peranan petugas di atas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* OPSI NON-TABEL STATUS IBADAH PARTANGIANGAN */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Opsi Status & Tampilan Ibadah Partangiangan di Portal Utama</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pilih opsi di bawah ini jika ibadah partangiangan dialihkan atau diliburkan. Pilihan akan langsung mengubah pesan di halaman utama jemaat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Opsi 1: Tabel Standar */}
                    <label
                      onClick={() => onUpdatePartangianganMode?.('normal')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        partangianganMode === 'normal'
                          ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="partangianganMode"
                            checked={partangianganMode === 'normal'}
                            onChange={() => onUpdatePartangianganMode?.('normal')}
                            className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-black">Tampilkan Tabel Petugas</span>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">Standar</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Menampilkan tabel jadwal dan daftar nama petugas pelayanan partangiangan seperti biasa di portal utama.
                      </p>
                    </label>

                    {/* Opsi 2: Partangiangan Keluarga */}
                    <label
                      onClick={() => onUpdatePartangianganMode?.('keluarga')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        partangianganMode === 'keluarga'
                          ? 'bg-amber-50/80 border-amber-600 text-amber-950 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="partangianganMode"
                            checked={partangianganMode === 'keluarga'}
                            onChange={() => onUpdatePartangianganMode?.('keluarga')}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-xs font-black">Partangiangan Keluarga (Ibadah Keluarga)</span>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Opsi 1</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug bg-white/80 p-2.5 rounded-xl border border-amber-200/80 font-medium">
                        "tidak ada petugas ibadah partangiangan dikarenakan ibadah keluarga akan dilakukan di rumah masing masing"
                      </p>
                    </label>

                    {/* Opsi 3: Tidak Ada Ibadah Partangiangan */}
                    <label
                      onClick={() => onUpdatePartangianganMode?.('selesai')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        partangianganMode === 'selesai'
                          ? 'bg-blue-50/80 border-blue-600 text-blue-950 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="partangianganMode"
                            checked={partangianganMode === 'selesai'}
                            onChange={() => onUpdatePartangianganMode?.('selesai')}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-black">Tidak Ada Ibadah Partangiangan</span>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-200 text-blue-900 uppercase">Opsi 2</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug bg-white/80 p-2.5 rounded-xl border border-blue-200/80 font-medium">
                        "tidak ada ibadah partangiangan karena ibadah partangiangann untuk tahun ini sudah selesai, akan dimulai lagi tahun depan"
                      </p>
                    </label>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 2: MANAGING WARTA JEMAAT                           */}
        {/* ======================================================== */}
        {activeSubTab === 'warta' && (
          <div className="space-y-6">
            {/* RINGKASAN TREN KEHADIRAN 1 MINGGU TERBARU (KHUSUS MINGGU, NO PARTANGIANGAN) */}
            {(() => {
              const trendsList = tempAttendanceTrends.length > 0 ? tempAttendanceTrends : (attendanceTrends && attendanceTrends.length > 0 ? attendanceTrends : INITIAL_ATTENDANCE_TRENDS);
              const latestIdx = trendsList.length - 1;
              const latest1W = trendsList[latestIdx] || INITIAL_ATTENDANCE_TRENDS[0];
              const smCount = latest1W.sekolahMinggu ?? latest1W.mingguSm ?? 95;
              const shift1Count = latest1W.shift1 ?? latest1W.mingguAma ?? 215;
              const shift2Count = latest1W.shift2 ?? latest1W.mingguIna ?? 212;
              const totalSunday = smCount + shift1Count + shift2Count;

              return (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Tren Kehadiran 1 Minggu
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {latest1W.tanggalRange || petugasMingguDate || 'Minggu Terbaru'}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-1 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Statistik Kehadiran Kebaktian Minggu</span>
                      </h3>
                    </div>
                    <div className="text-right self-start sm:self-auto">
                      <span className="text-[10px] text-slate-400 font-medium block">Total Hadir Kebaktian Minggu</span>
                      <span className="text-xl font-black text-emerald-400">{totalSunday} <span className="text-xs font-semibold text-slate-300">Jemaat</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Sekolah Minggu */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sekolah Minggu</span>
                        <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={smCount}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...trendsList];
                            updated[latestIdx] = {
                              ...updated[latestIdx],
                              mingguSm: val,
                              sekolahMinggu: val
                            };
                            setTempAttendanceTrends(updated);
                            if (onUpdateAttendanceTrends) {
                              onUpdateAttendanceTrends(updated);
                            }
                          }}
                          className="w-24 bg-slate-900/90 border border-slate-600 rounded-lg px-2.5 py-1 text-base font-black text-amber-400 focus:border-amber-400 outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">Jemaat</span>
                      </div>
                    </div>

                    {/* Shift 1 */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift 1 (Pagi)</span>
                        <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={shift1Count}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...trendsList];
                            updated[latestIdx] = {
                              ...updated[latestIdx],
                              mingguAma: val,
                              shift1: val
                            };
                            setTempAttendanceTrends(updated);
                            if (onUpdateAttendanceTrends) {
                              onUpdateAttendanceTrends(updated);
                            }
                          }}
                          className="w-24 bg-slate-900/90 border border-slate-600 rounded-lg px-2.5 py-1 text-base font-black text-cyan-400 focus:border-cyan-400 outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">Jemaat</span>
                      </div>
                    </div>

                    {/* Shift 2 */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift 2 (Siang)</span>
                        <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={shift2Count}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...trendsList];
                            updated[latestIdx] = {
                              ...updated[latestIdx],
                              mingguIna: val,
                              shift2: val
                            };
                            setTempAttendanceTrends(updated);
                            if (onUpdateAttendanceTrends) {
                              onUpdateAttendanceTrends(updated);
                            }
                          }}
                          className="w-24 bg-slate-900/90 border border-slate-600 rounded-lg px-2.5 py-1 text-base font-black text-indigo-400 focus:border-indigo-400 outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">Jemaat</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-medium">
                    * Statistik tren 1 minggu di atas hanya mencakup Kebaktian Minggu (Sekolah Minggu, Shift 1, dan Shift 2) tanpa ibadah partangiangan. Perubahan angka di atas otomatis memperbarui tren di halaman warta jemaat.
                  </p>
                </div>
              );
            })()}

            {!editingWartaId ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={startNewWarta}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Warta Baru</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {wartaList.map((w) => (
                    <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-[10px] mb-1">
                          <span className="font-extrabold uppercase bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-blue-700">{w.kategori}</span>
                          <span className="text-slate-500">{w.tanggal}</span>
                          {w.prioritas && <span className="bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.2 rounded border border-amber-200">Penting</span>}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{w.judul}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-2xl">{w.isi}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => startEditWarta(w)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-bold text-slate-700 hover:text-slate-900 rounded-lg transition cursor-pointer shadow-sm"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDeleteWarta(w.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* WARTA COMPOSER FORM */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase border-b border-slate-200 pb-3">
                  {editingWartaId === 'new' ? 'Tulis Pokok Warta Jemaat' : 'Ubah Pokok Warta Jemaat'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Hal Pengumuman</label>
                    <input
                      type="text"
                      value={wartaTitle}
                      onChange={(e) => setWartaTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                      placeholder="Contoh: Berita Pernikahan / Rencana Kegiatan Sermon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Warta</label>
                    <select
                      value={wartaKategori}
                      onChange={(e: any) => setWartaKategori(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none"
                    >
                      <option value="umum">Umum (Pemberitahuan Utama)</option>
                      <option value="pelayanan">Pelayanan Jemaat (Ibadah & Kursus)</option>
                      <option value="keuangan">Keuangan / Kas Masuk</option>
                      <option value="duka">Berita Duka Cita</option>
                      <option value="sukacita">Berita Sukacita (Kelahiran, Pernikahan, dll)</option>
                      <option value="sektor">Warta Sektor / Wijk</option>
                    </select>
                  </div>



                  <div className="flex items-center space-x-4 pt-4">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={wartaPrioritas}
                        onChange={(e) => setWartaPrioritas(e.target.checked)}
                        className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-slate-700 font-bold">Tandai sebagai Informasi Penting (Prioritas Atas)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Berita Lengkap</label>
                  <textarea
                    rows={6}
                    value={wartaIsi}
                    onChange={(e) => setWartaIsi(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all leading-relaxed font-sans"
                    placeholder="Ketik isi berita warta jemaat sejelas rincinya..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setEditingWartaId(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveWarta}
                    className="px-5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-bold text-white rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengumuman</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 3: MANAGING KEUANGAN                               */}
        {/* ======================================================== */}
        {activeSubTab === 'keuangan' && (
          <div className="space-y-6">
            {/* ADMIN FINANCIAL OVERVIEW & CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
              {/* 1. GABUNGAN: TOTAL PEMASUKAN & PENGELUARAN */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-slate-500 animate-pulse" />
                    <span>Total Arus Kas Masuk & Keluar</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Pemasukan</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                      <h4 className="text-base font-black text-emerald-600 truncate">{formatRupiah(totalPemasukan)}</h4>
                    </div>
                  </div>
                  <div className="pl-4">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Pengeluaran</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowDownRight className="w-4 h-4 text-red-500 shrink-0" />
                      <h4 className="text-base font-black text-red-600 truncate">{formatRupiah(totalPengeluaran)}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. GABUNGAN: SALDO KAS HURIA & KAS PEMBANGUNAN */}
              <div className="bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 border border-blue-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-blue-100/60 pb-3 mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Saldo Kas Huria & Kas Pembangunan</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 divide-x divide-blue-100/50 mb-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Kas Huria (Umum)</span>
                    <h4 className="text-sm font-extrabold text-blue-700 mt-0.5 truncate">{formatRupiah(saldoKasHuria)}</h4>
                  </div>
                  <div className="pl-3">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Kas Pembangunan</span>
                    <h4 className="text-sm font-extrabold text-indigo-700 mt-0.5 truncate">{formatRupiah(saldoKasPembangunan)}</h4>
                  </div>
                </div>
                <div className="border-t border-dashed border-blue-200/60 pt-2 flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Gabungan Saldo Kas:</span>
                  <span className="text-xs font-black text-slate-800">{formatRupiah(saldoKasHuria + saldoKasPembangunan)}</span>
                </div>
              </div>

              {/* 3. SALDO DIAKONIA SOSIAL */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                    <span>Saldo Diakonia Sosial</span>
                  </span>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{formatRupiah(saldoDiakoniaSosial)}</h4>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Membantu sesama dan pelayanan sosial jemaat</span>
                </div>
                <div className="p-3 bg-pink-50 text-pink-500 rounded-xl shrink-0 border border-pink-100">
                  <Heart className="w-5 h-5" />
                </div>
              </div>

              {/* 4. SALDO KUSTOM (EDITABLE!) */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                {!isEditingCustomBalance ? (
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate max-w-[150px] block" title={customBalanceTitle}>{customBalanceTitle}</span>
                      </span>
                      <h4 className="text-lg font-black text-slate-800 mt-1">{formatRupiah(activeCustomBalanceValue)}</h4>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Saldo kustom (menggabungkan basis & transaksi)</span>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0 border border-amber-100">
                        <Coins className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => {
                          setTempCustomTitle(customBalanceTitle);
                          setTempCustomValue(customBalanceValue);
                          setIsEditingCustomBalance(true);
                        }}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50/50 hover:bg-amber-50 px-2 py-1 rounded-md border border-amber-100 transition cursor-pointer"
                      >
                        Ubah Judul & Saldo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <span className="text-[10px] text-amber-800 uppercase font-bold flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sesuaikan Saldo Kustom</span>
                      </span>
                      <span className="text-[9px] text-slate-400">Atur Judul & Nilai Saldo</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">JUDUL SALDO KUSTOM</label>
                        <input
                          type="text"
                          value={tempCustomTitle}
                          onChange={(e) => setTempCustomTitle(e.target.value)}
                          placeholder="Contoh: Kas Remaja & Naposo"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-amber-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">NILAI SALDO (IDR)</label>
                        <input
                          type="number"
                          value={tempCustomValue}
                          onChange={(e) => setTempCustomValue(Number(e.target.value))}
                          placeholder="Contoh: 2500000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-amber-500 font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingCustomBalance(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1 rounded-lg transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempCustomTitle.trim()) {
                            alert('Judul saldo kustom tidak boleh kosong.');
                            return;
                          }
                          onUpdateCustomBalanceTitle(tempCustomTitle);
                          onUpdateCustomBalanceValue(tempCustomValue);
                          setIsEditingCustomBalance(false);
                        }}
                        className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-lg transition cursor-pointer shadow-sm shadow-amber-100"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!editingTransaksiId ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Buku Register Buku Kas Transaksi</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari transaksi (kategori, keterangan)..."
                        value={searchKeuangan}
                        onChange={(e) => setSearchKeuangan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 font-semibold shadow-sm"
                      />
                      {searchKeuangan && (
                        <button
                          onClick={() => setSearchKeuangan('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleExportKeuanganExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow shadow-emerald-100"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Ekspor ke Excel</span>
                    </button>

                    <button
                      onClick={startNewTransaksi}
                      className="px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow shadow-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Catat Transaksi Baru</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Jenis</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Kas</th>
                          <th className="p-3">Keterangan</th>
                          <th className="p-3 text-right">Jumlah</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const filtered = transaksiList.filter((t) => {
                            const q = searchKeuangan.toLowerCase();
                            return (
                              t.kategori.toLowerCase().includes(q) ||
                              t.keterangan.toLowerCase().includes(q) ||
                              t.tanggal.toLowerCase().includes(q) ||
                              t.tipe.toLowerCase().includes(q)
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50">
                                  Tidak ada transaksi yang cocok dengan pencarian "{searchKeuangan}"
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="p-3 text-slate-500 font-mono">{t.tanggal}</td>
                              <td className="p-3">
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider border ${
                                    t.tipe === 'pemasukan' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  {t.tipe}
                                </span>
                              </td>
                              <td className="p-3 text-slate-800 font-bold">{t.kategori}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  getTipeKasDisplayClass(getTipeKasOfTransaction(t, customBalanceTitle))
                                }`}>
                                  {getTipeKasLabel(getTipeKasOfTransaction(t, customBalanceTitle), customBalanceTitle)}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 min-w-[150px] max-w-xs break-words whitespace-normal" title={t.keterangan}>{t.keterangan}</td>
                              <td
                                className={`p-3 text-right font-bold font-mono ${
                                  t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                <div className="flex flex-col items-end">
                                  <span>{t.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(t.jumlah)}</span>
                                  {t.tipe === 'pemasukan' && t.sentralisasiPersen ? (
                                    <span className="text-[10px] text-amber-600 font-medium font-sans">
                                      (sentral {t.sentralisasiPersen}% = {formatRupiah(t.jumlah * t.sentralisasiPersen / 100)})
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => startEditTransaksi(t)}
                                    className="p-1 text-slate-450 hover:text-blue-600 rounded transition"
                                    title="Ubah Transaksi"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaksi(t.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                    title="Hapus Transaksi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* TRANSACTION LEDGER SHEET */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase border-b border-slate-200 pb-3">
                  {editingTransaksiId === 'new' ? 'Catat Arus Kas Transaksi Baru' : 'Koreksi Transaksi Kas'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipe Transaksi</label>
                    <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTxTipe('pemasukan')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-extrabold tracking-wide uppercase transition ${
                          txTipe === 'pemasukan' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Pemasukan Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxTipe('pengeluaran')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-extrabold tracking-wide uppercase transition ${
                          txTipe === 'pengeluaran' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Pengeluaran Cash
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori Transaksi Keuangan</label>
                    <input
                      type="text"
                      value={txKategori}
                      onChange={(e) => setTxKategori(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                      placeholder="Contoh: Pelean IA, Pelean IB, Pelean II, Listrik Gereja, Diakonia"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alokasi Kas (Tujuan / Sumber Dana)</label>
                    <select
                      value={txTipeKas}
                      onChange={(e) => setTxTipeKas(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-500 font-bold transition-all"
                    >
                      <option value="Kas Huria">Kas Huria (Umum)</option>
                      <option value="Kas Pembangunan">Kas Pembangunan</option>
                      <option value="Kas Diakonia">Kas Diakonia (Sosial)</option>
                      <option value="Kas Kustom">{customBalanceTitle || 'Kas Kustom (Lainnya)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah Transaksi (Rupiah)</label>
                    <input
                      type="number"
                      value={txJumlah === 0 ? '' : txJumlah}
                      onChange={(e) => setTxJumlah(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold font-mono transition-all"
                      placeholder="Masukkan nilai Rupiah (contoh: 2500000)"
                    />
                  </div>

                  {txTipe === 'pemasukan' && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">Potongan Sentralisasi (%)</label>
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold font-mono">Sentralisasi HKBP</span>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={txSentralisasiPersen === 0 ? '' : txSentralisasiPersen}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setTxSentralisasiPersen(val);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold font-mono transition-all"
                          placeholder="Potongan (cth: 55)"
                        />
                        <div className="flex space-x-1 shrink-0">
                          {[0, 45, 55].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setTxSentralisasiPersen(pct)}
                              className={`px-2 py-1.5 rounded text-[10px] font-bold border transition ${
                                txSentralisasiPersen === pct
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                      {txSentralisasiPersen > 0 && txJumlah > 0 && (
                        <div className="mt-2 space-y-1 pt-1.5 border-t border-dashed border-slate-200">
                          <div className="text-[10px] text-amber-600 font-bold flex justify-between">
                            <span>Dikirim ke Pusat ({txSentralisasiPersen}%):</span>
                            <span className="font-mono">-{formatRupiah(txJumlah * txSentralisasiPersen / 100)}</span>
                          </div>
                          <div className="text-[10px] text-blue-700 font-bold flex justify-between">
                            <span>Kas Bersih Huria ({100 - txSentralisasiPersen}%):</span>
                            <span className="font-mono">+{formatRupiah(txJumlah * (1 - txSentralisasiPersen / 100))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Transaksi</label>
                    <input
                      type="date"
                      value={txTanggal}
                      onChange={(e) => setTxTanggal(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keterangan Transaksi</label>
                  <input
                    type="text"
                    value={txKeterangan}
                    onChange={(e) => setTxKeterangan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                    placeholder="Contoh: Persembahan Minggu ke-4 Sektor VII"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setEditingTransaksiId(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveTransaksi}
                    className="px-5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Catat Transaksi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 4: MANAGING JEMAAT                                 */}
        {/* ======================================================== */}
        {activeSubTab === 'jemaat' && (
          <div className="space-y-6">
            {!editingJemaatId ? (
              <div className="space-y-4">
                {/* Statistics Cards for Jemaat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans animate-fadeIn">
                  {/* Card 1: Total Jemaat */}
                  <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Jumlah Jemaat Aktif</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {jemaatList.length} <span className="text-xs text-slate-500 font-bold">Jiwa</span>
                      </h3>
                      <p className="text-[9px] text-slate-500 font-semibold">Warga terdaftar di database</p>
                    </div>
                    <div className="p-3 bg-blue-100/50 text-blue-700 rounded-2xl border border-blue-200">
                      <Users className="w-5 h-5 shrink-0" />
                    </div>
                  </div>

                  {/* Card 2: Ulang Tahun Bulan Ini */}
                  <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Ultah Bulan Ini</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {(() => {
                          const thisMonth = new Date().getMonth(); // 0-11
                          return jemaatList.filter(j => {
                            if (!j.tanggalLahir) return false;
                            const d = new Date(j.tanggalLahir);
                            return !isNaN(d.getTime()) && d.getMonth() === thisMonth;
                          }).length;
                        })()} <span className="text-xs text-slate-500 font-bold">Warga</span>
                      </h3>
                      <p className="text-[9px] text-slate-500 font-semibold">Bulan {new Date().toLocaleDateString('id-ID', { month: 'long' })}</p>
                    </div>
                    <div className="p-3 bg-amber-100/50 text-amber-700 rounded-2xl border border-amber-200">
                      <Heart className="w-5 h-5 shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Ulang Tahun Jemaat (Warga Gereja)</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari jemaat (nama, sektor)..."
                        value={searchJemaat}
                        onChange={(e) => setSearchJemaat(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 font-semibold shadow-sm"
                      />
                      {searchJemaat && (
                        <button
                          onClick={() => setSearchJemaat('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                     <button
                      onClick={() => setShowJemaatExcelModal(true)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.99] text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm shadow-emerald-50"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Impor Excel</span>
                    </button>

                    <button
                      onClick={startNewJemaat}
                      className="px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow shadow-blue-100"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tambah Data Biodata</span>
                    </button>

                    {jemaatList.length > 0 && (
                      <button
                        onClick={handleDeleteAllJemaat}
                        className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 active:scale-[0.99] text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm shadow-rose-50"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Hapus Semua Data</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">
                          {jemaatColumns.map((col) => (
                            <th key={col.key} className="p-3">{col.label}</th>
                          ))}
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const filtered = jemaatList.filter((j) => {
                            const q = searchJemaat.toLowerCase();
                            const matchStandard = (
                              j.nama.toLowerCase().includes(q) ||
                              j.sektor.toLowerCase().includes(q) ||
                              (j.noHP && j.noHP.toLowerCase().includes(q)) ||
                              j.tanggalLahir.toLowerCase().includes(q)
                            );
                            if (matchStandard) return true;

                            return Object.keys(j).some((key) => {
                              if (['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'].includes(key)) return false;
                              const val = j[key];
                              return val && val.toString().toLowerCase().includes(q);
                            });
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={jemaatColumns.length + 1} className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50">
                                  Tidak ada data jemaat yang cocok dengan pencarian "{searchJemaat}"
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((j) => (
                            <tr key={j.id} className="hover:bg-slate-550/5">
                              {jemaatColumns.map((col) => (
                                <td key={col.key} className="p-3 text-slate-700 font-medium">
                                  {col.key === 'nama' ? (
                                    <span className="font-bold text-slate-900">{j[col.key]}</span>
                                  ) : col.key === 'tanggalLahir' || col.key === 'noHP' ? (
                                    <span className="font-mono text-xs">{j[col.key] || '-'}</span>
                                  ) : (
                                    j[col.key] || '-'
                                  )}
                                </td>
                              ))}
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => startEditJemaat(j)}
                                    className="p-1 text-slate-450 hover:text-blue-600 rounded transition cursor-pointer"
                                    title="Ubah Jemaat"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJemaat(j.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                    title="Hapus Jemaat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* DETAILED JEMAAT FORM EDITOR */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase border-b border-slate-200 pb-3">
                  {editingJemaatId === 'new' ? 'Daftarkan Biodata Jemaat Baru' : 'Ubah Biodata Jemaat'}
                </h3>

                <p className="text-[11px] text-slate-500 font-medium">
                  Formulir di bawah ini otomatis menyesuaikan dengan judul kolom tabel database jemaat Anda saat ini.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jemaatColumns.map((col) => {
                    if (col.key === 'nama') {
                      return (
                        <div key={col.key}>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{col.label}</label>
                          <input
                            type="text"
                            value={jmNama}
                            onChange={(e) => setJmNama(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                            placeholder="Contoh: Sahat Siregar"
                          />
                        </div>
                      );
                    }

                    if (col.key === 'tanggalLahir') {
                      return (
                        <div key={col.key}>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{col.label}</label>
                          <input
                            type="date"
                            value={jmTglLahir}
                            onChange={(e) => setJmTglLahir(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                          />
                        </div>
                      );
                    }

                    if (col.key === 'sektor') {
                      return (
                        <div key={col.key}>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{col.label}</label>
                          <input
                            type="text"
                            list="sektor-suggestions"
                            value={jmSektor}
                            onChange={(e) => setJmSektor(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                            placeholder="Pilih atau ketik sektor/wijk"
                          />
                          <datalist id="sektor-suggestions">
                            <option value="Sektor I" />
                            <option value="Sektor II" />
                            <option value="Sektor III" />
                            <option value="Sektor IV" />
                            <option value="Sektor V" />
                            <option value="Sektor VI" />
                            <option value="Sektor VII" />
                          </datalist>
                        </div>
                      );
                    }

                    if (col.key === 'noHP') {
                      return (
                        <div key={col.key}>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{col.label}</label>
                          <input
                            type="text"
                            value={jmNoHP}
                            onChange={(e) => setJmNoHP(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold font-mono transition-all"
                            placeholder="Contoh: 081234567890"
                          />
                        </div>
                      );
                    }

                    // Otherwise, it is a custom dynamic column
                    return (
                      <div key={col.key} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700">{col.label}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...jmCustomFields };
                              delete next[col.key];
                              setJmCustomFields(next);
                            }}
                            className="text-[10px] text-red-500 font-extrabold hover:underline cursor-pointer"
                          >
                            Hapus Kolom
                          </button>
                        </div>
                        <input
                          type="text"
                          value={jmCustomFields[col.key] || ''}
                          onChange={(e) => {
                            setJmCustomFields({
                              ...jmCustomFields,
                              [col.key]: e.target.value
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                          placeholder={`Isi nilai untuk kolom ${col.label}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Add New Custom Field Form */}
                <div className="border-t border-slate-100 pt-4 mt-4 bg-slate-50/30 p-4 rounded-xl border border-dashed border-slate-200">
                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Tambah Kolom Informasi Baru</label>
                      <input
                        type="text"
                        placeholder="Nama Kolom Baru (contoh: Pekerjaan, Alamat, Status)"
                        id="new-column-name-input"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById('new-column-name-input') as HTMLInputElement;
                        const rawName = inputEl?.value.trim();
                        if (!rawName) {
                          showToast('Harap isi nama kolom baru!');
                          return;
                        }
                        const cleanName = rawName;
                        if (['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'].includes(cleanName.toLowerCase())) {
                          showToast('Nama kolom tersebut sudah ada sebagai kolom standar.');
                          return;
                        }
                        if (jmCustomFields[cleanName] !== undefined) {
                          showToast('Kolom tersebut sudah ada.');
                          return;
                        }
                        setJmCustomFields({
                          ...jmCustomFields,
                          [cleanName]: ''
                        });
                        if (inputEl) inputEl.value = '';
                        showToast(`Kolom "${cleanName}" ditambahkan!`);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer shrink-0"
                    >
                      Tambah Kolom
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setEditingJemaatId(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg transition animate-none"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveJemaat}
                    className="px-5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Biodata</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* JEMAAT EXCEL IMPORT MODAL OVERLAY         */}
            {/* ========================================== */}
            {showJemaatExcelModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-800 to-indigo-950 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/10 rounded-xl animate-pulse">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider leading-none">Impor Database Jemaat (Excel)</h3>
                        <p className="text-[10px] text-blue-200 font-semibold tracking-wide mt-1">Impor data jemaat dari file spreadsheet .xlsx atau .xls</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowJemaatExcelModal(false);
                        setParsedJemaatList([]);
                        setExcelFileName('');
                        setExcelErrorMsg('');
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    
                    {/* Instructions & Template Block */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Format Kolom yang Didukung</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Sistem mendeteksi kolom secara otomatis. Pastikan file Excel Anda memiliki kolom header berikut:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 border border-slate-200 rounded-md">Nama Lengkap</span>
                          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 border border-slate-200 rounded-md">Sektor / Wijk</span>
                          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 border border-slate-200 rounded-md">Tanggal Lahir (YYYY-MM-DD)</span>
                          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 border border-slate-200 rounded-md">No HP / WhatsApp (Opsional)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={downloadJemaatExcelTemplate}
                        className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Template</span>
                      </button>
                    </div>

                    {/* Drag Drop or Upload File Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Pilih Berkas Excel (.xlsx, .xls)</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-500 transition relative">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleJemaatExcelImport}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                        <p className="text-xs font-black text-slate-700">
                          {excelFileName ? `Terpilih: ${excelFileName}` : 'Klik atau Seret Berkas Excel Ke Sini'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Mendukung berkas Microsoft Excel .xlsx atau .xls</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {excelErrorMsg && (
                      <div className="bg-red-50 border border-red-150 p-3 rounded-xl flex items-start space-x-2 text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold leading-normal">{excelErrorMsg}</span>
                      </div>
                    )}

                    {/* Preview Table of Parsed Data */}
                    {parsedJemaatList.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-green-600 animate-scale" />
                            <span>Preview Data Terdeteksi ({parsedJemaatList.length} Jemaat)</span>
                          </h4>
                          
                          {/* Import Method Toggle */}
                          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setJemaatImportMode('append')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                jemaatImportMode === 'append' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Gabungkan (Append)
                            </button>
                            <button
                              type="button"
                              onClick={() => setJemaatImportMode('overwrite')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                jemaatImportMode === 'overwrite' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Gantikan Semua (Overwrite)
                            </button>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                                <th className="p-2.5">Nama</th>
                                <th className="p-2.5">Sektor</th>
                                <th className="p-2.5">Tgl Lahir</th>
                                <th className="p-2.5">No HP / WA</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 bg-white">
                              {parsedJemaatList.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2 font-semibold text-slate-800">{row.nama}</td>
                                  <td className="p-2 font-semibold text-slate-600">{row.sektor}</td>
                                  <td className="p-2 font-mono text-slate-500 text-[11px]">{row.tanggalLahir}</td>
                                  <td className="p-2 font-mono text-slate-500 text-[11px]">{row.noHP || '-'}</td>
                                </tr>
                              ))}
                              {parsedJemaatList.length > 5 && (
                                <tr>
                                  <td colSpan={4} className="p-2 text-center text-[10px] text-slate-400 font-bold bg-slate-50 uppercase tracking-wider">
                                    + {parsedJemaatList.length - 5} baris lainnya disembunyikan di preview
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-slate-50 border-t border-slate-150 p-4.5 flex items-center justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowJemaatExcelModal(false);
                        setParsedJemaatList([]);
                        setExcelFileName('');
                        setExcelErrorMsg('');
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImportedJemaat}
                      disabled={parsedJemaatList.length === 0}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                        parsedJemaatList.length === 0
                          ? 'bg-slate-300 border-slate-300 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99]'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Ke Database</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 5: ARCHIVE & PDF DOCUMENT MANAGER                  */}
        {/* ======================================================== */}
        {activeSubTab === 'arsip_pdf' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Acara Minggu Aktif</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {liturgiMinggu?.[0]?.pdfUrl ? '✓ Terunggah (PDF)' : '✗ Belum Ada PDF'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Acara Partangiangan (PDF)</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {liturgiPartangiangan?.filter(l => l.pdfUrl).length || 0} Acara
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Arsip Berkas Permanen</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {arsipPdfs.length} Berkas
                  </span>
                </div>
              </div>
            </div>

            {/* List 1: PDFs linked to ACTIVE LITURGIES */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">1. Berkas PDF Acara Ibadah Jemaat Aktif</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Daftar file PDF tata ibadah yang sedang aktif dan dapat diakses langsung oleh jemaat di aplikasi mobile.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-550 uppercase tracking-wider text-[10px] bg-slate-50">
                      <th className="p-3">Nama Agenda Ibadah</th>
                      <th className="p-3">Tanggal Pelaksanaan</th>
                      <th className="p-3">Nama Berkas PDF</th>
                      <th className="p-3">Ukuran Berkas</th>
                      <th className="p-3 text-center">Aksi Berkas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {/* Sunday */}
                    {liturgiMinggu?.map((lit) => (
                      <tr key={`minggu-${lit.id}`} className="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                        <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          <span>{lit.judul} (Minggu)</span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{lit.tanggal}</td>
                        <td className="p-3 text-slate-750 font-medium">
                          {lit.isPdfMode ? (
                            <span className="text-slate-700 italic font-medium">{lit.uploadedPdfName || (lit.pdfUrl ? 'Tata_Ibadah_Minggu.pdf' : '-')}</span>
                          ) : (
                            <span className="text-blue-700 font-bold text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              Teks Manual ({lit.teksLiturgi?.length || 0} Langkah)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-550 font-mono">
                          {lit.isPdfMode ? (lit.uploadedPdfSize || (lit.pdfUrl ? '1.5 MB' : '-')) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {lit.teksLiturgi && lit.teksLiturgi.length > 0 && (
                              <button
                                onClick={() => setPreviewManualLit(lit)}
                                className="px-2 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-750 rounded text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
                                title="Lihat Teks Acara"
                              >
                                <FileText className="w-3 h-3 text-amber-600" />
                                <span>Lihat Teks</span>
                              </button>
                            )}
                            {lit.pdfUrl && (
                              <a
                                href={lit.pdfUrl}
                                download={`${lit.judul.replace(/\s+/g, '_')}.pdf`}
                                className="p-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded text-[11px] font-bold transition flex items-center space-x-1"
                                title="Unduh Berkas PDF"
                              >
                                <Download className="w-3 h-3 text-blue-600" />
                                <span>Unduh</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteLiturgy(lit.id, 'minggu')}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition cursor-pointer shrink-0"
                              title="Hapus Acara"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Partangiangan with PDFs or Manual text */}
                    {liturgiPartangiangan?.map((lit) => (
                      <tr key={`partangiangan-${lit.id}`} className="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                        <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>{lit.judul} (Partangiangan)</span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{lit.tanggal}</td>
                        <td className="p-3 text-slate-750 font-medium">
                          {lit.isPdfMode ? (
                            <span className="text-slate-700 italic font-medium">{lit.uploadedPdfName || (lit.pdfUrl ? 'Tata_Ibadah_Partangiangan.pdf' : '-')}</span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              Teks Manual ({lit.teksLiturgi?.length || 0} Langkah)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-550 font-mono">
                          {lit.isPdfMode ? (lit.uploadedPdfSize || (lit.pdfUrl ? '1.2 MB' : '-')) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {lit.teksLiturgi && lit.teksLiturgi.length > 0 && (
                              <button
                                onClick={() => setPreviewManualLit(lit)}
                                className="px-2 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-750 rounded text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
                                title="Lihat Teks Acara"
                              >
                                <FileText className="w-3 h-3 text-amber-600" />
                                <span>Lihat Teks</span>
                              </button>
                            )}
                            {lit.pdfUrl && (
                              <a
                                href={lit.pdfUrl}
                                download={`${lit.judul.replace(/\s+/g, '_')}.pdf`}
                                className="p-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded text-[11px] font-bold transition flex items-center space-x-1"
                                title="Unduh Berkas PDF"
                              >
                                <Download className="w-3 h-3 text-emerald-600" />
                                <span>Unduh</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteLiturgy(lit.id, 'partangiangan')}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition cursor-pointer shrink-0"
                              title="Hapus Acara"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* List 2: Custom Permanent PDF Library */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">2. Perpustakaan & Arsip Berkas Digital Jemaat</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Media penyimpanan berkas PDF per-minggu untuk Acara Ibadah, Jadwal Petugas, Warta Jemaat (Tingting), dan Laporan Keuangan.</p>
                </div>
                {!isAddingArsip && (
                  <button
                    onClick={() => {
                      setNewArsipJudul('');
                      setNewArsipKet('');
                      setNewArsipFileName('');
                      setNewArsipFileSize('');
                      setNewArsipPdfUrl('');
                      setIsAddingArsip(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Arsipkan Berkas Baru</span>
                  </button>
                )}
              </div>

              {isAddingArsip && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-fadeIn font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <span className="text-xs font-black uppercase text-blue-700">Arsipkan Berkas Baru (Per Minggu)</span>
                    <button onClick={() => setIsAddingArsip(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Judul Dokumen / Nama Berkas</label>
                      <input
                        type="text"
                        value={newArsipJudul}
                        onChange={(e) => setNewArsipJudul(e.target.value)}
                        placeholder="Contoh: AD/ART Huria HKBP atau Laporan Kas Minggu Ini"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-500 font-bold shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Keterangan Singkat</label>
                      <input
                        type="text"
                        value={newArsipKet}
                        onChange={(e) => setNewArsipKet(e.target.value)}
                        placeholder="Contoh: Berkas warta tingting jemaat periode minggu ini"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-500 font-bold shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Kategori Arsip</label>
                      <select
                        value={newArsipKategori}
                        onChange={(e) => setNewArsipKategori(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-500 font-bold shadow-sm cursor-pointer"
                      >
                        <option value="acara">Acara Ibadah (Liturgy)</option>
                        <option value="petugas">Jadwal Petugas (Duty List)</option>
                        <option value="warta">Warta Jemaat (Tingting)</option>
                        <option value="keuangan">Laporan Keuangan (Kas)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Pilih Periode Hari Minggu</label>
                      <input
                        type="date"
                        value={newArsipTanggalMinggu}
                        onChange={(e) => setNewArsipTanggalMinggu(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-500 font-bold shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Upload input for new file */}
                  <div className="bg-white p-4 rounded-lg border border-dashed border-slate-300">
                    {newArsipFileName ? (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{newArsipFileName}</p>
                            <p className="text-[10px] text-slate-500 font-semibold">{newArsipFileSize}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewArsipFileName('');
                            setNewArsipFileSize('');
                            setNewArsipPdfUrl('');
                          }}
                          className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3">
                        <span className="text-xs font-bold text-slate-500 mb-2">Unggah Dokumen Berkas (.pdf)</span>
                        <button
                          type="button"
                          onClick={() => document.getElementById('new-arsip-upload')?.click()}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-200 cursor-pointer flex items-center space-x-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih File PDF</span>
                        </button>
                        <input
                          id="new-arsip-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const name = file.name;
                              const size = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setNewArsipFileName(name);
                                  setNewArsipFileSize(size);
                                  setNewArsipPdfUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsAddingArsip(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        if (!newArsipJudul) {
                          alert('Mohon masukkan Judul Dokumen!');
                          return;
                        }
                        if (!newArsipPdfUrl) {
                          alert('Mohon pilih file PDF dokumen!');
                          return;
                        }
                        const newDoc = {
                          id: `arsip-custom-${Date.now()}`,
                          judul: newArsipJudul,
                          keterangan: newArsipKet || 'Tidak ada deskripsi tambahan.',
                          tanggalUpload: new Date().toISOString().split('T')[0],
                          tanggalMinggu: newArsipTanggalMinggu,
                          kategori: newArsipKategori,
                          fileName: newArsipFileName,
                          fileSize: newArsipFileSize,
                          pdfUrl: newArsipPdfUrl
                        };
                        const updated = [newDoc, ...arsipPdfs];
                        saveArsipPdfs(updated);
                        setIsAddingArsip(false);
                        showToast('Berkas berhasil disimpan ke Arsip Mingguan Huria!');
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-white rounded-lg text-xs font-bold transition shadow shadow-blue-100 cursor-pointer"
                    >
                      Simpan ke Perpustakaan
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filters and Search Bar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black text-slate-500 mr-1 uppercase">Filter Kategori:</span>
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'acara', label: 'Acara Ibadah' },
                    { id: 'petugas', label: 'Jadwal Petugas' },
                    { id: 'warta', label: 'Warta Jemaat' },
                    { id: 'keuangan', label: 'Laporan Keuangan' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setArchiveCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        archiveCategoryFilter === cat.id
                          ? 'bg-blue-600 border-transparent text-white shadow shadow-blue-500/10'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-850'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={archiveSearchQuery}
                    onChange={(e) => setArchiveSearchQuery(e.target.value)}
                    placeholder="Cari judul, keterangan, nama file..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Grouped by Week */}
              <div className="space-y-6">
                {(() => {
                  // Helper function to format date
                  const formatTanggalMingguIndo = (dateStr: string) => {
                    try {
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return dateStr;
                      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                      return date.toLocaleDateString('id-ID', options);
                    } catch (e) {
                      return dateStr;
                    }
                  };

                  // Filter the archives based on search and category filters
                  const filtered = arsipPdfs.filter(doc => {
                    const matchSearch = !archiveSearchQuery || 
                      doc.judul.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
                      doc.keterangan.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
                      (doc.fileName && doc.fileName.toLowerCase().includes(archiveSearchQuery.toLowerCase()));
                    
                    const matchKategori = archiveCategoryFilter === 'all' || doc.kategori === archiveCategoryFilter;
                    
                    return matchSearch && matchKategori;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-sans">
                        <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Tidak ada dokumen yang cocok dengan filter pencarian Anda.</p>
                      </div>
                    );
                  }

                  const groups: { [key: string]: any[] } = {};
                  filtered.forEach(doc => {
                    const key = doc.tanggalMinggu || 'umum';
                    if (!groups[key]) {
                      groups[key] = [];
                    }
                    groups[key].push(doc);
                  });

                  const sortedKeys = Object.keys(groups).sort((a, b) => {
                    if (a === 'umum') return 1;
                    if (b === 'umum') return -1;
                    return b.localeCompare(a);
                  });

                  return sortedKeys.map((key) => {
                    const files = groups[key];
                    const label = key === 'umum' ? 'Dokumen Umum / Katalog Permanen' : `Periode: ${formatTanggalMingguIndo(key)}`;
                    return (
                      <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h4 className="text-xs font-black uppercase text-indigo-900 tracking-tight flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>{label}</span>
                          </h4>
                          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full">
                            {files.length} Berkas
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {files.map((doc) => {
                            const isPdf = doc.isPdfMode !== false && (doc.pdfUrl || doc.fileName);
                            
                            // Category styling
                            let catLabel = 'Acara Ibadah';
                            let catStyle = 'bg-blue-50 border-blue-200 text-blue-700';
                            if (doc.kategori === 'petugas') {
                              catLabel = 'Jadwal Petugas';
                              catStyle = 'bg-purple-50 border-purple-200 text-purple-700';
                            } else if (doc.kategori === 'warta') {
                              catLabel = 'Warta Jemaat';
                              catStyle = 'bg-amber-50 border-amber-200 text-amber-700';
                            } else if (doc.kategori === 'keuangan') {
                              catLabel = 'Laporan Keuangan';
                              catStyle = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                            }

                            return (
                              <div key={doc.id} className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl hover:shadow hover:border-slate-300 transition flex flex-col justify-between space-y-4 font-sans">
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2 text-slate-500">
                                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${catStyle}`}>
                                        {catLabel}
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-500 font-semibold">{doc.tanggalUpload}</span>
                                    </div>
                                    {isPdf ? (
                                      <span className="text-[9px] bg-slate-200 border border-slate-250 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        PDF
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Teks
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-normal">{doc.judul}</h4>
                                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{doc.keterangan}</p>
                                  
                                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center space-x-2 text-[10px]">
                                    <FileText className={`w-3.5 h-3.5 ${isPdf ? 'text-slate-400' : 'text-emerald-500'}`} />
                                    {isPdf ? (
                                      <>
                                        <span className="text-slate-700 truncate max-w-[150px] font-mono">{doc.fileName || 'berkas_arsip.pdf'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 font-mono">{doc.fileSize || '1.0 MB'}</span>
                                      </>
                                    ) : (
                                      <span className="text-slate-700 font-medium">Teks Manual ({doc.teksLiturgi?.length || 0} Langkah)</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  {isPdf ? (
                                    doc.pdfUrl ? (
                                      <a
                                        href={doc.pdfUrl}
                                        download={`${doc.judul.replace(/\s+/g, '_')}.pdf`}
                                        className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center space-x-1"
                                        title="Unduh Berkas PDF"
                                      >
                                        <Download className="w-3 h-3 text-blue-600" />
                                        <span>Unduh Berkas</span>
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Katalog Berkas</span>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => setPreviewManualLit(doc)}
                                      className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center space-x-1"
                                      title="Lihat Teks Acara"
                                    >
                                      <FileText className="w-3 h-3 text-emerald-600" />
                                      <span>Lihat Teks</span>
                                    </button>
                                  )}

                                  <div className="flex items-center space-x-1.5">
                                    {doc.kategori === 'keuangan' && (
                                      <button
                                        onClick={handleExportKeuanganExcel}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 shadow-sm transition cursor-pointer"
                                        title="Ekspor Laporan Kas Aktif ke Excel"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {isPdf && doc.pdfUrl && (
                                      <a
                                        href={doc.pdfUrl}
                                        download={`${doc.judul.replace(/\s+/g, '_')}.pdf`}
                                        className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 shadow-sm transition cursor-pointer"
                                        title="Unduh Berkas"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => {
                                        triggerConfirm(
                                          'Hapus dari Arsip',
                                          `Apakah Anda yakin ingin menghapus dokumen "${doc.judul}" dari arsip perpustakaan secara permanen?`,
                                          () => {
                                            const updated = arsipPdfs.filter(d => d.id !== doc.id);
                                            saveArsipPdfs(updated);
                                            showToast('Dokumen berhasil dihapus dari arsip!');
                                          }
                                        );
                                      }}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition cursor-pointer"
                                      title="Hapus dari Arsip"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL: DATABASE BUKU NYANYIAN (BE & BN)                 */}
        {/* ======================================================== */}
        {activeSubTab === 'buku_nyanyian' && (
          <div className="space-y-6 font-sans">
            {/* Top Info Banner & Actions */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Music className="w-4 h-4 text-blue-400" />
                  <span>Portal Resmi HKBP: hkbp.or.id/buku-ende</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Database Buku Ende Resmi HKBP
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Basis data lirik dan nomor lagu resmi Buku Ende & Buku Nyanyian HKBP langsung dari <strong>hkbp.or.id/buku-ende</strong> dan <strong>hkbp.or.id/buku-nyanyian</strong>. Ketika membuat susunan acara kebaktian, sistem membaca nomor dan ayat lagu lalu otomatis mengisi lirik asli otentik tanpa perubahan kata.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://hkbp.or.id/buku-ende"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <span>🌐 Portal Buku Ende</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </a>
                  <a
                    href="https://hkbp.or.id/buku-nyanyian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <span>🌐 Portal Buku Nyanyian</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                  <a
                    href="https://hkbp.or.id/kidung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <span>🌐 Portal Kidung Jemaat</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setImportDbJsonText('');
                      setIsImportDbModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                    title="Impor atau berikan database lagu dalam format JSON atau teks"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📥 Berikan / Impor Database</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSyncStart('1');
                      setSyncEnd('50');
                      setIsSyncApiModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                    title="Sinkronisasi lagu otomatis langsung dari https://hkbp.or.id/buku-ende"
                  >
                    <Activity className="w-4 h-4 text-blue-200" />
                    <span>⚡ Sinkron dari hkbp.or.id</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportDb}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                    title="Unduh backup database lagu saat ini sebagai berkas JSON"
                  >
                    <Download className="w-4 h-4 text-slate-300" />
                    <span>Ekspor JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSongKategori('BE');
                      setNewSongNomor('');
                      setNewSongJudul('');
                      setNewSongRawLyrics('');
                      setIsAddSongModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Lagu Baru</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Lagu</span>
                <span className="text-xl font-extrabold text-slate-900">{bukuNyanyianDb.length} Lagu</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-blue-600 uppercase tracking-wider block font-bold">Buku Ende (BE)</span>
                <span className="text-xl font-extrabold text-blue-900">
                  {bukuNyanyianDb.filter(s => s.kategori === 'BE').length} Lagu
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-emerald-600 uppercase tracking-wider block font-bold">Buku Nyanyian (BN)</span>
                <span className="text-xl font-extrabold text-emerald-900">
                  {bukuNyanyianDb.filter(s => s.kategori === 'BN').length} Lagu
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-amber-600 uppercase tracking-wider block font-bold">Kidung Jemaat (KJ)</span>
                <span className="text-xl font-extrabold text-amber-900">
                  {bukuNyanyianDb.filter(s => s.kategori === 'KJ').length} Lagu
                </span>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {(['ALL', 'BE', 'BN', 'KJ'] as const).map(kat => (
                  <button
                    key={kat}
                    onClick={() => setSongCatalogFilter(kat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      songCatalogFilter === kat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {kat === 'ALL' ? 'Semua Buku' : kat === 'BE' ? 'Buku Ende (BE)' : kat === 'BN' ? 'Buku Nyanyian (BN)' : 'Kidung Jemaat (KJ)'}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={songCatalogSearch}
                  onChange={(e) => setSongCatalogSearch(e.target.value)}
                  placeholder="Cari nomor lagu (10), judul, atau lirik..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Song Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bukuNyanyianDb
                .filter(song => {
                  if (songCatalogFilter !== 'ALL' && song.kategori !== songCatalogFilter) return false;
                  if (!songCatalogSearch.trim()) return true;
                  const query = songCatalogSearch.toLowerCase();
                  const matchNum = String(song.nomor).includes(query);
                  const matchTitle = song.judul.toLowerCase().includes(query);
                  const matchLyrics = song.ayatList.some(v => v.teks.toLowerCase().includes(query));
                  return matchNum || matchTitle || matchLyrics;
                })
                .map(song => {
                  const isExpanded = expandedSongId === song.id;
                  const testRange = testSongVerseRange[song.id] || '1-2';
                  const parsedRange = parseVerseRange(testRange);
                  const formattedPreview = findSongAndFormatLyrics([song], song.kategori, song.nomor, parsedRange);

                  return (
                    <div
                      key={song.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                            song.kategori === 'BE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : song.kategori === 'BN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {song.kategori} No. {song.nomor}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {song.ayatList.length} Ayat
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {song.judul}
                        </h4>

                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                          &quot;{song.ayatList[0]?.teks.replace(/\n/g, ' ')}&quot;
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedSongId(isExpanded ? null : song.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1"
                        >
                          <span>{isExpanded ? 'Tutup Ayat' : 'Buka & Uji Ayat'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSongFromDb(song.id)}
                          className="p-1 text-slate-300 hover:text-red-600 rounded transition cursor-pointer"
                          title="Hapus Lagu dari DB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                          {/* Ayat Tester */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Simulasi Pengambilan Ayat:
                            </label>
                            <input
                              type="text"
                              value={testRange}
                              onChange={(e) => setTestSongVerseRange({ ...testSongVerseRange, [song.id]: e.target.value })}
                              placeholder="Contoh: 1-2 atau 1 & 3"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono font-bold"
                            />
                            <div className="mt-2 p-2 bg-white rounded border border-slate-150 text-[11px] font-mono whitespace-pre-line text-slate-700 max-h-40 overflow-y-auto">
                              {formattedPreview.lyrics || 'Tidak ada ayat cocok.'}
                            </div>
                          </div>

                          {/* All verses list */}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Semua Bait / Ayat:</span>
                            {song.ayatList.map(v => (
                              <div key={v.ayat} className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[11px]">
                                <span className="font-bold text-blue-700 block mb-0.5">Ayat {v.ayat}:</span>
                                <p className="text-slate-700 whitespace-pre-line font-mono">{v.teks}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Not-yet-downloaded songs from the official HKBP catalog */}
              {(() => {
                if (!songCatalogSearch.trim() || (songCatalogFilter !== 'ALL' && songCatalogFilter !== 'BE')) return null;
                const query = songCatalogSearch.toLowerCase().trim();
                const existingSet = new Set(bukuNyanyianDb.map(s => `${s.kategori}-${s.nomor}`));
                const matchingCatalog = BUKU_ENDE_CATALOG.filter(catItem => {
                  const numStr = String(catItem.nomorLagu);
                  const title = (catItem.judul || '').toLowerCase();
                  const isMatch = numStr === query || numStr.includes(query) || title.includes(query);
                  return isMatch && !existingSet.has(`BE-${catItem.nomorLagu}`);
                }).slice(0, 12);

                if (matchingCatalog.length === 0) return null;

                return (
                  <div className="col-span-full mt-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                          <Music className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ditemukan di Katalog Resmi HKBP (hkbp.or.id/buku-ende)</span>
                        </h4>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Lagu resmi berikut tersedia di portal HKBP dan lirik aslinya dapat diunduh sekali klik:
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {matchingCatalog.map(item => (
                        <div key={item.nomorLagu} className="bg-white border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                              BE {item.nomorLagu}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{item.judul}</h5>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              showToast(`Mengambil BE ${item.nomorLagu} dari hkbp.or.id...`);
                              const s = await fetchOfficialSongFromHkbp(Number(item.nomorLagu));
                              if (s) {
                                const updated = [...bukuNyanyianDb.filter(x => !(x.kategori === 'BE' && x.nomor === s.nomor)), s].sort((a, b) => a.nomor - b.nomor);
                                saveBukuNyanyianDb(updated);
                                showToast(`✓ Berhasil mengunduh BE ${item.nomorLagu} "${s.judul}" dari hkbp.or.id!`);
                              } else {
                                alert(`Gagal mengambil BE ${item.nomorLagu} dari hkbp.or.id`);
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh Lirik</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 6: MANAGING JADWAL IBADAH                         */}
        {/* ======================================================== */}
        {activeSubTab === 'jadwal' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Formulir Pengaturan Waktu Kebaktian</span>
            </h3>
            
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Kebaktian Sekolah Minggu</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editSekolahMinggu}
                    onChange={(e) => setEditSekolahMinggu(e.target.value)}
                    placeholder="Contoh: 07.30 WIB"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Kebaktian Shift 1 (Umum / Pagi)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editShift1}
                    onChange={(e) => setEditShift1(e.target.value)}
                    placeholder="Contoh: 08.00 WIB"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Kebaktian Shift 2 (Umum / Siang)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editShift2}
                    onChange={(e) => setEditShift2(e.target.value)}
                    placeholder="Contoh: 10.00 WIB"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateJadwalIbadah({
                    sekolahMinggu: editSekolahMinggu,
                    shift1: editShift1,
                    shift2: editShift2
                  });
                  showToast('Jadwal Ibadah berhasil disimpan!');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl text-xs font-black hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md shadow-blue-500/10 flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Jadwal Ibadah</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 7: MANAGING TENTANG GEREJA                         */}
        {/* ======================================================== */}
        {activeSubTab === 'sejarah' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Konten Informasi & Dokumentasi Gereja</span>
              </h3>
              {!isAddingTentang && editingTentangId === null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTentangId(null);
                    setTentangFormJudul('');
                    setTentangFormIsi('');
                    setTentangFormGambar('');
                    setTentangFormJudulGambar('');
                    setTentangFormKeteranganGambar('');
                    setIsAddingTentang(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl text-xs font-black hover:from-blue-600 hover:to-indigo-600 transition shadow-md shadow-blue-500/10 flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Informasi Baru</span>
                </button>
              )}
            </div>
 
            {/* FORM TAMBAH / EDIT KONTEN */}
            {(isAddingTentang || editingTentangId !== null) ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {editingTentangId !== null ? 'Edit Konten Informasi' : 'Tambah Konten Informasi Baru'}
                </h4>
 
                <div className="grid grid-cols-1 gap-4">
                  {/* Judul */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Judul Konten/Informasi</label>
                    <input
                      type="text"
                      value={tentangFormJudul}
                      onChange={(e) => setTentangFormJudul(e.target.value)}
                      placeholder="Contoh: Sejarah Singkat Gereja, Visi & Misi, Renovasi Altar..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none"
                    />
                  </div>
 
                  {/* Isi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Isi Konten/Informasi</label>
                    <textarea
                      rows={8}
                      value={tentangFormIsi}
                      onChange={(e) => setTentangFormIsi(e.target.value)}
                      placeholder="Ketik deskripsi atau narasi lengkap di sini..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none resize-y"
                    />
                    <p className="text-[10px] text-slate-400 italic">
                      * Petunjuk: Pisahkan paragraf dengan menekan tombol Enter dua kali agar terformat rapi.
                    </p>
                  </div>
 
                  {/* Upload Gambar */}
                  <div className="space-y-3.5 border-t border-slate-200 pt-3">
                    <label className="text-xs font-bold text-slate-700 block">Gambar Dokumentasi (Opsional)</label>
                    
                    {tentangFormGambar ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                        <div className="md:col-span-1 space-y-2">
                          <div className="w-full aspect-[2/1] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                            <img
                              src={tentangFormGambar}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTentangFormGambar('');
                              setTentangFormJudulGambar('');
                              setTentangFormKeteranganGambar('');
                            }}
                            className="w-full px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-200 transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Gambar</span>
                          </button>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 block">Judul Gambar / Caption Singkat</label>
                            <input
                              type="text"
                              value={tentangFormJudulGambar}
                              onChange={(e) => setTentangFormJudulGambar(e.target.value)}
                              placeholder="Contoh: Gedung Depan Gereja, Penyerahan Bantuan..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 block">Keterangan / Deskripsi Gambar</label>
                            <textarea
                              rows={3}
                              value={tentangFormKeteranganGambar}
                              onChange={(e) => setTentangFormKeteranganGambar(e.target.value)}
                              placeholder="Contoh: Diambil pada acara ulang tahun gereja ke-50..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-850 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-white hover:border-blue-500 transition relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-600">Klik atau seret gambar ke sini</p>
                        <p className="text-[9px] text-slate-400">PNG, JPG, atau JPEG up to 2MB</p>
                      </div>
                    )}
                  </div>
                </div>
 
                <div className="pt-2 flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingTentangId !== null) {
                        // Save Edit
                        if (!tentangFormJudul.trim() || !tentangFormIsi.trim()) {
                          alert('Judul dan isi konten tidak boleh kosong!');
                          return;
                        }
                        const updatedList = tentangGerejaList.map((item) =>
                          item.id === editingTentangId
                            ? {
                                ...item,
                                judul: tentangFormJudul.trim(),
                                isi: tentangFormIsi.trim(),
                                gambar: tentangFormGambar,
                                judulGambar: tentangFormGambar ? tentangFormJudulGambar.trim() : '',
                                keteranganGambar: tentangFormGambar ? tentangFormKeteranganGambar.trim() : '',
                                tanggalUpdate: new Date().toISOString().split('T')[0]
                              }
                            : item
                        );
                        onUpdateTentangGerejaList(updatedList);
                        showToast('Konten Informasi berhasil diperbarui!');
                        setEditingTentangId(null);
                        setIsAddingTentang(false);
                      } else {
                        // Add New
                        if (!tentangFormJudul.trim() || !tentangFormIsi.trim()) {
                          alert('Judul dan isi konten tidak boleh kosong!');
                          return;
                        }
                        const newItem: TentangGerejaItem = {
                          id: 'tntg-' + Date.now(),
                          judul: tentangFormJudul.trim(),
                          isi: tentangFormIsi.trim(),
                          gambar: tentangFormGambar,
                          judulGambar: tentangFormGambar ? tentangFormJudulGambar.trim() : '',
                          keteranganGambar: tentangFormGambar ? tentangFormKeteranganGambar.trim() : '',
                          tanggalUpdate: new Date().toISOString().split('T')[0]
                        };
                        onUpdateTentangGerejaList([...tentangGerejaList, newItem]);
                        showToast('Konten Informasi baru berhasil ditambahkan!');
                        setIsAddingTentang(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-black hover:bg-green-600 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Konten</span>
                  </button>
 
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTentang(false);
                      setEditingTentangId(null);
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            ) : (
              /* LIST KONTEN */
              <div className="space-y-3">
                {tentangGerejaList.map((item) => (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="flex items-start space-x-3.5">
                      {item.gambar ? (
                        <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src={item.gambar}
                            alt={item.judul}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">{item.judul}</h4>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {item.isi}
                        </p>
                        {item.tanggalUpdate && (
                          <span className="inline-block text-[9px] font-medium text-slate-400 font-mono">
                            Update: {item.tanggalUpdate}
                          </span>
                        )}
                      </div>
                    </div>
 
                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTentangId(item.id);
                          setTentangFormJudul(item.judul);
                          setTentangFormIsi(item.isi);
                          setTentangFormGambar(item.gambar || '');
                          setTentangFormJudulGambar(item.judulGambar || '');
                          setTentangFormKeteranganGambar(item.keteranganGambar || '');
                          setIsAddingTentang(false);
                        }}
                        className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                        title="Edit Konten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerConfirm(
                            'Hapus Konten Informasi',
                            `Apakah Anda yakin ingin menghapus konten "${item.judul}"?`,
                            () => {
                              const updated = tentangGerejaList.filter((t) => t.id !== item.id);
                              onUpdateTentangGerejaList(updated);
                              showToast('Konten berhasil dihapus!');
                            }
                          );
                        }}
                        className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition cursor-pointer"
                        title="Hapus Konten"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
 
                {tentangGerejaList.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Belum ada konten informasi. Klik "Tambah Informasi Baru" di atas untuk menambahkan profil gereja, visi misi, sejarah, dll.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 8: MANAGING PARHALADO                              */}
        {/* ======================================================== */}
        {activeSubTab === 'parhalado' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Susunan Pelayan & Parhalado Huria</span>
              </h3>
              
              {!isAddingParhalado && !editingParhaladoId && (
                <button
                  type="button"
                  onClick={() => {
                    setParhaladoFormNama('');
                    setParhaladoFormJabatan('');
                    setParhaladoFormNoTelp('');
                    setIsAddingParhalado(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100/75 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Parhalado Baru</span>
                </button>
              )}
            </div>

            {/* FORM TAMBAH / EDIT INLINE */}
            {(isAddingParhalado || editingParhaladoId) && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fadeIn max-w-xl">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {isAddingParhalado ? 'Registrasi Pelayan Baru' : 'Sunting Data Pelayan'}
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Nama Lengkap (Serta Gelar)</label>
                    <input
                      type="text"
                      value={parhaladoFormNama}
                      onChange={(e) => setParhaladoFormNama(e.target.value)}
                      placeholder="Contoh: St. K. Pasaribu"
                      className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Jabatan / Sektor Pelayanan</label>
                    <input
                      type="text"
                      value={parhaladoFormJabatan}
                      onChange={(e) => setParhaladoFormJabatan(e.target.value)}
                      placeholder="Contoh: Sekretaris Jemaat / Sintua Sektor II"
                      className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Nomor Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={parhaladoFormNoTelp}
                      onChange={(e) => setParhaladoFormNoTelp(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!parhaladoFormNama || !parhaladoFormJabatan) {
                        alert('Mohon isi nama lengkap dan jabatan!');
                        return;
                      }

                      if (isAddingParhalado) {
                        const newMember = {
                          id: Date.now().toString(),
                          nama: parhaladoFormNama,
                          jabatan: parhaladoFormJabatan,
                          noTelp: parhaladoFormNoTelp
                        };
                        onUpdateParhaladoList([...parhaladoList, newMember]);
                        showToast('Pelayan Baru Berhasil Terdaftar!');
                      } else {
                        const updated = parhaladoList.map(item => 
                          item.id === editingParhaladoId 
                            ? { ...item, nama: parhaladoFormNama, jabatan: parhaladoFormJabatan, noTelp: parhaladoFormNoTelp } 
                            : item
                        );
                        onUpdateParhaladoList(updated);
                        showToast('Biodata Pelayan Berhasil Diperbarui!');
                      }

                      // Reset form
                      setParhaladoFormNama('');
                      setParhaladoFormJabatan('');
                      setParhaladoFormNoTelp('');
                      setIsAddingParhalado(false);
                      setEditingParhaladoId(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow shadow-blue-500/10 flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Pelayan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setParhaladoFormNama('');
                      setParhaladoFormJabatan('');
                      setParhaladoFormNoTelp('');
                      setIsAddingParhalado(false);
                      setEditingParhaladoId(null);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-250 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* TABEL PELAYAN / PARHALADO LIST */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 font-extrabold text-slate-700">Nama Pelayan</th>
                    <th className="p-3.5 font-extrabold text-slate-700">Jabatan / Sektor</th>
                    <th className="p-3.5 font-extrabold text-slate-700">No. Telepon / WA</th>
                    <th className="p-3.5 font-extrabold text-slate-700 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parhaladoList.length > 0 ? (
                    parhaladoList.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 font-black text-slate-900">{member.nama}</td>
                        <td className="p-3.5 font-bold text-slate-600">{member.jabatan}</td>
                        <td className="p-3.5 font-semibold text-slate-500 font-mono">{member.noTelp || '-'}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingParhaladoId(member.id);
                                setParhaladoFormNama(member.nama);
                                setParhaladoFormJabatan(member.jabatan);
                                setParhaladoFormNoTelp(member.noTelp || '');
                                setIsAddingParhalado(false);
                              }}
                              className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded transition cursor-pointer"
                              title="Sunting"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerConfirm(
                                  'Hapus Pelayan',
                                  `Apakah Anda yakin ingin menghapus "${member.nama}" dari daftar pelayan huria aktif?`,
                                  () => {
                                    const updated = parhaladoList.filter(item => item.id !== member.id);
                                    onUpdateParhaladoList(updated);
                                    showToast('Pelayan Berhasil Dihapus.');
                                  }
                                );
                              }}
                              className="p-1.5 bg-red-50 border border-red-150 hover:bg-red-100 text-red-600 rounded transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-slate-400 text-center italic">Tidak ada data pelayan parhalado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL: EXCEL HUB & ACCOUNT DATABASE                     */}
        {/* ======================================================== */}
        {activeSubTab === 'database_akun' && (
          <div className="space-y-6">
            {/* MANAGE DATABASE OF ACCOUNTS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Daftar Akun Pengguna</span>
                </h3>
                
                {!isAddingAccount && editingAccountIdx === null && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccountFormUsername('');
                      setAccountFormEmail('');
                      setAccountFormPassword('');
                      setShowFormPassword(false);
                      setAccountFormNamaGereja('HKBP Hinalang Silalahi');
                      setAccountFormStatus('ruas');
                      setIsAddingAccount(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100/75 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Akun Baru</span>
                  </button>
                )}
              </div>

              {/* FORM MANUAL ACC INLINE */}
              {(isAddingAccount || editingAccountIdx !== null) && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fadeIn max-w-xl">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {isAddingAccount ? 'Tambahkan Akun Baru' : 'Sunting Detail Akun'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Username</label>
                      <input
                        type="text"
                        value={accountFormUsername}
                        onChange={(e) => setAccountFormUsername(e.target.value)}
                        placeholder="Masukkan username"
                        disabled={editingAccountIdx !== null}
                        className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Alamat Email</label>
                      <input
                        type="email"
                        value={accountFormEmail}
                        onChange={(e) => setAccountFormEmail(e.target.value)}
                        placeholder="administrator@hkbp.or.id"
                        disabled={editingAccountIdx !== null}
                        className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Password Keamanan</label>
                      <div className="relative">
                        <input
                          type={showFormPassword ? "text" : "password"}
                          value={accountFormPassword}
                          onChange={(e) => setAccountFormPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPassword(!showFormPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 flex items-center justify-center rounded-md hover:bg-slate-50 transition"
                          title={showFormPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                        >
                          {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Nama Gereja</label>
                      <input
                        type="text"
                        value={accountFormNamaGereja}
                        onChange={(e) => setAccountFormNamaGereja(e.target.value)}
                        placeholder="Contoh: HKBP Hinalang Silalahi"
                        className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Status / Level Akses</label>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setAccountFormStatus('ruas')}
                        className={`py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          accountFormStatus === 'ruas'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Ruas Jemaat</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAccountFormStatus('parhalado')}
                        className={`py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          accountFormStatus === 'parhalado'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Parhalado</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-blue-500/15 flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Akun</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setEditingAccountIdx(null);
                        setShowFormPassword(false);
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-250 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* TABLE OF ACCOUNTS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3.5 font-extrabold text-slate-700">Username</th>
                      <th className="p-3.5 font-extrabold text-slate-700">Email</th>
                      <th className="p-3.5 font-extrabold text-slate-700">Password</th>
                      <th className="p-3.5 font-extrabold text-slate-700">Nama Gereja</th>
                      <th className="p-3.5 font-extrabold text-slate-700">Akses</th>
                      <th className="p-3.5 font-extrabold text-slate-700 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accountsList.length > 0 ? (
                      accountsList.map((acc, index) => (
                        <tr key={acc.username + '_' + index} className="hover:bg-slate-50/50 transition">
                          <td className="p-3.5 font-black text-slate-900">{acc.username}</td>
                          <td className="p-3.5 font-bold text-slate-600">{acc.email}</td>
                          <td className="p-3.5 font-medium text-slate-500 font-mono">
                            {acc.password ? (
                              <div className="flex items-center space-x-2">
                                <span className={showPasswordMap[acc.username] ? "" : "tracking-widest text-[10px]"}>
                                  {showPasswordMap[acc.username] ? acc.password : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowPasswordMap(prev => ({ ...prev, [acc.username]: !prev[acc.username] }))}
                                  className="text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer flex items-center justify-center rounded hover:bg-slate-100"
                                  title={showPasswordMap[acc.username] ? "Sembunyikan Password" : "Tampilkan Password"}
                                >
                                  {showPasswordMap[acc.username] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">No password</span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-600">{acc.namaGereja || 'HKBP Hinalang Silalahi'}</td>
                          <td className="p-3.5 font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold tracking-wider ${
                              acc.status === 'parhalado' 
                                ? 'bg-red-50 border border-red-200 text-red-700' 
                                : 'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}>
                              {acc.status || 'ruas'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccountIdx(index);
                                  setAccountFormUsername(acc.username);
                                  setAccountFormEmail(acc.email);
                                  setAccountFormPassword(acc.password || '');
                                  setAccountFormNamaGereja(acc.namaGereja || 'HKBP Hinalang Silalahi');
                                  setAccountFormStatus(acc.status || 'ruas');
                                  setIsAddingAccount(false);
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded transition cursor-pointer"
                                title="Sunting"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(index)}
                                disabled={acc.username === 'admin'}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  acc.username === 'admin' 
                                    ? 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'bg-red-50 border border-red-150 hover:bg-red-100 text-red-600'
                                }`}
                                title={acc.username === 'admin' ? 'Admin utama tidak bisa dihapus' : 'Hapus'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-slate-400 text-center italic">Tidak ada database akun terdaftar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>


      {/* CUSTOM CONFIRMATION DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-3 text-red-650">
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-650" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-red-500/15"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}



      {/* CUSTOM MANUAL LITURGY PREVIEW MODAL */}
      {previewManualLit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <span className="text-[9px] bg-blue-50 border border-blue-200 text-blue-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                  Pratinjau Teks Liturgi
                </span>
                <h3 className="text-sm font-black text-slate-950 mt-1 leading-tight">{previewManualLit.judul}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{previewManualLit.tanggal}</p>
              </div>
              <button
                onClick={() => setPreviewManualLit(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {(previewManualLit.ayatReferensi || previewManualLit.ayatBacaan) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                  {previewManualLit.ayatReferensi && (
                    <div className="text-xs text-amber-900 font-bold">
                      Epistel: <span className="font-medium text-amber-800">{previewManualLit.ayatReferensi}</span>
                    </div>
                  )}
                  {previewManualLit.ayatBacaan && (
                    <div className="text-xs text-amber-900 font-bold">
                      Khotbah: <span className="font-medium text-amber-800">{previewManualLit.ayatBacaan}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {previewManualLit.teksLiturgi && previewManualLit.teksLiturgi.length > 0 ? (
                  previewManualLit.teksLiturgi.map((step, idx) => (
                    <div key={step.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <h4 className="text-xs font-black text-slate-900">{step.label}</h4>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                        {step.isi}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4">Tidak ada teks liturgi manual.</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end">
              <button
                onClick={() => setPreviewManualLit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: INPUT NOMOR & AYAT LAGU DARI DATABASE */}
      {songPickerStepIndex !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Input Nomor & Ayat Lagu</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Membaca data lagu & lirik otomatis untuk Acara #{songPickerStepIndex + 1}</p>
                </div>
              </div>
              <button
                onClick={() => setSongPickerStepIndex(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Category Pills */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Pilih Buku Nyanyian:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BE', 'BN', 'KJ'] as const).map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSongPickerKategori(k)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer border text-center ${
                        songPickerKategori === k
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {k === 'BE' ? 'BE (Buku Ende)' : k === 'BN' ? 'BN (Buku Nyanyian)' : 'KJ (Kidung Jemaat)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number and Verse inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Nomor Lagu:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={songPickerNomor}
                    onChange={(e) => setSongPickerNomor(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Ayat / Bait:
                  </label>
                  <input
                    type="text"
                    value={songPickerAyat}
                    onChange={(e) => setSongPickerAyat(e.target.value)}
                    placeholder="Contoh: 1-3, 1+3, atau 1,2+5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick Popular Numbers Pill suggestion */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">Contoh Cepat Tersedia:</span>
                <div className="flex flex-wrap gap-1.5">
                  {bukuNyanyianDb
                    .filter(s => s.kategori === songPickerKategori)
                    .slice(0, 8)
                    .map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSongPickerNomor(String(s.nomor));
                          setSongPickerAyat('1-2');
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border cursor-pointer font-bold transition ${
                          songPickerNomor === String(s.nomor)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        No. {s.nomor}
                      </button>
                    ))}
                </div>
              </div>

              {/* Live Preview Box */}
              {(() => {
                const n = parseInt(songPickerNomor, 10);
                const range = parseVerseRange(songPickerAyat);
                const match = findSongAndFormatLyrics(bukuNyanyianDb, songPickerKategori, n, range);

                if (match.found && match.song) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {match.song.kategori} No. {match.song.nomor}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 mt-1">{match.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Total {match.song.ayatList.length} Ayat
                        </span>
                      </div>

                      {/* Quick verse toggle buttons */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => setSongPickerAyat('')}
                          className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                            !songPickerAyat.trim() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Semua Ayat
                        </button>
                        {match.song.ayatList.map(v => (
                          <button
                            key={v.ayat}
                            type="button"
                            onClick={() => setSongPickerAyat(String(v.ayat))}
                            className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                              songPickerAyat.trim() === String(v.ayat)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Ayat {v.ayat}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-150 text-[11px] text-slate-700 whitespace-pre-line font-mono max-h-36 overflow-y-auto leading-relaxed">
                        {match.lyrics}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs font-bold text-amber-900">
                      Lagu {songPickerKategori} No. {songPickerNomor || '?'} belum terdaftar di database lokal.
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Anda dapat melihat dan menyalin nomor dan lirik lagu dari website resmi lagu HKBP.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {(songPickerKategori === 'BE' || songPickerKategori === 'BN' || songPickerKategori === 'KJ') && (
                        <button
                          type="button"
                          onClick={async () => {
                            const n = parseInt(songPickerNomor, 10);
                            if (isNaN(n) || n <= 0) return;
                            try {
                              showToast(`Mengambil ${songPickerKategori} No. ${n} dari API resmi hkbp.or.id...`);
                              const s = await fetchSongFromApi(n, songPickerKategori);
                              if (s) {
                                const updated = [...bukuNyanyianDb.filter(x => !(x.kategori === songPickerKategori && x.nomor === n)), s].sort((a, b) => {
                                  if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori);
                                  return a.nomor - b.nomor;
                                });
                                saveBukuNyanyianDb(updated);
                                showToast(`Berhasil mengambil ${songPickerKategori} No. ${n} "${s.judul}" dari portal resmi HKBP!`);
                              } else {
                                alert(`Lagu ${songPickerKategori} No. ${n} tidak ditemukan di portal hkbp.or.id.`);
                              }
                            } catch (e: any) {
                              alert(`Gagal mengambil lagu: ${e.message}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>⚡ Ambil Resmi dari hkbp.or.id</span>
                        </button>
                      )}
                      <a
                        href={songPickerKategori === 'BN' ? 'https://hkbp.or.id/buku-nyanyian' : songPickerKategori === 'KJ' ? 'https://hkbp.or.id/kidung' : 'https://hkbp.or.id/buku-ende'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                      >
                        <span>Cari di hkbp.or.id</span>
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSongKategori(songPickerKategori);
                          setNewSongNomor(songPickerNomor);
                          setNewSongJudul('');
                          setNewSongRawLyrics('');
                          setIsAddSongModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        + Tambah Manual
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <a
                href={songPickerKategori === 'BN' ? "https://hkbp.or.id/buku-nyanyian" : songPickerKategori === 'KJ' ? "https://hkbp.or.id/kidung" : "https://hkbp.or.id/buku-ende"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center space-x-1"
              >
                <span>🌐 Portal Resmi: {songPickerKategori === 'BN' ? 'hkbp.or.id/buku-nyanyian' : songPickerKategori === 'KJ' ? 'hkbp.or.id/kidung' : 'hkbp.or.id/buku-ende'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSongPickerStepIndex(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplySongFromPicker}
                  className="px-5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-[0.99] cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ke Acara</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH LAGU BARU KE DATABASE */}
      {isAddSongModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900">Tambah Lagu ke Database</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Tambah lagu atau sinkronkan langsung dari portal resmi https://hkbp.or.id/buku-ende</p>
              </div>
              <button
                onClick={() => setIsAddSongModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kategori Buku:</label>
                  <select
                    value={newSongKategori}
                    onChange={(e) => setNewSongKategori(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="BE">BE (Buku Ende)</option>
                    <option value="BN">BN (Buku Nyanyian)</option>
                    <option value="KJ">KJ (Kidung Jemaat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nomor Lagu:</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={newSongNomor}
                    onChange={(e) => setNewSongNomor(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Judul Lagu:</label>
                <input
                  type="text"
                  value={newSongJudul}
                  onChange={(e) => setNewSongJudul(e.target.value)}
                  placeholder="Contoh: Hupuji Ho Amang"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Lirik / Bait Lagu:</label>
                  <span className="text-[10px] text-slate-400">Pisahkan tiap bait dengan baris kosong</span>
                </div>
                <textarea
                  rows={6}
                  value={newSongRawLyrics}
                  onChange={(e) => setNewSongRawLyrics(e.target.value)}
                  placeholder={"1. Hupuji Ho Amang pardenggan basa i...\n\n2. Gok di Ho do dongan nang hagogoon i..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddSongModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewSongToDb}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: IMPOR / BERIKAN DATABASE BUKU NYANYIAN */}
      {isImportDbModalOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Impor / Berikan Database Lagu</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Unggah berkas JSON atau tempel format data buku nyanyian</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportDbModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* File Upload Option */}
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  id="import-song-db-file"
                  accept=".json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const text = evt.target?.result as string;
                      if (text) {
                        setImportDbJsonText(text);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
                <label
                  htmlFor="import-song-db-file"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <FolderOpen className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Klik untuk Unggah Berkas JSON</span>
                  <span className="text-[10px] text-slate-400">Mendukung berkas data resmi dari https://hkbp.or.id/buku-ende atau format JSON</span>
                </label>
              </div>

              {/* Paste JSON Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Atau Tempel (Paste) Teks JSON Database:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = [
                        {
                          kategori: "BE",
                          nomor: 10,
                          judul: "HUPUJI HUPASANGAP HO",
                          ayatList: [
                            { ayat: 1, teks: "Hupuji hupasangap Ho Amang pardenggan basa\nAi jadijadianMu do sude angka na masa\nDitompa Ho do sasude Dagingku ro di tondi pe Pinuji ma goarMu" },
                            { ayat: 2, teks: "Saluhut na tinompaMi Naeng sonang di rohaMu\nArian dohot borngin pe Disarihon rohaMu\nNang uhum di gomgomanMi Na tigor na sintong do i Pinuji ma goarMu" }
                          ]
                        }
                      ];
                      setImportDbJsonText(JSON.stringify(sample, null, 2));
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Muat Contoh Format
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={importDbJsonText}
                  onChange={(e) => setImportDbJsonText(e.target.value)}
                  placeholder={`Contoh struktur JSON:\n[\n  {\n    "kategori": "BE",\n    "nomor": 10,\n    "judul": "Hupuji Ho Amang",\n    "ayatList": [\n      { "ayat": 1, "teks": "..." },\n      { "ayat": 2, "teks": "..." }\n    ]\n  }\n]`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Live Detection Summary */}
              {(() => {
                if (!importDbJsonText.trim()) return null;
                const parsed = normalizeSongImport(importDbJsonText);
                return (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    parsed.length > 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{parsed.length > 0 ? `Siap diimpor: ${parsed.length} lagu berhasil dikenali` : 'Format belum sesuai. Periksa kembali struktur data.'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Import Mode Selection */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Metode Penggabungan Database:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start space-x-2 ${
                    importDbMode === 'merge' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importDbMode === 'merge'}
                      onChange={() => setImportDbMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-bold">Gabungkan (Merge)</span>
                      <span className="block text-[10px] text-slate-500 font-normal">Menambahkan lagu baru tanpa menghapus lagu yang ada</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start space-x-2 ${
                    importDbMode === 'replace' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importDbMode === 'replace'}
                      onChange={() => setImportDbMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-bold">Ganti Total (Replace)</span>
                      <span className="block text-[10px] text-slate-500 font-normal">Mengganti seluruh lagu dengan data yang baru diimpor</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetToDefaultDb}
                className="text-[10px] font-bold text-slate-500 hover:text-red-600 underline cursor-pointer"
              >
                Reset ke Standar HKBP
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportDbModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessImportDb}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Proses & Simpan Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: SINKRONISASI BUKU ENDE, BUKU NYANYIAN & KIDUNG JEMAAT API */}
      {isSyncApiModalOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  syncBook === 'BN' ? 'bg-emerald-100 text-emerald-700' : syncBook === 'KJ' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Portal Resmi HKBP (hkbp.or.id/{syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung' : 'buku-ende'})
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sinkronisasi lagu otentik langsung dari basis data resmi HKBP</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSyncingApi}
                onClick={() => setIsSyncApiModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Book Category Switcher */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Pilih Buku Nyanyian:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isSyncingApi}
                    onClick={() => {
                      setSyncBook('BE');
                      setSyncStart('1');
                      setSyncEnd('50');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer border text-center ${
                      syncBook === 'BE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Buku Ende (867)
                  </button>
                  <button
                    type="button"
                    disabled={isSyncingApi}
                    onClick={() => {
                      setSyncBook('BN');
                      setSyncStart('1');
                      setSyncEnd('50');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer border text-center ${
                      syncBook === 'BN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Buku Nyanyian (865)
                  </button>
                  <button
                    type="button"
                    disabled={isSyncingApi}
                    onClick={() => {
                      setSyncBook('KJ');
                      setSyncStart('1');
                      setSyncEnd('50');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer border text-center ${
                      syncBook === 'KJ'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kidung Jemaat (478)
                  </button>
                </div>
              </div>

              {/* API Info Card */}
              <div className={`border rounded-2xl p-4 space-y-1.5 ${
                syncBook === 'BN' ? 'bg-emerald-50/70 border-emerald-200' : syncBook === 'KJ' ? 'bg-amber-50/70 border-amber-200' : 'bg-blue-50/70 border-blue-200'
              }`}>
                <div className={`flex items-center space-x-1.5 text-xs font-bold ${
                  syncBook === 'BN' ? 'text-emerald-800' : syncBook === 'KJ' ? 'text-amber-800' : 'text-blue-800'
                }`}>
                  <Check className={`w-4 h-4 ${syncBook === 'BN' ? 'text-emerald-600' : syncBook === 'KJ' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span>Sumber Resmi: https://hkbp.or.id/{syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung' : 'buku-ende'}</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${
                  syncBook === 'BN' ? 'text-emerald-700' : syncBook === 'KJ' ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  Data diambil langsung dari API resmi HKBP (<code>api.hkbp.or.id/api/v1/{syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung-jemaat' : 'buku-ende'}/songs</code>) yang menopang portal resmi <strong>hkbp.or.id/{syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung' : 'buku-ende'}</strong>. Seluruh lirik dan bait lagu dijamin 100% otentik, akurat, dan tidak diubah.
                </p>
                <div className="pt-1">
                  <span className={`text-[10px] font-mono bg-white px-2 py-0.5 rounded border inline-block ${
                    syncBook === 'BN' ? 'text-emerald-900 border-emerald-200' : syncBook === 'KJ' ? 'text-amber-900 border-amber-200' : 'text-blue-900 border-blue-200'
                  }`}>
                    Endpoint: https://api.hkbp.or.id/api/v1/{syncBook === 'BN' ? 'buku-nyanyian' : syncBook === 'KJ' ? 'kidung-jemaat' : 'buku-ende'}/songs/:nomor
                  </span>
                </div>
              </div>

              {/* Range input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Tentukan Rentang Nomor Lagu {syncBook} (1 - {syncBook === 'BN' ? '865' : syncBook === 'KJ' ? '478' : '867'}):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Dari Nomor:</span>
                    <input
                      type="number"
                      min="1"
                      max={syncBook === 'BN' ? 865 : syncBook === 'KJ' ? 478 : 867}
                      disabled={isSyncingApi}
                      value={syncStart}
                      onChange={(e) => setSyncStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Sampai Nomor:</span>
                    <input
                      type="number"
                      min="1"
                      max={syncBook === 'BN' ? 865 : syncBook === 'KJ' ? 478 : 867}
                      disabled={isSyncingApi}
                      value={syncEnd}
                      onChange={(e) => setSyncEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1.5 font-semibold">Pilihan Cepat {syncBook}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: `${syncBook} 1 - 25`, s: '1', e: '25' },
                      { label: `${syncBook} 1 - 50`, s: '1', e: '50' },
                      { label: `${syncBook} 51 - 100`, s: '51', e: '100' },
                      { label: `${syncBook} 101 - 150`, s: '101', e: '150' },
                      { label: `${syncBook} ${syncBook === 'KJ' ? '400 - 450' : '700 - 750'}`, s: syncBook === 'KJ' ? '400' : '700', e: syncBook === 'KJ' ? '450' : '750' }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={isSyncingApi}
                        onClick={() => {
                          setSyncStart(preset.s);
                          setSyncEnd(preset.e);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 bg-white rounded-lg border border-slate-200 cursor-pointer transition ${
                          syncBook === 'BN' ? 'hover:bg-emerald-50 hover:text-emerald-700' : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress State */}
              {isSyncingApi && (
                <div className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs font-bold animate-pulse ${
                  syncBook === 'BN' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${
                    syncBook === 'BN' ? 'text-emerald-600' : 'text-blue-600'
                  }`} />
                  <span>{syncProgress}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                disabled={isSyncingApi}
                onClick={() => setIsSyncApiModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isSyncingApi}
                onClick={handleSyncFromApi}
                className={`px-5 py-2 hover:brightness-105 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5 ${
                  syncBook === 'BN' ? 'bg-gradient-to-r from-emerald-700 to-teal-700' : 'bg-gradient-to-r from-blue-700 to-indigo-700'
                }`}
              >
                {isSyncingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isSyncingApi ? 'Sedang Mengambil...' : `Mulai Sinkronisasi ${syncBook}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SCRIPTURE PICKER MODAL ("Pilih Kitab & Ayat Alkitab") */}
      {scripturePickerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-rose-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <BookOpen className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">Pilih Kitab & Ayat Alkitab</h3>
                  <p className="text-[10px] text-blue-100/90">Pilih dari 66 Kitab PL/PB (Bahasa Indonesia atau Bahasa Batak)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScripturePickerTarget(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Language Mode Selector */}
              <div className="bg-slate-900/5 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                  Bahasa
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerLangMode('indo');
                      handleUpdateScripturePickerPreview(pickerBookId, pickerChapter, pickerVerseRange, 'indo');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                      pickerLangMode === 'indo'
                        ? 'bg-gradient-to-r from-blue-900 to-rose-900 text-white border-blue-950 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Bahasa Indonesia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerLangMode('batak');
                      handleUpdateScripturePickerPreview(pickerBookId, pickerChapter, pickerVerseRange, 'batak');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                      pickerLangMode === 'batak'
                        ? 'bg-gradient-to-r from-blue-900 to-rose-900 text-white border-blue-950 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Bahasa Batak</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Book Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pilih Kitab</label>
                  <select
                    value={pickerBookId}
                    onChange={(e) => {
                      const newBId = e.target.value;
                      setPickerBookId(newBId);
                      setPickerChapter(1);
                      handleUpdateScripturePickerPreview(newBId, 1, pickerVerseRange, pickerLangMode);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-800"
                  >
                    <optgroup label="Perjanjian Lama (Padan Na Robi)">
                      {ALKITAB_BOOKS_CATALOG.filter(b => b.testament === 'PL').map(b => (
                        <option key={b.id} value={b.id}>
                          {pickerLangMode === 'batak' ? `${b.batak} (${b.indonesia})` : `${b.indonesia} (${b.batak})`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Perjanjian Baru (Padan Na Imbaru)">
                      {ALKITAB_BOOKS_CATALOG.filter(b => b.testament === 'PB').map(b => (
                        <option key={b.id} value={b.id}>
                          {pickerLangMode === 'batak' ? `${b.batak} (${b.indonesia})` : `${b.indonesia} (${b.batak})`}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Chapter Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pasal / Bindu</label>
                  {(() => {
                    const bInfo = ALKITAB_BOOKS_CATALOG.find(b => b.id === pickerBookId) || ALKITAB_BOOKS_CATALOG[39];
                    return (
                      <select
                        value={pickerChapter}
                        onChange={(e) => {
                          const chap = parseInt(e.target.value, 10);
                          setPickerChapter(chap);
                          handleUpdateScripturePickerPreview(pickerBookId, chap, pickerVerseRange, pickerLangMode);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-800"
                      >
                        {Array.from({ length: bInfo.totalChapters }, (_, i) => i + 1).map(c => (
                          <option key={c} value={c}>
                            {pickerLangMode === 'batak' ? `Bindu ${c}` : `Pasal ${c}`}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* Verse Range Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Ayat (Contoh: 1-5 atau 16)</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={pickerVerseRange}
                      onChange={(e) => setPickerVerseRange(e.target.value)}
                      placeholder="1-5"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateScripturePickerPreview(pickerBookId, pickerChapter, pickerVerseRange, pickerLangMode)}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-900 to-rose-900 hover:brightness-110 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
                    >
                      Cek
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Pratinjau Nats ({pickerLangMode === 'indo' ? 'Bahasa Indonesia' : 'Bahasa Batak'}):
                  </span>
                  {isFetchingPickerPreview && (
                    <span className="text-[10px] text-blue-900 font-bold flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Memuat...</span>
                    </span>
                  )}
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={pickerPreviewText}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setScripturePickerTarget(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyScriptureFromPicker}
                className="px-5 py-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-rose-900 hover:brightness-110 text-white rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Ke Acara</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
