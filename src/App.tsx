import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Smartphone, Monitor, ShieldAlert } from 'lucide-react';
import MemberView from './components/MemberView';
import AdminLogin from './components/AdminLogin';
import AdminView from './components/AdminView';
import StandaloneTentang from './components/StandaloneTentang';
import { Liturgi, Warta, Transaksi, Jemaat, PetugasMingguRow, PartangianganAttendanceRow, PetugasPartangianganRow, JadwalIbadah, ParhaladoMember, TentangGerejaItem, WeeklyAttendanceTrend } from './types';
import {
  INITIAL_LITURGI_MINGGU,
  INITIAL_LITURGI_PARTANGIANGAN,
  INITIAL_WARTA,
  INITIAL_TRANSAKSI,
  INITIAL_JEMAAT,
  INITIAL_PETUGAS_MINGGU,
  INITIAL_PARTANGIANGAN_ATTENDANCE,
  INITIAL_PETUGAS_PARTANGIANGAN,
  INITIAL_JADWAL_IBADAH,
  INITIAL_SEJARAH_GEREJA,
  INITIAL_TENTANG_GEREJA,
  INITIAL_PARHALADO_LIST,
  INITIAL_ATTENDANCE_TRENDS
} from './data/mockData';

export default function App() {
  // Navigation states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
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

  // Helper to save key to server
  const saveKeyToServer = (key: string, value: any) => {
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).catch(err => console.error(`Failed to sync ${key} to server:`, err));
  };

  // 1. Initial hydration and safety checks
  useEffect(() => {
    // Check if showing standalone Tentang Gereja
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'tentang') {
      setIsStandaloneTentang(true);
    }

    // Check session storage for admin persistence
    const logged = sessionStorage.getItem('hkbp_admin_logged');
    if (logged === 'true') {
      setIsAdminLoggedIn(true);
    }

    // A. Instant client-side hydration for snappiness
    const localMinggu = localStorage.getItem('hkbp_liturgi_minggu');
    if (localMinggu) setLiturgiMinggu(JSON.parse(localMinggu));
    else setLiturgiMinggu(INITIAL_LITURGI_MINGGU);

    const localPartangiangan = localStorage.getItem('hkbp_liturgi_partangiangan');
    if (localPartangiangan) setLiturgiPartangiangan(JSON.parse(localPartangiangan));
    else setLiturgiPartangiangan(INITIAL_LITURGI_PARTANGIANGAN);

    const localPetugas = localStorage.getItem('hkbp_petugas_minggu');
    if (localPetugas) setPetugasMinggu(JSON.parse(localPetugas));
    else setPetugasMinggu(INITIAL_PETUGAS_MINGGU);

    const localPartangianganAttendance = localStorage.getItem('hkbp_partangiangan_attendance');
    if (localPartangianganAttendance) setPartangianganAttendance(JSON.parse(localPartangianganAttendance));
    else setPartangianganAttendance(INITIAL_PARTANGIANGAN_ATTENDANCE);

    const localPetugasPartangiangan = localStorage.getItem('hkbp_petugas_partangiangan');
    if (localPetugasPartangiangan) setPetugasPartangiangan(JSON.parse(localPetugasPartangiangan));
    else setPetugasPartangiangan(INITIAL_PETUGAS_PARTANGIANGAN);

    setPartangianganAttendanceDate(localStorage.getItem('hkbp_partangiangan_attendance_date') || 'Selasa, 09 Juni & Rabu, 10 Juni 2026');
    setPetugasPartangianganDate(localStorage.getItem('hkbp_petugas_partangiangan_date') || 'Selasa, 16 Juni & Rabu, 17 Juni 2026');
    setPetugasMingguDate(localStorage.getItem('hkbp_petugas_minggu_date') || 'Minggu, 14 Juni 2026');

    const localWarta = localStorage.getItem('hkbp_warta_list');
    if (localWarta) setWartaList(JSON.parse(localWarta));
    else setWartaList(INITIAL_WARTA);

    const localTransaksi = localStorage.getItem('hkbp_transaksi_list');
    if (localTransaksi) setTransaksiList(JSON.parse(localTransaksi));
    else setTransaksiList(INITIAL_TRANSAKSI);

    const localJemaat = localStorage.getItem('hkbp_jemaat_list');
    if (localJemaat) setJemaatList(JSON.parse(localJemaat));
    else setJemaatList([]);

    setCustomBalanceTitle(localStorage.getItem('hkbp_custom_balance_title') || 'Kas Remaja & Naposo');
    setCustomBalanceValue(Number(localStorage.getItem('hkbp_custom_balance_value') || '2500000'));

    const localJadwal = localStorage.getItem('hkbp_jadwal_ibadah');
    if (localJadwal) setJadwalIbadah(JSON.parse(localJadwal));
    else setJadwalIbadah(INITIAL_JADWAL_IBADAH);

    const localTentang = localStorage.getItem('hkbp_tentang_gereja_list');
    if (localTentang) {
      try {
        setTentangGerejaList(JSON.parse(localTentang));
      } catch (e) {
        setTentangGerejaList(INITIAL_TENTANG_GEREJA);
      }
    } else {
      setTentangGerejaList(INITIAL_TENTANG_GEREJA);
    }

    const localParhalado = localStorage.getItem('hkbp_parhalado_list');
    if (localParhalado) setParhaladoList(JSON.parse(localParhalado));
    else setParhaladoList(INITIAL_PARHALADO_LIST);

    const localTrends = localStorage.getItem('hkbp_attendance_trends');
    if (localTrends) setAttendanceTrends(JSON.parse(localTrends));
    else setAttendanceTrends(INITIAL_ATTENDANCE_TRENDS);

    // B. Fetch server database for real synchronization
    fetch('/api/db')
      .then(res => res.json())
      .then(db => {
        if (db && typeof db === 'object' && Object.keys(db).length > 0) {
          // Update all React state and local storage caches with server state
          if (db.hkbp_liturgi_minggu) {
            setLiturgiMinggu(db.hkbp_liturgi_minggu);
            localStorage.setItem('hkbp_liturgi_minggu', JSON.stringify(db.hkbp_liturgi_minggu));
          }
          if (db.hkbp_liturgi_partangiangan) {
            setLiturgiPartangiangan(db.hkbp_liturgi_partangiangan);
            localStorage.setItem('hkbp_liturgi_partangiangan', JSON.stringify(db.hkbp_liturgi_partangiangan));
          }
          if (db.hkbp_petugas_minggu) {
            setPetugasMinggu(db.hkbp_petugas_minggu);
            localStorage.setItem('hkbp_petugas_minggu', JSON.stringify(db.hkbp_petugas_minggu));
          }
          if (db.hkbp_partangiangan_attendance) {
            setPartangianganAttendance(db.hkbp_partangiangan_attendance);
            localStorage.setItem('hkbp_partangiangan_attendance', JSON.stringify(db.hkbp_partangiangan_attendance));
          }
          if (db.hkbp_petugas_partangiangan) {
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
          if (db.hkbp_warta_list) {
            setWartaList(db.hkbp_warta_list);
            localStorage.setItem('hkbp_warta_list', JSON.stringify(db.hkbp_warta_list));
          }
          if (db.hkbp_transaksi_list) {
            setTransaksiList(db.hkbp_transaksi_list);
            localStorage.setItem('hkbp_transaksi_list', JSON.stringify(db.hkbp_transaksi_list));
          }
          if (db.hkbp_jemaat_list) {
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
          if (db.hkbp_jadwal_ibadah) {
            setJadwalIbadah(db.hkbp_jadwal_ibadah);
            localStorage.setItem('hkbp_jadwal_ibadah', JSON.stringify(db.hkbp_jadwal_ibadah));
          }
          if (db.hkbp_tentang_gereja_list) {
            setTentangGerejaList(db.hkbp_tentang_gereja_list);
            localStorage.setItem('hkbp_tentang_gereja_list', JSON.stringify(db.hkbp_tentang_gereja_list));
          }
          if (db.hkbp_parhalado_list) {
            setParhaladoList(db.hkbp_parhalado_list);
            localStorage.setItem('hkbp_parhalado_list', JSON.stringify(db.hkbp_parhalado_list));
          }
          if (db.hkbp_attendance_trends) {
            setAttendanceTrends(db.hkbp_attendance_trends);
            localStorage.setItem('hkbp_attendance_trends', JSON.stringify(db.hkbp_attendance_trends));
          }
        } else {
          // Seed the database on server with current local storage / defaults
          const seedData = {
            hkbp_liturgi_minggu: localMinggu ? JSON.parse(localMinggu) : INITIAL_LITURGI_MINGGU,
            hkbp_liturgi_partangiangan: localPartangiangan ? JSON.parse(localPartangiangan) : INITIAL_LITURGI_PARTANGIANGAN,
            hkbp_petugas_minggu: localPetugas ? JSON.parse(localPetugas) : INITIAL_PETUGAS_MINGGU,
            hkbp_partangiangan_attendance: localPartangianganAttendance ? JSON.parse(localPartangianganAttendance) : INITIAL_PARTANGIANGAN_ATTENDANCE,
            hkbp_petugas_partangiangan: localPetugasPartangiangan ? JSON.parse(localPetugasPartangiangan) : INITIAL_PETUGAS_PARTANGIANGAN,
            hkbp_partangiangan_attendance_date: localStorage.getItem('hkbp_partangiangan_attendance_date') || 'Selasa, 09 Juni & Rabu, 10 Juni 2026',
            hkbp_petugas_partangiangan_date: localStorage.getItem('hkbp_petugas_partangiangan_date') || 'Selasa, 16 Juni & Rabu, 17 Juni 2026',
            hkbp_petugas_minggu_date: localStorage.getItem('hkbp_petugas_minggu_date') || 'Minggu, 14 Juni 2026',
            hkbp_warta_list: localWarta ? JSON.parse(localWarta) : INITIAL_WARTA,
            hkbp_transaksi_list: localTransaksi ? JSON.parse(localTransaksi) : INITIAL_TRANSAKSI,
            hkbp_jemaat_list: localJemaat ? JSON.parse(localJemaat) : [],
            hkbp_custom_balance_title: localStorage.getItem('hkbp_custom_balance_title') || 'Kas Remaja & Naposo',
            hkbp_custom_balance_value: Number(localStorage.getItem('hkbp_custom_balance_value') || '2500000'),
            hkbp_jadwal_ibadah: localJadwal ? JSON.parse(localJadwal) : INITIAL_JADWAL_IBADAH,
            hkbp_tentang_gereja_list: localTentang ? JSON.parse(localTentang) : INITIAL_TENTANG_GEREJA,
            hkbp_parhalado_list: localParhalado ? JSON.parse(localParhalado) : INITIAL_PARHALADO_LIST,
            hkbp_attendance_trends: localTrends ? JSON.parse(localTrends) : INITIAL_ATTENDANCE_TRENDS,
          };
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: seedData })
          }).catch(e => console.error('Failed to seed server DB:', e));
        }
      })
      .catch(err => console.error('Failed to load server DB:', err));
  }, []);

  // 2. Synchronization updaters to local storage AND server database
  const handleUpdateLiturgiMinggu = (data: Liturgi[]) => {
    setLiturgiMinggu(data);
    localStorage.setItem('hkbp_liturgi_minggu', JSON.stringify(data));
    saveKeyToServer('hkbp_liturgi_minggu', data);
  };

  const handleUpdateLiturgiPartangiangan = (data: Liturgi[]) => {
    setLiturgiPartangiangan(data);
    localStorage.setItem('hkbp_liturgi_partangiangan', JSON.stringify(data));
    saveKeyToServer('hkbp_liturgi_partangiangan', data);
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

  // Logout routine
  const handleLogout = () => {
    sessionStorage.removeItem('hkbp_admin_logged');
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
  };

  const triggerResetAllData = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang seluruh database aplikasi ini ke mode Demo Setelan Awal? Semua inputan khusus Anda akan hilang.')) {
      localStorage.clear();
      sessionStorage.clear();
      setLiturgiMinggu(INITIAL_LITURGI_MINGGU);
      setLiturgiPartangiangan(INITIAL_LITURGI_PARTANGIANGAN);
      setPetugasMinggu(INITIAL_PETUGAS_MINGGU);
      setPartangianganAttendance(INITIAL_PARTANGIANGAN_ATTENDANCE);
      setPetugasPartangiangan(INITIAL_PETUGAS_PARTANGIANGAN);
      setPartangianganAttendanceDate('Selasa, 09 Juni & Rabu, 10 Juni 2026');
      setPetugasPartangianganDate('Selasa, 16 Juni & Rabu, 17 Juni 2026');
      setPetugasMingguDate('Minggu, 14 Juni 2026');
      setWartaList(INITIAL_WARTA);
      setTransaksiList(INITIAL_TRANSAKSI);
      setJemaatList([]);
      setCustomBalanceTitle('Kas Remaja & Naposo');
      setCustomBalanceValue(2500000);
      setJadwalIbadah(INITIAL_JADWAL_IBADAH);
      setTentangGerejaList(INITIAL_TENTANG_GEREJA);
      setParhaladoList(INITIAL_PARHALADO_LIST);
      setAttendanceTrends(INITIAL_ATTENDANCE_TRENDS);
      setIsAdminLoggedIn(false);
      setIsAdminMode(false);
      alert('Database Parhalado berhasil di-reset!');
    }
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
    <div className="bg-slate-50 min-h-screen">
      
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
          onGoToLogin={() => setIsAdminMode(true)}
          onUpdateLiturgiMinggu={handleUpdateLiturgiMinggu}
          onUpdateLiturgiPartangiangan={handleUpdateLiturgiPartangiangan}
          onUpdateJemaat={handleUpdateJemaat}
        />
      ) : (
        /* 2. ADMIN PORTAL VIEW */
        <div className="min-h-screen flex flex-col bg-slate-50">
          
          {/* Admin Header Utilities */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsAdminMode(false)}
              className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Portal Jemaat</span>
            </button>
            
            <div className="text-[11px] text-slate-500 font-medium">
              Sesi: <span className="text-slate-700 font-semibold">{isAdminLoggedIn ? 'Aktif' : 'Terkunci'}</span>
            </div>
          </div>

          {!isAdminLoggedIn ? (
            /* ADMIN LOGIN GATE */
            <AdminLogin onLoginSuccess={() => setIsAdminLoggedIn(true)} />
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
              onUpdateLiturgiMinggu={handleUpdateLiturgiMinggu}
              onUpdateLiturgiPartangiangan={handleUpdateLiturgiPartangiangan}
              onUpdatePetugasMinggu={handleUpdatePetugasMinggu}
              onUpdatePartangianganAttendance={handleUpdatePartangianganAttendance}
              onUpdatePetugasPartangiangan={handleUpdatePetugasPartangiangan}
              onUpdatePartangianganAttendanceDate={handleUpdatePartangianganAttendanceDate}
              onUpdatePetugasPartangianganDate={handleUpdatePetugasPartangianganDate}
              onUpdatePetugasMingguDate={handleUpdatePetugasMingguDate}
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
