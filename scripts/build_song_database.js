import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchSongData(apiPath, category, nomor) {
  try {
    const res = await fetch(`https://api.hkbp.or.id/api/v1/${apiPath}/songs/${nomor}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.lirik || !Array.isArray(data.lirik)) return null;

    let refrain = null;
    const verseItems = [];

    data.lirik.forEach((item) => {
      const type = (item.type || '').toLowerCase();
      const lines = (item.lines || []).map(l => String(l).trim()).filter(Boolean);
      if (lines.length === 0) return;

      if (type === 'reff' || type === 'refrain' || type === 'chorus') {
        const text = lines.join('\n');
        if (!refrain && text) {
          refrain = text;
        }
      } else {
        verseItems.push(lines.join('\n'));
      }
    });

    const ayatList = verseItems.map((text, idx) => ({
      ayat: idx + 1,
      teks: text
    }));

    if (ayatList.length === 0 && !refrain) return null;

    const prefix = category.toUpperCase();
    let cleanJudul = (data.judul || '').replace(/^(?:BE|BN|KJ)\s*\d+\s*/i, '').trim();

    return {
      id: `${prefix}-${nomor}`,
      kategori: prefix,
      nomor,
      judul: cleanJudul || `${prefix} No. ${nomor}`,
      refrain: refrain ? `Reff:\n${refrain}` : null,
      tonalitas: data.tonalitas || null,
      pengarang: data.pengarang || null,
      lirikOleh: data.lirikOleh || null,
      notasiUrl: data.notasiUrl || null,
      midiUrl: data.midiUrl || null,
      ayatList
    };
  } catch (err) {
    return null;
  }
}

async function fetchCategoryBatch(apiPath, category, totalCount) {
  console.log(`Starting download for ${category} (1..${totalCount})...`);
  const songs = [];
  const concurrency = 25;

  for (let i = 1; i <= totalCount; i += concurrency) {
    const promises = [];
    for (let j = i; j < i + concurrency && j <= totalCount; j++) {
      promises.push(fetchSongData(apiPath, category, j));
    }
    const batchResults = await Promise.all(promises);
    batchResults.forEach(song => {
      if (song) songs.push(song);
    });
    if (i % 100 === 1 || i + concurrency > totalCount) {
      console.log(`[${category}] Progress: ${Math.min(i + concurrency - 1, totalCount)} / ${totalCount} (Downloaded: ${songs.length})`);
    }
  }

  songs.sort((a, b) => a.nomor - b.nomor);
  return songs;
}

async function run() {
  const beSongs = await fetchCategoryBatch('buku-ende', 'BE', 867);
  console.log(`Finished BE. Total: ${beSongs.length}, Songs with Reff: ${beSongs.filter(s => s.refrain).length}`);
  fs.writeFileSync(
    path.join(__dirname, '../src/data/official_buku_ende.json'),
    JSON.stringify(beSongs, null, 2)
  );

  const bnSongs = await fetchCategoryBatch('buku-nyanyian', 'BN', 865);
  console.log(`Finished BN. Total: ${bnSongs.length}, Songs with Reff: ${bnSongs.filter(s => s.refrain).length}`);
  fs.writeFileSync(
    path.join(__dirname, '../src/data/official_buku_nyanyian.json'),
    JSON.stringify(bnSongs, null, 2)
  );

  const kjSongs = await fetchCategoryBatch('kidung-jemaat', 'KJ', 478);
  console.log(`Finished KJ. Total: ${kjSongs.length}, Songs with Reff: ${kjSongs.filter(s => s.refrain).length}`);
  fs.writeFileSync(
    path.join(__dirname, '../src/data/official_kidung_jemaat.json'),
    JSON.stringify(kjSongs, null, 2)
  );

  console.log('ALL SONG DATABASES SUCCESSFULLY UPDATED!');
}

run();
