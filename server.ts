import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
// Load environment variables
dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

// Load Firebase configuration for REST API access
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId && firebaseConfig.apiKey) {
      console.log("Firebase configuration loaded successfully for project:", firebaseConfig.projectId, "and database:", firebaseConfig.firestoreDatabaseId);
    }
  }
} catch (err) {
  console.error("Failed to load Firebase configuration:", err);
}

// Helper to get Firestore REST API URL for the single-document store
function getFirestoreUrl() {
  if (!firebaseConfig || !firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId || !firebaseConfig.apiKey) {
    return null;
  }
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/kv_store/all_data?key=${firebaseConfig.apiKey}`;
}

// Helper to parse Firestore REST API document to standard JavaScript object
function parseDocument(doc: any): any {
  if (!doc || !doc.fields) return {};
  const data: any = {};
  for (const [key, valueObj] of Object.entries(doc.fields)) {
    const rawValue = (valueObj as any).stringValue;
    if (rawValue) {
      try {
        if (rawValue.startsWith("{") || rawValue.startsWith("[")) {
          data[key] = JSON.parse(rawValue);
        } else {
          data[key] = rawValue;
        }
      } catch {
        data[key] = rawValue;
      }
    }
  }
  return data;
}

// Helper to serialize standard JavaScript object to Firestore REST API fields
function serializeFields(data: any): any {
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      // Don't send giant static song database in single kv_store document (>1MB limit)
      if (key === "hkbp_buku_nyanyian_db" && Array.isArray(value)) {
        const customOnly = value.filter((s: any) => s && s.isCustom);
        if (customOnly.length > 0) {
          fields["hkbp_custom_songs"] = { stringValue: JSON.stringify(customOnly) };
        }
        continue;
      }

      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      // Safety check: Firestore single document field max size limit
      if (stringValue.length < 800000) {
        fields[key] = { stringValue };
      } else {
        console.warn(`Skipping key '${key}' in single Firestore document payload as string length (${stringValue.length}) exceeds safety limit.`);
      }
    }
  }
  return fields;
}

// Helper to read database with Firestore integration
async function readDb() {
  const url = getFirestoreUrl();
  if (url) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        const doc = await response.json();
        const data = parseDocument(doc);
        return data;
      } else if (response.status === 404) {
        console.log("Firestore document 'all_data' not found. Seeding from db.json...");
        const localDb = readLocalDb();
        if (Object.keys(localDb).length > 0) {
          await writeDb(localDb);
          return localDb;
        }
      } else {
        const errText = await response.text();
        console.warn(`Reading from Firestore REST API: Status ${response.status}`, errText);
      }
    } catch (err) {
      console.warn("Error reading from Firestore REST API:", err);
    }
  }
  return readLocalDb();
}

function readLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  return {};
}

// Helper to write database with Firestore integration
async function writeDb(data: any) {
  writeLocalDb(data);

  const url = getFirestoreUrl();
  if (url) {
    try {
      const fields = serializeFields(data);
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });
      if (response.ok) {
        console.log("Successfully synchronized database to Firestore REST API.");
        return true;
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Firestore REST API write status ${response.status}:`, errData?.error?.message || errData);
        return false;
      }
    } catch (err) {
      console.warn("Error writing to Firestore REST API:", err);
      return false;
    }
  }
  return true;
}

// Write a single key-value pair to Firestore
async function writeDbKey(key: string, value: any) {
  const data = await readDb();
  data[key] = value;
  return await writeDb(data);
}

// Write batch keys to Firestore
async function writeDbBatch(batchData: any) {
  const data = await readDb();
  Object.assign(data, batchData);
  return await writeDb(data);
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing database file:", err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse json requests with larger limits to allow Base64 PDF uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API database endpoints for data synchronization
  app.get("/api/db", async (req, res) => {
    try {
      const db = await readDb();
      res.json(db);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/db", async (req, res) => {
    try {
      const { key, value, data } = req.body;
      let success = false;
      if (data && typeof data === "object") {
        // Batch update
        success = await writeDbBatch(data);
      } else if (key) {
        success = await writeDbKey(key, value);
      } else {
        return res.status(400).json({ success: false, message: "Invalid payload. Provide 'key' & 'value' or 'data'." });
      }
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/db/reset", async (req, res) => {
    try {
      let success = false;
      const url = getFirestoreUrl();
      if (url) {
        try {
          const response = await fetch(url, { method: "DELETE" });
          if (response.ok || response.status === 404) {
            success = true;
          } else {
            console.error(`Failed to delete Firestore document: Status ${response.status}`);
          }
        } catch (err) {
          console.error("Error deleting Firestore document:", err);
        }
      }
      const localSuccess = writeLocalDb({});
      res.json({ success: success || localSuccess });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -----------------------------------------------------------------
  // -----------------------------------------------------------------
  // OFFICIAL HKBP BUKU ENDE API INTEGRATION (https://hkbp.or.id/buku-ende)
  // -----------------------------------------------------------------
  const bukuEndeCache = new Map<number, any>();
  const OFFICIAL_SONGS_FILE = path.join(process.cwd(), 'src', 'data', 'official_buku_ende.json');

  // Pre-seed cache from disk if available
  try {
    if (fs.existsSync(OFFICIAL_SONGS_FILE)) {
      const diskSongs = JSON.parse(fs.readFileSync(OFFICIAL_SONGS_FILE, 'utf-8'));
      if (Array.isArray(diskSongs)) {
        diskSongs.forEach((s: any) => {
          if (s && s.nomor) {
            const songLyricsObj: Record<string, string> = {};
            (s.ayatList || []).forEach((a: any) => {
              songLyricsObj[`verse${a.ayat}`] = a.teks;
            });
            bukuEndeCache.set(Number(s.nomor), {
              ...s,
              songLyrics: songLyricsObj
            });
          }
        });
        console.log(`Preloaded ${bukuEndeCache.size} official HKBP songs from official_buku_ende.json`);
      }
    }
  } catch (err) {
    console.warn('Failed to load official_buku_ende.json:', err);
  }

  async function fetchBukuEndeFromSource(nomor: number) {
    if (bukuEndeCache.has(nomor)) {
      return bukuEndeCache.get(nomor);
    }

    // 1. Official HKBP API directly from https://hkbp.or.id/buku-ende
    try {
      const officialUrl = `https://api.hkbp.or.id/api/v1/buku-ende/songs/${nomor}`;
      const response = await fetch(officialUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.lirik && Array.isArray(data.lirik)) {
          const ayatList = data.lirik.map((item: any, idx: number) => ({
            ayat: idx + 1,
            teks: (item.lines || []).join('\n').trim()
          })).filter((a: any) => a.teks);

          const songLyricsObj: Record<string, string> = {};
          ayatList.forEach((a: any) => {
            songLyricsObj[`verse${a.ayat}`] = a.teks;
          });

          const song = {
            id: `BE-${data.nomorLagu || nomor}`,
            kategori: 'BE',
            nomor: parseInt(String(data.nomorLagu || nomor), 10),
            judul: data.judul || `Buku Ende No. ${nomor}`,
            tonalitas: data.tonalitas || null,
            pengarang: data.pengarang || null,
            lirikOleh: data.lirikOleh || null,
            notasiUrl: data.notasiUrl || null,
            midiUrl: data.midiUrl || null,
            ayatList,
            songLyrics: songLyricsObj
          };

          bukuEndeCache.set(nomor, song);

          // Asynchronously persist to disk
          try {
            const allSongs = Array.from(bukuEndeCache.values());
            fs.writeFileSync(OFFICIAL_SONGS_FILE, JSON.stringify(allSongs, null, 2), 'utf-8');
          } catch {
            // non-fatal
          }

          return song;
        }
      }
    } catch (err) {
      console.warn(`Official HKBP API error for BE ${nomor}:`, err);
    }

    return null;
  }

  // Endpoint to get official catalog list from https://hkbp.or.id/buku-ende
  app.get('/api/be/catalog', (req, res) => {
    try {
      const catalogPath = path.join(process.cwd(), 'src', 'data', 'bukuEndeCatalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        return res.json({ success: true, count: catalog.length, catalog });
      }
      res.json({ success: false, message: 'Catalog not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Exact endpoint compatible with evansianipar06/API-Buku-Ende (/api/be/lyrics?songNumber=10)
  app.get('/api/be/lyrics', async (req, res) => {
    try {
      const songNumber = req.query.songNumber || req.query.nomor;
      if (!songNumber) {
        return res.status(400).json({
          status: false,
          message: 'songNumber or nomor must be provided',
          data: null
        });
      }

      const num = parseInt(String(songNumber), 10);
      if (isNaN(num) || num <= 0 || num > 864) {
        return res.status(400).json({
          status: false,
          message: 'Nomor lagu Buku Ende tidak valid (1 - 864)',
          data: null
        });
      }

      const song = await fetchBukuEndeFromSource(num);
      if (!song) {
        return res.status(404).json({
          status: false,
          message: `Lagu Buku Ende Nomor ${num} tidak ditemukan.`,
          data: null
        });
      }

      res.json({
        status: true,
        message: 'Ok',
        data: {
          songNumber: song.nomor,
          songTitle: song.judul,
          songLyrics: song.songLyrics,
          ayatList: song.ayatList,
          song: {
            id: song.id,
            kategori: song.kategori,
            nomor: song.nomor,
            judul: song.judul,
            ayatList: song.ayatList
          }
        }
      });
    } catch (err: any) {
      console.error('Error in /api/be/lyrics:', err);
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil lagu dari Buku Ende API',
        error: err.message
      });
    }
  });

  // REST single song endpoint
  app.get('/api/be/song/:nomor', async (req, res) => {
    try {
      const num = parseInt(req.params.nomor, 10);
      if (isNaN(num) || num <= 0 || num > 864) {
        return res.status(400).json({ success: false, message: 'Nomor lagu Buku Ende harus antara 1 dan 864' });
      }

      const song = await fetchBukuEndeFromSource(num);
      if (!song) {
        return res.status(404).json({ success: false, message: `Lagu Nomor ${num} tidak ditemukan` });
      }

      res.json({
        success: true,
        song: {
          id: song.id,
          kategori: song.kategori,
          nomor: song.nomor,
          judul: song.judul,
          ayatList: song.ayatList
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch fetch endpoint to sync ranges, e.g. /api/be/batch?start=1&end=50
  app.get('/api/be/batch', async (req, res) => {
    try {
      const start = parseInt(String(req.query.start || '1'), 10);
      const end = parseInt(String(req.query.end || '10'), 10);

      const startNum = Math.max(1, isNaN(start) ? 1 : start);
      const endNum = Math.min(864, isNaN(end) ? 10 : end);

      const songs = [];
      for (let n = startNum; n <= endNum; n++) {
        try {
          const s = await fetchBukuEndeFromSource(n);
          if (s) {
            songs.push({
              id: s.id,
              kategori: s.kategori,
              nomor: s.nomor,
              judul: s.judul,
              ayatList: s.ayatList
            });
          }
        } catch (e) {
          console.error(`Failed to fetch BE ${n}:`, e);
        }
      }

      res.json({
        status: true,
        count: songs.length,
        songs
      });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // -----------------------------------------------------------------
  // OFFICIAL HKBP BUKU NYANYIAN (BN) API INTEGRATION (https://hkbp.or.id/buku-nyanyian)
  // -----------------------------------------------------------------
  const bukuNyanyianCache = new Map<number, any>();
  const OFFICIAL_BN_FILE = path.join(process.cwd(), 'src', 'data', 'official_buku_nyanyian.json');

  // Pre-seed BN cache from disk if available
  try {
    if (fs.existsSync(OFFICIAL_BN_FILE)) {
      const diskSongs = JSON.parse(fs.readFileSync(OFFICIAL_BN_FILE, 'utf-8'));
      if (Array.isArray(diskSongs)) {
        diskSongs.forEach((s: any) => {
          if (s && s.nomor) {
            const songLyricsObj: Record<string, string> = {};
            (s.ayatList || []).forEach((a: any) => {
              songLyricsObj[`verse${a.ayat}`] = a.teks;
            });
            bukuNyanyianCache.set(Number(s.nomor), {
              ...s,
              songLyrics: songLyricsObj
            });
          }
        });
        console.log(`Preloaded ${bukuNyanyianCache.size} official HKBP songs from official_buku_nyanyian.json`);
      }
    }
  } catch (err) {
    console.warn('Failed to load official_buku_nyanyian.json:', err);
  }

  async function fetchBukuNyanyianFromSource(nomor: number) {
    if (bukuNyanyianCache.has(nomor)) {
      return bukuNyanyianCache.get(nomor);
    }

    // 1. Official HKBP API directly from https://hkbp.or.id/buku-nyanyian
    try {
      const officialUrl = `https://api.hkbp.or.id/api/v1/buku-nyanyian/songs/${nomor}`;
      const response = await fetch(officialUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.lirik && Array.isArray(data.lirik)) {
          const ayatList = data.lirik.map((item: any, idx: number) => ({
            ayat: idx + 1,
            teks: (item.lines || []).join('\n').trim()
          })).filter((a: any) => a.teks);

          const songLyricsObj: Record<string, string> = {};
          ayatList.forEach((a: any) => {
            songLyricsObj[`verse${a.ayat}`] = a.teks;
          });

          const song = {
            id: `BN-${data.nomorLagu || nomor}`,
            kategori: 'BN',
            nomor: parseInt(String(data.nomorLagu || nomor), 10),
            judul: data.judul || `Buku Nyanyian No. ${nomor}`,
            tonalitas: data.tonalitas || null,
            pengarang: data.pengarang || null,
            lirikOleh: data.lirikOleh || null,
            notasiUrl: data.notasiUrl || null,
            midiUrl: data.midiUrl || null,
            ayatList,
            songLyrics: songLyricsObj
          };

          bukuNyanyianCache.set(nomor, song);

          // Asynchronously persist to disk
          try {
            const allSongs = Array.from(bukuNyanyianCache.values());
            fs.writeFileSync(OFFICIAL_BN_FILE, JSON.stringify(allSongs, null, 2), 'utf-8');
          } catch {
            // non-fatal
          }

          return song;
        }
      }
    } catch (err) {
      console.warn(`Official HKBP API error for BN ${nomor}:`, err);
    }

    return null;
  }

  // Endpoint to get official catalog list from https://hkbp.or.id/buku-nyanyian
  app.get('/api/bn/catalog', (req, res) => {
    try {
      const catalogPath = path.join(process.cwd(), 'src', 'data', 'bukuNyanyianCatalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        return res.json({ success: true, count: catalog.length, catalog });
      }
      res.json({ success: false, message: 'Buku Nyanyian Catalog not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint compatible with query (/api/bn/lyrics?songNumber=10)
  app.get('/api/bn/lyrics', async (req, res) => {
    try {
      const songNumber = req.query.songNumber || req.query.nomor;
      if (!songNumber) {
        return res.status(400).json({
          status: false,
          message: 'songNumber or nomor must be provided',
          data: null
        });
      }

      const num = parseInt(String(songNumber), 10);
      if (isNaN(num) || num <= 0 || num > 865) {
        return res.status(400).json({
          status: false,
          message: 'Nomor lagu Buku Nyanyian tidak valid (1 - 865)',
          data: null
        });
      }

      const song = await fetchBukuNyanyianFromSource(num);
      if (!song) {
        return res.status(404).json({
          status: false,
          message: `Lagu Buku Nyanyian Nomor ${num} tidak ditemukan.`,
          data: null
        });
      }

      res.json({
        status: true,
        message: 'Ok',
        data: {
          songNumber: song.nomor,
          songTitle: song.judul,
          songLyrics: song.songLyrics,
          ayatList: song.ayatList,
          song: {
            id: song.id,
            kategori: song.kategori,
            nomor: song.nomor,
            judul: song.judul,
            ayatList: song.ayatList
          }
        }
      });
    } catch (err: any) {
      console.error('Error in /api/bn/lyrics:', err);
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil lagu dari Buku Nyanyian API',
        error: err.message
      });
    }
  });

  // REST single song endpoint for Buku Nyanyian
  app.get('/api/bn/song/:nomor', async (req, res) => {
    try {
      const num = parseInt(req.params.nomor, 10);
      if (isNaN(num) || num <= 0 || num > 865) {
        return res.status(400).json({ success: false, message: 'Nomor lagu Buku Nyanyian harus antara 1 dan 865' });
      }

      const song = await fetchBukuNyanyianFromSource(num);
      if (!song) {
        return res.status(404).json({ success: false, message: `Lagu BN Nomor ${num} tidak ditemukan` });
      }

      res.json({
        success: true,
        song: {
          id: song.id,
          kategori: song.kategori,
          nomor: song.nomor,
          judul: song.judul,
          ayatList: song.ayatList
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch fetch endpoint for Buku Nyanyian, e.g. /api/bn/batch?start=1&end=50
  app.get('/api/bn/batch', async (req, res) => {
    try {
      const start = parseInt(String(req.query.start || '1'), 10);
      const end = parseInt(String(req.query.end || '10'), 10);

      const startNum = Math.max(1, isNaN(start) ? 1 : start);
      const endNum = Math.min(865, isNaN(end) ? 10 : end);

      const songs = [];
      for (let n = startNum; n <= endNum; n++) {
        try {
          const s = await fetchBukuNyanyianFromSource(n);
          if (s) {
            songs.push({
              id: s.id,
              kategori: s.kategori,
              nomor: s.nomor,
              judul: s.judul,
              ayatList: s.ayatList
            });
          }
        } catch (e) {
          console.error(`Failed to fetch BN ${n}:`, e);
        }
      }

      res.json({
        status: true,
        count: songs.length,
        songs
      });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // -----------------------------------------------------------------
  // OFFICIAL HKBP KIDUNG JEMAAT (KJ) API INTEGRATION (https://hkbp.or.id/kidung)
  // -----------------------------------------------------------------
  const kidungJemaatCache = new Map<number, any>();
  const OFFICIAL_KJ_FILE = path.join(process.cwd(), 'src', 'data', 'official_kidung_jemaat.json');

  // Pre-seed KJ cache from disk if available
  try {
    if (fs.existsSync(OFFICIAL_KJ_FILE)) {
      const diskSongs = JSON.parse(fs.readFileSync(OFFICIAL_KJ_FILE, 'utf-8'));
      if (Array.isArray(diskSongs)) {
        diskSongs.forEach((s: any) => {
          if (s && s.nomor) {
            const songLyricsObj: Record<string, string> = {};
            (s.ayatList || []).forEach((a: any) => {
              songLyricsObj[`verse${a.ayat}`] = a.teks;
            });
            kidungJemaatCache.set(Number(s.nomor), {
              ...s,
              songLyrics: songLyricsObj
            });
          }
        });
        console.log(`Preloaded ${kidungJemaatCache.size} official HKBP songs from official_kidung_jemaat.json`);
      }
    }
  } catch (err) {
    console.warn('Failed to load official_kidung_jemaat.json:', err);
  }

  async function fetchKidungJemaatFromSource(nomor: number) {
    if (kidungJemaatCache.has(nomor)) {
      return kidungJemaatCache.get(nomor);
    }

    // 1. Official HKBP API directly from https://hkbp.or.id/kidung
    try {
      const officialUrl = `https://api.hkbp.or.id/api/v1/kidung-jemaat/songs/${nomor}`;
      const response = await fetch(officialUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.lirik && Array.isArray(data.lirik)) {
          const ayatList = data.lirik.map((item: any, idx: number) => ({
            ayat: idx + 1,
            teks: (item.lines || []).join('\n').trim()
          })).filter((a: any) => a.teks);

          const songLyricsObj: Record<string, string> = {};
          ayatList.forEach((a: any) => {
            songLyricsObj[`verse${a.ayat}`] = a.teks;
          });

          let cleanJudul = (data.judul || '').replace(/^KJ\s*\d+\s*/i, '').trim();
          if (!cleanJudul) cleanJudul = `Kidung Jemaat No. ${nomor}`;

          const song = {
            id: `KJ-${data.nomorLagu || nomor}`,
            kategori: 'KJ',
            nomor: parseInt(String(data.nomorLagu || nomor), 10),
            judul: cleanJudul,
            tonalitas: data.tonalitas || null,
            pengarang: data.pengarang || null,
            lirikOleh: data.lirikOleh || null,
            notasiUrl: data.notasiUrl || null,
            midiUrl: data.midiUrl || null,
            ayatList,
            songLyrics: songLyricsObj
          };

          kidungJemaatCache.set(nomor, song);

          // Asynchronously persist to disk
          try {
            const allSongs = Array.from(kidungJemaatCache.values());
            fs.writeFileSync(OFFICIAL_KJ_FILE, JSON.stringify(allSongs, null, 2), 'utf-8');
          } catch {
            // non-fatal
          }

          return song;
        }
      }
    } catch (err) {
      console.warn(`Official HKBP API error for KJ ${nomor}:`, err);
    }

    return null;
  }

  // Endpoint to get official catalog list from https://hkbp.or.id/kidung
  app.get('/api/kj/catalog', (req, res) => {
    try {
      const catalogPath = path.join(process.cwd(), 'src', 'data', 'kidungJemaatCatalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        return res.json({ success: true, count: catalog.length, catalog });
      }
      res.json({ success: false, message: 'Kidung Jemaat Catalog not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint compatible with query (/api/kj/lyrics?songNumber=10)
  app.get('/api/kj/lyrics', async (req, res) => {
    try {
      const songNumber = req.query.songNumber || req.query.nomor;
      if (!songNumber) {
        return res.status(400).json({
          status: false,
          message: 'songNumber or nomor must be provided',
          data: null
        });
      }

      const num = parseInt(String(songNumber), 10);
      if (isNaN(num) || num <= 0 || num > 478) {
        return res.status(400).json({
          status: false,
          message: 'Nomor lagu Kidung Jemaat tidak valid (1 - 478)',
          data: null
        });
      }

      const song = await fetchKidungJemaatFromSource(num);
      if (!song) {
        return res.status(404).json({
          status: false,
          message: `Lagu Kidung Jemaat Nomor ${num} tidak ditemukan.`,
          data: null
        });
      }

      res.json({
        status: true,
        message: 'Ok',
        data: {
          songNumber: song.nomor,
          songTitle: song.judul,
          songLyrics: song.songLyrics,
          ayatList: song.ayatList,
          song: {
            id: song.id,
            kategori: song.kategori,
            nomor: song.nomor,
            judul: song.judul,
            ayatList: song.ayatList
          }
        }
      });
    } catch (err: any) {
      console.error('Error in /api/kj/lyrics:', err);
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil lagu dari Kidung Jemaat API',
        error: err.message
      });
    }
  });

  // REST single song endpoint for Kidung Jemaat
  app.get('/api/kj/song/:nomor', async (req, res) => {
    try {
      const num = parseInt(req.params.nomor, 10);
      if (isNaN(num) || num <= 0 || num > 478) {
        return res.status(400).json({ success: false, message: 'Nomor lagu Kidung Jemaat harus antara 1 dan 478' });
      }

      const song = await fetchKidungJemaatFromSource(num);
      if (!song) {
        return res.status(404).json({ success: false, message: `Lagu KJ Nomor ${num} tidak ditemukan` });
      }

      res.json({
        success: true,
        song: {
          id: song.id,
          kategori: song.kategori,
          nomor: song.nomor,
          judul: song.judul,
          ayatList: song.ayatList
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch fetch endpoint for Kidung Jemaat, e.g. /api/kj/batch?start=1&end=50
  app.get('/api/kj/batch', async (req, res) => {
    try {
      const start = parseInt(String(req.query.start || '1'), 10);
      const end = parseInt(String(req.query.end || '10'), 10);

      const startNum = Math.max(1, isNaN(start) ? 1 : start);
      const endNum = Math.min(478, isNaN(end) ? 10 : end);

      const songs = [];
      for (let n = startNum; n <= endNum; n++) {
        try {
          const s = await fetchKidungJemaatFromSource(n);
          if (s) {
            songs.push({
              id: s.id,
              kategori: s.kategori,
              nomor: s.nomor,
              judul: s.judul,
              ayatList: s.ayatList
            });
          }
        } catch (e) {
          console.error(`Failed to fetch KJ ${n}:`, e);
        }
      }

      res.json({
        status: true,
        count: songs.length,
        songs
      });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // API endpoint: Send OTP validation email
  app.post("/api/send-otp", async (req, res) => {
    const { email, code, username } = req.body;

    if (!email || !code || !username) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, code, and username are required." 
      });
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER || "hkbphinalangsilalahi@gmail.com";
    const smtpPass = process.env.SMTP_PASS;

    // Check if SMTP is configured
    if (!smtpUser || !smtpPass) {
      console.warn("SMTP credentials are not configured in environment variables. Falling back to simulation mode.");
      return res.json({
        success: false,
        reason: "SMTP_NOT_CONFIGURED",
        message: "SMTP belum dikonfigurasi lengkap di Environment Variables (Secrets). Masukkan SMTP_USER dan SMTP_PASS di panel Settings.",
        code: code
      });
    }

    try {
      // Create reusable transporter object using SMTP transport
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false // Avoid self-signed certificate failures
        }
      });

      // Send mail with defined transport object
      const mailOptions = {
        from: `"Sistem Pelayanan Digital HKBP" <${smtpUser}>`,
        to: email,
        subject: `[HKBP] Kode Validator Aktivasi Akun - ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #1d4ed8; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">SISTEM PELAYANAN DIGITAL HKBP</h2>
              <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">HKBP Hinalang Silalahi</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
            
            <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 12px;">Shalom, Pelayan/Jemaat <strong>${username}</strong>.</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
              Anda menerima pesan ini karena pihak Admin Gereja sedang mendaftarkan atau menyunting kredensial akun Anda di portal database administrasi gereja.
            </p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="font-size: 12px; font-weight: bold; color: #64748b; margin: 0 0 10px 0; uppercase; letter-spacing: 1px;">KODE VALIDATOR AKTIF (6 DIGIT)</p>
              <div style="display: inline-block; background-color: #ffffff; border: 2px solid #cbd5e1; border-radius: 12px; padding: 10px 24px; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                ${code}
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0 0; line-height: 1.4;">
                Gunakan kode di atas untuk memvalidasi bahwa email Anda aktif dan berwenang digunakan dalam sistem.
              </p>
            </div>
            
            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-top: 20px;">
              Mohon beritahukan kode 6 digit di atas kepada Admin Gereja yang sedang melayani pendaftaran Anda.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 30px; margin-bottom: 15px;" />
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center; margin: 0;">
              Ini adalah email otomatis dari Sistem Informasi HKBP Hinalang Silalahi.<br />
              Harap jangan membalas email ini secara langsung. Jika Anda tidak merasa mendaftarkan akun, silakan hubungi parhalado gereja setempat.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Successfully sent verification email with OTP ${code} to ${email}`);
      return res.json({ success: true, message: "Email sent successfully." });
    } catch (err: any) {
      console.error("Failed to send email via SMTP:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send email via SMTP server.", 
        error: err.message,
        // fallback so developer can still check it if email config is wrong/rejected
        fallbackCode: code
      });
    }
  });

  // Vite dev server middleware integration in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving enabled.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
