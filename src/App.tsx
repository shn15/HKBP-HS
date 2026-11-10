import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import MemberView from './components/MemberView';
import AdminLogin from './components/AdminLogin';
import AdminView from './components/AdminView';
import StandaloneTentang from './components/StandaloneTentang';
import { fetchDbFromServer, saveDbKey, getLocalClientTimestamp } from './services/dbClient';
import { Liturgi, Warta, Transaksi, Jemaat, PetugasMingguRow, PartangianganAttendanceRow, PetugasPartangianganRow, JadwalIbadah, ParhaladoMember, TentangGerejaItem, WeeklyAttendanceTrend, PartangianganMode } from './types';
import {
  INITIAL_LITURGI_MINGGU,
  INITIAL_LITURGI_PARTANGIANGAN,
  INITIAL_WARTA,
  INITIAL_TRANSAKSI,
  INITIAL_PETUGAS_MINGGU,
  INITIAL_PARTANGIANGAN_ATTENDANCE,
  INITIAL_PETUGAS_PARTANGIANGAN,
  INITIAL_JADWAL_IBADAH,
  INITIAL_TENTANG_GEREJA,
  INITIAL_PARHALADO_LIST,
  INITIAL_ATTENDANCE_TRENDS
} from './data/mockData';

export default function App() {
  // Navigation states with persistence
  const [isAdminMode, setIsAdminMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin') return true;
    return sessionStorage.getItem('hkbp_is_admin_mode') === 'true';
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('hkbp_admin_logged') === 'true';
  });
  const [isStandaloneTentang, setIsStandaloneTentang] = useState(false);

  // Core synchronized application state
  const [liturgiMinggu, setLiturgiMinggu] = useState<Liturgi[]>([]);
  const [liturgiPartangiangan, setLiturgiPartangiangan] = useState<Liturgi[]>([]);
  const [petugasMinggu, setPetugasMinggu] = useState<PetugasMingguRow[]>([]);
  const [partangianganAttendance, setPartangianganAttendance] = useState<PartangianganAttendanceRow[]>([]);
  const [petugasPartangiangan, setPetugasPartangiangan] = useState<PetugasPartangianganRow[]>([]);
  const [partangianganAttendanceDate, setPartangianganAttendanceDate] = useState<string>('');
  const [petugasPartangianganDate, setPetugasPartangianganDate] = useState<string>('');
  const [petugasMingguDate, setPetugasMingguDate] = useState<string>('');
  const [wartaList, setWartaList] = useState<Warta[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [customBalanceTitle, setCustomBalanceTitle] = useState<string>('Kas Remaja & Naposo');
  const [customBalanceValue, setCustomBalanceValue] = useState<number>(2500000);
  const [jadwalIbadah, setJadwalIbadah] = useState<JadwalIbadah>(INITIAL_JADWAL_IBADAH);
  const [tentangGerejaList, setTentangGerejaList] = useState<TentangGerejaItem[]>([]);
  const [parhaladoList, setParhaladoList] = useState<ParhaladoMember[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<WeeklyAttendanceTrend[]>([]);
  const [partangianganMode, setPartangianganMode] = useState<PartangianganMode>('normal');

  // Helper for safe JSON parsing without throw
  const safeJsonParse = <T,>(val: string | null, fallback: T): T => {
    if (!val) return fallback;
    try {
      return JSON.parse(val);
    } catch (e) {
      console.warn('Failed to parse cached JSON, using fallback:', e);
      return fallback;
    }
  };

  // Helper to save key to server/Firestore
  const saveKeyToServer = (key: string, value: any) => {
    saveDbKey(key, value).catch(err => console.error(`Failed to sync ${key}:`, err));
  };

  // 1. Initial hydration and safety checks
  useEffect(() => {
    // Check if showing standalone Tentang Gereja
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'tentang') {
      setIsStandaloneTentang(true);
    }

    // Check session storage for admin persistence
    try {
      const logged = sessionStorage.getItem('hkbp_admin_logged');
      if (logged === 'true') {
        setIsAdminLoggedIn(true);
      }
    } catch (e) {
      console.warn('Session storage inaccessible:', e);
    }

    // A. Instant client-side hydration for snappiness
    const localMinggu = localStorage.getItem('hkbp_liturgi_minggu');
    setLiturgiMinggu(safeJsonParse(localMinggu, INITIAL_LITURGI_MINGGU));

    const localPartangiangan = localStorage.getItem('hkbp_liturgi_partangiangan');
    setLiturgiPartangiangan(safeJsonParse(localPartangiangan, INITIAL_LITURGI_PARTANGIANGAN));

    const localPetugas = localStorage.getItem('hkbp_petugas_minggu');
    setPetugasMinggu(safeJsonParse(localPetugas, INITIAL_PETUGAS_MINGGU));

    const localPartangianganAttendance = localStorage.getItem('hkbp_partangiangan_attendance');
    setPartangianganAttendance(safeJsonParse(localPartangianganAttendance, INITIAL_PARTANGIANGAN_ATTENDANCE));

    const localPetugasPartangiangan = localStorage.getItem('hkbp_petugas_partangiangan');
    setPetugasPartangiangan(safeJsonParse(localPetugasPartangiangan, INITIAL_PETUGAS_PARTANGIANGAN));

    setPartangianganAttendanceDate(localStorage.getItem('hkbp_partangiangan_attendance_date') || 'Selasa, 09 Juni & Rabu, 10 Juni 2026');
    setPetugasPartangianganDate(localStorage.getItem('hkbp_petugas_partangiangan_date') || 'Selasa, 16 Juni & Rabu, 17 Juni 2026');
    setPetugasMingguDate(localStorage.getItem('hkbp_petugas_minggu_date') || 'Minggu, 14 Juni 2026');
    const localPartangianganMode = localStorage.getItem('hkbp_partangiangan_mode') as PartangianganMode;
    if (localPartangianganMode) setPartangianganMode(localPartangianganMode);

    const localWarta = localStorage.getItem('hkbp_warta_list');
    setWartaList(safeJsonParse(localWarta, INITIAL_WARTA));

    const localTransaksi = localStorage.getItem('hkbp_transaksi_list');
    setTransaksiList(safeJsonParse(localTransaksi, INITIAL_TRANSAKSI));

    const localJemaat = localStorage.getItem('hkbp_jemaat_list');
    setJemaatList(safeJsonParse(localJemaat, []));

    setCustomBalanceTitle(localStorage.getItem('hkbp_custom_balance_title') || 'Kas Remaja & Naposo');
    setCustomBalanceValue(Number(localStorage.getItem('hkbp_custom_balance_value') || '2500000'));

    const localJadwal = localStorage.getItem('hkbp_jadwal_ibadah');
    setJadwalIbadah(safeJsonParse(localJadwal, INITIAL_JADWAL_IBADAH));

    const localTentang = localStorage.getItem('hkbp_tentang_gereja_list');
    setTentangGerejaList(safeJsonParse(localTentang, INITIAL_TENTANG_GEREJA));

    const localParhalado = localStorage.getItem('hkbp_parhalado_list');
    setParhaladoList(safeJsonParse(localParhalado, INITIAL_PARHALADO_LIST));

    const localTrends = localStorage.getItem('hkbp_attendance_trends');
    setAttendanceTrends(safeJsonParse(localTrends, INITIAL_ATTENDANCE_TRENDS));

    // B. Fetch server/Firestore database for real synchronization
    fetchDbFromServer()
      .then(db => {
        if (db && typeof db === 'object' && Object.keys(db).length > 0) {
          // Update all React state and local storage caches with server state
          if (db.hkbp_liturgi_minggu !== undefined) {
            setLiturgiMinggu(db.hkbp_liturgi_minggu);
            localStorage.setItem('hkbp_liturgi_minggu', JSON.stringify(db.hkbp_liturgi_minggu));
          }
          if (db.hkbp_liturgi_partangiangan !== undefined) {
            setLiturgiPartangiangan(db.hkbp_liturgi_partangiangan);
            localStorage.setItem('hkbp_liturgi_partangiangan', JSON.stringify(db.hkbp_liturgi_partangiangan));
          }
          if (db.hkbp_petugas_minggu !== undefined) {
            setPetugasMinggu(db.hkbp_petugas_minggu);
            localStorage.setItem('hkbp_petugas_minggu', JSON.stringify(db.hkbp_petugas_minggu));
          }
          if (db.hkbp_partangiangan_attendance !== undefined) {
            setPartangianganAttendance(db.hkbp_partangiangan_attendance);
            localStorage.setItem('hkbp_partangiangan_attendance', JSON.stringify(db.hkbp_partangiangan_attendance));
          }
          if (db.hkbp_petugas_partangiangan !== undefined) {
            setPetugasPartangiangan(db.hkbp_petugas_partangiangan);
            localStorage.setItem('hkbp_petugas_partangiangan', JSON.stringify(db.hkbp_petugas_partangiangan));
          }
          if (db.hkbp_partangiangan_attendance_date !== undefined) {
            setPartangianganAttendanceDate(db.hkbp_partangiangan_attendance_date);
            localStorage.setItem('hkbp_partangiangan_attendance_date', db.hkbp_partangiangan_attendance_date);
          }
          if (db.hkbp_petugas_partangiangan_date !== undefined) {
            setPetugasPartangianganDate(db.hkbp_petugas_partangiangan_date);
            localStorage.setItem('hkbp_petugas_partangiangan_date', db.hkbp_petugas_partangiangan_date);
          }
          if (db.hkbp_petugas_minggu_date !== undefined) {
            setPetugasMingguDate(db.hkbp_petugas_minggu_date);
            localStorage.setItem('hkbp_petugas_minggu_date', db.hkbp_petugas_minggu_date);
          }
          if (db.hkbp_partangiangan_mode !== undefined) {
            setPartangianganMode(db.hkbp_partangiangan_mode as PartangianganMode);
            localStorage.setItem('hkbp_partangiangan_mode', db.hkbp_partangiangan_mode);
          }
          if (db.hkbp_warta_list !== undefined) {
            setWartaList(db.hkbp_warta_list);
            localStorage.setItem('hkbp_warta_list', JSON.stringify(db.hkbp_warta_list));
          }
          if (db.hkbp_transaksi_list !== undefined) {
            setTransaksiList(db.hkbp_transaksi_list);
            localStorage.setItem('hkbp_transaksi_list', JSON.stringify(db.hkbp_transaksi_list));
          }
          if (db.hkbp_jemaat_list !== undefined) {
            setJemaatList(db.hkbp_jemaat_list);
            localStorage.setItem('hkbp_jemaat_list', JSON.stringify(db.hkbp_jemaat_list));
          }
          if (db.hkbp_custom_balance_title !== undefined) {
            setCustomBalanceTitle(db.hkbp_custom_balance_title);
            localStorage.setItem('hkbp_custom_balance_title', db.hkbp_custom_balance_title);
          }
          if (db.hkbp_custom_balance_value !== undefined) {
            setCustomBalanceValue(Number(db.hkbp_custom_balance_value));
            localStorage.setItem('hkbp_custom_balance_value', db.hkbp_custom_balance_value.toString());
          }
          if (db.hkbp_jadwal_ibadah !== undefined) {
            setJadwalIbadah(db.hkbp_jadwal_ibadah);
            localStorage.setItem('hkbp_jadwal_ibadah', JSON.stringify(db.hkbp_jadwal_ibadah));
          }
          if (db.hkbp_tentang_gereja_list !== undefined) {
            setTentangGerejaList(db.hkbp_tentang_gereja_list);
            localStorage.setItem('hkbp_tentang_gereja_list', JSON.stringify(db.hkbp_tentang_gereja_list));
          }
          if (db.hkbp_parhalado_list !== undefined) {
            setParhaladoList(db.hkbp_parhalado_list);
            localStorage.setItem('hkbp_parhalado_list', JSON.stringify(db.hkbp_parhalado_list));
          }
          if (db.hkbp_attendance_trends !== undefined) {
            setAttendanceTrends(db.hkbp_attendance_trends);
            localStorage.setItem('hkbp_attendance_trends', JSON.stringify(db.hkbp_attendance_trends));
          }
          if (db.hkbp_registered_admins !== undefined) {
            localStorage.setItem('hkbp_registered_admins', JSON.stringify(db.hkbp_registered_admins));
          }
        }
      })
      .catch(err => console.error('Failed to load DB:', err));
  }, []);

  // Real-time synchronization: cross-tab storage events, focus sync, and multi-device polling
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'hkbp_liturgi_minggu') setLiturgiMinggu(safeJsonParse(e.newValue, INITIAL_LITURGI_MINGGU));
        if (e.key === 'hkbp_liturgi_partangiangan') setLiturgiPartangiangan(safeJsonParse(e.newValue, INITIAL_LITURGI_PARTANGIANGAN));
        if (e.key === 'hkbp_warta_list') setWartaList(safeJsonParse(e.newValue, INITIAL_WARTA));
        if (e.key === 'hkbp_transaksi_list') setTransaksiList(safeJsonParse(e.newValue, INITIAL_TRANSAKSI));
        if (e.key === 'hkbp_jemaat_list') setJemaatList(safeJsonParse(e.newValue, []));
        if (e.key === 'hkbp_petugas_minggu') setPetugasMinggu(safeJsonParse(e.newValue, INITIAL_PETUGAS_MINGGU));
        if (e.key === 'hkbp_partangiangan_attendance') setPartangianganAttendance(safeJsonParse(e.newValue, INITIAL_PARTANGIANGAN_ATTENDANCE));
        if (e.key === 'hkbp_petugas_partangiangan') setPetugasPartangiangan(safeJsonParse(e.newValue, INITIAL_PETUGAS_PARTANGIANGAN));
        if (e.key === 'hkbp_partangiangan_attendance_date') setPartangianganAttendanceDate(e.newValue);
        if (e.key === 'hkbp_petugas_partangiangan_date') setPetugasPartangianganDate(e.newValue);
        if (e.key === 'hkbp_petugas_minggu_date') setPetugasMingguDate(e.newValue);
        if (e.key === 'hkbp_partangiangan_mode') setPartangianganMode(e.newValue as PartangianganMode);
        if (e.key === 'hkbp_custom_balance_title') setCustomBalanceTitle(e.newValue);
        if (e.key === 'hkbp_custom_balance_value') setCustomBalanceValue(Number(e.newValue));
        if (e.key === 'hkbp_jadwal_ibadah') setJadwalIbadah(safeJsonParse(e.newValue, INITIAL_JADWAL_IBADAH));
        if (e.key === 'hkbp_tentang_gereja_list') setTentangGerejaList(safeJsonParse(e.newValue, INITIAL_TENTANG_GEREJA));
        if (e.key === 'hkbp_parhalado_list') setParhaladoList(safeJsonParse(e.newValue, INITIAL_PARHALADO_LIST));
        if (e.key === 'hkbp_attendance_trends') setAttendanceTrends(safeJsonParse(e.newValue, INITIAL_ATTENDANCE_TRENDS));
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    const syncFromServer = () => {
      fetchDbFromServer().then(db => {
        if (!db || typeof db !== 'object') return;

        // Check if a key was modified/deleted on this client recently
        const shouldApply = (key: string): boolean => {
          const localTs = getLocalClientTimestamp(key);
          const serverTs = Number(db[`updated_at_${key}`] || 0);
          // If locally edited within the last 15 seconds and server timestamp is older than local, ignore stale server data
          if (localTs > 0 && Date.now() - localTs < 15000 && serverTs < localTs) {
            return false;
          }
          return true;
        };

        if (db.hkbp_liturgi_minggu !== undefined && shouldApply('hkbp_liturgi_minggu')) {
          setLiturgiMinggu(db.hkbp_liturgi_minggu);
          localStorage.setItem('hkbp_liturgi_minggu', JSON.stringify(db.hkbp_liturgi_minggu));
        }
        if (db.hkbp_liturgi_partangiangan !== undefined && shouldApply('hkbp_liturgi_partangiangan')) {
          setLiturgiPartangiangan(db.hkbp_liturgi_partangiangan);
          localStorage.setItem('hkbp_liturgi_partangiangan', JSON.stringify(db.hkbp_liturgi_partangiangan));
        }
        if (db.hkbp_warta_list !== undefined && shouldApply('hkbp_warta_list')) {
          setWartaList(db.hkbp_warta_list);
          localStorage.setItem('hkbp_warta_list', JSON.stringify(db.hkbp_warta_list));
        }
        if (db.hkbp_petugas_minggu !== undefined && shouldApply('hkbp_petugas_minggu')) {
          setPetugasMinggu(db.hkbp_petugas_minggu);
          localStorage.setItem('hkbp_petugas_minggu', JSON.stringify(db.hkbp_petugas_minggu));
        }
        if (db.hkbp_partangiangan_attendance !== undefined && shouldApply('hkbp_partangiangan_attendance')) {
          setPartangianganAttendance(db.hkbp_partangiangan_attendance);
          localStorage.setItem('hkbp_partangiangan_attendance', JSON.stringify(db.hkbp_partangiangan_attendance));
        }
        if (db.hkbp_petugas_partangiangan !== undefined && shouldApply('hkbp_petugas_partangiangan')) {
          setPetugasPartangiangan(db.hkbp_petugas_partangiangan);
          localStorage.setItem('hkbp_petugas_partangiangan', JSON.stringify(db.hkbp_petugas_partangiangan));
        }
        if (db.hkbp_partangiangan_attendance_date !== undefined && shouldApply('hkbp_partangiangan_attendance_date')) {
          setPartangianganAttendanceDate(db.hkbp_partangiangan_attendance_date);
          localStorage.setItem('hkbp_partangiangan_attendance_date', db.hkbp_partangiangan_attendance_date);
        }
        if (db.hkbp_petugas_partangiangan_date !== undefined && shouldApply('hkbp_petugas_partangiangan_date')) {
          setPetugasPartangianganDate(db.hkbp_petugas_partangiangan_date);
          localStorage.setItem('hkbp_petugas_partangiangan_date', db.hkbp_petugas_partangiangan_date);
        }
        if (db.hkbp_petugas_minggu_date !== undefined && shouldApply('hkbp_petugas_minggu_date')) {
          setPetugasMingguDate(db.hkbp_petugas_minggu_date);
          localStorage.setItem('hkbp_petugas_minggu_date', db.hkbp_petugas_minggu_date);
        }
        if (db.hkbp_partangiangan_mode !== undefined && shouldApply('hkbp_partangiangan_mode')) {
          setPartangianganMode(db.hkbp_partangiangan_mode as PartangianganMode);
          localStorage.setItem('hkbp_partangiangan_mode', db.hkbp_partangiangan_mode);
        }
        if (db.hkbp_transaksi_list !== undefined && shouldApply('hkbp_transaksi_list')) {
          setTransaksiList(db.hkbp_transaksi_list);
          localStorage.setItem('hkbp_transaksi_list', JSON.stringify(db.hkbp_transaksi_list));
        }
        if (db.hkbp_jemaat_list !== undefined && shouldApply('hkbp_jemaat_list')) {
          setJemaatList(db.hkbp_jemaat_list);
          localStorage.setItem('hkbp_jemaat_list', JSON.stringify(db.hkbp_jemaat_list));
        }
        if (db.hkbp_custom_balance_title !== undefined && shouldApply('hkbp_custom_balance_title')) {
          setCustomBalanceTitle(db.hkbp_custom_balance_title);
          localStorage.setItem('hkbp_custom_balance_title', db.hkbp_custom_balance_title);
        }
        if (db.hkbp_custom_balance_value !== undefined && shouldApply('hkbp_custom_balance_value')) {
          setCustomBalanceValue(Number(db.hkbp_custom_balance_value));
          localStorage.setItem('hkbp_custom_balance_value', db.hkbp_custom_balance_value.toString());
        }
        if (db.hkbp_jadwal_ibadah !== undefined && shouldApply('hkbp_jadwal_ibadah')) {
          setJadwalIbadah(db.hkbp_jadwal_ibadah);
          localStorage.setItem('hkbp_jadwal_ibadah', JSON.stringify(db.hkbp_jadwal_ibadah));
        }
        if (db.hkbp_tentang_gereja_list !== undefined && shouldApply('hkbp_tentang_gereja_list')) {
          setTentangGerejaList(db.hkbp_tentang_gereja_list);
          localStorage.setItem('hkbp_tentang_gereja_list', JSON.stringify(db.hkbp_tentang_gereja_list));
        }
        if (db.hkbp_parhalado_list !== undefined && shouldApply('hkbp_parhalado_list')) {
          setParhaladoList(db.hkbp_parhalado_list);
          localStorage.setItem('hkbp_parhalado_list', JSON.stringify(db.hkbp_parhalado_list));
        }
        if (db.hkbp_attendance_trends !== undefined && shouldApply('hkbp_attendance_trends')) {
          setAttendanceTrends(db.hkbp_attendance_trends);
          localStorage.setItem('hkbp_attendance_trends', JSON.stringify(db.hkbp_attendance_trends));
        }
        if (db.hkbp_registered_admins !== undefined && shouldApply('hkbp_registered_admins')) {
          localStorage.setItem('hkbp_registered_admins', JSON.stringify(db.hkbp_registered_admins));
        }
      }).catch(() => {});
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncFromServer);
    const interval = setInterval(syncFromServer, 8000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncFromServer);
      clearInterval(interval);
    };
  }, []);

  // 2. Synchronization updaters to local storage AND server database
  const handleUpdateLiturgiMinggu = (data: Liturgi[]) => {
    setLiturgiMinggu(data);
    localStorage.setItem('hkbp_liturgi_minggu', JSON.stringify(data));
    saveKeyToServer('hkbp_liturgi_minggu', data);
    window.dispatchEvent(new CustomEvent('hkbp_data_updated', { detail: { key: 'hkbp_liturgi_minggu', data } }));
  };

  const handleUpdateLiturgiPartangiangan = (data: Liturgi[]) => {
    setLiturgiPartangiangan(data);
    localStorage.setItem('hkbp_liturgi_partangiangan', JSON.stringify(data));
    saveKeyToServer('hkbp_liturgi_partangiangan', data);
    window.dispatchEvent(new CustomEvent('hkbp_data_updated', { detail: { key: 'hkbp_liturgi_partangiangan', data } }));
  };

  const handleUpdatePetugasMinggu = (data: PetugasMingguRow[]) => {
    setPetugasMinggu(data);
    localStorage.setItem('hkbp_petugas_minggu', JSON.stringify(data));
    saveKeyToServer('hkbp_petugas_minggu', data);
  };

  const handleUpdatePartangianganAttendance = (data: PartangianganAttendanceRow[]) => {
    setPartangianganAttendance(data);
    localStorage.setItem('hkbp_partangiangan_attendance', JSON.stringify(data));
    saveKeyToServer('hkbp_partangiangan_attendance', data);
  };

  const handleUpdatePetugasPartangiangan = (data: PetugasPartangianganRow[]) => {
    setPetugasPartangiangan(data);
    localStorage.setItem('hkbp_petugas_partangiangan', JSON.stringify(data));
    saveKeyToServer('hkbp_petugas_partangiangan', data);
  };

  const handleUpdatePartangianganAttendanceDate = (date: string) => {
    setPartangianganAttendanceDate(date);
    localStorage.setItem('hkbp_partangiangan_attendance_date', date);
    saveKeyToServer('hkbp_partangiangan_attendance_date', date);
  };

  const handleUpdatePetugasPartangianganDate = (date: string) => {
    setPetugasPartangianganDate(date);
    localStorage.setItem('hkbp_petugas_partangiangan_date', date);
    saveKeyToServer('hkbp_petugas_partangiangan_date', date);
  };

  const handleUpdatePetugasMingguDate = (date: string) => {
    setPetugasMingguDate(date);
    localStorage.setItem('hkbp_petugas_minggu_date', date);
    saveKeyToServer('hkbp_petugas_minggu_date', date);
  };

  const handleUpdatePartangianganMode = (mode: PartangianganMode) => {
    setPartangianganMode(mode);
    localStorage.setItem('hkbp_partangiangan_mode', mode);
    saveKeyToServer('hkbp_partangiangan_mode', mode);
  };

  const handleUpdateWarta = (data: Warta[]) => {
    setWartaList(data);
    localStorage.setItem('hkbp_warta_list', JSON.stringify(data));
    saveKeyToServer('hkbp_warta_list', data);
  };

  const handleUpdateTransaksi = (data: Transaksi[]) => {
    setTransaksiList(data);
    localStorage.setItem('hkbp_transaksi_list', JSON.stringify(data));
    saveKeyToServer('hkbp_transaksi_list', data);
  };

  const handleUpdateJemaat = (data: Jemaat[]) => {
    setJemaatList(data);
    localStorage.setItem('hkbp_jemaat_list', JSON.stringify(data));
    saveKeyToServer('hkbp_jemaat_list', data);
  };

  const handleUpdateCustomBalanceTitle = (title: string) => {
    setCustomBalanceTitle(title);
    localStorage.setItem('hkbp_custom_balance_title', title);
    saveKeyToServer('hkbp_custom_balance_title', title);
  };

  const handleUpdateCustomBalanceValue = (value: number) => {
    setCustomBalanceValue(value);
    localStorage.setItem('hkbp_custom_balance_value', value.toString());
    saveKeyToServer('hkbp_custom_balance_value', value);
  };

  const handleUpdateJadwalIbadah = (data: JadwalIbadah) => {
    setJadwalIbadah(data);
    localStorage.setItem('hkbp_jadwal_ibadah', JSON.stringify(data));
    saveKeyToServer('hkbp_jadwal_ibadah', data);
  };

  const handleUpdateTentangGerejaList = (data: TentangGerejaItem[]) => {
    setTentangGerejaList(data);
    localStorage.setItem('hkbp_tentang_gereja_list', JSON.stringify(data));
    saveKeyToServer('hkbp_tentang_gereja_list', data);
  };

  const handleUpdateParhaladoList = (data: ParhaladoMember[]) => {
    setParhaladoList(data);
    localStorage.setItem('hkbp_parhalado_list', JSON.stringify(data));
    saveKeyToServer('hkbp_parhalado_list', data);
  };

  const handleUpdateAttendanceTrends = (data: WeeklyAttendanceTrend[]) => {
    setAttendanceTrends(data);
    localStorage.setItem('hkbp_attendance_trends', JSON.stringify(data));
    saveKeyToServer('hkbp_attendance_trends', data);
  };

  const handleOpenAdmin = () => {
    setIsAdminMode(true);
    sessionStorage.setItem('hkbp_is_admin_mode', 'true');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'admin');
    window.history.replaceState({}, '', url.toString());
  };

  const handleCloseAdmin = () => {
    setIsAdminMode(false);
    sessionStorage.removeItem('hkbp_is_admin_mode');
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('admin_tab');
    window.history.replaceState({}, '', url.toString());
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('hkbp_admin_logged', 'true');
    sessionStorage.setItem('hkbp_is_admin_mode', 'true');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'admin');
    window.history.replaceState({}, '', url.toString());
  };

  // Logout routine
  const handleLogout = () => {
    sessionStorage.removeItem('hkbp_admin_logged');
    sessionStorage.removeItem('hkbp_is_admin_mode');
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('admin_tab');
    window.history.replaceState({}, '', url.toString());
  };

  // RENDERING ENGINE
  if (isStandaloneTentang) {
    return (
      <StandaloneTentang
        tentangGerejaList={tentangGerejaList}
        onBackToMain={() => {
          setIsStandaloneTentang(false);
          // Clean the URL query params
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="bg-[#F4F6FA] min-h-screen font-sans text-slate-900">
      
      {/* CORE DISPLAY ROUTER */}
      {!isAdminMode ? (
        /* 1. PUBLIC PORTAL VIEW */
        <MemberView
          liturgiMinggu={liturgiMinggu}
          liturgiPartangiangan={liturgiPartangiangan}
          petugasMinggu={petugasMinggu}
          partangianganAttendance={partangianganAttendance}
          petugasPartangiangan={petugasPartangiangan}
          partangianganAttendanceDate={partangianganAttendanceDate}
          petugasPartangianganDate={petugasPartangianganDate}
          petugasMingguDate={petugasMingguDate}
          wartaList={wartaList}
          transaksiList={transaksiList}
          jemaatList={jemaatList}
          customBalanceTitle={customBalanceTitle}
          customBalanceValue={customBalanceValue}
          jadwalIbadah={jadwalIbadah}
          tentangGerejaList={tentangGerejaList}
          parhaladoList={parhaladoList}
          partangianganMode={partangianganMode}
          attendanceTrends={attendanceTrends}
          onGoToLogin={handleOpenAdmin}
        />
      ) : (
        /* 2. ADMIN PORTAL VIEW */
        <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
          
          {/* Admin Header Utilities */}
          <div className="bg-[#0F2447] border-b border-[#1D3B6E] px-6 py-3 flex items-center justify-between text-white">
            <button
              onClick={handleCloseAdmin}
              className="flex items-center space-x-2 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/15 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Portal</span>
            </button>
            
            <div className="text-[11px] text-white/75 font-medium">
              Sesi Admin: <span className="text-white font-semibold">{isAdminLoggedIn ? 'Aktif' : 'Terkunci'}</span>
            </div>
          </div>

          {!isAdminLoggedIn ? (
            /* ADMIN LOGIN GATE */
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          ) : (
            /* FULLY DOCKABLE ADMIN DASHBOARD */
            <AdminView
              liturgiMinggu={liturgiMinggu}
              liturgiPartangiangan={liturgiPartangiangan}
              petugasMinggu={petugasMinggu}
              partangianganAttendance={partangianganAttendance}
              petugasPartangiangan={petugasPartangiangan}
              partangianganAttendanceDate={partangianganAttendanceDate}
              petugasPartangianganDate={petugasPartangianganDate}
              petugasMingguDate={petugasMingguDate}
              wartaList={wartaList}
              transaksiList={transaksiList}
              jemaatList={jemaatList}
              customBalanceTitle={customBalanceTitle}
              customBalanceValue={customBalanceValue}
              jadwalIbadah={jadwalIbadah}
              tentangGerejaList={tentangGerejaList}
              parhaladoList={parhaladoList}
              partangianganMode={partangianganMode}
              onUpdateLiturgiMinggu={handleUpdateLiturgiMinggu}
              onUpdateLiturgiPartangiangan={handleUpdateLiturgiPartangiangan}
              onUpdatePetugasMinggu={handleUpdatePetugasMinggu}
              onUpdatePartangianganAttendance={handleUpdatePartangianganAttendance}
              onUpdatePetugasPartangiangan={handleUpdatePetugasPartangiangan}
              onUpdatePartangianganAttendanceDate={handleUpdatePartangianganAttendanceDate}
              onUpdatePetugasPartangianganDate={handleUpdatePetugasPartangianganDate}
              onUpdatePetugasMingguDate={handleUpdatePetugasMingguDate}
              onUpdatePartangianganMode={handleUpdatePartangianganMode}
              onUpdateWarta={handleUpdateWarta}
              onUpdateTransaksi={handleUpdateTransaksi}
              onUpdateJemaat={handleUpdateJemaat}
              onUpdateCustomBalanceTitle={handleUpdateCustomBalanceTitle}
              onUpdateCustomBalanceValue={handleUpdateCustomBalanceValue}
              onUpdateJadwalIbadah={handleUpdateJadwalIbadah}
              onUpdateTentangGerejaList={handleUpdateTentangGerejaList}
              onUpdateParhaladoList={handleUpdateParhaladoList}
              attendanceTrends={attendanceTrends}
              onUpdateAttendanceTrends={handleUpdateAttendanceTrends}
              onLogout={handleLogout}
            />
          )}
        </div>
      )}
    </div>
  );
}
