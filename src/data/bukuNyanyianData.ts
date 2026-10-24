// Database Lagu Buku Ende, Buku Nyanyian & Kidung Jemaat HKBP Resmi
// Sumber Data Tunggal & Asli: Portal Resmi HKBP (https://hkbp.or.id/buku-ende, https://hkbp.or.id/buku-nyanyian, https://hkbp.or.id/kidung)
// API Resmi: https://api.hkbp.or.id/api/v1/

import officialSongsJson from './official_buku_ende.json';
import bukuEndeCatalogJson from './bukuEndeCatalog.json';
import officialNyanyianJson from './official_buku_nyanyian.json';
import bukuNyanyianCatalogJson from './bukuNyanyianCatalog.json';
import officialKidungJson from './official_kidung_jemaat.json';
import kidungJemaatCatalogJson from './kidungJemaatCatalog.json';

export interface BukuSongVerse {
  ayat: number;
  teks: string;
}

export interface BukuSong {
  id: string; // e.g. "BE-10", "BN-1", "KJ-1"
  kategori: 'BE' | 'BN' | 'KJ' | string;
  nomor: number;
  judul: string;
  ayatList: BukuSongVerse[];
  refrain?: string | null;
  tonalitas?: string | null;
  pengarang?: string | null;
  lirikOleh?: string | null;
  notasiUrl?: string | null;
  midiUrl?: string | null;
}

export interface BukuEndeCatalogItem {
  nomorLagu: string;
  judul: string;
  notasiUrl?: string;
  updatedAt?: string;
}

export interface BukuNyanyianCatalogItem {
  nomorLagu: string;
  judul: string;
  tonalitas?: string;
  nomorBukuLagu?: string;
  notasiUrl?: string;
  updatedAt?: string;
}

export interface KidungJemaatCatalogItem {
  nomorLagu: string;
  judul: string;
  tonalitas?: string;
  notasiUrl?: string;
  updatedAt?: string;
}

// Katalog lengkap 867 lagu Buku Ende dari https://hkbp.or.id/buku-ende
export const BUKU_ENDE_CATALOG: BukuEndeCatalogItem[] = (bukuEndeCatalogJson as any[]) || [];

// Katalog lengkap 865 lagu Buku Nyanyian dari https://hkbp.or.id/buku-nyanyian
export const BUKU_NYANYIAN_CATALOG: BukuNyanyianCatalogItem[] = (bukuNyanyianCatalogJson as any[]) || [];

// Katalog lengkap 478 lagu Kidung Jemaat dari https://hkbp.or.id/kidung
export const KIDUNG_JEMAAT_CATALOG: KidungJemaatCatalogItem[] = (kidungJemaatCatalogJson as any[]) || [];

// Database lagu awal resmi terverifikasi langsung dari https://hkbp.or.id
export const INITIAL_BUKU_NYANYIAN_DB: BukuSong[] = [
  ...((officialSongsJson as BukuSong[]) || []),
  ...((officialNyanyianJson as BukuSong[]) || []),
  ...((officialKidungJson as BukuSong[]) || [])
];

/**
 * Mengambil lagu langsung dari portal resmi HKBP:
 * - Buku Ende: https://hkbp.or.id/buku-ende
 * - Buku Nyanyian: https://hkbp.or.id/buku-nyanyian
 * - Kidung Jemaat: https://hkbp.or.id/kidung
 * Teks lirik dipertahankan 100% otentik tanpa modifikasi apapun.
 */
export async function fetchOfficialSongFromHkbp(nomor: number, kategori: 'BE' | 'BN' | 'KJ' | string = 'BE'): Promise<BukuSong | null> {
  const katUpper = kategori.toUpperCase();
  const isBN = katUpper === 'BN';
  const isKJ = katUpper === 'KJ';

  const maxNomor = isBN ? 865 : isKJ ? 478 : 867;
  if (isNaN(nomor) || nomor <= 0 || nomor > maxNomor) return null;

  const apiPath = isBN ? 'buku-nyanyian' : isKJ ? 'kidung-jemaat' : 'buku-ende';
  const serverPath = isBN ? '/api/bn/song' : isKJ ? '/api/kj/song' : '/api/be/song';
  const prefix = isBN ? 'BN' : isKJ ? 'KJ' : 'BE';

  // 1. Cek endpoint server lokal terlebih dahulu
  try {
    const res = await fetch(`${serverPath}/${nomor}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.song && Array.isArray(data.song.ayatList) && data.song.ayatList.length > 0) {
        return data.song;
      }
    }
  } catch {
    // lanjut ke fallback
  }

  // 2. Fallback langsung ke API Resmi HKBP
  try {
    const directRes = await fetch(`https://api.hkbp.or.id/api/v1/${apiPath}/songs/${nomor}`);
    if (directRes.ok) {
      const data = await directRes.json();
      if (data && data.lirik && Array.isArray(data.lirik)) {
        let refrainText: string | null = null;
        const verseItems: string[] = [];

        data.lirik.forEach((item: any) => {
          const type = (item.type || '').toLowerCase();
          const lines = (item.lines || []).map((l: any) => String(l).trim()).filter(Boolean);
          if (lines.length === 0) return;

          if (type === 'reff' || type === 'refrain' || type === 'chorus') {
            const text = lines.join('\n').trim();
            if (!refrainText && text) {
              refrainText = text;
            }
          } else {
            verseItems.push(lines.join('\n').trim());
          }
        });

        const ayatList = verseItems.map((teks: string, idx: number) => ({
          ayat: idx + 1,
          teks
        }));

        if (ayatList.length > 0 || refrainText) {
          let cleanJudul = (data.judul || '').replace(/^(?:BE|BN|KJ)\s*\d+\s*/i, '').trim();
          if (!cleanJudul) {
            cleanJudul = `${prefix === 'BN' ? 'Buku Nyanyian' : prefix === 'KJ' ? 'Kidung Jemaat' : 'Buku Ende'} No. ${nomor}`;
          }

          return {
            id: `${prefix}-${data.nomorLagu || nomor}`,
            kategori: prefix,
            nomor: parseInt(String(data.nomorLagu || nomor), 10),
            judul: cleanJudul,
            refrain: refrainText ? `Reff:\n${refrainText}` : null,
            tonalitas: data.tonalitas || null,
            pengarang: data.pengarang || null,
            lirikOleh: data.lirikOleh || null,
            notasiUrl: data.notasiUrl || null,
            midiUrl: data.midiUrl || null,
            ayatList
          };
        }
      }
    }
  } catch (err) {
    console.warn(`Gagal mengambil data resmi ${prefix} ${nomor} dari hkbp.or.id:`, err);
  }

  return null;
}

// Helper to parse verse expressions: e.g. "1 - 2", "1+3", "1,2+5", "1-3+5", "1 & 3", "1, 2, 4", "1 s/d 3", "1"
export function parseVerseRange(verseStr?: string): number[] {
  if (!verseStr || !verseStr.trim()) return [];
  const str = verseStr.toLowerCase().replace(/s\/d/g, '-').replace(/sampai/g, '-').replace(/dan/g, '&');
  const result = new Set<number>();

  // Split by commas, plus signs, and ampersands
  const parts = str.split(/[,+&]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check for range: e.g. "1-3" or "1 - 2"
    if (trimmed.includes('-')) {
      const rangeParts = trimmed.split('-');
      if (rangeParts.length >= 2) {
        const start = parseInt(rangeParts[0].trim(), 10);
        const end = parseInt(rangeParts[1].trim(), 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          for (let i = min; i <= max; i++) {
            result.add(i);
          }
          continue;
        }
      }
    }

    // Single number
    const num = parseInt(trimmed.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      result.add(num);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

export interface ParsedSongQuery {
  matched: boolean;
  kategori: 'BE' | 'BN' | 'KJ' | string;
  nomor: number;
  ayatNumbers: number[];
  verseString?: string;
  prefix?: string;
}

/**
 * Intelligent parser that extracts song book, song number, and verse numbers from title/label.
 * Handles inputs like:
 * - "01. Bernyanyi BE No. 10 : 1 - 2"
 * - "Marende BE 10 : 1-2"
 * - "BE 10 : 1-2"
 * - "BE No. 175: 1 & 3"
 * - "BN 705 : 1"
 * - "KJ 3: 1-2"
 * - "BE. 10 ayat 1, 2"
 * - "10 : 1-2" / "No. 10 : 1-2" (defaults to BE)
 */
export function parseSongFromLabel(label: string): ParsedSongQuery | null {
  if (!label || typeof label !== 'string') return null;

  const regex = /^(.*?)(?:[\s(\[\{]|^)(BE|BN|KJ|Buku\s*Ende|Buku\s*Nyanyian|Kidung\s*Jemaat)[.\s]*(?:No\.?|Nomor)?\s*(\d+)(?:[\s:]*(?:ayat|ay\.?|v\.?|:)?\s*([0-9\s,\-\+&/sd]+))?/i;

  const match = label.match(regex);
  if (!match) {
    // Try compact format like "BE10:1-2"
    const compactRegex = /^(.*?)(BE|BN|KJ)(\d+)(?:[\s:]*([0-9\s,\-\+&/sd]+))?/i;
    const compactMatch = label.match(compactRegex);
    if (compactMatch) {
      let kat: 'BE' | 'BN' | 'KJ' = 'BE';
      const rawKat = compactMatch[2].toUpperCase();
      if (rawKat === 'BN') kat = 'BN';
      else if (rawKat === 'KJ') kat = 'KJ';

      const nomor = parseInt(compactMatch[3], 10);
      if (!isNaN(nomor) && nomor > 0) {
        const verseStr = compactMatch[4] ? compactMatch[4].trim() : '';
        const ayatNumbers = parseVerseRange(verseStr);

        return {
          matched: true,
          kategori: kat,
          nomor,
          ayatNumbers,
          verseString: verseStr,
          prefix: compactMatch[1]?.trim() || ''
        };
      }
    }

    // Number-only pattern with verses: e.g. "01. Marende No. 10 : 1-2", "No. 10 : 1-2", "10 : 1-2", "Marende 10 : 1-2"
    // In HKBP church worship, if book is omitted it defaults to 'BE' (Buku Ende)
    const numberOnlyRegex = /^(.*?)(?:No\.?|Nomor)?\s*(\d{1,4})(?:[\s:]*(?:ayat|ay\.?|v\.?|:)\s*([0-9\s,\-\+&/sd]+))/i;
    const numMatch = label.match(numberOnlyRegex);
    if (numMatch) {
      const nomor = parseInt(numMatch[2], 10);
      if (!isNaN(nomor) && nomor > 0) {
        const verseStr = numMatch[3] ? numMatch[3].trim() : '';
        const ayatNumbers = parseVerseRange(verseStr);
        return {
          matched: true,
          kategori: 'BE',
          nomor,
          ayatNumbers,
          verseString: verseStr,
          prefix: numMatch[1]?.trim() || ''
        };
      }
    }

    return null;
  }

  let kat: 'BE' | 'BN' | 'KJ' = 'BE';
  const rawKat = match[2].toUpperCase();
  if (rawKat.includes('BN') || rawKat.includes('NYANYIAN')) kat = 'BN';
  else if (rawKat.includes('KJ') || rawKat.includes('KIDUNG')) kat = 'KJ';

  const nomor = parseInt(match[3], 10);
  if (isNaN(nomor) || nomor <= 0) return null;

  const verseStr = match[4] ? match[4].trim() : '';
  const ayatNumbers = parseVerseRange(verseStr);

  return {
    matched: true,
    kategori: kat,
    nomor,
    ayatNumbers,
    verseString: verseStr,
    prefix: match[1]?.trim() || ''
  };
}

/**
 * Universal normalizer for imported song files
 */
export function normalizeSongImport(rawInput: any): BukuSong[] {
  let songsArray: any[] = [];
  if (Array.isArray(rawInput)) {
    songsArray = rawInput;
  } else if (rawInput && typeof rawInput === 'object') {
    if (Array.isArray(rawInput.songs)) songsArray = rawInput.songs;
    else if (Array.isArray(rawInput.data)) songsArray = rawInput.data;
    else if (Array.isArray(rawInput.lagu)) songsArray = rawInput.lagu;
    else if (Array.isArray(rawInput.buku_nyanyian)) songsArray = rawInput.buku_nyanyian;
    else songsArray = [rawInput];
  } else if (typeof rawInput === 'string') {
    try {
      const parsed = JSON.parse(rawInput);
      return normalizeSongImport(parsed);
    } catch {
      return [];
    }
  }

  const result: BukuSong[] = [];
  for (const item of songsArray) {
    if (!item || typeof item !== 'object') continue;

    let kategori: 'BE' | 'BN' | 'KJ' | string = 'BE';
    const rawKat = String(item.kategori || item.book || item.buku || item.category || '').toUpperCase();
    if (rawKat.includes('BN') || rawKat.includes('NYANYIAN')) kategori = 'BN';
    else if (rawKat.includes('KJ') || rawKat.includes('KIDUNG')) kategori = 'KJ';

    const nomorRaw = item.nomor ?? item.no ?? item.number ?? item.id;
    const nomor = typeof nomorRaw === 'number' ? nomorRaw : parseInt(String(nomorRaw).replace(/\D/g, ''), 10);
    if (isNaN(nomor) || nomor <= 0) continue;

    const judul = String(item.judul || item.title || item.name || `${kategori} No. ${nomor}`).trim();

    const ayatList: BukuSongVerse[] = [];
    if (Array.isArray(item.ayatList)) {
      item.ayatList.forEach((v: any, idx: number) => {
        if (typeof v === 'string') {
          ayatList.push({ ayat: idx + 1, teks: v.trim() });
        } else if (v && typeof v === 'object') {
          const ayatNum = Number(v.ayat || v.verse || v.no || idx + 1);
          const teks = String(v.teks || v.text || v.lirik || v.lyrics || '').trim();
          if (teks) ayatList.push({ ayat: ayatNum, teks });
        }
      });
    } else if (Array.isArray(item.verses) || Array.isArray(item.lirik) || Array.isArray(item.lyrics)) {
      const list = item.verses || item.lirik || item.lyrics;
      list.forEach((v: any, idx: number) => {
        if (typeof v === 'string') {
          ayatList.push({ ayat: idx + 1, teks: v.trim() });
        } else if (v && typeof v === 'object') {
          const ayatNum = Number(v.ayat || v.verse || v.no || idx + 1);
          const teks = String(v.teks || v.text || v.lirik || v.lyrics || '').trim();
          if (teks) ayatList.push({ ayat: ayatNum, teks });
        }
      });
    } else if (typeof item.lirik === 'string' || typeof item.teks === 'string' || typeof item.lyrics === 'string') {
      const fullText = String(item.lirik || item.teks || item.lyrics).trim();
      const verseChunks = fullText.split(/\n(?=\d+[\.\s])/);
      if (verseChunks.length > 1) {
        verseChunks.forEach((chunk: string, idx: number) => {
          const clean = chunk.replace(/^\d+[\.\s]*/, '').trim();
          if (clean) ayatList.push({ ayat: idx + 1, teks: clean });
        });
      } else {
        ayatList.push({ ayat: 1, teks: fullText });
      }
    }

    if (ayatList.length > 0) {
      result.push({
        id: `${kategori}-${nomor}`,
        kategori,
        nomor,
        judul,
        tonalitas: item.tonalitas || null,
        pengarang: item.pengarang || null,
        lirikOleh: item.lirikOleh || null,
        notasiUrl: item.notasiUrl || null,
        midiUrl: item.midiUrl || null,
        ayatList
      });
    }
  }

  return result;
}

/**
 * Searches the catalog for the song and generates the formatted lyrics
 * for the requested verses.
 */
export function findSongAndFormatLyrics(
  songs: BukuSong[],
  kategori: 'BE' | 'BN' | 'KJ' | string,
  nomor: number,
  ayatNumbers: number[] = [],
  rawVerseStr?: string
): { found: boolean; song?: BukuSong; lyrics: string; title: string; formattedLabel: string } {
  const song = songs.find(
    s => s.kategori.toUpperCase() === kategori.toUpperCase() && Number(s.nomor) === Number(nomor)
  );

  if (!song) {
    return {
      found: false,
      lyrics: '',
      title: '',
      formattedLabel: ''
    };
  }

  let versesToInclude = song.ayatList;
  if (ayatNumbers.length > 0) {
    versesToInclude = song.ayatList.filter(v => ayatNumbers.includes(v.ayat));
    if (versesToInclude.length === 0) {
      versesToInclude = song.ayatList;
    }
  }

  const formattedLyrics = versesToInclude
    .map(v => {
      const cleanTeks = v.teks.trim();
      const verseHeader = /^\d+\./.test(cleanTeks) ? cleanTeks : `${v.ayat}. ${cleanTeks}`;
      if (song.refrain) {
        return `${verseHeader}\n\n${song.refrain}`;
      }
      return verseHeader;
    })
    .join('\n\n');

  let verseDesc = '';
  if (rawVerseStr && rawVerseStr.trim()) {
    verseDesc = ` : ${rawVerseStr.trim()}`;
  } else if (ayatNumbers.length === 1) {
    verseDesc = ` : ${ayatNumbers[0]}`;
  } else if (ayatNumbers.length > 1) {
    // Group into ranges separated by + (e.g. 1 - 3, 1 + 3, or 1 - 2 + 5)
    const segments: string[] = [];
    let start = ayatNumbers[0];
    let end = ayatNumbers[0];

    for (let i = 1; i < ayatNumbers.length; i++) {
      const cur = ayatNumbers[i];
      if (cur === end + 1) {
        end = cur;
      } else {
        segments.push(start === end ? `${start}` : `${start} - ${end}`);
        start = cur;
        end = cur;
      }
    }
    segments.push(start === end ? `${start}` : `${start} - ${end}`);
    verseDesc = ` : ${segments.join(' + ')}`;
  }

  return {
    found: true,
    song,
    lyrics: formattedLyrics,
    title: song.judul,
    formattedLabel: `${kategori} No. ${song.nomor}${verseDesc} "${song.judul}"`
  };
}
