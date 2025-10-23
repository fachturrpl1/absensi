# Architecture

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- TailwindCSS 4
- shadcn/ui (Radix UI)
- React Query v5 (server state)
- Zustand (client state)
- React Hook Form + Zod

**Backend:**
- Supabase (Auth, PostgreSQL, Storage, Realtime)
- Next.js Route Handlers

---

## Struktur Project

```
src/
├── app/                    # Pages & API routes
│   ├── layout.tsx         # Root layout (providers)
│   ├── page.tsx           # Dashboard
│   ├── api/               # API endpoints
│   ├── auth/              # Login, signup
│   ├── attendance/        # Attendance pages
│   ├── members/           # Members pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   └── ...
├── hooks/                # Custom React hooks
├── action/               # Server actions (DB operations)
├── lib/                  # Utilities
├── interface/            # TypeScript interfaces
├── utils/
│   └── supabase/        # Supabase clients
└── middleware.ts         # Auth middleware
```

---

## Data Flow

```
Browser (React UI)
  ↓
Custom Hook (React Query)
  ↓
API Route Handler (/api/*)
  ↓
Server Action (action/*.ts)
  ↓
Supabase Client
  ↓
PostgreSQL Database
```

---

## Pattern: Server vs Client Components

### Server Component (Default)
```typescript
// app/members/page.tsx
import { getAllOrganization_member } from '@/action/members'

export default async function MembersPage() {
  const { data } = await getAllOrganization_member()
  return <MembersClient initialData={data} />
}
```

**Keuntungan:**
- Fetch data langsung di server
- Better SEO
- Smaller bundle size

---

### Client Component
```typescript
// components/members-client.tsx
'use client'

import { useMembers } from '@/hooks/use-members'

export function MembersClient() {
  const { data, isLoading } = useMembers()
  
  if (isLoading) return <div>Loading...</div>
  return <DataTable data={data} />
}
```

**Kapan pakai:**
- Butuh interactivity (useState, onClick)
- Butuh browser APIs
- Butuh React hooks

---

## Pattern: API Layer

### 1. Custom Hook (React Query)
```typescript
// hooks/use-members.ts
import { useQuery } from '@tanstack/react-query'

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      return res.json()
    },
    staleTime: 3 * 60 * 1000, // 3 menit
  })
}
```

### 2. API Route
```typescript
// app/api/members/route.ts
import { NextResponse } from 'next/server'
import { getAllOrganization_member } from '@/action/members'

export async function GET() {
  const result = await getAllOrganization_member()
  return NextResponse.json(result)
}
```

### 3. Server Action
```typescript
// action/members.ts
"use server"
import { createClient } from '@/utils/supabase/server'

export async function getAllOrganization_member() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
  
  return { success: !error, data }
}
```

---

## State Management

### Server State (React Query)
Untuk data dari API:
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['members'],
  queryFn: fetchMembers,
  staleTime: 3 * 60 * 1000,
})
```

**Invalidate setelah mutasi:**
```typescript
const queryClient = useQueryClient()
queryClient.invalidateQueries(['members'])
```

---

### Client State (Zustand)
Untuk UI state:
```typescript
// hooks/use-sidebar.ts
import { create } from 'zustand'

export const useSidebar = create<SidebarStore>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
```

---

## Authentication Flow

### Middleware (middleware.ts)
```typescript
// Check session
const { data: { user } } = await supabase.auth.getUser()

// Redirect jika belum login
if (!user && !isPublicPath) {
  return NextResponse.redirect('/auth/login')
}

// Check organization membership
const { data: member } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single()

// Redirect ke onboarding jika belum join org
if (!member) {
  return NextResponse.redirect('/onboarding')
}
```

---

### API Route Auth
```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Form Handling

### React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

type FormData = z.infer<typeof schema>

function Form() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  
  async function onSubmit(data: FormData) {
    await createMember(data)
    queryClient.invalidateQueries(['members'])
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* fields */}
    </form>
  )
}
```

---

## Supabase Clients

### Client-side
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server-side
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name) => cookieStore.delete(name),
      }
    }
  )
}
```

**Kapan pakai apa:**
- Client-side: Component client, browser actions
- Server-side: Server components, API routes, server actions

---

## Error Handling

### API Level
```typescript
try {
  const data = await fetchData()
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { success: false, message: 'Failed' },
    { status: 500 }
  )
}
```

### Component Level
```typescript
const { data, error, isLoading } = useMembers()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
return <DataTable data={data} />
```

---

## Performance Optimization

### React Query Caching
- Reduces API calls by 60-74%
- `staleTime`: Data dianggap fresh (3-5 menit)
- `gcTime`: Cache bertahan (5-10 menit)
- Background refetching

### Next.js Optimizations
- Server Components (smaller bundles)
- Image optimization (`next/image`)
- Code splitting (automatic)

### Database
- Proper indexes
- RLS policies
- Prepared statements via Supabase

---

## Security

### Authentication
- Supabase Auth (JWT)
- HTTP-only cookies
- Auto token refresh

### Authorization
- Row Level Security (RLS)
- Organization-scoped queries
- Role-based permissions

### Data Protection
- Environment variables untuk secrets
- HTTPS only
- Input validation (Zod)
- Parameterized queries

---

**Last Updated:** 2025-10-23
