// Official HKBP Alkitab & Biblia Service (https://hkbp.or.id/alkitab)
// Fetches Indonesian (Terjemahan Baru - 'tb') and Batak Toba (Biblia - 'toba') scriptures

export interface AlkitabVerseItem {
  verse: number;
  text: string;
  type?: string;
  title?: string;
}

export interface AlkitabChapterData {
  bookName: string;
  chapter: number;
  version: 'tb' | 'toba';
  verses: AlkitabVerseItem[];
}

export interface DualAlkitabVerse {
  verse: number;
  textIndo: string;
  textBatak: string;
  titleIndo?: string;
  titleBatak?: string;
}

export interface AlkitabBookInfo {
  id: string;
  indonesia: string;
  batak: string;
  abbrIndo: string;
  abbrBatak: string;
  testament: 'PL' | 'PB';
  totalChapters: number;
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/pandapotan/ktb@main/bib';

// 66 Books Catalog matching official HKBP structure
export const ALKITAB_BOOKS_CATALOG: AlkitabBookInfo[] = [
  // Perjanjian Lama / Padan Na Robi (39 Books)
  { id: '1', indonesia: 'Kejadian', batak: '1 Musa', abbrIndo: 'Kej', abbrBatak: '1Mus', testament: 'PL', totalChapters: 50 },
  { id: '2', indonesia: 'Keluaran', batak: '2 Musa', abbrIndo: 'Kel', abbrBatak: '2Mus', testament: 'PL', totalChapters: 40 },
  { id: '3', indonesia: 'Imamat', batak: '3 Musa', abbrIndo: 'Ima', abbrBatak: '3Mus', testament: 'PL', totalChapters: 27 },
  { id: '4', indonesia: 'Bilangan', batak: '4 Musa', abbrIndo: 'Bil', abbrBatak: '4Mus', testament: 'PL', totalChapters: 36 },
  { id: '5', indonesia: 'Ulangan', batak: '5 Musa', abbrIndo: 'Ula', abbrBatak: '5Mus', testament: 'PL', totalChapters: 34 },
  { id: '6', indonesia: 'Yosua', batak: 'Josua', abbrIndo: 'Yos', abbrBatak: 'Jos', testament: 'PL', totalChapters: 24 },
  { id: '7', indonesia: 'Hakim-hakim', batak: 'Uhum', abbrIndo: 'Hak', abbrBatak: 'Uhm', testament: 'PL', totalChapters: 21 },
  { id: '8', indonesia: 'Rut', batak: 'Rut', abbrIndo: 'Rut', abbrBatak: 'Rut', testament: 'PL', totalChapters: 4 },
  { id: '9', indonesia: '1 Samuel', batak: '1 Samuel', abbrIndo: '1Sam', abbrBatak: '1Sam', testament: 'PL', totalChapters: 31 },
  { id: '10', indonesia: '2 Samuel', batak: '2 Samuel', abbrIndo: '2Sam', abbrBatak: '2Sam', testament: 'PL', totalChapters: 24 },
  { id: '11', indonesia: '1 Raja-raja', batak: '1 Raja-raja', abbrIndo: '1Raj', abbrBatak: '1Raj', testament: 'PL', totalChapters: 22 },
  { id: '12', indonesia: '2 Raja-raja', batak: '2 Raja-raja', abbrIndo: '2Raj', abbrBatak: '2Raj', testament: 'PL', totalChapters: 25 },
  { id: '13', indonesia: '1 Tawarikh', batak: '1 Tawarikh', abbrIndo: '1Taw', abbrBatak: '1Taw', testament: 'PL', totalChapters: 29 },
  { id: '14', indonesia: '2 Tawarikh', batak: '2 Tawarikh', abbrIndo: '2Taw', abbrBatak: '2Taw', testament: 'PL', totalChapters: 36 },
  { id: '15', indonesia: 'Ezra', batak: 'Ezra', abbrIndo: 'Ezr', abbrBatak: 'Ezr', testament: 'PL', totalChapters: 10 },
  { id: '16', indonesia: 'Nehemia', batak: 'Nehemia', abbrIndo: 'Neh', abbrBatak: 'Neh', testament: 'PL', totalChapters: 13 },
  { id: '17', indonesia: 'Ester', batak: 'Ester', abbrIndo: 'Est', abbrBatak: 'Est', testament: 'PL', totalChapters: 10 },
  { id: '18', indonesia: 'Ayub', batak: 'Ajob', abbrIndo: 'Ayb', abbrBatak: 'Ajob', testament: 'PL', totalChapters: 42 },
  { id: '19', indonesia: 'Mazmur', batak: 'Psalmen', abbrIndo: 'Maz', abbrBatak: 'Psa', testament: 'PL', totalChapters: 150 },
  { id: '20', indonesia: 'Amsal', batak: 'Poda', abbrIndo: 'Ams', abbrBatak: 'Pod', testament: 'PL', totalChapters: 31 },
  { id: '21', indonesia: 'Pengkhotbah', batak: 'Parjamita', abbrIndo: 'Pkh', abbrBatak: 'Parj', testament: 'PL', totalChapters: 12 },
  { id: '22', indonesia: 'Kidung Agung', batak: 'Ende ni Ende', abbrIndo: 'Kid', abbrBatak: 'Ende', testament: 'PL', totalChapters: 8 },
  { id: '23', indonesia: 'Yesaya', batak: 'Jesaya', abbrIndo: 'Yes', abbrBatak: 'Jes', testament: 'PL', totalChapters: 66 },
  { id: '24', indonesia: 'Yeremia', batak: 'Jeremia', abbrIndo: 'Yer', abbrBatak: 'Jer', testament: 'PL', totalChapters: 52 },
  { id: '25', indonesia: 'Ratapan', batak: 'Andung-andung', abbrIndo: 'Rat', abbrBatak: 'And', testament: 'PL', totalChapters: 5 },
  { id: '26', indonesia: 'Yehezkiel', batak: 'Esekiel', abbrIndo: 'Yeh', abbrBatak: 'Esk', testament: 'PL', totalChapters: 48 },
  { id: '27', indonesia: 'Daniel', batak: 'Daniel', abbrIndo: 'Dan', abbrBatak: 'Dan', testament: 'PL', totalChapters: 12 },
  { id: '28', indonesia: 'Hosea', batak: 'Hosea', abbrIndo: 'Hos', abbrBatak: 'Hos', testament: 'PL', totalChapters: 14 },
  { id: '29', indonesia: 'Yoel', batak: 'Joel', abbrIndo: 'Yoe', abbrBatak: 'Joe', testament: 'PL', totalChapters: 3 },
  { id: '30', indonesia: 'Amos', batak: 'Amos', abbrIndo: 'Amo', abbrBatak: 'Amo', testament: 'PL', totalChapters: 9 },
  { id: '31', indonesia: 'Obaja', batak: 'Obadja', abbrIndo: 'Oba', abbrBatak: 'Obd', testament: 'PL', totalChapters: 1 },
  { id: '32', indonesia: 'Yunus', batak: 'Jonas', abbrIndo: 'Yun', abbrBatak: 'Jon', testament: 'PL', totalChapters: 4 },
  { id: '33', indonesia: 'Mikha', batak: 'Mika', abbrIndo: 'Mik', abbrBatak: 'Mik', testament: 'PL', totalChapters: 7 },
  { id: '34', indonesia: 'Nahum', batak: 'Nahum', abbrIndo: 'Nah', abbrBatak: 'Nah', testament: 'PL', totalChapters: 3 },
  { id: '35', indonesia: 'Habakuk', batak: 'Habakuk', abbrIndo: 'Hab', abbrBatak: 'Hab', testament: 'PL', totalChapters: 3 },
  { id: '36', indonesia: 'Zefanya', batak: 'Sefanya', abbrIndo: 'Zef', abbrBatak: 'Sef', testament: 'PL', totalChapters: 3 },
  { id: '37', indonesia: 'Hagai', batak: 'Hagai', abbrIndo: 'Hag', abbrBatak: 'Hag', testament: 'PL', totalChapters: 2 },
  { id: '38', indonesia: 'Zakharia', batak: 'Sakaria', abbrIndo: 'Zak', abbrBatak: 'Sak', testament: 'PL', totalChapters: 14 },
  { id: '39', indonesia: 'Maleakhi', batak: 'Maleakhi', abbrIndo: 'Mal', abbrBatak: 'Mal', testament: 'PL', totalChapters: 4 },

  // Perjanjian Baru / Padan Na Imbaru (27 Books)
  { id: '40', indonesia: 'Matius', batak: 'Mateus', abbrIndo: 'Mat', abbrBatak: 'Mat', testament: 'PB', totalChapters: 28 },
  { id: '41', indonesia: 'Markus', batak: 'Markus', abbrIndo: 'Mar', abbrBatak: 'Mar', testament: 'PB', totalChapters: 16 },
  { id: '42', indonesia: 'Lukas', batak: 'Lukas', abbrIndo: 'Luk', abbrBatak: 'Luk', testament: 'PB', totalChapters: 24 },
  { id: '43', indonesia: 'Yohanes', batak: 'Johanes', abbrIndo: 'Yoh', abbrBatak: 'Joh', testament: 'PB', totalChapters: 21 },
  { id: '44', indonesia: 'Kisah Para Rasul', batak: 'Ulaon ni Apostel', abbrIndo: 'Kis', abbrBatak: 'Ula', testament: 'PB', totalChapters: 28 },
  { id: '45', indonesia: 'Roma', batak: 'Roma', abbrIndo: 'Rom', abbrBatak: 'Rom', testament: 'PB', totalChapters: 16 },
  { id: '46', indonesia: '1 Korintus', batak: '1 Korintus', abbrIndo: '1Kor', abbrBatak: '1Kor', testament: 'PB', totalChapters: 16 },
  { id: '47', indonesia: '2 Korintus', batak: '2 Korintus', abbrIndo: '2Kor', abbrBatak: '2Kor', testament: 'PB', totalChapters: 13 },
  { id: '48', indonesia: 'Galatia', batak: 'Galatia', abbrIndo: 'Gal', abbrBatak: 'Gal', testament: 'PB', totalChapters: 6 },
  { id: '49', indonesia: 'Efesus', batak: 'Efesus', abbrIndo: 'Efe', abbrBatak: 'Efe', testament: 'PB', totalChapters: 6 },
  { id: '50', indonesia: 'Filipi', batak: 'Filipi', abbrIndo: 'Flp', abbrBatak: 'Flp', testament: 'PB', totalChapters: 4 },
  { id: '51', indonesia: 'Kolose', batak: 'Kolose', abbrIndo: 'Kol', abbrBatak: 'Kol', testament: 'PB', totalChapters: 4 },
  { id: '52', indonesia: '1 Tesalonika', batak: '1 Tesalonika', abbrIndo: '1Tes', abbrBatak: '1Tes', testament: 'PB', totalChapters: 5 },
  { id: '53', indonesia: '2 Tesalonika', batak: '2 Tesalonika', abbrIndo: '2Tes', abbrBatak: '2Tes', testament: 'PB', totalChapters: 3 },
  { id: '54', indonesia: '1 Timotius', batak: '1 Timotius', abbrIndo: '1Tim', abbrBatak: '1Tim', testament: 'PB', totalChapters: 6 },
  { id: '55', indonesia: '2 Timotius', batak: '2 Timotius', abbrIndo: '2Tim', abbrBatak: '2Tim', testament: 'PB', totalChapters: 4 },
  { id: '56', indonesia: 'Titus', batak: 'Titus', abbrIndo: 'Tit', abbrBatak: 'Tit', testament: 'PB', totalChapters: 3 },
  { id: '57', indonesia: 'Filemon', batak: 'Filemon', abbrIndo: 'Flm', abbrBatak: 'Flm', testament: 'PB', totalChapters: 1 },
  { id: '58', indonesia: 'Ibrani', batak: 'Heber', abbrIndo: 'Ibr', abbrBatak: 'Heb', testament: 'PB', totalChapters: 13 },
  { id: '59', indonesia: 'Yakobus', batak: 'Jakobus', abbrIndo: 'Yak', abbrBatak: 'Jak', testament: 'PB', totalChapters: 5 },
  { id: '60', indonesia: '1 Petrus', batak: '1 Petrus', abbrIndo: '1Pet', abbrBatak: '1Pet', testament: 'PB', totalChapters: 5 },
  { id: '61', indonesia: '2 Petrus', batak: '2 Petrus', abbrIndo: '2Pet', abbrBatak: '2Pet', testament: 'PB', totalChapters: 3 },
  { id: '62', indonesia: '1 Yohanes', batak: '1 Johanes', abbrIndo: '1Yoh', abbrBatak: '1Joh', testament: 'PB', totalChapters: 5 },
  { id: '63', indonesia: '2 Yohanes', batak: '2 Johanes', abbrIndo: '2Yoh', abbrBatak: '2Joh', testament: 'PB', totalChapters: 1 },
  { id: '64', indonesia: '3 Yohanes', batak: '3 Johanes', abbrIndo: '3Yoh', abbrBatak: '3Joh', testament: 'PB', totalChapters: 1 },
  { id: '65', indonesia: 'Yudas', batak: 'Judas', abbrIndo: 'Yud', abbrBatak: 'Jud', testament: 'PB', totalChapters: 1 },
  { id: '66', indonesia: 'Wahyu', batak: 'Pangungkapon', abbrIndo: 'Wah', abbrBatak: 'Pang', testament: 'PB', totalChapters: 22 }
];

const chapterCache = new Map<string, AlkitabVerseItem[]>();

export function findBookByName(query: string): AlkitabBookInfo | null {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  for (const b of ALKITAB_BOOKS_CATALOG) {
    if (
      b.indonesia.toLowerCase() === q ||
      b.batak.toLowerCase() === q ||
      b.abbrIndo.toLowerCase() === q ||
      b.abbrBatak.toLowerCase() === q
    ) {
      return b;
    }
  }

  // Partial search
  for (const b of ALKITAB_BOOKS_CATALOG) {
    if (
      b.indonesia.toLowerCase().includes(q) ||
      b.batak.toLowerCase().includes(q) ||
      q.includes(b.indonesia.toLowerCase()) ||
      q.includes(b.batak.toLowerCase())
    ) {
      return b;
    }
  }

  return null;
}

/**
 * Fetch a single chapter in specified version ('tb' or 'toba') directly from official HKBP CDN
 */
export async function fetchAlkitabChapter(
  bookName: string,
  chapter: number,
  version: 'tb' | 'toba' = 'tb'
): Promise<AlkitabVerseItem[]> {
  const cacheKey = `${version}:${bookName}:${chapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  try {
    const formattedBookName = bookName.replace(/\s+/g, '');
    const url = `${CDN_BASE}/${version}/book/${formattedBookName}/${chapter}.json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const verses: AlkitabVerseItem[] = [];

    const rawList: any[] = Array.isArray(json.verses) ? json.verses : Array.isArray(json) ? json : [];
    let pendingTitle: string | undefined = undefined;
    let autoVerseCounter = 1;

    for (const item of rawList) {
      if (!item) continue;

      const typeStr = String(item.type || '').toLowerCase();
      const isTitle = typeStr === 'title' || typeStr === 'header' || typeStr === 'pericope' || typeStr === 'heading';
      const text = String(item.text || item.content || '').trim();

      if (isTitle) {
        if (text) {
          pendingTitle = pendingTitle ? `${pendingTitle} / ${text}` : text;
        }
        continue;
      }

      // Check explicit verse number
      let verseNum = Number(item.verse || item.no || 0);
      if (verseNum <= 0) {
        verseNum = autoVerseCounter;
      }

      if (text) {
        verses.push({
          verse: verseNum,
          text,
          type: item.type || 'content',
          title: item.title || pendingTitle
        });
        pendingTitle = undefined;
        autoVerseCounter = verseNum + 1;
      }
    }

    if (verses.length > 0) {
      chapterCache.set(cacheKey, verses);
    }

    return verses;
  } catch (err) {
    console.error(`Failed to fetch Alkitab ${version} ${bookName} ${chapter}:`, err);
    return [];
  }
}

/**
 * Fetch a chapter in both Indonesian (tb) and Batak Toba (toba) in parallel
 */
export async function fetchDualAlkitabChapter(
  bookInfo: AlkitabBookInfo,
  chapter: number
): Promise<DualAlkitabVerse[]> {
  try {
    const [tbVerses, tobaVerses] = await Promise.all([
      fetchAlkitabChapter(bookInfo.indonesia, chapter, 'tb'),
      fetchAlkitabChapter(bookInfo.indonesia, chapter, 'toba')
    ]);

    const maxVerse = Math.max(
      ...tbVerses.map(v => v.verse),
      ...tobaVerses.map(v => v.verse),
      0
    );

    const dualList: DualAlkitabVerse[] = [];
    for (let i = 1; i <= maxVerse; i++) {
      const tbItem = tbVerses.find(v => v.verse === i);
      const tobaItem = tobaVerses.find(v => v.verse === i);

      if (tbItem || tobaItem) {
        dualList.push({
          verse: i,
          textIndo: tbItem?.text || '(Teks tidak tersedia)',
          textBatak: tobaItem?.text || '(Teks ndang tarpatupa)',
          titleIndo: tbItem?.title,
          titleBatak: tobaItem?.title
        });
      }
    }

    return dualList;
  } catch (err) {
    console.error('Error fetching dual Alkitab chapter:', err);
    return [];
  }
}

/**
 * Parse input string e.g. "Johanes 3 : 16", "Mateus 5 : 13 - 16", "1 Musa 1 : 1-3", "Epistel: Yohanes 3:16"
 */
export function parseAlkitabReference(query: string): {
  book?: AlkitabBookInfo;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
} | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.replace(/^(?:\d+[\.\s]*)?(?:Epistel|Khotbah|Jamita|Tangiang|Votum|Ayat|Nats)?[\:\s]*/i, '').trim();

  const regex = /^(.*?)\s*(\d+)(?:\s*[\:\.]\s*(\d+)(?:\s*[\-\+]\s*(\d+))?)?$/i;
  const match = clean.match(regex);
  if (!match) return null;

  const rawBookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

  const book = findBookByName(rawBookName);
  if (!book || isNaN(chapter) || chapter <= 0) return null;

  return {
    book,
    chapter,
    startVerse,
    endVerse
  };
}

/**
 * Auto-detects and fetches scripture text (Indonesia or Batak Toba)
 * from any string label (e.g. "05. Epistel: Yohanes 3:16" or "1 Musa 1:1-3")
 */
export async function fetchAndFormatScriptureFromLabel(
  label: string,
  langMode: 'indo' | 'batak' = 'indo'
): Promise<{
  found: boolean;
  referenceLabel: string;
  formattedText: string;
  bookNameIndo?: string;
  bookNameBatak?: string;
  chapter?: number;
  startVerse?: number;
  endVerse?: number;
}> {
  if (!label || typeof label !== 'string') {
    return { found: false, referenceLabel: '', formattedText: '' };
  }

  const parsed = parseAlkitabReference(label);
  if (!parsed || !parsed.book) {
    return { found: false, referenceLabel: '', formattedText: '' };
  }

  try {
    const verses = await fetchDualAlkitabChapter(parsed.book, parsed.chapter);
    if (verses.length === 0) {
      return { found: false, referenceLabel: '', formattedText: '' };
    }

    let filtered = verses;
    if (parsed.startVerse && parsed.startVerse > 0) {
      const endV = parsed.endVerse || parsed.startVerse;
      filtered = verses.filter(v => v.verse >= parsed.startVerse! && v.verse <= endV);
    }

    if (filtered.length === 0) {
      return { found: false, referenceLabel: '', formattedText: '' };
    }

    const verseRangeText = parsed.startVerse
      ? `${parsed.startVerse}${parsed.endVerse && parsed.endVerse > parsed.startVerse ? '-' + parsed.endVerse : ''}`
      : `1-${filtered.length}`;

    let referenceLabel = `${parsed.book.indonesia} ${parsed.chapter}:${verseRangeText}`;
    if (langMode === 'batak') {
      referenceLabel = `${parsed.book.batak} ${parsed.chapter}:${verseRangeText}`;
    }

    // Format text based on language mode
    const indoLines = filtered.map(v => `${v.verse}. ${v.textIndo}`).join('\n');
    const batakLines = filtered.map(v => `${v.verse}. ${v.textBatak}`).join('\n');

    let formattedText = langMode === 'batak' ? batakLines : indoLines;

    return {
      found: true,
      referenceLabel,
      formattedText,
      bookNameIndo: parsed.book.indonesia,
      bookNameBatak: parsed.book.batak,
      chapter: parsed.chapter,
      startVerse: parsed.startVerse,
      endVerse: parsed.endVerse
    };
  } catch (err) {
    console.error('Failed to auto-fetch scripture from label:', err);
    return { found: false, referenceLabel: '', formattedText: '' };
  }
}
