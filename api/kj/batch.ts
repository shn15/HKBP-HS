export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const start = parseInt(String(req.query?.start || '1'), 10);
    const end = parseInt(String(req.query?.end || '10'), 10);
    const startNum = Math.max(1, isNaN(start) ? 1 : start);
    const endNum = Math.min(478, isNaN(end) ? 10 : end);

    const songs: any[] = [];
    for (let n = startNum; n <= endNum; n++) {
      try {
        const r = await fetch(`https://api.hkbp.or.id/api/v1/kidung-jemaat/songs/${n}`);
        if (r.ok) {
          const data: any = await r.json();
          if (data && Array.isArray(data.lirik)) {
            const ayatList = data.lirik
              .map((item: any, idx: number) => ({
                ayat: idx + 1,
                teks: (item.lines || []).join('\n').trim(),
              }))
              .filter((a: any) => a.teks);
            let cleanJudul = (data.judul || '').replace(/^KJ\s*\d+\s*/i, '').trim();
            if (!cleanJudul) cleanJudul = `Kidung Jemaat No. ${n}`;
            songs.push({
              id: `KJ-${data.nomorLagu || n}`,
              kategori: 'KJ',
              nomor: parseInt(String(data.nomorLagu || n), 10),
              judul: cleanJudul,
              ayatList,
            });
          }
        }
      } catch {
        // skip individual failures
      }
    }

    return res.status(200).json({ status: true, count: songs.length, songs });
  } catch (err: any) {
    return res.status(500).json({ status: false, error: err?.message || 'Error fetching KJ batch' });
  }
}
