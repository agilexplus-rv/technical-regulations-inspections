import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/inspections',
  '/checklists',
  '/admin',
  '/feedback'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/mfa',
  '/api/health'
]

// Define API routes that should be accessible without authentication
const publicApiRoutes = [
  '/api/auth/',
  '/api/health'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('Middleware: Checking route:', pathname)
  
  // Check if this is a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Skip middleware for public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    console.log('Middleware: Public route, allowing access')
    return NextResponse.next()
  }
  
  // For protected routes, check for authentication
  if (isProtectedRoute) {
    console.log('Middleware: Protected route detected, checking authentication')
    
    // Temporarily allow access to test client-side authentication
    // TODO: Implement proper server-side session validation
    console.log('Middleware: Temporarily allowing access (client-side auth will handle protection)')
    return NextResponse.next()
  }
  
  // For all other routes (like root path), allow through
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
