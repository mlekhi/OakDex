import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// how many requests each API can handle
const RATE_LIMITS = {
  '/api/chat': { requests: 8, window: 60 },
}

// in memory request tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${ip}:${path}`
  
  const limit = RATE_LIMITS[path as keyof typeof RATE_LIMITS]
  if (!limit) return { allowed: true, remaining: 999, resetTime: now + 60000 }
  
  const userRequests = rateLimitStore.get(key)
  
  if (!userRequests || now > userRequests.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + (limit.window * 1000) })
    return { allowed: true, remaining: limit.requests - 1, resetTime: now + (limit.window * 1000) }
  }
  
  if (userRequests.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetTime: userRequests.resetTime }
  }
  
  userRequests.count++
  return { allowed: true, remaining: limit.requests - userRequests.count, resetTime: userRequests.resetTime }
}

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const path = request.nextUrl.pathname
  
  // Check rate limit
  const rateLimit = checkRateLimit(ip, path)
  
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter,
        limit: RATE_LIMITS[path as keyof typeof RATE_LIMITS]?.requests || 5
      }),
      { 
        status: 429, // too many requests
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': (RATE_LIMITS[path as keyof typeof RATE_LIMITS]?.requests || 5).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }
  
  // let the request through but add headers to successful responses
  const response = NextResponse.next()
  const limit = RATE_LIMITS[path as keyof typeof RATE_LIMITS]
  
  if (limit) {
    response.headers.set('X-RateLimit-Limit', limit.requests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
  }
  
  return response
}

// check all api routes
export const config = {
  matcher: '/api/:path*'
} 