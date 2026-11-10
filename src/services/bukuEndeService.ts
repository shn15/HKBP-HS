// Service to fetch Buku Ende, Buku Nyanyian & Kidung Jemaat data exclusively from official HKBP portal
// - Buku Ende: https://hkbp.or.id/buku-ende
// - Buku Nyanyian: https://hkbp.or.id/buku-nyanyian
// - Kidung Jemaat: https://hkbp.or.id/kidung

import { BukuSong, fetchOfficialSongFromHkbp } from '../data/bukuNyanyianData';

export interface BukuEndeApiResponse {
  status: boolean;
  message: string;
  data?: {
    songNumber: number;
    songTitle: string;
    songLyrics: Record<string, string>;
    ayatList: { ayat: number; teks: string }[];
    song?: BukuSong;
  };
}

/**
 * Fetch a single hymn directly from official HKBP API (BE, BN, or KJ)
 */
export async function fetchSongFromApi(nomor: number, kategori: 'BE' | 'BN' | 'KJ' | string = 'BE'): Promise<BukuSong | null> {
  return fetchOfficialSongFromHkbp(nomor, kategori);
}

/**
 * Fetch a batch range of songs from official HKBP API (BE, BN, or KJ)
 */
export async function fetchBatchFromApi(start: number, end: number, kategori: 'BE' | 'BN' | 'KJ' | string = 'BE'): Promise<BukuSong[]> {
  try {
    const katUpper = kategori.toUpperCase();
    const isBN = katUpper === 'BN';
    const isKJ = katUpper === 'KJ';
    const path = isBN ? '/api/bn/batch' : isKJ ? '/api/kj/batch' : '/api/be/batch';
    const res = await fetch(`${path}?start=${start}&end=${end}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.status && Array.isArray(json.songs)) {
        return json.songs;
      }
    }
  } catch (err) {
    console.warn(`Batch endpoint unavailable for ${kategori}, falling back to direct HKBP fetch:`, err);
  }

  // Fallback directly to official HKBP API
  const songs: BukuSong[] = [];
  for (let n = start; n <= end; n++) {
    const song = await fetchOfficialSongFromHkbp(n, kategori);
    if (song) songs.push(song);
  }
  return songs;
}
