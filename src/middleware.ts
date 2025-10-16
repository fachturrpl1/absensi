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

  // Get user with error handling for malformed cookies
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data?.user
  } catch (error) {
    // If there's an error (likely due to malformed cookies), clear auth cookies
    console.warn('Error getting user, clearing auth cookies:', error)
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

  // Redirect logic based on user authentication
  if (user && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  // Allow newly signed up users to see signup page briefly before redirect
  if (user && pathname.startsWith("/auth/signup")) {
    // Check if user has been recently created (within last minute)
    const userCreatedAt = new Date(user.created_at)
    const now = new Date()
    const timeDifference = now.getTime() - userCreatedAt.getTime()
    const oneMinuteInMs = 60 * 1000
    
    // If user was created more than 1 minute ago, redirect to dashboard
    if (timeDifference > oneMinuteInMs) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    // Otherwise, let them stay on signup page to see the success message
  }

  // Don't require auth for auth pages
  const publicPaths = ["/auth"]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Check if authenticated user has organization (except for onboarding page and accept-invite flow)
  if (user && !pathname.startsWith("/onboarding") && !isPublicPath) {
    try {
      // Check if user has organization membership
      const { data: member } = await supabase
        .from("organization_members")
        .select(`
          is_active,
          organization:organizations(
            id,
            is_active
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle()

      // Normalize typing from Supabase response for safer runtime checks
      const memberData: any = member

      // If user has no organization or organization is inactive, redirect to onboarding
      if (!memberData || !memberData.organization || !memberData.organization.is_active || !memberData.is_active) {
        return NextResponse.redirect(new URL("/onboarding", req.url))
      }
    } catch (error) {
      console.warn('Error checking organization membership:', error)
      // On error, allow access but user will see appropriate message in UI
    }
  }

  return response
}

export const config = {
  // Exclude static assets and debug/api routes used during development from auth middleware
  matcher: [
    // Ensure our client logging endpoint and other debug APIs are excluded from auth middleware
    "/((?!_next/static|_next/image|favicon.ico|api/debug|api/dashboard/monthly|api/log-client-error).*)",
  ],
}
