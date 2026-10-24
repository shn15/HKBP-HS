import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Gift,
  Tv,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Clock,
  MapPin,
  Map,
  X,
  Users,
  Coins,
  Heart,
  Building,
  Activity,
  ArrowLeft,
  Maximize2,
  Menu,
  Info,
  Phone,
  History,
  Instagram,
  Mail,
  Edit2,
  Trash2,
  Save,
  Plus,
  Wrench,
  AlertTriangle,
  AlertCircle,
  Navigation,
  Copy,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Liturgi, Warta, Transaksi, Jemaat, WartaKategori, PetugasMingguRow, PartangianganAttendanceRow, PetugasPartangianganRow, JadwalIbadah, ParhaladoMember, TentangGerejaItem, PartangianganMode, WeeklyAttendanceTrend } from '../types';
import AlkitabModal from './AlkitabModal';
import { INITIAL_ATTENDANCE_TRENDS } from '../data/mockData';

const BIRTHDAY_VERSES = [
  {
    verse: "Mazmur 90:12",
    text: "Ajarlah kami menghitung hari-hari kami sedemikian, hingga kami beroleh hati yang bijaksana."
  },
  {
    verse: "Amsal 3:1-2",
    text: "Hai anakku, janganlah engkau melupakan ajaranku, dan biarlah hatimu memelihara perintahku, karena panjang umur dan lanjut usia serta sejahtera akan ditambahkannya kepadamu."
  },
  {
    verse: "Mazmur 20:4",
    text: "Kiranya diberikan-Nya kepadamu apa yang kaukehendaki dan dijadikan-Nya berhasil apa yang kaurancangkan."
  },
  {
    verse: "Bilangan 6:24-26",
    text: "TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia; TUHAN menghadapkan wajah-Nya kepadamu dan memberi engkau damai sejahtera."
  },
  {
    verse: "Amsal 9:11",
    text: "Karena oleh aku hari-harimu diperbanyak, dan tahun-tahun hidupmu ditambah."
  },
  {
    verse: "3 Yohanes 1:2",
    text: "Saudaraku yang kekasih, aku berdoa, semoga engkau baik-baik saja dan sehat-sehat dalam segala sesuatu, sama seperti jiwamu baik-baik saja."
  },
  {
    verse: "Mazmur 118:24",
    text: "Inilah hari yang dijadikan TUHAN, marilah kita bersorak-sorak dan bersukacita karenanya!"
  },
  {
    verse: "Mazmur 37:4",
    text: "dan bergembiralah karena TUHAN; maka Ia akan memberikan kepadamu apa yang diinginkan hatimu."
  },
  {
    verse: "Mazmur 139:13-14",
    text: "Sebab Engkaulah yang membentuk buah pinggangku, menenun aku dalam kandungan ibuku. Aku bersyukur kepada-Mu oleh karena kejadianku dahsyat dan ajaib."
  },
  {
    verse: "Mazmur 16:11",
    text: "Engkau memberitahukan kepadaku jalan kehidupan; di hadapan-Mu ada sukacita berlimpah-limpah, di tangan kanan-Mu ada nikmat senantiasa."
  }
];

const getWeeklyVerse = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime() + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekNumber = Math.ceil((dayOfYear + start.getDay() + 1) / 7);
  const index = weekNumber % BIRTHDAY_VERSES.length;
  return BIRTHDAY_VERSES[index];
};

interface MemberViewProps {
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
  customBalanceTitle: string;
  customBalanceValue: number;
  jadwalIbadah: JadwalIbadah;
  tentangGerejaList: TentangGerejaItem[];
  parhaladoList: ParhaladoMember[];
  partangianganMode?: PartangianganMode;
  attendanceTrends?: WeeklyAttendanceTrend[];
  onGoToLogin: () => void;
  onUpdateLiturgiMinggu?: (list: Liturgi[]) => void;
  onUpdateLiturgiPartangiangan?: (list: Liturgi[]) => void;
  onUpdateJemaat?: (list: Jemaat[]) => void;
}

export default function MemberView({
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
  jadwalIbadah,
  tentangGerejaList,
  parhaladoList,
  partangianganMode = 'normal',
  attendanceTrends = [],
  onGoToLogin,
  onUpdateLiturgiMinggu,
  onUpdateLiturgiPartangiangan,
  onUpdateJemaat
}: MemberViewProps) {
  const [activeTab, setActiveTab] = useState<'minggu' | 'petugas' | 'warta' | 'keuangan' | 'ultah' | 'live'>(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    const validTabs = ['minggu', 'petugas', 'warta', 'keuangan', 'ultah', 'live'];
    if (urlTab && validTabs.includes(urlTab)) return urlTab as any;
    const hash = window.location.hash.replace('#', '');
    if (hash && validTabs.includes(hash)) return hash as any;
    const local = localStorage.getItem('hkbp_member_active_tab');
    if (local && validTabs.includes(local)) return local as any;
    return 'minggu';
  });
  const [kebaktianSubTab, setKebaktianSubTab] = useState<'minggu' | 'partangiangan'>(() => {
    const urlSub = new URLSearchParams(window.location.search).get('kebaktian');
    if (urlSub === 'minggu' || urlSub === 'partangiangan') return urlSub;
    const local = localStorage.getItem('hkbp_kebaktian_subtab');
    if (local === 'minggu' || local === 'partangiangan') return local;
    return 'minggu';
  });
  const [petugasSubTab, setPetugasSubTab] = useState<'minggu' | 'partangiangan'>(() => {
    const urlSub = new URLSearchParams(window.location.search).get('petugas');
    if (urlSub === 'minggu' || urlSub === 'partangiangan') return urlSub;
    const local = localStorage.getItem('hkbp_petugas_subtab');
    if (local === 'minggu' || local === 'partangiangan') return local;
    return 'minggu';
  });

  // Sync navigation states to localStorage and URL for refresh persistence
  useEffect(() => {
    localStorage.setItem('hkbp_member_active_tab', activeTab);
    const url = new URL(window.location.href);
    if (url.searchParams.get('view') !== 'admin') {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hkbp_kebaktian_subtab', kebaktianSubTab);
    const url = new URL(window.location.href);
    if (url.searchParams.get('view') !== 'admin') {
      url.searchParams.set('kebaktian', kebaktianSubTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [kebaktianSubTab]);

  useEffect(() => {
    localStorage.setItem('hkbp_petugas_subtab', petugasSubTab);
    const url = new URL(window.location.href);
    if (url.searchParams.get('view') !== 'admin') {
      url.searchParams.set('petugas', petugasSubTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [petugasSubTab]);

  const [expandedLiturgySteps, setExpandedLiturgySteps] = useState<Record<string, boolean>>({});
  const [wartaFilter, setWartaFilter] = useState<WartaKategori | 'semua'>('semua');
  const [wartaSearch, setWartaSearch] = useState('');
  const [keuanganFilter, setKeuanganFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMenuModal, setActiveMenuModal] = useState<'jadwal' | 'sejarah' | 'parhalado' | 'alamat' | 'developer' | null>(null);
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [isAlkitabModalOpen, setIsAlkitabModalOpen] = useState(false);
  const [alkitabQuery, setAlkitabQuery] = useState('');

  // ----------------------------------------------------
  // STATES FOR JEMAAT EDITING IN MEMBER VIEW (PORTAL JEMAAT)
  // ----------------------------------------------------
  const [editingJemaatId, setEditingJemaatId] = useState<string | null>(null);
  const [jmNama, setJmNama] = useState('');
  const [jmTglLahir, setJmTglLahir] = useState('');
  const [jmSektor, setJmSektor] = useState('Sektor III');
  const [jmNoHP, setJmNoHP] = useState('');
  const [jmCustomFields, setJmCustomFields] = useState<Record<string, string>>({});
  const [searchJemaat, setSearchJemaat] = useState('');
  const [memberToast, setMemberToast] = useState('');

  const currentVerse = useMemo(() => getWeeklyVerse(), []);

  const showMemberToast = (msg: string) => {
    setMemberToast(msg);
    setTimeout(() => setMemberToast(''), 3000);
  };

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

  // CRUD handlers for Jemaat
  const startEditJemaat = (j: Jemaat) => {
    setEditingJemaatId(j.id);
    setJmNama(j.nama);
    setJmTglLahir(j.tanggalLahir);
    setJmSektor(j.sektor);
    setJmNoHP(j.noHP || '');
    
    // Extracted custom fields
    const standardKeys = ['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'];
    const customs: Record<string, string> = {};
    Object.keys(j).forEach((k) => {
      if (!standardKeys.includes(k)) {
        customs[k] = j[k] !== undefined && j[k] !== null ? j[k].toString() : '';
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
    setJmCustomFields({});
  };

  const handleSaveJemaat = () => {
    if (!jmNama.trim()) {
      showMemberToast('Nama lengkap jemaat wajib diisi!');
      return;
    }
    if (!jmTglLahir) {
      showMemberToast('Tanggal lahir wajib diisi!');
      return;
    }
    if (!onUpdateJemaat) return;

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
    showMemberToast('Data Jemaat Berhasil Disimpan!');
  };

  // Safe Confirm Dialog state for MemberView
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

  const handleDeleteJemaat = (id: string) => {
    if (!onUpdateJemaat) return;
    triggerConfirm(
      'Hapus Data Jemaat',
      'Apakah Anda yakin ingin menghapus data biodata jemaat ini?',
      () => {
        const filtered = jemaatList.filter((j) => j.id !== id);
        onUpdateJemaat(filtered);
        showMemberToast('Biodata Jemaat Dihapus.');
      }
    );
  };


  // Disable body scroll when Live mode (Fullscreen) is active to prevent page scrolling behind the iframe
  useEffect(() => {
    if (activeTab === 'live') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeTab]);

  const toggleStep = (stepId: string) => {
    setExpandedLiturgySteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // Dynamic current date for real-world and uploaded data
  const currentContextDate = useMemo(() => new Date(), []);
  
  const bdayMembersThisWeek = useMemo(() => {
    return jemaatList.filter((j) => {
      if (!j.tanggalLahir) return false;
      const bday = new Date(j.tanggalLahir);
      if (isNaN(bday.getTime())) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Birthday month and day this year
      const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      // Birthday next year (for December -> January transition check)
      const bdayNextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());

      // Closest upcoming birthday date
      let nextBday = bdayThisYear;
      if (bdayThisYear.getTime() < today.getTime()) {
        nextBday = bdayNextYear;
      }

      // Calculate diff in days
      const diffTime = nextBday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 0 means today, up to 7 days from now
      return diffDays >= 0 && diffDays <= 7;
    }).sort((a, b) => {
      const bdayA = new Date(a.tanggalLahir);
      const bdayB = new Date(b.tanggalLahir);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextA = new Date(today.getFullYear(), bdayA.getMonth(), bdayA.getDate());
      if (nextA.getTime() < today.getTime()) nextA.setFullYear(today.getFullYear() + 1);

      const nextB = new Date(today.getFullYear(), bdayB.getMonth(), bdayB.getDate());
      if (nextB.getTime() < today.getTime()) nextB.setFullYear(today.getFullYear() + 1);

      return nextA.getTime() - nextB.getTime();
    });
  }, [jemaatList]);

  // Compute stats
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

  const saldoKas = totalPemasukan - totalPengeluaran;

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

  // Kas Huria
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

  // Kas Pembangunan
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

  // Diakonia Sosial
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

  // Active Custom Balance Value
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

  // Chart data preparing
  const chartData = useMemo(() => {
    // Let's group transactions by category for visualization
    const categoryTotals: Record<string, { name: string; pemasukan: number; pengeluaran: number }> = {};
    transaksiList.forEach((t) => {
      if (!categoryTotals[t.kategori]) {
        categoryTotals[t.kategori] = { name: t.kategori, pemasukan: 0, pengeluaran: 0 };
      }
      if (t.tipe === 'pemasukan') {
        categoryTotals[t.kategori].pemasukan += t.jumlah;
      } else {
        categoryTotals[t.kategori].pengeluaran += t.jumlah;
      }
    });
    return Object.values(categoryTotals);
  }, [transaksiList]);

  // Filtering Warta Jemaat
  const filteredWarta = useMemo(() => {
    return wartaList.filter((w) => {
      const matchKategori = wartaFilter === 'semua' || w.kategori === wartaFilter;
      const matchSearch =
        w.judul.toLowerCase().includes(wartaSearch.toLowerCase()) ||
        w.isi.toLowerCase().includes(wartaSearch.toLowerCase()) ||
        (w.penulis && w.penulis.toLowerCase().includes(wartaSearch.toLowerCase()));
      return matchKategori && matchSearch;
    });
  }, [wartaList, wartaFilter, wartaSearch]);

  // Convert numbers to Rupiah currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Humanize Birthday Display
  const getBdayDiffString = (tanggalLahir: string) => {
    const bday = new Date(tanggalLahir);
    if (isNaN(bday.getTime())) {
      return { text: '', isToday: false, age: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bdayYear = bday.getFullYear();
    const age = today.getFullYear() - bdayYear;

    const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const bdayNextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());

    let nextBday = bdayThisYear;
    if (bdayThisYear.getTime() < today.getTime()) {
      nextBday = bdayNextYear;
    }

    const diffTime = nextBday.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'Hari Ini! 🎂', isToday: true, age };
    } else if (diffDays === 1) {
      return { text: 'Besok', isToday: false, age };
    } else if (diffDays === -1) {
      return { text: 'Kemarin', isToday: false, age };
    } else if (diffDays > 1) {
      return { text: `${diffDays} hari lagi`, isToday: false, age };
    } else {
      return { text: `${Math.abs(diffDays)} hari lalu`, isToday: false, age };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* HEADER BAR */}
      {activeTab !== 'live' && (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-md px-4 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center p-0.5 shadow-md">
                <img
                  src="/hkbp.png"
                  alt="HKBP Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
                  HKBP Hinalang Silalahi
                </h1>
                <p className="text-[10px] md:text-xs text-blue-100 mt-1 font-medium tracking-wide">Resort Hinalang Silalahi (Distrik XI Toba Hasundutan) </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md flex items-center justify-center"
                title="Menu Gereja"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md"
              >
                Admin
              </button>
            </div>
          </div>
        </header>
      )}

      {/* CORE FRAME FOR TABS */}
      <main className={`flex-1 w-full mx-auto relative z-10 transition-all duration-300 ${activeTab === 'live' ? 'max-w-none p-0 pb-16 md:pb-16' : 'max-w-4xl p-4 pb-20 md:pb-12'}`}>
        <AnimatePresence mode="wait">
                  {/* TAB 1: KEBAKTIAN GABUNGAN (MINGGU & PARTANGIANGAN) */}
          {activeTab === 'minggu' && (
            <motion.div
              key="tab-kebaktian-gabung"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Segmented Toggler */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto mb-6">
                <button
                  onClick={() => setKebaktianSubTab('minggu')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    kebaktianSubTab === 'minggu'
                      ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ibadah Minggu</span>
                </button>
                <button
                  onClick={() => setKebaktianSubTab('partangiangan')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    kebaktianSubTab === 'partangiangan'
                      ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ibadah Partangiangan</span>
                </button>
              </div>

              {kebaktianSubTab === 'minggu' ? (
                /* Sunday Liturgy */
                liturgiMinggu.slice(0, 1).map((liturgy) => {
                  return (
                    <div key={liturgy.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md relative z-10" id="agenda-minggu-container">
                      
                      {/* Card header with info and optional download button */}
                      <div className="p-5 bg-slate-50 border-b border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                              <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                Kebaktian Minggu 
                              </span>
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-900 mt-2.5">{liturgy.judul}</h3>
                            {liturgy.topik && (
                              <div className="mt-2 text-xs md:text-sm font-extrabold text-blue-700 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-xl inline-flex items-center space-x-1.5 max-w-full">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shrink-0"></span>
                                <span className="break-words">Topik: {liturgy.topik}</span>
                              </div>
                            )}
                            {(liturgy.ayatReferensi || liturgy.ayatBacaan) && (
                              <div className="mt-2 flex flex-wrap gap-2 items-center">
                                {liturgy.ayatReferensi && (
                                  <div className="text-xs text-amber-900 font-extrabold bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-xl inline-flex items-center space-x-1.5 shadow-2xs">
                                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <span>Epistel: {liturgy.ayatReferensi}</span>
                                  </div>
                                )}
                                {liturgy.ayatBacaan && (
                                  <div className="text-xs text-amber-900 font-extrabold bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-xl inline-flex items-center space-x-1.5 shadow-2xs">
                                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <span>Khotbah: {liturgy.ayatBacaan}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* MANUAL LITURGY ACCORDION LIST */}
                      <div className="p-4 divide-y divide-slate-100 bg-transparent">
                        {liturgy.teksLiturgi && liturgy.teksLiturgi.length > 0 ? (
                          <>
                            {liturgy.teksLiturgi.map((step) => {
                               const isExpanded = !!expandedLiturgySteps[step.id];
                               return (
                                 <div key={step.id} className="py-3 px-2 transition-all rounded-xl hover:bg-slate-50">
                                   <button
                                     onClick={() => toggleStep(step.id)}
                                     className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none group"
                                   >
                                     <div className="flex items-start space-x-2.5">
                                       <span className="text-xs md:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                         {step.label}
                                       </span>
                                     </div>
                                     <div className="text-slate-400 group-hover:text-slate-600 pl-2 shrink-0">
                                       {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                     </div>
                                   </button>

                                   <AnimatePresence>
                                     {isExpanded && (
                                       <motion.div
                                         initial={{ height: 0, opacity: 0 }}
                                         animate={{ height: 'auto', opacity: 1 }}
                                         exit={{ height: 0, opacity: 0 }}
                                         transition={{ duration: 0.15 }}
                                         className="overflow-hidden"
                                       >
                                         <div className="mt-2.5 pl-3.5 border-l-2 border-blue-500 text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-150">
                                           {step.isi}
                                         </div>
                                       </motion.div>
                                     )}
                                   </AnimatePresence>
                                 </div>
                               );
                            })}
                            <div className="pt-3 text-center text-[11px] text-slate-400 italic">
                              (Ketuk pada baris acara di atas untuk memunculkan isi acara)
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center bg-slate-50/50 rounded-2xl m-2 border border-dashed border-slate-200">
                            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                            <p className="text-xs font-bold text-slate-700">Acara belum di isi oleh pengurus</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Partangiangan Liturgy */
                liturgiPartangiangan.slice(0, 1).map((liturgy) => {
                  return (
                    <div key={liturgy.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md relative z-10" id="agenda-partangiangan-container">
                      
                      {/* Card header with info and optional download button */}
                      <div className="p-5 bg-slate-50 border-b border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                              <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                Ibadah Lingkungan/Keluarga
                              </span>
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-900 mt-2.5">{liturgy.judul}</h3>
                            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>Jadwal: {liturgy.tanggal} (Pkl 19:30 WIB)</span>
                            </div>
                            {(liturgy.ayatReferensi || liturgy.ayatBacaan) && (
                              <>
                                {liturgy.ayatReferensi && (
                                  <div className="mt-2 text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block mr-2">
                                    Epistel: {liturgy.ayatReferensi}
                                  </div>
                                )}
                                {liturgy.ayatBacaan && (
                                  <div className="mt-2 text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                                    Khotbah: {liturgy.ayatBacaan}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Manual liturgy */}
                      <div className="p-4 divide-y divide-slate-100 bg-transparent">
                        {liturgy.teksLiturgi && liturgy.teksLiturgi.length > 0 ? (
                          <>
                            {liturgy.teksLiturgi.map((step) => {
                              const isExpanded = !!expandedLiturgySteps[step.id];
                              return (
                                <div key={step.id} className="py-3 px-2 transition-all rounded-xl hover:bg-slate-50">
                                  <button
                                    onClick={() => toggleStep(step.id)}
                                    className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none group"
                                  >
                                    <div className="flex items-start space-x-2.5">
                                      <span className="text-xs md:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {step.label}
                                      </span>
                                    </div>
                                    <div className="text-slate-400 group-hover:text-slate-600 pl-2 shrink-0">
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                  </button>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2.5 pl-3.5 border-l-2 border-emerald-500 text-xs md:text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed">
                                          {step.isi}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                            <div className="pt-3 text-center text-[11px] text-slate-400 italic">
                              (Ketuk pada baris acara di atas untuk memunculkan isi acara)
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center bg-slate-50/50 rounded-2xl m-2 border border-dashed border-slate-200">
                            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                            <p className="text-xs font-bold text-slate-700">Acara belum di isi oleh pengurus</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* TAB 2: PETUGAS IBADAH (MINGGU & PARTANGIANGAN) */}
          {activeTab === 'petugas' && (
            <motion.div
              key="tab-petugas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-3 shadow-sm relative z-10">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 border border-amber-200">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Daftar Petugas & Pelayan Ibadah</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Jadwal tugas parhalado,operator, song leader, dan jadwal partangiangan lingkungan HKBP.
                  </p>
                </div>
              </div>

              {/* Segmented Toggler */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto mb-2">
                <button
                  onClick={() => setPetugasSubTab('minggu')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    petugasSubTab === 'minggu'
                      ? 'bg-amber-600 text-white shadow shadow-amber-500/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Petugas Minggu</span>
                </button>
                <button
                  onClick={() => setPetugasSubTab('partangiangan')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    petugasSubTab === 'partangiangan'
                      ? 'bg-amber-600 text-white shadow shadow-amber-500/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Petugas Partangiangan</span>
                </button>
              </div>

              {/* Petugas View Content */}
              {petugasSubTab === 'minggu' ? (
                /* NEW FILE-LIKE SPREADSHEET FOR PETUGAS MINGGU */
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Jadwal Petugas Ibadah Minggu</span>
                        </div>
                      </div>

                      {/* DATE FOR PETUGAS MINGGU */}
                      <div className="mt-3 flex items-center space-x-2 text-xs bg-emerald-50/50 border border-emerald-100 rounded-xl px-3.5 py-2 text-emerald-950 font-semibold max-w-md">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tanggal: <span className="font-extrabold text-emerald-800">{petugasMingguDate || 'Belum diatur'}</span></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-b border-blue-800">
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-800 min-w-[150px] bg-blue-900 text-white">
                              Tugas
                            </th>
                            <th colSpan={3} className="px-4 py-2 text-center text-xs font-black uppercase tracking-wider border-b border-blue-800 bg-blue-900 text-white">
                              Petugas
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
                          {petugasMinggu && petugasMinggu.length > 0 ? (
                            petugasMinggu.map((row, index) => (
                              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-slate-900 border-r border-slate-200 bg-slate-50/80">
                                  {row.tugas}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-800 font-semibold border-r border-slate-200 text-center">
                                  {row.shift1 || <span className="text-slate-400 italic">Belum ditentukan</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-800 font-semibold border-r border-slate-200 text-center">
                                  {row.shift2 || <span className="text-slate-400 italic">Belum ditentukan</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-800 font-semibold text-center">
                                  {row.sekolahMinggu || <span className="text-slate-400 italic">Belum ditentukan</span>}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 italic">
                                Data petugas ibadah minggu belum tersedia, silakan hubungi admin.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-500 font-medium">
                      Seret tabel ke samping jika Anda menggunakan layar HP / perangkat seluler.
                    </div>
                  </div>
                </div>
              ) : (
                /* Petugas View Content for Partangiangan - 2 TABLES Layout */
                (() => {
                  const totalAma = partangianganAttendance.reduce((sum, r) => sum + (Number(r.ama) || 0), 0);
                  const totalIna = partangianganAttendance.reduce((sum, r) => sum + (Number(r.ina) || 0), 0);
                  const totalSM = partangianganAttendance.reduce((sum, r) => sum + (Number(r.sm) || 0), 0);
                  const totalReNa = partangianganAttendance.reduce((sum, r) => sum + (Number(r.rena) || 0), 0);
                  const totalParhalado = partangianganAttendance.reduce((sum, r) => sum + (Number(r.parhalado) || 0), 0);
                  const grandTotalNaro = totalAma + totalIna + totalSM + totalReNa + totalParhalado;

                  return (
                    <div className="space-y-8 animate-fadeIn">
                      
                      {/* TABEL 1: TOROP NARO MANDOHOTI PARTANGIANGAN (Hanya tampil jika ada data) */}
                      {partangianganAttendance && partangianganAttendance.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                  Torop Naro Mandohoti Partangiangan di Minggu Naung Salpu
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase self-start sm:self-auto">
                                Statistik Kehadiran
                              </span>
                            </div>

                            {/* DATE FOR TABEL 1 */}
                            <div className="mt-3 flex items-center space-x-2 text-xs bg-teal-50/50 border border-teal-100 rounded-xl px-3.5 py-2 text-teal-950 font-semibold max-w-md">
                              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>Tanggal: <span className="font-extrabold text-teal-800">{partangianganAttendanceDate || 'Belum diatur'}</span></span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white border-b border-teal-950">
                                  <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[100px]">
                                    Hari
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[150px]">
                                    Lunggu
                                  </th>
                                  <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[70px]">
                                    Ama
                                  </th>
                                  <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[70px]">
                                    Ina
                                  </th>
                                  <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[70px]">
                                    SM
                                  </th>
                                  <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[70px]">
                                    ReNa
                                  </th>
                                  <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-teal-950 min-w-[80px]">
                                    Parhalado
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider min-w-[90px] bg-emerald-950/40">
                                    Naro (Total)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {partangianganAttendance.map((row, idx) => {
                                  const rowTotal = (Number(row.ama) || 0) + 
                                                   (Number(row.ina) || 0) + 
                                                   (Number(row.sm) || 0) + 
                                                   (Number(row.rena) || 0) + 
                                                   (Number(row.parhalado) || 0);
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3 text-xs font-bold text-slate-700 text-center border-r border-slate-200">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                          row.hari === 'Selasa' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sky-100 text-sky-800 border border-sky-200'
                                        }`}>
                                          {row.hari}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-xs font-bold text-slate-900 border-r border-slate-200">
                                        {row.lunggu}
                                      </td>
                                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 text-center border-r border-slate-200">
                                        {row.ama}
                                      </td>
                                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 text-center border-r border-slate-200">
                                        {row.ina}
                                      </td>
                                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 text-center border-r border-slate-200">
                                        {row.sm}
                                      </td>
                                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 text-center border-r border-slate-200">
                                        {row.rena}
                                      </td>
                                      <td className="px-3 py-3 text-xs font-semibold text-slate-800 text-center border-r border-slate-200">
                                        {row.parhalado}
                                      </td>
                                      <td className="px-4 py-3 text-xs font-extrabold text-teal-800 text-center bg-teal-50/30">
                                        {rowTotal}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* BARIS 7: TOROP NARO (GRAND TOTALS) */}
                                <tr className="bg-teal-50/80 border-t-2 border-teal-300 font-extrabold text-slate-900">
                                  <td colSpan={2} className="px-4 py-3.5 text-xs font-black text-teal-950 uppercase tracking-wide border-r border-teal-200 text-left bg-teal-100/60">
                                    Torop Naro (Total Jumlah)
                                  </td>
                                  <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 bg-teal-50/20 text-teal-950">
                                    {totalAma}
                                  </td>
                                  <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 bg-teal-50/20 text-teal-950">
                                    {totalIna}
                                  </td>
                                  <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 bg-teal-50/20 text-teal-950">
                                    {totalSM}
                                  </td>
                                  <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 bg-teal-50/20 text-teal-950">
                                    {totalReNa}
                                  </td>
                                  <td className="px-3 py-3.5 text-xs text-center border-r border-teal-200 bg-teal-50/20 text-teal-950">
                                    {totalParhalado}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-center bg-teal-600 text-white font-black">
                                    {grandTotalNaro}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-500 font-medium">
                            Jumlah "Torop Naro" dihitung secara otomatis sebagai gabungan per kolom dari seluruh Lunggu.
                          </div>
                        </div>
                      )}

                      {/* TABEL 2: PETUGAS PELAYANAN PARTANGIANGAN */}
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                Petugas Partangiangan
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase self-start sm:self-auto">
                              Pelayan Sektor
                            </span>
                          </div>

                          {/* DATE FOR TABEL 2 */}
                          <div className="mt-3 flex items-center space-x-2 text-xs bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-2 text-indigo-950 font-semibold max-w-md">
                            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Tanggal: <span className="font-extrabold text-indigo-800">{petugasPartangianganDate || 'Belum diatur'}</span></span>
                          </div>
                        </div>

                        {partangianganMode === 'keluarga' ? (
                          <div className="p-8 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/80 text-center space-y-3">
                            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                              <Building className="w-7 h-7 text-amber-700" />
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase bg-amber-200/80 text-amber-900 px-3 py-1 rounded-full tracking-wider border border-amber-300/60">
                                Partangiangan Keluarga (Ibadah Keluarga)
                              </span>
                              <h4 className="text-base font-black text-amber-950 mt-2">Ibadah Partangiangan Sektor</h4>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-amber-900 leading-relaxed max-w-2xl mx-auto bg-white/90 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs">
                              "tidak ada petugas ibadah partangiangan dikarenakan ibadah keluarga akan dilakukan di rumah masing masing"
                            </p>
                          </div>
                        ) : partangianganMode === 'selesai' ? (
                          <div className="p-8 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-blue-50/80 text-center space-y-3">
                            <div className="w-14 h-14 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                              <Calendar className="w-7 h-7 text-blue-700" />
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase bg-blue-200/80 text-blue-900 px-3 py-1 rounded-full tracking-wider border border-blue-300/60">
                                Informasi Akhir Tahun
                              </span>
                              <h4 className="text-base font-black text-blue-950 mt-2">Status Ibadah Partangiangan</h4>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-blue-900 leading-relaxed max-w-2xl mx-auto bg-white/90 p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                              "tidak ada ibadah partangiangan karena ibadah partangiangann untuk tahun ini sudah selesai, akan dimulai lagi tahun depan"
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-b border-blue-950">
                                    <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[80px]">
                                      Hari
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[120px]">
                                      Lunggu
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[140px]">
                                      Dibagas Ni Keluarga
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[160px]">
                                      Alamat
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[130px] bg-indigo-950/20">
                                      Jamita
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider border-r border-blue-950 min-w-[130px] bg-indigo-950/20">
                                      Agenda
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider min-w-[130px] bg-indigo-950/20">
                                      Ende
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {petugasPartangiangan && petugasPartangiangan.length > 0 ? (
                                    petugasPartangiangan.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 py-3 text-xs font-bold text-slate-700 text-center border-r border-slate-200">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            row.hari === 'Selasa' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sky-100 text-sky-800 border border-sky-200'
                                          }`}>
                                            {row.hari}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-900 border-r border-slate-200">
                                          {row.lunggu}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-200">
                                          {row.keluarga || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium text-slate-600 border-r border-slate-200">
                                          {row.alamat || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-black text-indigo-950 bg-indigo-50/10 border-r border-slate-200">
                                          {row.jamita || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-black text-indigo-950 bg-indigo-50/10 border-r border-slate-200">
                                          {row.agenda || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-black text-indigo-950 bg-indigo-50/10">
                                          {row.ende || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={7} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                                        Data petugas pelayanan belum tersedia.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-500 font-medium">
                              3 kolom terakhir (Jamita, Agenda, Ende) merupakan daftar petugas pelayanan ibadah partangiangan.
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })()
              )}
            </motion.div>
          )}

          {/* TAB 3: WARTA JEMAAT */}
          {activeTab === 'warta' && (
            <motion.div
              key="tab-warta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* RINGKASAN TREN KEHADIRAN 1 MINGGU TERBARU (KHUSUS MINGGU, NO PARTANGIANGAN) */}
              {(() => {
                const latest1W = (attendanceTrends && attendanceTrends.length > 0) ? attendanceTrends[attendanceTrends.length - 1] : INITIAL_ATTENDANCE_TRENDS[INITIAL_ATTENDANCE_TRENDS.length - 1];
                const smCount = latest1W.sekolahMinggu ?? latest1W.mingguSm ?? 95;
                const shift1Count = latest1W.shift1 ?? latest1W.mingguAma ?? 215;
                const shift2Count = latest1W.shift2 ?? latest1W.mingguIna ?? 212;
                const totalSunday = smCount + shift1Count + shift2Count;

                return (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-3.5 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-800 pb-2.5">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Ringkasan Kebaktian Minggu (1 Minggu)
                        </span>
                        <h3 className="text-sm font-black text-white mt-1 flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span>Statistik Kehadiran Kebaktian Minggu</span>
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                          Ibadah Minggu: {latest1W.tanggalRange || petugasMingguDate || 'Minggu Terbaru'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Sekolah Minggu */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sekolah Minggu</span>
                          <span className="text-lg font-black text-amber-400 mt-0.5 block">{smCount} <span className="text-xs font-normal text-slate-400">orang</span></span>
                        </div>
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Shift 1 */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift 1 (Pagi)</span>
                          <span className="text-lg font-black text-cyan-400 mt-0.5 block">{shift1Count} <span className="text-xs font-normal text-slate-400">orang</span></span>
                        </div>
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Shift 2 */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift 2 (Siang)</span>
                          <span className="text-lg font-black text-indigo-400 mt-0.5 block">{shift2Count} <span className="text-xs font-normal text-slate-400">orang</span></span>
                        </div>
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Filter and Search Box */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3.5 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari pokok warta jemaat..."
                    value={wartaSearch}
                    onChange={(e) => setWartaSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>

                {/* Filter chip sliders */}
                <div className="overflow-x-auto no-scrollbar flex space-x-1.5 py-1">
                  {(['semua', 'umum', 'pelayanan', 'keuangan', 'duka', 'sukacita', 'sektor'] as const).map((kategori) => (
                    <button
                      key={kategori}
                      onClick={() => setWartaFilter(kategori)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border cursor-pointer transition-all shrink-0 ${
                        wartaFilter === kategori
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {kategori === 'semua'
                        ? 'Semua'
                        : kategori === 'umum'
                        ? 'Umum'
                        : kategori === 'pelayanan'
                        ? 'Pelayanan'
                        : kategori === 'keuangan'
                        ? 'Keuangan'
                        : kategori === 'duka'
                        ? 'Duka Cita'
                        : kategori === 'sukacita'
                        ? 'Sukacita'
                        : 'Sektor'}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIST WARTA */}
              <div className="space-y-3">
                {filteredWarta.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-xs shadow-sm">
                    Tidak ditemukan berita warta jemaat yang sesuai.
                  </div>
                ) : (
                  filteredWarta.map((warta) => (
                    <div
                      key={warta.id}
                      className={`border rounded-2xl p-5 transition-all shadow-sm relative overflow-hidden hover:bg-slate-50/50 ${
                        warta.prioritas
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {warta.prioritas && (
                        <div className="absolute top-0 right-0 bg-amber-100/50 text-[9px] text-amber-800 font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg flex items-center space-x-1 border-b border-l border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Penting</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg tracking-wide border ${
                            warta.kategori === 'umum'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : warta.kategori === 'pelayanan'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : warta.kategori === 'keuangan'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : warta.kategori === 'sukacita'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : warta.kategori === 'sektor'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {warta.kategori === 'duka'
                            ? 'Duka Cita'
                            : warta.kategori === 'sukacita'
                            ? 'Sukacita'
                            : warta.kategori === 'sektor'
                            ? 'Warta Sektor'
                            : warta.kategori}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{warta.tanggal}</span>
                      </div>

                      <h4 className="text-sm md:text-base font-bold text-slate-900 mt-2.5 leading-tight">
                        {warta.judul}
                      </h4>

                      <div className="text-xs text-slate-700 leading-relaxed mt-3 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-150">
                        {warta.isi}
                      </div>

                      {warta.penulis && (
                        <p className="text-[10px] text-slate-400 mt-2.5 text-right font-medium">
                          Oleh: <span className="text-slate-600 font-semibold">{warta.penulis}</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: KEUANGAN JEMAAT */}
          {activeTab === 'keuangan' && (
            <motion.div
              key="tab-keuangan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* TOP FINANCIAL METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. GABUNGAN: TOTAL PEMASUKAN & PENGELUARAN */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-slate-500 animate-pulse" />
                      <span>Total Kas Masuk & Keluar</span>
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
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Khusus pelayanan kasih & sosial</span>
                  </div>
                  <div className="p-3 bg-pink-50 text-pink-500 rounded-xl shrink-0 border border-pink-100">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. SALDO KUSTOM */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center space-x-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate max-w-[160px] block" title={customBalanceTitle}>{customBalanceTitle}</span>
                    </span>
                    <h4 className="text-lg font-black text-slate-800 mt-1">{formatRupiah(activeCustomBalanceValue)}</h4>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Saldo kustom (menggabungkan basis & transaksi)</span>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0 border border-amber-100">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* RECHARTS VISUALIZATION */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Grafik Kas Jemaat</h4>
                  <span className="text-[10px] text-slate-500 italic">Disusun berdasarkan Kategori Terdaftar</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#1e293b', borderRadius: '12px' }}
                        formatter={(value) => [formatRupiah(Number(value))]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="pemasukan" fill="#10B981" name="Pemasukan" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pengeluaran" fill="#EF4444" name="Pengeluaran" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DETAILED TRANSACTION TABLE LEDGER */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Buku Jurnal Keuangan Kas</h4>
                  
                  {/* Ledger Type Filter */}
                  <select
                    value={keuanganFilter}
                    onChange={(e: any) => setKeuanganFilter(e.target.value)}
                    className="bg-white text-xs border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="semua">Semua Transaksi</option>
                    <option value="pemasukan">Hanya Pemasukan</option>
                    <option value="pengeluaran">Hanya Pengeluaran</option>
                  </select>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] md:text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Kas</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaksiList
                        .filter((t) => keuanganFilter === 'semua' || t.tipe === keuanganFilter)
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-500 whitespace-nowrap">{t.tanggal}</td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{t.kategori}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide inline-block mt-0.5 ${
                                  t.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {t.tipe}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                getTipeKasDisplayClass(getTipeKasOfTransaction(t, customBalanceTitle))
                              }`}>
                                {getTipeKasLabel(getTipeKasOfTransaction(t, customBalanceTitle), customBalanceTitle)}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 break-words whitespace-normal min-w-[150px] max-w-[300px]" title={t.keterangan}>
                              {t.keterangan}
                            </td>
                            <td
                              className={`p-3 text-right font-bold font-mono whitespace-nowrap ${
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
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile-friendly list layout (visible only on mobile) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {transaksiList
                    .filter((t) => keuanganFilter === 'semua' || t.tipe === keuanganFilter)
                    .map((t) => (
                      <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{t.tanggal}</span>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                t.tipe === 'pemasukan'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {t.tipe}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                              getTipeKasDisplayClass(getTipeKasOfTransaction(t, customBalanceTitle))
                            }`}>
                              {getTipeKasLabel(getTipeKasOfTransaction(t, customBalanceTitle), customBalanceTitle)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="font-extrabold text-xs text-slate-800 block mb-0.5">{t.kategori}</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium break-words whitespace-normal">
                              {t.keterangan}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono text-xs font-black whitespace-nowrap block ${
                                t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {t.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(t.jumlah)}
                            </span>
                            {t.tipe === 'pemasukan' && t.sentralisasiPersen ? (
                              <span className="text-[9px] text-amber-600 font-medium font-sans block mt-0.5">
                                (sentral {t.sentralisasiPersen}% = {formatRupiah(t.jumlah * t.sentralisasiPersen / 100)})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  {transaksiList.filter((t) => keuanganFilter === 'semua' || t.tipe === keuanganFilter).length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      Tidak ada transaksi untuk ditampilkan
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: JEMAAT BERULANG TAHUN */}
          {activeTab === 'ultah' && (
            <motion.div
              key="tab-ultah"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Celeb Header Banner */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl shadow-sm relative overflow-hidden text-center relative z-10">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent"></div>
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>

                <div className="inline-flex p-3 bg-white text-amber-600 rounded-full border border-amber-200 mb-3 shadow-sm">
                  <Gift className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  Ulang Tahun Jemaat (1 Minggu Ini)
                </h3>
                <div className="bg-white/80 border border-amber-100 rounded-xl p-3 my-2.5 shadow-2xs max-w-md mx-auto text-amber-950 italic text-[11px] font-semibold leading-relaxed">
                  "{currentVerse.text}" <span className="block text-[10px] text-amber-700 font-extrabold mt-1 not-italic uppercase tracking-wider">— {currentVerse.verse}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Di bawah ini adalah daftar ruas jemaat yang berulang tahun pada periode <span className="text-amber-700 font-bold">
                    {(() => {
                      const today = new Date();
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                      return `${today.toLocaleDateString('id-ID', options)} s/d ${nextWeek.toLocaleDateString('id-ID', options)}`;
                    })()}
                  </span>.
                </p>
              </div>

              {/* LIST CELEB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {bdayMembersThisWeek.length === 0 ? (
                  <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-xs shadow-sm">
                    Tidak ada jemaat yang berulang tahun minggu ini.
                  </div>
                ) : (
                  bdayMembersThisWeek.map((member) => {
                    const info = getBdayDiffString(member.tanggalLahir);
                    const formattedBday = (() => {
                      const d = new Date(member.tanggalLahir);
                      if (isNaN(d.getTime())) return member.tanggalLahir;
                      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    })();

                    return (
                      <div
                        key={member.id}
                        className={`border rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between hover:bg-slate-50/50 ${
                          info.isToday
                            ? 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-amber-400 ring-1 ring-amber-400/20'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {info.isToday && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-bl-lg flex items-center space-x-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span>Hari Ini!</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                              <Gift className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 leading-tight">{member.nama}</h4>
                              <p className="text-[10px] text-blue-600 font-extrabold mt-0.5 uppercase tracking-wide">{member.sektor}</p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Tanggal Lahir:</span>
                              <span className="text-slate-800 font-semibold">{formattedBday}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Memasuki Umur:</span>
                              <span className="text-amber-700 font-bold">{info.age} Tahun</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>



              {/* Jemaat Form Editor Modal Overlay */}
              {editingJemaatId !== null && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-950 text-white p-5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                          <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider leading-none">
                            {editingJemaatId === 'new' ? 'Tambah Anggota Baru' : 'Ubah Data Anggota Jemaat'}
                          </h3>
                          <p className="text-[10px] text-blue-200 font-semibold tracking-wide mt-1">
                            {editingJemaatId === 'new' ? 'Daftarkan anggota jemaat baru ke database' : 'Perbarui informasi biodata & kolom tambahan anggota'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingJemaatId(null)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-5 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap Jemaat</label>
                          <input
                            type="text"
                            value={jmNama}
                            onChange={(e) => setJmNama(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all shadow-xs"
                            placeholder="Contoh: Sahat Siregar"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Lahir (Ulang Tahun)</label>
                          <input
                            type="date"
                            value={jmTglLahir}
                            onChange={(e) => setJmTglLahir(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sektor Jemaat (Wijk wilayah)</label>
                          <select
                            value={jmSektor}
                            onChange={(e) => setJmSektor(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all shadow-xs"
                          >
                            <option value="Sektor I">Sektor I (Wijk Immanuel)</option>
                            <option value="Sektor II">Sektor II (Wijk Jerusalem)</option>
                            <option value="Sektor III">Sektor III (Wijk Nazareth)</option>
                            <option value="Sektor IV">Sektor IV (Wijk Hebron)</option>
                            <option value="Sektor V">Sektor V (Wijk Betlehem)</option>
                            <option value="Sektor VI">Sektor VI (Wijk Kapernaum)</option>
                            <option value="Sektor VII">Sektor VII (Wijk Sion)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor WhatsApp / Telefon</label>
                          <input
                            type="text"
                            value={jmNoHP}
                            onChange={(e) => setJmNoHP(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold font-mono transition-all shadow-xs"
                            placeholder="Contoh: 081234567890"
                          />
                        </div>
                      </div>

                      {/* Dynamic Custom Fields */}
                      {Object.keys(jmCustomFields).length > 0 && (
                        <div className="border-t border-slate-100 pt-4 mt-4">
                          <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-3">
                            Informasi Kolom Tambahan (Dari Excel / Kustom)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(jmCustomFields).map((key) => (
                              <div key={key} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/80">
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wide">{key}</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = { ...jmCustomFields };
                                      delete next[key];
                                      setJmCustomFields(next);
                                    }}
                                    className="text-[10px] text-red-500 font-extrabold hover:underline cursor-pointer"
                                  >
                                    Hapus Kolom
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={jmCustomFields[key]}
                                  onChange={(e) => {
                                    setJmCustomFields({
                                      ...jmCustomFields,
                                      [key]: e.target.value
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add New Custom Column */}
                      <div className="border-t border-slate-150 pt-4 mt-4 bg-slate-50/30 p-4 rounded-2xl border border-dashed border-slate-200">
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Tambah Kolom Informasi Baru</label>
                            <input
                              type="text"
                              placeholder="Nama Kolom Baru (contoh: Pekerjaan, Alamat, Status)"
                              id="member-new-column-name-input"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-semibold transition-all shadow-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById('member-new-column-name-input') as HTMLInputElement;
                              const rawName = inputEl?.value.trim();
                              if (!rawName) {
                                showMemberToast('Harap isi nama kolom baru!');
                                return;
                              }
                              const cleanName = rawName;
                              if (['id', 'nama', 'sektor', 'tanggalLahir', 'noHP'].includes(cleanName.toLowerCase())) {
                                showMemberToast('Nama kolom tersebut sudah ada sebagai kolom standar.');
                                return;
                              }
                              if (jmCustomFields[cleanName] !== undefined) {
                                showMemberToast('Kolom tersebut sudah ada.');
                                return;
                              }
                              setJmCustomFields({
                                ...jmCustomFields,
                                [cleanName]: ''
                              });
                              if (inputEl) inputEl.value = '';
                              showMemberToast(`Kolom "${cleanName}" ditambahkan!`);
                            }}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer shrink-0"
                          >
                            Tambah Kolom
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 border-t border-slate-150 p-4.5 flex items-center justify-end space-x-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingJemaatId(null)}
                        className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveJemaat}
                        className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:brightness-105 active:scale-[0.99] text-xs font-extrabold text-white rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: LIVE ACARA PROJECTOR - STATUS SEDANG PERBAIKAN */}
          {activeTab === 'live' && (
            <motion.div
              key="tab-live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto z-50 flex flex-col font-sans"
              id="projector-live-frame"
            >
              {/* Top Navigation Bar */}
              <div className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center p-0.5">
                    <img
                      src="/hkbp.png"
                      alt="HKBP Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white leading-tight">HKBP Hinalang Silalahi</h2>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                        Live: Sedang Perbaikan
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('minggu')}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all border border-blue-400/40 cursor-pointer shadow-lg shadow-blue-900/30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              </div>

              {/* Maintenance Hero Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-2xl mx-auto w-full text-center">
                {/* Animated Badge & Icon */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/10 mx-auto">
                    <div className="relative">
                      <Tv className="w-12 h-12 text-slate-400" />
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-xl border-2 border-slate-900 shadow-md">
                        <Wrench className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sedang Dalam Perbaikan</span>
                  </div>
                </div>

                {/* Title and Message */}
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  Menu Live Sedang Dalam Perbaikan
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-lg mb-8">
                  Mohon maaf atas ketidaknyamanannya. Layanan siaran langsung dan tayangan proyektor ibadah HKBP Hinalang Silalahi saat ini sedang dalam proses pemeliharaan serta optimalisasi server.
                </p>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5">
                      <Wrench className="w-4 h-4 text-amber-400" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Status Sistem</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sedang dilakukan konfigurasi dan sinkronisasi proyektor.
                    </p>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-2.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Buku Acara</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Jemaat tetap dapat mengakses tata ibadah lengkap di menu <span className="text-blue-300 font-semibold">Kebaktian</span>.
                    </p>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Perkiraan Aktif</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Akan segera aktif kembali untuk ibadah jemaat mendatang.
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setActiveTab('minggu')}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-lg shadow-blue-900/30 transition cursor-pointer border border-blue-400/20"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Kembali ke Kebaktian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('warta')}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition cursor-pointer border border-slate-700"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Lihat Warta Jemaat</span>
                  </button>
                </div>

                {/* Emergency Link for Church Media Operators */}
                <div className="mt-8 pt-6 border-t border-slate-800/80 w-full text-center">
                  <p className="text-[11px] text-slate-500">
                    Operator Media / Parhalado membutuhkan tautan manual?{' '}
                    <a
                      href="https://church-presenter.ai.studio/projector?mode=share&account=acc_default"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold underline inline-flex items-center gap-1"
                    >
                      Buka Tautan Layar Proyektor
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* PERSISTENT FLOATING BOTTOM NAVIGATION BAR */}
      {activeTab !== 'live' && (
        <footer className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-t border-white/10 py-2.5 px-2 flex items-center justify-around z-40 shadow-lg backdrop-blur-md">
          <div className="max-w-2xl mx-auto w-full flex items-center justify-around gap-1">
            <button
              onClick={() => {
                setActiveTab('minggu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all ${
                activeTab === 'minggu' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Kebaktian</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('petugas');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all ${
                activeTab === 'petugas' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Petugas</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('warta');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all ${
                activeTab === 'warta' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Warta</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('keuangan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all ${
                activeTab === 'keuangan' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Keuangan</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ultah');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all ${
                activeTab === 'ultah' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
            >
              <Gift className="w-5 h-5" />
              <span className="text-[9px] font-semibold">Ultah</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('live');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-all relative ${
                activeTab === 'live' ? 'text-amber-300 font-bold scale-105' : 'text-blue-100/70 hover:text-white'
              }`}
              title="Layar Live (Sedang Perbaikan)"
            >
              <div className="relative">
                <Tv className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-3.5 px-1 py-0.5 bg-amber-400 text-slate-950 text-[7px] font-black rounded-full uppercase leading-none tracking-tighter shadow-sm">
                  Perbaikan
                </span>
              </div>
              <span className="text-[9px] font-semibold">Live</span>
            </button>
          </div>
        </footer>
      )}

      {/* SIDEBAR DRAWER MENU */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col border-r border-slate-100 font-sans"
            >
              <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center p-0.5 shadow-md">
                    <img
                      src="/hkbp.png"
                      alt="HKBP Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight leading-none">HKBP Hinalang</h2>
                    <p className="text-[10px] text-blue-100 mt-1 font-semibold leading-none">Silalahi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 pl-2.5">Menu Navigasi</p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuModal('jadwal');
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <Clock className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Jadwal Ibadah</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    window.open(window.location.origin + window.location.pathname + '?view=tentang', '_blank');
                  }}
                  className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <History className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Tentang HKBP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuModal('parhalado');
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <Users className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Daftar Parhalado</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuModal('alamat');
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Alamat & Lokasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuModal('developer');
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <Phone className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Hubungi Developer</span>
                </button>
              </div>

              <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
                <p className="text-[10px] text-slate-400 font-mono">HKBP Hinalang Silalahi App © 2026</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAILED OVERLAY MODALS FOR SIDEBAR MENU ITEMS */}
      <AnimatePresence>
        {activeMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMenuModal(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans max-h-[85vh] border border-slate-100"
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-2.5">
                  {activeMenuModal === 'jadwal' && <Clock className="w-5 h-5 text-amber-300" />}
                  {activeMenuModal === 'sejarah' && <History className="w-5 h-5 text-amber-300" />}
                  {activeMenuModal === 'parhalado' && <Users className="w-5 h-5 text-amber-300" />}
                  {activeMenuModal === 'alamat' && <MapPin className="w-5 h-5 text-amber-300" />}
                  {activeMenuModal === 'developer' && <Phone className="w-5 h-5 text-amber-300" />}
                  <h3 className="font-extrabold text-sm md:text-base tracking-tight leading-none">
                    {activeMenuModal === 'jadwal' && 'Jadwal Ibadah Hari Minggu'}
                    {activeMenuModal === 'sejarah' && 'Tentang HKBP Hinalang Silalahi'}
                    {activeMenuModal === 'parhalado' && 'Daftar Parhalado Huria'}
                    {activeMenuModal === 'alamat' && 'Alamat & Lokasi Google Maps'}
                    {activeMenuModal === 'developer' && 'Hubungi Pengembang App'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenuModal(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body Scroll Container */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                {activeMenuModal === 'jadwal' && (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-xs italic">
                      Berikut adalah waktu pelaksanaan ibadah minggu di HKBP Hinalang Silalahi:
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-xs md:text-sm leading-tight">Ibadah Sekolah Minggu</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Anak-anak & Balita</p>
                          </div>
                        </div>
                        <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-mono text-xs md:text-sm font-black border border-emerald-200">
                          {jadwalIbadah.sekolahMinggu || '07.30 WIB'}
                        </span>
                      </div>

                      <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-xs md:text-sm leading-tight">Ibadah Shift 1</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Umum</p>
                          </div>
                        </div>
                        <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 rounded-xl font-mono text-xs md:text-sm font-black border border-blue-200">
                          {jadwalIbadah.shift1 || '08.00 WIB'}
                        </span>
                      </div>

                      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-xs md:text-sm leading-tight">Ibadah Shift 2</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Umum</p>
                          </div>
                        </div>
                        <span className="px-3.5 py-1.5 bg-indigo-100 text-indigo-800 rounded-xl font-mono text-xs md:text-sm font-black border border-indigo-200">
                          {jadwalIbadah.shift2 || '10.00 WIB'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeMenuModal === 'sejarah' && (
                  <div className="space-y-6">
                    {tentangGerejaList.map((item) => (
                      <div key={item.id} className="bg-slate-50 rounded-2xl border border-slate-150 p-4.5 space-y-3.5 shadow-xs">
                        {item.gambar ? (
                          <div className="space-y-2">
                            <div className="w-full aspect-[2/1] bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                              <img
                                src={item.gambar}
                                alt={item.judulGambar || item.judul}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            {(item.judulGambar || item.keteranganGambar) && (
                              <div className="bg-white border border-slate-150 rounded-xl p-3 space-y-1 shadow-xs">
                                {item.judulGambar && (
                                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0"></span>
                                    <span>{item.judulGambar}</span>
                                  </p>
                                )}
                                {item.keteranganGambar && (
                                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-3">
                                    {item.keteranganGambar}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : null}
                        <div className="space-y-1">
                          <h4 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center justify-between">
                            <span>{item.judul}</span>
                            {item.tanggalUpdate && (
                              <span className="text-[10px] font-medium text-slate-400 font-mono">
                                Diperbarui: {item.tanggalUpdate}
                              </span>
                            )}
                          </h4>
                          <div className="h-0.5 w-12 bg-blue-600 rounded-full" />
                        </div>
                        <div className="space-y-2.5">
                          {item.isi.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="indent-6 text-slate-700 leading-relaxed text-xs md:text-sm font-medium">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                    {tentangGerejaList.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-xs italic">
                        Belum ada konten informasi tentang gereja.
                      </div>
                    )}
                  </div>
                )}

                {activeMenuModal === 'parhalado' && (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-xs italic">
                      Berikut adalah daftar lengkap pelayan dan pengurus (Parhalado) yang aktif melayani di HKBP Hinalang Silalahi saat ini:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {parhaladoList.map((member, idx) => {
                        // Generate dynamic initial for badge icon
                        const initials = member.nama
                          .split(' ')
                          .filter(n => !n.startsWith('St.') && !n.startsWith('Pdt.') && !n.startsWith('Cpdt.'))
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('') || 'PH';

                        // Decide nice theme color for background badge
                        let badgeBg = 'bg-slate-600';
                        if (member.jabatan.toLowerCase().includes('pimpinan') || member.jabatan.toLowerCase().includes('pendeta resort')) {
                          badgeBg = 'bg-blue-600';
                        } else if (member.jabatan.toLowerCase().includes('pendeta')) {
                          badgeBg = 'bg-indigo-600';
                        } else if (member.jabatan.toLowerCase().includes('calon') || member.jabatan.toLowerCase().includes('bikaris')) {
                          badgeBg = 'bg-amber-600';
                        } else if (member.jabatan.toLowerCase().includes('sekretaris') || member.jabatan.toLowerCase().includes('bendahara')) {
                          badgeBg = 'bg-teal-600';
                        }

                        return (
                          <div key={member.id} className="p-3.5 bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl flex flex-col justify-between transition-all space-y-2 shadow-xs">
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-full ${badgeBg} flex items-center justify-center text-white font-extrabold text-xs font-mono shadow-sm shrink-0`}>
                                {initials.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 text-xs leading-tight truncate" title={member.nama}>
                                  {member.nama}
                                </h4>
                                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mt-0.5 leading-none">
                                  {member.jabatan}
                                </span>
                              </div>
                            </div>
                            
                            {member.noTelp && (
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold font-mono">
                                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{member.noTelp}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <a
                                    href={`tel:${member.noTelp}`}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                    title="Hubungi Telepon"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${member.noTelp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition"
                                    title="Hubungi WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeMenuModal === 'alamat' && (
                  <div className="space-y-4">
                    {/* Header Banner Lokasi Akurat */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4.5 rounded-2xl border border-blue-100 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30 mt-0.5">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 text-sm tracking-tight">HKBP Hinalang Silalahi</h4>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Lokasi Akurat
                              </span>
                            </div>
                            <p className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wide mt-0.5">
                              HKBP Resort Hinalang Silalahi • Distrik XI Toba Hasundutan
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-blue-150/70 space-y-2 text-xs shadow-2xs">
                        <div className="flex items-start space-x-2">
                          <span className="font-extrabold text-slate-800 shrink-0">Alamat:</span>
                          <span className="text-slate-700 font-semibold leading-relaxed">
                            Desa Hinalang Bagasan, Kecamatan Balige, Kabupaten Toba, Sumatera Utara 22312, Indonesia.
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-500 font-medium">
                            Titik Koordinat: <strong className="font-mono text-slate-900 font-bold">2.3346565, 99.0417933</strong>
                          </span>
                          <span className="text-slate-500 font-medium">
                            Plus Code: <strong className="font-mono text-blue-700 font-bold">897R+VP Hinalang Bagasan</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Google Maps Interactive Frame */}
                    <div className="w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner group">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1994.57!2d99.0417933!3d2.3346565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x302e04937513a287%3A0xd841b081a75a68d9!2sHKBP%20Hinalang%20Silalahi%20Lutheran%20Church!5e0!3m2!1sid!2sid!4v1720000000000!5m2!1sid!2sid"
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps Location - HKBP Hinalang Silalahi Lutheran Church"
                      />
                    </div>

                    {/* Tombol Aksi Utama: Buka di Google Maps & Petunjuk Arah */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <a
                        href="https://maps.app.goo.gl/MsdAzCJwb64EB8eP6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-blue-600/20"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span>Buka di Google Maps</span>
                      </a>

                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=2.3346565,99.0417933"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-600/20"
                      >
                        <Navigation className="w-4 h-4 shrink-0" />
                        <span>Petunjuk Arah</span>
                      </a>
                    </div>

                    {/* Tombol Salin Alamat & Koordinat */}
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy = 'HKBP Hinalang Silalahi Lutheran Church, Desa Hinalang Bagasan, Kec. Balige, Kab. Toba, Sumatera Utara 22312, Indonesia (Titik Koordinat: 2.3346565, 99.0417933)';
                          navigator.clipboard.writeText(textToCopy);
                          setCopiedLocation(true);
                          setTimeout(() => setCopiedLocation(false), 2500);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition cursor-pointer shadow-2xs"
                      >
                        {copiedLocation ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-extrabold">Alamat & Koordinat Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin Alamat & Titik Koordinat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeMenuModal === 'developer' && (
                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 shadow-lg space-y-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center font-extrabold text-sm shadow-md text-white font-mono shrink-0">
                          DEV
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm tracking-tight leading-none">Tim Pengembang Aplikasi</h4>
                          <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-wider block mt-1.5">Sistem Informasi HKBP Hinalang</span>
                        </div>
                      </div>

                      <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-semibold">
                        Aplikasi ini dikembangkan secara sukarela untuk mempermudah pelayanan digital Huria HKBP Hinalang Silalahi. Menyediakan akses instan ke Tata Ibadah, Warta Jemaat, dan Transparansi Keuangan secara real-time.
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                          <span>Didukung oleh</span>
                          <span className="text-amber-300 font-black tracking-wide font-sans">AI Studio Developer Hub</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <h4 className="font-black text-xs text-slate-900 mb-2">Hubungi Pengembang</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                        Kami sangat mengharapkan masukan Anda demi kelancaran ibadah digital kita. Klik tombol kontak di bawah ini untuk terhubung langsung:
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <a
                          href="https://wa.me/6287814180634"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition hover:scale-105 active:scale-95 cursor-pointer group text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition">
                            <MessageCircle className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide mt-2 block">WhatsApp</span>
                        </a>

                        <a
                          href="https://instagram.com/_prmshn_"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-3.5 bg-pink-50/70 hover:bg-pink-100 border border-pink-100 rounded-xl transition hover:scale-105 active:scale-95 cursor-pointer group text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition">
                            <Instagram className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-[10px] text-pink-800 font-extrabold uppercase tracking-wide mt-2 block">Instagram</span>
                        </a>

                        <a
                          href="mailto:pirmasiahaan1234@gmail.com?subject=Saran%20Aplikasi%20HKBP%20Hinalang"
                          className="flex flex-col items-center justify-center p-3.5 bg-blue-50/70 hover:bg-blue-100 border border-blue-100 rounded-xl transition hover:scale-105 active:scale-95 cursor-pointer group text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition">
                            <Mail className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-[10px] text-blue-800 font-extrabold uppercase tracking-wide mt-2 block">E-Mail</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveMenuModal(null)}
                  className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Dialog
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION DIALOG FOR MEMBER VIEW */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
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
      {/* ALKITAB INDONESIA & BIBEL BATAK TOBA MODAL */}
      <AlkitabModal
        isOpen={isAlkitabModalOpen}
        onClose={() => setIsAlkitabModalOpen(false)}
        initialQuery={alkitabQuery}
      />
    </div>
  );
}
