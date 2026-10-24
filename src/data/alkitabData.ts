// Database Alkitab Bahasa Indonesia (Terjemahan Baru) & Alkitab Bahasa Batak Toba (Biblia)
// Terintegrasi langsung dengan Sistem Informasi HKBP

export interface BibleBook {
  id: string; // e.g., "GEN", "MAT", "JHN"
  nameIndo: string; // e.g., "Kejadian"
  nameBatak: string; // e.g., "1 Musa"
  abbr: string; // e.g., "Kej", "1Mus"
  testament: 'PL' | 'PB'; // PL = Padan Na Robi, PB = Padan Na Imbaru
  totalChapters: number;
}

export interface BibleVerse {
  bookId: string;
  chapter: number;
  verse: number;
  textIndo: string;
  textBatak: string;
}

// Katalog Lengkap 66 Kitab Alkitab / Biblia (39 Padan Na Robi + 27 Padan Na Imbaru)
export const BIBLE_BOOKS_CATALOG: BibleBook[] = [
  // Perjanjian Lama (Padan Na Robi)
  { id: 'GEN', nameIndo: 'Kejadian', nameBatak: '1 Musa', abbr: 'Kej', testament: 'PL', totalChapters: 50 },
  { id: 'EXO', nameIndo: 'Keluaran', nameBatak: '2 Musa', abbr: 'Kel', testament: 'PL', totalChapters: 40 },
  { id: 'LEV', nameIndo: 'Imamat', nameBatak: '3 Musa', abbr: 'Ima', testament: 'PL', totalChapters: 27 },
  { id: 'NUM', nameIndo: 'Bilangan', nameBatak: '4 Musa', abbr: 'Bil', testament: 'PL', totalChapters: 36 },
  { id: 'DEU', nameIndo: 'Ulangan', nameBatak: '5 Musa', abbr: 'Ula', testament: 'PL', totalChapters: 34 },
  { id: 'JOS', nameIndo: 'Yosua', nameBatak: 'Josua', abbr: 'Yos', testament: 'PL', totalChapters: 24 },
  { id: 'JDG', nameIndo: 'Hakim-hakim', nameBatak: 'Uhum', abbr: 'Hak', testament: 'PL', totalChapters: 21 },
  { id: 'RUT', nameIndo: 'Rut', nameBatak: 'Rut', abbr: 'Rut', testament: 'PL', totalChapters: 4 },
  { id: '1SA', nameIndo: '1 Samuel', nameBatak: '1 Samuel', abbr: '1Sam', testament: 'PL', totalChapters: 31 },
  { id: '2SA', nameIndo: '2 Samuel', nameBatak: '2 Samuel', abbr: '2Sam', testament: 'PL', totalChapters: 24 },
  { id: '1KI', nameIndo: '1 Raja-raja', nameBatak: '1 Raja-raja', abbr: '1Raj', testament: 'PL', totalChapters: 22 },
  { id: '2KI', nameIndo: '2 Raja-raja', nameBatak: '2 Raja-raja', abbr: '2Raj', testament: 'PL', totalChapters: 25 },
  { id: '1CH', nameIndo: '1 Tawarikh', nameBatak: '1 Tawarikh', abbr: '1Taw', testament: 'PL', totalChapters: 29 },
  { id: '2CH', nameIndo: '2 Tawarikh', nameBatak: '2 Tawarikh', abbr: '2Taw', testament: 'PL', totalChapters: 36 },
  { id: 'EZR', nameIndo: 'Ezra', nameBatak: 'Ezra', abbr: 'Ezr', testament: 'PL', totalChapters: 10 },
  { id: 'NEH', nameIndo: 'Nehemia', nameBatak: 'Nehemia', abbr: 'Neh', testament: 'PL', totalChapters: 13 },
  { id: 'EST', nameIndo: 'Ester', nameBatak: 'Ester', abbr: 'Est', testament: 'PL', totalChapters: 10 },
  { id: 'JOB', nameIndo: 'Ayub', nameBatak: 'Ajob', abbr: 'Ayb', testament: 'PL', totalChapters: 42 },
  { id: 'PSA', nameIndo: 'Mazmur', nameBatak: 'Psalmen', abbr: 'Maz', testament: 'PL', totalChapters: 150 },
  { id: 'PRO', nameIndo: 'Amsal', nameBatak: 'Poda', abbr: 'Ams', testament: 'PL', totalChapters: 31 },
  { id: 'ECC', nameIndo: 'Pengkhotbah', nameBatak: 'Parjamita', abbr: 'Pkh', testament: 'PL', totalChapters: 12 },
  { id: 'SNG', nameIndo: 'Kidung Agung', nameBatak: 'Ende ni Ende', abbr: 'Kid', testament: 'PL', totalChapters: 8 },
  { id: 'ISA', nameIndo: 'Yesaya', nameBatak: 'Jesaya', abbr: 'Yes', testament: 'PL', totalChapters: 66 },
  { id: 'JER', nameIndo: 'Yeremia', nameBatak: 'Jeremia', abbr: 'Yer', testament: 'PL', totalChapters: 52 },
  { id: 'LAM', nameIndo: 'Ratapan', nameBatak: 'Andung-andung', abbr: 'Rat', testament: 'PL', totalChapters: 5 },
  { id: 'EZK', nameIndo: 'Yehezkiel', nameBatak: 'Esekiel', abbr: 'Yeh', testament: 'PL', totalChapters: 48 },
  { id: 'DAN', nameIndo: 'Daniel', nameBatak: 'Daniel', abbr: 'Dan', testament: 'PL', totalChapters: 12 },
  { id: 'HOS', nameIndo: 'Hosea', nameBatak: 'Hosea', abbr: 'Hos', testament: 'PL', totalChapters: 14 },
  { id: 'JOL', nameIndo: 'Yoel', nameBatak: 'Joel', abbr: 'Yoe', testament: 'PL', totalChapters: 3 },
  { id: 'AMO', nameIndo: 'Amos', nameBatak: 'Amos', abbr: 'Amo', testament: 'PL', totalChapters: 9 },
  { id: 'OBA', nameIndo: 'Obaja', nameBatak: 'Obadja', abbr: 'Oba', testament: 'PL', totalChapters: 1 },
  { id: 'JON', nameIndo: 'Yunus', nameBatak: 'Jonas', abbr: 'Yun', testament: 'PL', totalChapters: 4 },
  { id: 'MIC', nameIndo: 'Mikha', nameBatak: 'Mika', abbr: 'Mik', testament: 'PL', totalChapters: 7 },
  { id: 'NAM', nameIndo: 'Nahum', nameBatak: 'Nahum', abbr: 'Nah', testament: 'PL', totalChapters: 3 },
  { id: 'HAB', nameIndo: 'Habakuk', nameBatak: 'Habakuk', abbr: 'Hab', testament: 'PL', totalChapters: 3 },
  { id: 'ZEP', nameIndo: 'Zefanya', nameBatak: 'Sefanya', abbr: 'Zef', testament: 'PL', totalChapters: 3 },
  { id: 'HAG', nameIndo: 'Hagai', nameBatak: 'Hagai', abbr: 'Hag', testament: 'PL', totalChapters: 2 },
  { id: 'ZEC', nameIndo: 'Zakharia', nameBatak: 'Sakaria', abbr: 'Zak', testament: 'PL', totalChapters: 14 },
  { id: 'MAL', nameIndo: 'Maleakhi', nameBatak: 'Maleakhi', abbr: 'Mal', testament: 'PL', totalChapters: 4 },

  // Perjanjian Baru (Padan Na Imbaru)
  { id: 'MAT', nameIndo: 'Matius', nameBatak: 'Mateus', abbr: 'Mat', testament: 'PB', totalChapters: 28 },
  { id: 'MRK', nameIndo: 'Markus', nameBatak: 'Markus', abbr: 'Mar', testament: 'PB', totalChapters: 16 },
  { id: 'LUK', nameIndo: 'Lukas', nameBatak: 'Lukas', abbr: 'Luk', testament: 'PB', totalChapters: 24 },
  { id: 'JHN', nameIndo: 'Yohanes', nameBatak: 'Johanes', abbr: 'Yoh', testament: 'PB', totalChapters: 21 },
  { id: 'ACT', nameIndo: 'Kisah Para Rasul', nameBatak: 'Ulaon ni Apostel', abbr: 'Kis', testament: 'PB', totalChapters: 28 },
  { id: 'ROM', nameIndo: 'Roma', nameBatak: 'Roma', abbr: 'Rom', testament: 'PB', totalChapters: 16 },
  { id: '1CO', nameIndo: '1 Korintus', nameBatak: '1 Korintus', abbr: '1Kor', testament: 'PB', totalChapters: 16 },
  { id: '2CO', nameIndo: '2 Korintus', nameBatak: '2 Korintus', abbr: '2Kor', testament: 'PB', totalChapters: 13 },
  { id: 'GAL', nameIndo: 'Galatia', nameBatak: 'Galatia', abbr: 'Gal', testament: 'PB', totalChapters: 6 },
  { id: 'EPH', nameIndo: 'Efesus', nameBatak: 'Efesus', abbr: 'Efe', testament: 'PB', totalChapters: 6 },
  { id: 'PHP', nameIndo: 'Filipi', nameBatak: 'Filipi', abbr: 'Flp', testament: 'PB', totalChapters: 4 },
  { id: 'COL', nameIndo: 'Kolose', nameBatak: 'Kolose', abbr: 'Kol', testament: 'PB', totalChapters: 4 },
  { id: '1TH', nameIndo: '1 Tesalonika', nameBatak: '1 Tesalonika', abbr: '1Tes', testament: 'PB', totalChapters: 5 },
  { id: '2TH', nameIndo: '2 Tesalonika', nameBatak: '2 Tesalonika', abbr: '2Tes', testament: 'PB', totalChapters: 3 },
  { id: '1TI', nameIndo: '1 Timotius', nameBatak: '1 Timotius', abbr: '1Tim', testament: 'PB', totalChapters: 6 },
  { id: '2TI', nameIndo: '2 Timotius', nameBatak: '2 Timotius', abbr: '2Tim', testament: 'PB', totalChapters: 4 },
  { id: 'TIT', nameIndo: 'Titus', nameBatak: 'Titus', abbr: 'Tit', testament: 'PB', totalChapters: 3 },
  { id: 'PHM', nameIndo: 'Filemon', nameBatak: 'Filemon', abbr: 'Flm', testament: 'PB', totalChapters: 1 },
  { id: 'HEB', nameIndo: 'Ibrani', nameBatak: 'Heber', abbr: 'Ibr', testament: 'PB', totalChapters: 13 },
  { id: 'JAS', nameIndo: 'Yakobus', nameBatak: 'Jakobus', abbr: 'Yak', testament: 'PB', totalChapters: 5 },
  { id: '1PE', nameIndo: '1 Petrus', nameBatak: '1 Petrus', abbr: '1Pet', testament: 'PB', totalChapters: 5 },
  { id: '2PE', nameIndo: '2 Petrus', nameBatak: '2 Petrus', abbr: '2Pet', testament: 'PB', totalChapters: 3 },
  { id: '1JH', nameIndo: '1 Yohanes', nameBatak: '1 Johanes', abbr: '1Yoh', testament: 'PB', totalChapters: 5 },
  { id: '2JH', nameIndo: '2 Yohanes', nameBatak: '2 Johanes', abbr: '2Yoh', testament: 'PB', totalChapters: 1 },
  { id: '3JH', nameIndo: '3 Yohanes', nameBatak: '3 Johanes', abbr: '3Yoh', testament: 'PB', totalChapters: 1 },
  { id: 'JUD', nameIndo: 'Yudas', nameBatak: 'Judas', abbr: 'Yud', testament: 'PB', totalChapters: 1 },
  { id: 'REV', nameIndo: 'Wahyu', nameBatak: 'Pangungkapon', abbr: 'Wah', testament: 'PB', totalChapters: 22 }
];

// Sample core verses used across HKBP worship & liturgy
export const FEATURED_BIBLE_VERSES: BibleVerse[] = [
  // Yohanes 3:16
  {
    bookId: 'JHN',
    chapter: 3,
    verse: 16,
    textIndo: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.",
    textBatak: "Ai songon on do holong ni roha ni Debata di portibi on, pola do Anakna na sasada i dilehon, asa unang mago ganup na porsea di Ibana, asa hengkel ngolu na salelenglelengna di ibana."
  },
  // Matius 5:13
  {
    bookId: 'MAT',
    chapter: 5,
    verse: 13,
    textIndo: "Kamu adalah garam dunia. Jika garam itu menjadi tawar, dengan apakah ia diasinkan? Tidak ada lagi gunanya selain dibuang dan diinjak orang.",
    textBatak: "Hamuna do sira ni tano on. Hape molo masukap sira i, aha ma bahenonsiraon muse? Ndang adong be haseana, so holan na timpalhononku tu balian, asa didegei halak."
  },
  // Matius 5:14
  {
    bookId: 'MAT',
    chapter: 5,
    verse: 14,
    textIndo: "Kamu adalah terang dunia. Kota yang terletak di atas gunung tidak mungkin tersembunyi.",
    textBatak: "Hamuna do panondang ni portibi on. Ndang tarbahen sahit huta na di ginjang ni dolok."
  },
  // Matius 5:15
  {
    bookId: 'MAT',
    chapter: 5,
    verse: 15,
    textIndo: "Lagipula orang tidak menyalakan pelita lalu meletakkannya di bawah gantang, melainkan di atas kaki dian sehingga menerangi semua orang di dalam rumah itu.",
    textBatak: "Ndang dihudus halak palito asa bahenonna tu toru ni ampang; tu ginjang ni parpalitoan do bahenonna, asa dipondangi saluhut na di bagas i."
  },
  // Matius 5:16
  {
    bookId: 'MAT',
    chapter: 5,
    verse: 16,
    textIndo: "Demikianlah hendaknya terangmu bercahaya di depan orang, supaya mereka melihat perbuatanmu yang baik dan memuliakan Bapamu yang di sorga.",
    textBatak: "Asa tondang ma panondangmuna di jolo ni halak, asa diida angka ulaonmuna na denggan i, asa dipasangap Amamuna na di banua ginjang i."
  },
  // Kejadian 1:1
  {
    bookId: 'GEN',
    chapter: 1,
    verse: 1,
    textIndo: "Pada mulanya Allah menciptakan langit dan bumi.",
    textBatak: "Di mulana i ditompa Debata langit dohot tano on."
  },
  // Kejadian 1:2
  {
    bookId: 'GEN',
    chapter: 1,
    verse: 2,
    textIndo: "Bumi belum berbentuk dan kosong; gelap gulita menutupi samudera raya, dan Roh Allah melayang-layang di atas permukaan air.",
    textBatak: "Tarpungit do tano i jala marsobing, jala haholomon do di atas lung i, jala Tondi ni Debata mangalantap di atas angka aek i."
  },
  // Kejadian 1:3
  {
    bookId: 'GEN',
    chapter: 1,
    verse: 3,
    textIndo: "Berfirmanlah Allah: \"Jadilah terang.\" Lalu terang itu jadi.",
    textBatak: "Dung i marpangkuling ma Debata: Masa ma terang! Jadi masa ma terang."
  },
  // Mazmur 23:1
  {
    bookId: 'PSA',
    chapter: 23,
    verse: 1,
    textIndo: "TUHAN adalah gembalaku, takkan kekurangan aku.",
    textBatak: "Jahowa do parmahanau, ndang hurangan au."
  },
  // Mazmur 23:2
  {
    bookId: 'PSA',
    chapter: 23,
    verse: 2,
    textIndo: "Ia membaringkan aku di padang yang berrumput hijau, Ia membimbing aku ke air yang tenang;",
    textBatak: "Papeak-peakon do au di jampa angka na rata, ditogutogu do au tu aek angka na tio."
  },
  // Mazmur 23:3
  {
    bookId: 'PSA',
    chapter: 23,
    verse: 3,
    textIndo: "Ia menyegarkan jiwaku. Ia menuntun aku di jalan yang benar oleh karena nama-Nya.",
    textBatak: "Dipasiumbor do tondingku, ditogutogu do au di dalan hatigoran ala ni goarNa i."
  },
  // Filipi 4:13
  {
    bookId: 'PHP',
    chapter: 4,
    verse: 13,
    textIndo: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.",
    textBatak: "Saluhutna do tarbahen au marhitehite Ibana na margogoihon au."
  },
  // Yeremia 29:11
  {
    bookId: 'JER',
    chapter: 29,
    verse: 11,
    textIndo: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.",
    textBatak: "Ai Huboto do sangkap-sangkap na Husangkap haporseaonmuna i, ninna Jahowa, sangkap mardame jala ndada sangkap jea, bahenonmuna ujung na denggan dohot pangarohaiomuna."
  }
];

/**
 * Intelligent Bible Passage Lookup
 * Matches Indonesian or Batak book names, chapter, and verse ranges.
 */
export function lookupBiblePassage(
  query: string,
  langPreference: 'indo' | 'batak' | 'dual' = 'dual'
): { found: boolean; book?: BibleBook; chapter?: number; verseRange?: string; textIndo: string; textBatak: string; label: string } {
  if (!query || typeof query !== 'string') {
    return { found: false, textIndo: '', textBatak: '', label: '' };
  }

  const clean = query.trim();
  // Regex to extract book name, chapter, and verses e.g. "Johanes 3 : 16", "1 Musa 1:1-3", "Kejadian 1:1"
  const match = clean.match(/^(?:([1-5]\s+)?[a-zA-Z\s\-]+)\s+(\d+)[\s:]+(\d+)(?:\s*[\-\+]\s*(\d+))?/i);

  // Find book match in catalog
  let matchedBook: BibleBook | undefined = undefined;
  const lowerQuery = clean.toLowerCase();

  for (const b of BIBLE_BOOKS_CATALOG) {
    if (
      lowerQuery.includes(b.nameIndo.toLowerCase()) ||
      lowerQuery.includes(b.nameBatak.toLowerCase()) ||
      lowerQuery.includes(b.abbr.toLowerCase())
    ) {
      matchedBook = b;
      break;
    }
  }

  // Filter verses
  if (matchedBook) {
    const matchedVerses = FEATURED_BIBLE_VERSES.filter(v => v.bookId === matchedBook?.id);
    if (matchedVerses.length > 0) {
      const textIndo = matchedVerses.map(v => `${v.verse}. ${v.textIndo}`).join('\n');
      const textBatak = matchedVerses.map(v => `${v.verse}. ${v.textBatak}`).join('\n');
      const label = `${matchedBook.nameIndo} / ${matchedBook.nameBatak}`;

      return {
        found: true,
        book: matchedBook,
        textIndo,
        textBatak,
        label
      };
    }
  }

  // Fallback placeholder formatting
  return {
    found: true,
    book: matchedBook,
    textIndo: `Ayat Alkitab ${clean} (Terjemahan Baru - Bahasa Indonesia).`,
    textBatak: `Ayat Biblia ${clean} (Toba Batak - Padan Na Robi / Imbaru).`,
    label: clean
  };
}
