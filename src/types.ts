export interface LiturgiSection {
  id: string;
  label: string;
  isi: string;
  pembaca?: string;
}

export interface PetugasMingguRow {
  tugas: string;
  shift1: string;
  shift2: string;
  sekolahMinggu: string;
}

export interface PartangianganAttendanceRow {
  hari: 'Selasa' | 'Rabu';
  lunggu: string;
  ama: number;
  ina: number;
  sm: number;
  rena: number;
  parhalado: number;
}

export type PartangianganMode = 'normal' | 'keluarga' | 'selesai';

export interface PetugasPartangianganRow {
  hari: 'Selasa' | 'Rabu';
  lunggu: string;
  keluarga: string;
  alamat: string;
  jamita: string;
  agenda: string;
  ende: string;
}

export interface Liturgi {
  id: string;
  judul: string;
  tanggal: string;
  topik?: string;
  ayatReferensi?: string;
  ayatBacaan?: string;
  teksLiturgi: LiturgiSection[];
  pdfUrl?: string | null;
  uploadedPdfName?: string | null;
  uploadedPdfSize?: string | null;
  isPdfMode: boolean;
}

export type WartaKategori = 'umum' | 'keuangan' | 'duka' | 'pelayanan' | 'sektor' | 'sukacita';

export interface Warta {
  id: string;
  tanggal: string;
  judul: string;
  isi: string;
  kategori: WartaKategori;
  penulis?: string;
  prioritas: boolean;
}

export type TransaksiTipe = 'pemasukan' | 'pengeluaran';

export interface Transaksi {
  id: string;
  tipe: TransaksiTipe;
  kategori: string; // Pelean IA, Pelean IB, Pelean II, Donatur, Pengeluaran Operasional, dsb
  jumlah: number;
  tanggal: string;
  keterangan: string;
  tipeKas?: 'Kas Huria' | 'Kas Pembangunan' | 'Kas Diakonia' | 'Kas Kustom';
  sentralisasiPersen?: number;
}

export interface Jemaat {
  id: string;
  nama: string;
  tanggalLahir: string; // YYYY-MM-DD
  sektor: string; // Sektor I s/d VII / Wijk
  noHP?: string;
  [key: string]: any;
}

export interface AdminCredentials {
  username: string;
  email: string;
  password?: string;
  namaGereja?: string;
  status?: 'ruas' | 'parhalado';
}

export interface ParhaladoMember {
  id: string;
  nama: string;
  jabatan: string;
  noTelp: string;
}

export interface JadwalIbadah {
  sekolahMinggu: string;
  shift1: string;
  shift2: string;
}

export interface TentangGerejaItem {
  id: string;
  judul: string;
  isi: string;
  gambar?: string; // base64 data URL
  judulGambar?: string; // Judul untuk gambar dokumentasi
  keteranganGambar?: string; // Keterangan/deskripsi untuk gambar dokumentasi
  tanggalUpdate?: string;
}

export interface WeeklyAttendanceTrend {
  weekLabel: string; // e.g., "Minggu I", "Minggu II"
  tanggalRange: string; // e.g., "14 Juni 2026"
  mingguAma: number;
  mingguIna: number;
  mingguSm: number;
  mingguRena: number;
  mingguParhalado: number;
  shift1?: number;
  shift2?: number;
  sekolahMinggu?: number;
  partangianganAma: number;
  partangianganIna: number;
  partangianganSm: number;
  partangianganRena: number;
  partangianganParhalado: number;
}

