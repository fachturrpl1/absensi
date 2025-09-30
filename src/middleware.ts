import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options) {
          // Set cookie on both request and response
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          // Remove cookie from both request and response
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user session with error handling for malformed cookies
  let session = null
  try {
    const result = await supabase.auth.getSession()
    session = result.data?.session
  } catch (error) {
    // If there's an error (likely due to malformed cookies), clear auth cookies
    console.warn('Error getting session, clearing auth cookies:', error)
    const authCookieNames = [
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token.0`,
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token.1`,
      // Add more potential chunked cookie names if needed
    ]
    
    authCookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName)
    })
  }

  const { pathname } = req.nextUrl

  // Redirect logic based on session
  if (session && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (!session && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // exclude assets
}
