import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Ganti dengan kredensial yang Anda inginkan
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Set cookie untuk menandai user sudah login
    res.setHeader('Set-Cookie', serialize('admin_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 jam
      path: '/',
    }));

    return res.status(200).json({ message: 'Login berhasil' });
  }

  return res.status(401).json({ message: 'Username atau password salah' });
} 