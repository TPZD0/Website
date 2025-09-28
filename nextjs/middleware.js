import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const protectedMatchers = [
    /^\/dashboard$/,
    /^\/summarizer$/,
    /^\/goals$/,
    /^\/quiz(?:\/.*)?$/,
    /^\/settings$/,
    /^\/flashcards$/,
  ];

  const isProtected = protectedMatchers.some((re) => re.test(pathname));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get('sp_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/summarizer', '/goals', '/quiz/:path*', '/settings', '/flashcards'],
};

