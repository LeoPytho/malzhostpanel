import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Hapus cookie admin_token
  res.setHeader('Set-Cookie', serialize('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0), // Expire cookie
    path: '/',
  }));

  return res.status(200).json({ message: 'Logout berhasil' });
} 