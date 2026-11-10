import fs from 'fs';
import path from 'path';

const MAX_CHUNK_CHARS = 700000;

function getFirebaseConfig() {
  const candidates: (string | URL)[] = [];
  try {
    candidates.push(new URL('../firebase-applet-config.json', import.meta.url));
  } catch {
    // ignore
  }
  candidates.push(path.join(process.cwd(), 'firebase-applet-config.json'));

  for (const target of candidates) {
    try {
      if (fs.existsSync(target)) {
        return JSON.parse(fs.readFileSync(target, 'utf-8'));
      }
    } catch (err) {
      console.error('Failed to read firebase-applet-config.json:', err);
    }
  }
  return null;
}

function safeParseJsonOrString(rawValue: string): any {
  try {
    if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
      return JSON.parse(rawValue);
    }
    return rawValue;
  } catch {
    return rawValue;
  }
}

function parseLegacyFields(doc: any): Record<string, any> {
  if (!doc || !doc.fields) return {};
  const data: Record<string, any> = {};
  for (const [key, valueObj] of Object.entries(doc.fields)) {
    const rawValue = (valueObj as any)?.stringValue;
    if (rawValue !== undefined && rawValue !== null) {
      data[key] = safeParseJsonOrString(rawValue);
    }
  }
  return data;
}

function getRunQueryUrl(cfg: any) {
  return `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents:runQuery?key=${cfg.apiKey}`;
}

function getDocBaseUrl(cfg: any, collectionName: string, docId: string) {
  return `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/${collectionName}/${encodeURIComponent(docId)}?key=${cfg.apiKey}`;
}

async function readAllFromFirestore(cfg: any): Promise<Record<string, any>> {
  const queryRes = await fetch(getRunQueryUrl(cfg), {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'kv_store' }],
      },
    }),
  });
  if (!queryRes.ok) {
    throw new Error(`Firestore runQuery failed with status ${queryRes.status}`);
  }
  const rows: any[] = await queryRes.json();
  const docs: any[] = Array.isArray(rows) ? rows.map((r) => r?.document).filter(Boolean) : [];
  const merged: Record<string, any> = {};

  const legacyDoc = docs.find((d) => String(d.name || '').endsWith('/all_data'));
  if (legacyDoc) {
    Object.assign(merged, parseLegacyFields(legacyDoc));
  }

  for (const d of docs) {
    const docId = String(d.name || '').split('/').pop() || '';
    if (!docId || docId === 'all_data' || docId === 'test_doc') continue;
    const fields = d.fields || {};
    const isChunked = Boolean(fields.isChunked?.booleanValue);
    const chunkCount = Number(fields.chunkCount?.integerValue || 0);
    const clientTs = Number(fields.clientTs?.integerValue || 0);

    if (isChunked && chunkCount > 0) {
      let combined = '';
      for (let i = 0; i < chunkCount; i++) {
        const cRes = await fetch(getDocBaseUrl(cfg, 'kv_store_chunks', `${docId}__chunk_${i}`), { cache: 'no-store' });
        if (cRes.ok) {
          const cJson: any = await cRes.json();
          combined += String(cJson?.fields?.chunk?.stringValue || '');
        }
      }
      merged[docId] = safeParseJsonOrString(combined);
      if (clientTs) merged[`updated_at_${docId}`] = clientTs;
    } else if (typeof fields.valueStr?.stringValue === 'string') {
      merged[docId] = safeParseJsonOrString(fields.valueStr.stringValue);
      if (clientTs) merged[`updated_at_${docId}`] = clientTs;
    }
  }

  return merged;
}

async function writeKeyToFirestore(cfg: any, key: string, value: any): Promise<boolean> {
  const timestamp = Date.now();
  let targetKey = key;
  let targetValue = value;

  if (key === 'hkbp_buku_nyanyian_db' && Array.isArray(value)) {
    targetKey = 'hkbp_custom_songs';
    targetValue = value.filter((s: any) => s && s.isCustom);
  }

  const serialized =
    typeof targetValue === 'string'
      ? targetValue
      : typeof targetValue === 'number' || typeof targetValue === 'boolean'
        ? String(targetValue)
        : JSON.stringify(targetValue);

  if (serialized.length <= MAX_CHUNK_CHARS) {
    const body = {
      fields: {
        valueStr: { stringValue: serialized },
        isChunked: { booleanValue: false },
        chunkCount: { integerValue: '0' },
        clientTs: { integerValue: String(timestamp) },
      },
    };
    const res = await fetch(getDocBaseUrl(cfg, 'kv_store', targetKey), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } else {
    const chunks: string[] = [];
    for (let i = 0; i < serialized.length; i += MAX_CHUNK_CHARS) {
      chunks.push(serialized.slice(i, i + MAX_CHUNK_CHARS));
    }
    for (let i = 0; i < chunks.length; i++) {
      const chunkBody = {
        fields: {
          key: { stringValue: targetKey },
          index: { integerValue: String(i) },
          chunk: { stringValue: chunks[i] },
          clientTs: { integerValue: String(timestamp) },
        },
      };
      const cRes = await fetch(getDocBaseUrl(cfg, 'kv_store_chunks', `${targetKey}__chunk_${i}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunkBody),
      });
      if (!cRes.ok) return false;
    }
    const metaBody = {
      fields: {
        valueStr: { stringValue: '' },
        isChunked: { booleanValue: true },
        chunkCount: { integerValue: String(chunks.length) },
        clientTs: { integerValue: String(timestamp) },
      },
    };
    const mRes = await fetch(getDocBaseUrl(cfg, 'kv_store', targetKey), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaBody),
    });
    return mRes.ok;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const cfg = getFirebaseConfig();
  if (!cfg || !cfg.projectId || !cfg.firestoreDatabaseId || !cfg.apiKey) {
    return res.status(500).json({ success: false, error: 'Firebase config not found.' });
  }

  try {
    if (req.method === 'GET') {
      const db = await readAllFromFirestore(cfg);
      return res.status(200).json(db);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { key, value, data } = body;
      if (data && typeof data === 'object') {
        const results = await Promise.all(
          Object.entries(data).map(([k, v]) => writeKeyToFirestore(cfg, k, v))
        );
        return res.status(200).json({ success: results.every(Boolean) });
      }
      if (key) {
        const ok = await writeKeyToFirestore(cfg, key, value);
        return res.status(200).json({ success: ok });
      }
      return res.status(400).json({ success: false, message: "Invalid payload. Provide 'key' & 'value' or 'data'." });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err: any) {
    console.error('Vercel /api/db error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
}
