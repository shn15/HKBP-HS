import nodemailer from 'nodemailer';
import dns from 'dns';

function parseBody(body: any): any {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  const { email, code, username } = parseBody(req.body);

  if (!email || !code || !username) {
    return res.status(400).json({
      success: false,
      message: 'Email, code, and username are required.',
    });
  }

  const emailStr = String(email).trim().toLowerCase();

  // 1. Validasi format penulisan email
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(emailStr) || emailStr.includes('..')) {
    return res.status(400).json({
      success: false,
      reason: 'INVALID_EMAIL_FORMAT',
      message: 'Format penulisan email tidak valid. Pengiriman kode dibatalkan.',
    });
  }

  const domain = emailStr.split('@')[1];
  if (!domain || !domain.includes('.')) {
    return res.status(400).json({
      success: false,
      reason: 'INVALID_DOMAIN',
      message: 'Domain email tidak valid. Pengiriman kode dibatalkan.',
    });
  }

  // 2. Deteksi apakah email / domain tersebut aktif (DNS MX Record lookup)
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return res.status(400).json({
        success: false,
        reason: 'EMAIL_INACTIVE',
        message: `Email tidak aktif atau domain @${domain} tidak memiliki server email aktif. Pengiriman kode dibatalkan.`,
      });
    }

    const validMx = mxRecords.filter((r) => r.exchange && r.exchange !== '.' && r.exchange !== '');
    if (validMx.length === 0) {
      return res.status(400).json({
        success: false,
        reason: 'EMAIL_INACTIVE',
        message: `Email tidak aktif (domain @${domain} tidak menerima email). Pengiriman kode dibatalkan.`,
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      reason: 'EMAIL_NOT_FOUND',
      message: `Email tidak aktif atau domain @${domain} tidak ditemukan. Pengiriman kode dibatalkan.`,
    });
  }

  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.trim().replace(/\s+/g, '');

  let senderUser = 'pirmasiahaan1234@gmail.com';
  if (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) {
    senderUser = process.env.SMTP_USER.trim();
  }

  if (!cleanPass) {
    return res.status(200).json({
      success: false,
      reason: 'SMTP_NOT_CONFIGURED',
      message:
        'SMTP_PASS belum dikonfigurasi di Environment Variables server (Vercel Settings -> Environment Variables). Tambahkan SMTP_USER dan SMTP_PASS (Google App Password) lalu redeploy.',
      sender: senderUser,
    });
  }

  try {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = Number(process.env.SMTP_PORT || 587);

    const createTransporterForUser = (user: string) => {
      if (smtpHost && smtpHost !== 'smtp.gmail.com') {
        return nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user, pass: cleanPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          tls: { rejectUnauthorized: false },
        });
      }
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass: cleanPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false },
      });
    };

    let activeSender = senderUser;
    let transporter = createTransporterForUser(activeSender);

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      if (activeSender !== 'pirmasiahaan1234@gmail.com') {
        activeSender = 'pirmasiahaan1234@gmail.com';
        transporter = createTransporterForUser(activeSender);
        await transporter.verify();
      } else {
        throw verifyErr;
      }
    }

    const mailOptions = {
      from: `"Sistem Pelayanan Digital HKBP" <${activeSender}>`,
      to: emailStr,
      subject: `[HKBP] Kode Autentikasi Verifikasi Akun - ${code}`,
      text: `Syalom, user admin '${username}'\nKode dibawah merupakan kode autentikasi untuk verifikasi akun anda pada portal HKBP Hinalang Silalahi\n\nKode: ${code}\n\nSilahkan memasukkan kode di atas pada kolom yang tersedia di portal verifikasi\n\nHKBP Hinalang Silalahi`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">SISTEM PELAYANAN DIGITAL HKBP</h2>
            <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">HKBP Hinalang Silalahi</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
          
          <p style="font-size: 15px; color: #1e293b; line-height: 1.6; margin-bottom: 8px; font-weight: bold;">
            Syalom, user admin '${username}'
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 22px;">
            Kode dibawah merupakan kode autentikasi untuk verifikasi akun anda pada portal HKBP Hinalang Silalahi
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="font-size: 12px; font-weight: bold; color: #64748b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">KODE AUTENTIKASI (6 DIGIT)</p>
            <div style="display: inline-block; background-color: #ffffff; border: 2px solid #cbd5e1; border-radius: 12px; padding: 10px 24px; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              ${code}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin-top: 22px; font-weight: 600; text-align: center;">
            Silahkan memasukkan kode di atas pada kolom yang tersedia di portal verifikasi
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
    return res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (err: any) {
    console.error('Vercel /api/send-otp SMTP error:', err);
    const errMsg = String(err?.message || '');
    const friendlyMsg =
      errMsg.includes('535') || errMsg.toLowerCase().includes('username and password not accepted')
        ? 'Autentikasi SMTP Gmail ditolak (535). Pastikan SMTP_USER dan SMTP_PASS (Google App Password 16 digit) di Vercel Environment Variables sudah benar.'
        : `Gagal mengirim email melalui server SMTP (${errMsg || 'Error tidak diketahui'}).`;
    return res.status(500).json({
      success: false,
      message: friendlyMsg,
      error: errMsg,
    });
  }
}
