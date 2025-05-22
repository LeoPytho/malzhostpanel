import { NextResponse } from 'next/server';

export function middleware(request) {
  // Cek jika user mencoba mengakses halaman admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token');

    // Jika tidak ada token, redirect ke halaman login
    if (!adminToken || adminToken.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Konfigurasi path mana saja yang perlu dicek oleh middleware
export const config = {
  matcher: '/admin/:path*',
}; 