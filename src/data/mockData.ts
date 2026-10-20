import { Liturgi, Warta, Transaksi, Jemaat, PetugasMingguRow, PartangianganAttendanceRow, PetugasPartangianganRow, TentangGerejaItem, WeeklyAttendanceTrend } from '../types';

// Helper to generate dates relative to June 12, 2026 (current context date)
const getRelativeDate = (offsetDays: number): string => {
  const baseDate = new Date('2026-06-12');
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split('T')[0];
};

export const INITIAL_PARTANGIANGAN_ATTENDANCE: PartangianganAttendanceRow[] = [
  { hari: 'Selasa', lunggu: 'Sektor I (Bethesda)', ama: 12, ina: 18, sm: 5, rena: 8, parhalado: 2 },
  { hari: 'Selasa', lunggu: 'Sektor II (Siloam)', ama: 10, ina: 15, sm: 4, rena: 6, parhalado: 3 },
  { hari: 'Rabu', lunggu: 'Sektor III (Nazareth)', ama: 15, ina: 22, sm: 8, rena: 12, parhalado: 2 },
  { hari: 'Rabu', lunggu: 'Sektor IV (Jerusalem)', ama: 8, ina: 14, sm: 3, rena: 5, parhalado: 2 },
  { hari: 'Selasa', lunggu: 'Sektor V (Hebron)', ama: 14, ina: 19, sm: 6, rena: 9, parhalado: 3 },
  { hari: 'Rabu', lunggu: 'Sektor VI (Efrata)', ama: 11, ina: 16, sm: 5, rena: 7, parhalado: 2 }
];

export const INITIAL_PETUGAS_PARTANGIANGAN: PetugasPartangianganRow[] = [
  { hari: 'Selasa', lunggu: 'Sektor I (Bethesda)', keluarga: 'Kel. A. Hutapea', alamat: 'Jl. Merdeka No. 12', jamita: 'St. J. Simanjuntak', agenda: 'St. R. Hutagalung', ende: 'Grace br. Tobing' },
  { hari: 'Selasa', lunggu: 'Sektor II (Siloam)', keluarga: 'Kel. B. Siregar', alamat: 'Jl. Damai No. 45', jamita: 'St. K. Pasaribu', agenda: 'St. M. Limbong', ende: 'Sonia br. Marpaung' },
  { hari: 'Selasa', lunggu: 'Sektor V (Hebron)', keluarga: 'Kel. C. Nainggolan', alamat: 'Jl. Kasih No. 7', jamita: 'St. P. Naibaho', agenda: 'St. H. Simanjuntak', ende: 'Joy br. Silaban' },
  { hari: 'Rabu', lunggu: 'Sektor III (Nazareth)', keluarga: 'Kel. D. Sitorus', alamat: 'Jl. Harapan No. 3', jamita: 'St. G. Sitorus', agenda: 'St. A. Hutapea', ende: 'Clara br. Simanjuntak' },
  { hari: 'Rabu', lunggu: 'Sektor IV (Jerusalem)', keluarga: 'Kel. E. Marpaung', alamat: 'Jl. Berkat No. 22', jamita: 'St. L. Tarihoran', agenda: 'St. B. Sitorus', ende: 'Rian Harianja' },
  { hari: 'Rabu', lunggu: 'Sektor VI (Efrata)', keluarga: 'Kel. F. Nababan', alamat: 'Jl. Sukacita No. 10', jamita: 'St. R. Sitorus', agenda: 'St. J. Sianipar', ende: 'Daniel Nababan' }
];

export const INITIAL_PETUGAS_MINGGU: PetugasMingguRow[] = [
  { tugas: 'Harentaon', shift1: 'St. J. Simanjuntak', shift2: 'St. R. Hutagalung', sekolahMinggu: 'St. B. Sitorus' },
  { tugas: 'Operator', shift1: 'Andreas Siregar', shift2: 'Kevin Nainggolan', sekolahMinggu: 'Grace br. Tobing' },
  { tugas: 'Song Leader', shift1: 'Sonia br. Marpaung', shift2: 'Rian Harianja', sekolahMinggu: 'Joy br. Silaban' },
  { tugas: 'Organis', shift1: 'Cynthia br. Pane', shift2: 'Daniel Nababan', sekolahMinggu: 'Clara br. Simanjuntak' },
  { tugas: 'Agenda', shift1: 'Pdt. R. Sitorus, S.Th', shift2: 'St. K. Pasaribu', sekolahMinggu: 'St. M. Limbong' },
  { tugas: 'Tinting Huria', shift1: 'St. P. Naibaho', shift2: 'St. H. Simanjuntak', sekolahMinggu: 'St. L. Tarihoran' },
  { tugas: 'Papungu Pelean', shift1: 'St. G. Sitorus & Team', shift2: 'St. A. Hutapea & Team', sekolahMinggu: 'Remaja SM & Team' },
  { tugas: 'Jamita', shift1: 'Pdt. Dr. J. Sinaga', shift2: 'Pdt. R. Sitorus, S.Th', sekolahMinggu: 'Cpdt. A. Nababan, S.Th' }
];

export const INITIAL_LITURGI_MINGGU: Liturgi[] = [
  {
    id: 'liturgi-minggu-1',
    judul: 'Ibadah Minggu V Dung Trinitatis (HKBP)',
    tanggal: getRelativeDate(2), // Sunday, June 14, 2026
    topik: 'Gabe Sulum jala Sira di Portibi on (Menjadi Terang dan Garam bagi Dunia)',
    ayatReferensi: 'Mateus 5 : 13 - 16',
    isPdfMode: false,
    pdfUrl: null,
    teksLiturgi: [
      {
        id: 'lm-1',
        label: '01. Bernyanyi BE No. 10 : 1 - 2 "Hupuji Ho Amang"',
        isi: '1. Hupuji Ho Amang pardenggan basa i, Napasarisari sude na tinompaM. Ho do mual ni hangoluan, Ho do sumalo sude ulaon.\n2. Gok di Ho do dongan nang hagogoon i, Molo tung margogo hami mangula i. Sude na uli na niula i, Holan ala ni asi ni rohaM do i.',
        pembaca: 'Song Leader'
      },
      {
        id: 'lm-2',
        label: '02. Votum - Introitus - Tangiang (A.V.B)',
        isi: 'P: Marhitehite Goar ni Debata Ama, dohot Goar ni AnakNa Tuhan Jesus Kristus, dohot Goar ni Tondi Parbadia, na tumompa langit dohot tano on. Amen. Hagogoon dohot hamuliaon do di Debata saleleng ni lelengna.\nJ: (Bernyanyi) Amen, Amen, Amen.\nP: Martangiang ma hita: Ale Tuhan Debata, Amanami na di banua ginjang, mual ni sude denggan basa. Hupuji hami Ho ala tongtong dipalumehon Ho tu hami haporseaon dohot gogo. Pasu-pasu ma parsombaon nami di bagas jorom on. Marhite Jesus Kristus Tuhannami. Amen.',
        pembaca: 'Pendeta'
      },
      {
        id: 'lm-3',
        label: '03. Bernyanyi BE No. 175 : 1 & 3 "Tondi Parbadia Mabaor"',
        isi: '1. Tondi parbadia mabaor sian ginjang, ro di rohanami jala baen torang. Asa unang hami lilu sipadalan, baen ma haporseaon gabe hasonangan.\n3. Sai pargogoi ma hami mangihuthon patikMu na badia, dipardalanan on. Unang be hami tundal sian joloM, sai togu ma lomo ni rohanami.',
        pembaca: 'Song Leader'
      },
      {
        id: 'lm-4',
        label: '04. Patik (Hukum Taurat): Patik I - X',
        isi: 'P: Tangihon hamu ma Patik ni Debata di Minggu sadari on, i ma na tarsurat di Patik Pangampun: "Ingkon haholonganmu do Tuhan Debatam sian nasa roham, sian nasa tondim, dohot sian nasa pingkiranmu."\nJ: Mangido gogo ma hita sian Tuhan: Ale Tuhan Debata pargogoi ma rohanami mangulahon na nidokMu. Amen.',
        pembaca: 'Pendeta'
      },
      {
        id: 'lm-5',
        label: '05. Bernyanyi BE No. 182 : 1 - 2 "Tu JoloM O Jesus"',
        isi: '1. Tu joloM o Jesus ro do ahu nuaeng, rura hamatean sai hutinggalhon be. Jesus, Ho do haporusan, las ni roha ni tondingku.\n2. Sai buri ahu gabe ias jala tang, marhite mudarMu na use di Golgata. Unang be hami madabu tu dorguk ni dosa i.',
        pembaca: 'Jemaat'
      },
      {
        id: 'lm-6',
        label: '06. Manopoti Dosa (Pengakuan Dosa) & Bagabaga (Janji)',
        isi: 'P: Tatopoti ma dosanta di jolo ni Debata na badia i... Ale Debatami parasi roha jala na badia, tung mansai bahat do dosanami marhite pingkiran, hata, dohot pangalahonami. Sai asi ma rohaM di hami, sesa ma sude salanami marhite anakMu Jesus Kristus.\nJ: (Mangendehon) BE No. 180 "Asi ni rohaM dungdungonku..."\nP: Bagabaga ni Debata taringot tu hasesaan ni dosa: "Songon on do Hata ni Tuhan: Martahu-tahu pe dosamu songon abit gapit, ingkon gabe putih do bahenonku songon hapas." Hasangapon ma di Debata na di ginjang!\nJ: Amen!',
        pembaca: 'Bersama'
      },
      {
        id: 'lm-7',
        label: '07. Bernyanyi BE No. 125 : 1 - 2 "Maradophon Sitaluhon"',
        isi: '1. Maradophon sitaluhon di paraloan i, sai pos roha di hagogoon ni Tuhan Jesus i. Ibana do raramu, pargogo na sun jolo.\n2. Nang pe ro parungkilon, songgop parmaraan, ndang tagamon hita be talu di hamusuon.',
        pembaca: 'Song Leader'
      },
      {
        id: 'lm-8',
        label: '08. Epistel (Pembacaan Alkitab): Efesus 4 : 1 - 6',
        isi: 'P: Jahat ma hita mandok Hata ni Debata na badia, tarsurat di Efesus 4 : 1 - 6... "Dibahen i, mangido ma ahu tu hamu, ahu na tarrante di bagasan Tuhan i: Sae ma parange munu ripe marhadomuan tu panjouon naung sahat tu hamu!"\nJ: "Marhite haringgasan ni roha mangaramoti hasadaon ni Tondi, pinadomu ni raut dame."\nP: Martua do angka na tumangihon Hata ni Debata jala na umpeopsa. Amen.',
        pembaca: 'Bersama'
      },
      {
        id: 'lm-9',
        label: '09. Bernyanyi BE No. 260 : 1 - 3 "Alo Musu I" (Mengumpulkan Persembahan IA & IB)',
        isi: '1. Alo musu i, unang Ho talu! Sai pir ma roham, unang ho goar madabu. Jesus gogoM, sai puji ma i.\n(Jemaat maju mengumpulkan persembahan IA & IB ke kotak persembahan di depan altar dengan tertib)\n2. Togu donganmu, unang dipalas roha ni musu. Paratarata ma badia ni roham, asa dame ho jala sonang di haporseaon.',
        pembaca: 'Jemaat'
      },
      {
        id: 'lm-10',
        label: '10. Manghatindangkon Haporseaon (Apostolik)',
        isi: 'P: Tahatindangkon ma haporseaonta i, rap ripe mandok rap dohot donganta marhaporseaon di sandok portibi on:\nP+J: Ahu porsea di Debata Ama, na tumompa langit dohot tano...\nAhu porsea di Jesus Kristus...\nAhu porsea di Tondi Parbadia...',
        pembaca: 'Bersama'
      },
      {
        id: 'lm-11',
        label: '11. Tingting (Warta Jemaat) & Doa Syafaat',
        isi: '1. Pembacaan Warta Kiriman / Tingting Sektor, Berita Dukacita, Berita Pernikahan, dsb.\n2. Doa Syafaat Kongregasional dipimpin oleh Sintua / Vikar / Pendeta Humalat.',
        pembaca: 'Pendeta'
      },
      {
        id: 'lm-12',
        label: '12. Bernyanyi BE No. 361 : 1 - 3 "Na Denggan Situtu Do" (Mengumpulkan Persembahan II)',
        isi: '1. Na denggan situtu do mamuji Debata, mamuji goarna na badia i. Marningot sude pasupasuNa di borngin nang arian.\n2. Tanganki mamuji Ho, tondingku mangoloi, Ho do mual ni sude na uli. Pasahat ma gogom dohot artam tu jolo ni Debata.\n3. (Sambil mengumpulkan persembahan II ke kantong kolekte)',
        pembaca: 'Jemaat'
      },
      {
        id: 'lm-13',
        label: '13. Jamita (Khotbah / Renungan): Mateus 5 : 13 - 16',
        isi: 'Tema: Gara dohot Sira ni Portibi (Garam dan Terang Dunia)\n\nPendeta memaparkan isi Khotbah taringot tu peran ni Kristen gabe sira (garam) na mambahen tabo jala mangaramoti parange na denggan, jala gabe gara (terang) na patiurhon parange di tongatonga ni keluarga, masyarakat, nang jemaat.',
        pembaca: 'Pendeta'
      },
      {
        id: 'lm-14',
        label: '14. Bernyanyi BE No. 467 : 1 - 2 "Asi Ni RohaM Dungdungonku" (Persembahan Pembangunan)',
        isi: '1. Asi ni rohaM dungdungonku, mamuji goarMu na badia. Sian nasa gogo ni diringku, pasahat ma pelean lomo ni rohaM.\n2. Sangap di Ama na mambahen dame, sangap di Anak sigomgom hita, sangap di Tondi Parbadia pargogo jemaat on.',
        pembaca: 'Jemaat'
      },
      {
        id: 'lm-15',
        label: '15. Tangiang Pelean - Doa Bapa Kami - Pasupasu (Penutup)',
        isi: 'P: Martangiang ma hita pasahat Pelean: Ale Debata Amanami na badia, pinasahat nami ma pelean on gabe tanda ni las ni rohanami... Rap mandok Doa Bapa Kami:\nP+J: Ale Amanami na di banua ginjang, sai diparbadia ma GoarMu...\nP: Dioloi Tuhan ma tangiangmu, jala tangihon pasupasu sian Debata:\n"Sai dipasu-pasu jala diramoti Tuhan Debata ma ho. Sai dipasondangkon Tuhan ma bohiNa tu ho, jala asi ma rohaNa di ho. Sai didomakkon Tuhan ma bohiNa tu ho, jala dilehon ma di ho dame. Amen."\nJ: (Bernyanyi) Amen, Amen, Amen.',
        pembaca: 'Pendeta'
      }
    ]
  }
];

export const INITIAL_LITURGI_PARTANGIANGAN: Liturgi[] = [
  {
    id: 'liturgi-part-1',
    judul: 'Partangiangan Sektor III - Parbue na Denggan',
    tanggal: getRelativeDate(-1), // Thursday, June 11, 2026
    isPdfMode: false,
    pdfUrl: null,
    teksLiturgi: [
      {
        id: 'lp-1',
        label: '01. Bernyanyi BE No. 9 : 1 "Hupuji Ho di Sian Bagas"',
        isi: 'Hupuji Ho di sian bagas rohangku, O Tuhan Debatangku. Pasupasu ma tangiang nami on na mandapothon Ho marhite las ni roha.'
      },
      {
        id: 'lp-2',
        label: '02. Doa Pembuka & Epistel (Galatia 5 : 22 - 23)',
        isi: 'Sintua: Marhitehite goar ni ama, anak dohot parbadia marpungu ma hita mangasahon dame. Martangiang ma hita... \n(Pembacaan Epistel): "Alor parbue ni Tondi, i ma: Holong, las ni roha, dame, lambas ni roha, basar, haporseaon, lambok, nang hatomanon."'
      },
      {
        id: 'lp-3',
        label: '03. Bernyanyi BE No. 122 : 1 "Idang ma parbue i o Jesus"',
        isi: 'Idang ma parbue i o Jesus na badia, sai togu jemaat on mangulahon lomo ni rohaM marhite torang ni roha.'
      },
      {
        id: 'lp-4',
        label: '04. Jamita (Renungan Singkat)',
        isi: 'Sintua/Tuan Rumah: Membahas taringot tu buah-buah roh di bagasan ngolu siganup ari di keluarga, partumpuan rura, nang masyarakat.'
      },
      {
        id: 'lp-5',
        label: '05. Bernyanyi BE No. 227 : 1 "Jesus Ngolu ni Tondingku" (Persembahan Lingkungan)',
        isi: 'Jesus ngolu ni tondingku, Ho do olo-oloku. Pasahat hamu ma tumpak parsadaanon marhite dame (Kotak persembahan beredar).'
      },
      {
        id: 'lp-6',
        label: '06. Syafaat Umum & Doa Penutup',
        isi: 'Sintua memimpin doa syafaat untuk kondisi rohani jemaat sektor, anak-anak sekolah, yang sedang sakit, serta ditutup dengan Doa Bapa Kami dan berkat.'
      }
    ]
  }
];

export const INITIAL_WARTA: Warta[] = [
  {
    id: 'warta-1',
    tanggal: getRelativeDate(2),
    judul: 'Rencana Pembangunan Gedung Serbaguna HKBP',
    isi: 'Huria na hinaholongan, dipatupa Huria do pangaradeon tu pembangunan Gedung Serbaguna jemaat. Dipangido tu sude ruas jemaat asa turgas patupahon persembahan khusus pembangunan setiap minggu ke-2 di kantong kolekte tambahan. Mauliate di parbue na denggan sian rohanta.',
    kategori: 'umum',
    penulis: 'Sintua R. Marpaung',
    prioritas: true
  },
  {
    id: 'warta-2',
    tanggal: getRelativeDate(2),
    judul: 'Kegiatan Sermon Pendeta & Parhalado Sektor VII',
    isi: 'Disodahon tu sude parhalado (Sintua) Sektor VII asa ro tu Sermon Parhalado na dipatupa di Ruang Konsistori ibadah ari Sabtu, 13 Juni pukul 17:00 WIB. Diminta kehadiran yang tepat waktu demi pelayanan tertib.',
    kategori: 'pelayanan',
    penulis: 'Sekretaris Huria',
    prioritas: false
  },
  {
    id: 'warta-3',
    tanggal: getRelativeDate(2),
    judul: 'Laporan Keuangan Sementera Kas Huria Mei-Juni',
    isi: 'Penerimaan Minggu Transisi:\n- Pelean IA: Rp 4.250.000\n- Pelean IB: Rp 3.820.000\n- Pelean Minggu II: Rp 2.910.000\nTotal Saldo Saat Ini di Rekening BNI Huria adalah Rp 82.350.000. Laporan lengkap tertera di papan informasi keuangan.',
    kategori: 'keuangan',
    penulis: 'Bendahara Huria (Sintua J. Sianipar)',
    prioritas: false
  },
  {
    id: 'warta-4',
    tanggal: getRelativeDate(-2),
    judul: 'Berita Dukacita: Telah Berpulang Sintua Em. J. Sitorus',
    isi: 'Telah berpulang ke Rumah Bapa di Surga, hamba-Nya Sintua Em. J. Sitorus (Sektor IV) pada hari Rabu, 10 Juni 2026. Pemakaman akan dilaksanakan pada hari Sabtu, 13 Juni 2026 didahului dengan acara adat dan ibadah pelepasan (Acara Pangapulon). Huria menyampaikan turut berdukacita yang sedalam-dalamnya.',
    kategori: 'duka',
    penulis: 'Bidang Sosial Huria',
    prioritas: true
  },
  {
    id: 'warta-5',
    tanggal: getRelativeDate(-1),
    judul: 'Berita Sukacita: Pemberkatan Pernikahan (Sidi & Riri)',
    isi: 'Huria menyampaikan berita sukacita atas rencana pernikahan anggota jemaat kita: \nSidi Maruli Tua Tampubolon (Sektor II) dengan Riri Anggraini boru Sitorus. \nPemberkatan nikah akan dilaksanakan pada hari Sabtu, 4 Juli 2026 pukul 09:00 WIB di gedung gereja HKBP. Marilah kita mendoakan perjalanan hidup baru keluarga baru ini agar senantiasa diberkati Tuhan.',
    kategori: 'sukacita',
    penulis: 'Parhalado Protokol',
    prioritas: false
  }
];

export const INITIAL_TRANSAKSI: Transaksi[] = [
  {
    id: 'tr-1',
    tipe: 'pemasukan',
    kategori: 'Pelean IA (Umum)',
    jumlah: 4250000,
    tanggal: getRelativeDate(-5),
    keterangan: 'Pelean Minggu Pagi 07 Juni 2026'
  },
  {
    id: 'tr-2',
    tipe: 'pemasukan',
    kategori: 'Pelean IB (Gereja)',
    jumlah: 3820000,
    tanggal: getRelativeDate(-5),
    keterangan: 'Pelean Minggu Pagi 07 Juni 2026 - Pos Pelayanan'
  },
  {
    id: 'tr-3',
    tipe: 'pemasukan',
    kategori: 'Pelean II (Pembangunan)',
    jumlah: 2910000,
    tanggal: getRelativeDate(-5),
    keterangan: 'Pelean Khusus Penambahan Kas Fisik'
  },
  {
    id: 'tr-4',
    tipe: 'pengeluaran',
    kategori: 'Operasional Gereja',
    jumlah: 1500000,
    tanggal: getRelativeDate(-4),
    keterangan: 'Biaya Rekening Listrik & Air Bersih Gereja Mei-Juni'
  },
  {
    id: 'tr-5',
    tipe: 'pemasukan',
    kategori: 'Persembahan Persepuluhan',
    jumlah: 5000000,
    tanggal: getRelativeDate(-3),
    keterangan: 'Persepuluhan Keluarga NN Sektor III'
  },
  {
    id: 'tr-6',
    tipe: 'pengeluaran',
    kategori: 'Pelayanan Jemaat',
    jumlah: 800000,
    tanggal: getRelativeDate(-2),
    keterangan: 'Sumbangan diakonia dukacita keluarga St. Em. J. Sitorus'
  },
  {
    id: 'tr-7',
    tipe: 'pengeluaran',
    kategori: 'Pemeliharaan Inventaris',
    jumlah: 1200000,
    tanggal: getRelativeDate(-1),
    keterangan: 'Service AC Ruang Konsistori & Mic Altar'
  },
  {
    id: 'tr-8',
    tipe: 'pemasukan',
    kategori: 'Donasi Khusus',
    jumlah: 10000000,
    tanggal: getRelativeDate(0),
    keterangan: 'Donasi Pembelian Proyektor Baru Koor Ama'
  }
];

export const INITIAL_JEMAAT: Jemaat[] = [
  {
    id: 'jm-1',
    nama: 'Sahat Siregar',
    tanggalLahir: '1985-06-12', // Exactly today! (2026-06-12)
    sektor: 'Sektor III',
    noHP: '08123456781'
  },
  {
    id: 'jm-2',
    nama: 'Rotua Situmorang',
    tanggalLahir: '1992-06-14', // Sunday (in range)
    sektor: 'Sektor I',
    noHP: '08137328900'
  },
  {
    id: 'jm-3',
    nama: 'Grace Simanjuntak',
    tanggalLahir: '2005-06-15', // Monday (in range)
    sektor: 'Sektor V (Remaja/Seksi ND)',
    noHP: '08192837465'
  },
  {
    id: 'jm-4',
    nama: 'Sintua M. Nainggolan',
    tanggalLahir: '1963-06-11', // Yesterday (June 11, in range)
    sektor: 'Sektor IV',
    noHP: '08529090123'
  },
  {
    id: 'jm-5',
    nama: 'Elisabeth br. Pasaribu',
    tanggalLahir: '1974-06-17', // Next Wednesday (in range)
    sektor: 'Sektor II',
    noHP: '08216752003'
  },
  {
    id: 'jm-6',
    nama: 'Boni Manurung',
    tanggalLahir: '1989-06-08', // Birthday passed, outside 1 week range starting today (since June 12-18 are of interest)
    sektor: 'Sektor VI',
    noHP: '08987654321'
  },
  {
    id: 'jm-7',
    nama: 'Samuel Hutapea',
    tanggalLahir: '2016-06-13', // Tomorrow! (June 13, in range)
    sektor: 'Sektor III (Sekolah Minggu)',
    noHP: '08112233445'
  },
  {
    id: 'jm-8',
    nama: 'Pesta br. Silaban',
    tanggalLahir: '1960-06-18', // June 18 (in range)
    sektor: 'Sektor VII',
    noHP: '08223344556'
  }
];

export const INITIAL_JADWAL_IBADAH = {
  sekolahMinggu: '07.30 WIB',
  shift1: '08.00 WIB',
  shift2: '10.00 WIB'
};

export const INITIAL_SEJARAH_GEREJA = `Huria Kristen Batak Protestan (HKBP) Hinalang Silalahi berdiri kokoh sebagai tonggak sejarah iman kristiani di wilayah Balige, Toba. Didirikan pertama kali pada tahun 1928, gereja ini bermula dari persekutuan doa kecil yang dipelopori oleh para pemuka masyarakat lokal bertekad luhur.

Dengan seiring berjalannya waktu dan bertambahnya jiwa, pondok kayu sederhana tersebut bertransformasi menjadi bangunan gereja yang megah dan indah di bawah naungan Resort Hinalang Silalahi - Distrik XI Toba Hasundutan. Kini, gereja ini mendampingi ratusan kepala keluarga jemaat, melayani dengan penuh ketulusan, kasih, dan kesetiaan di bumi Toba.

Visi HKBP Hinalang Silalahi senantiasa menjadi garam dan terang dunia (Gabe Sulum jala Sira di Portibi on), mendidik rohani generasi muda naposo, melestarikan nilai luhur adat budaya Batak yang selaras dengan Injil, serta membangun jemaat misioner yang tangguh dalam iman.`;

export const INITIAL_TENTANG_GEREJA: TentangGerejaItem[] = [
  {
    id: 'tntg-1',
    judul: 'Sejarah Singkat Gereja',
    isi: 'Huria Kristen Batak Protestan (HKBP) Hinalang Silalahi berdiri kokoh sebagai tonggak sejarah iman kristiani di wilayah Balige, Toba. Didirikan pertama kali pada tahun 1928, gereja ini bermula dari persekutuan doa kecil yang dipelopori oleh para pemuka masyarakat lokal bertekad luhur.\n\nDengan seiring berjalannya waktu dan bertambahnya jiwa, pondok kayu sederhana tersebut bertransformasi menjadi bangunan gereja yang megah dan indah di bawah naungan Resort Hinalang Silalahi - Distrik XI Toba Hasundutan. Kini, gereja ini mendampingi ratusan kepala keluarga jemaat, melayani dengan penuh ketulusan, kasih, dan kesetiaan di bumi Toba.',
    tanggalUpdate: '2026-06-29',
    gambar: ''
  },
  {
    id: 'tntg-2',
    judul: 'Visi & Misi Gereja',
    isi: 'Visi HKBP Hinalang Silalahi senantiasa menjadi garam dan terang dunia (Gabe Sulum jala Sira di Portibi on), mendidik rohani generasi muda naposo, melestarikan nilai luhur adat budaya Batak yang selaras dengan Injil, serta membangun jemaat misioner yang tangguh dalam iman.',
    tanggalUpdate: '2026-06-29',
    gambar: ''
  }
];


export const INITIAL_PARHALADO_LIST = [
  {
    id: 'ph-1',
    nama: 'Pdt. R. Sitorus, S.Th',
    jabatan: 'Pendeta Resort / Pimpinan',
    noTelp: '081234567890'
  },
  {
    id: 'ph-2',
    nama: 'Pdt. Dr. J. Sinaga',
    jabatan: 'Pendeta Jemaat',
    noTelp: '081345678901'
  },
  {
    id: 'ph-3',
    nama: 'Cpdt. A. Nababan, S.Th',
    jabatan: 'Bikaris / Calon Pendeta',
    noTelp: '082156789012'
  },
  {
    id: 'ph-4',
    nama: 'St. K. Pasaribu',
    jabatan: 'Sekretaris Jemaat',
    noTelp: '085267890123'
  },
  {
    id: 'ph-5',
    nama: 'St. M. Limbong',
    jabatan: 'Bendahara Jemaat',
    noTelp: '082278901234'
  },
  {
    id: 'ph-6',
    nama: 'St. P. Naibaho',
    jabatan: 'Sintua Sektor I',
    noTelp: '081290123456'
  },
  {
    id: 'ph-7',
    nama: 'St. H. Simanjuntak',
    jabatan: 'Sintua Sektor II',
    noTelp: '081391234567'
  },
  {
    id: 'ph-8',
    nama: 'St. L. Tarihoran',
    jabatan: 'Sintua Sektor III',
    noTelp: '085392345678'
  }
];

export const INITIAL_ATTENDANCE_TRENDS: WeeklyAttendanceTrend[] = [
  {
    weekLabel: "Minggu Ke-1",
    tanggalRange: "14 Juni 2026",
    mingguAma: 120,
    mingguIna: 150,
    mingguSm: 80,
    mingguRena: 90,
    mingguParhalado: 15,
    partangianganAma: 65,
    partangianganIna: 85,
    partangianganSm: 25,
    partangianganRena: 40,
    partangianganParhalado: 14
  },
  {
    weekLabel: "Minggu Ke-2",
    tanggalRange: "21 Juni 2026",
    mingguAma: 130,
    mingguIna: 155,
    mingguSm: 85,
    mingguRena: 95,
    mingguParhalado: 15,
    partangianganAma: 70,
    partangianganIna: 90,
    partangianganSm: 30,
    partangianganRena: 45,
    partangianganParhalado: 14
  },
  {
    weekLabel: "Minggu Ke-3",
    tanggalRange: "28 Juni 2026",
    mingguAma: 125,
    mingguIna: 148,
    mingguSm: 78,
    mingguRena: 88,
    mingguParhalado: 15,
    partangianganAma: 68,
    partangianganIna: 88,
    partangianganSm: 28,
    partangianganRena: 42,
    partangianganParhalado: 14
  },
  {
    weekLabel: "Minggu Ke-4 (Terbaru)",
    tanggalRange: "05 Juli 2026",
    mingguAma: 142,
    mingguIna: 165,
    mingguSm: 95,
    mingguRena: 110,
    mingguParhalado: 15,
    partangianganAma: 75,
    partangianganIna: 104,
    partangianganSm: 35,
    partangianganRena: 51,
    partangianganParhalado: 14
  }
];

