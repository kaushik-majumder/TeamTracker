import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_ROUTES = ['/login', '/setup-password']

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.includes(path)

  const cookie = request.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (session?.userId && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  // Only admins can access admin subroutes
  if (path.startsWith('/dashboard/admin') && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
