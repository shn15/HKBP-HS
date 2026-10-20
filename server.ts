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
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      fields[key] = { stringValue };
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
        console.error(`Error reading from Firestore REST API: Status ${response.status}`, errText);
      }
    } catch (err) {
      console.error("Error reading from Firestore REST API:", err);
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
        console.error(`Error writing to Firestore REST API: Status ${response.status}`, errData);
        return false;
      }
    } catch (err) {
      console.error("Error writing to Firestore REST API:", err);
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
