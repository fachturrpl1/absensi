# 🏗️ Architecture Documentation

## Overview

Presensi adalah aplikasi **full-stack** berbasis **Next.js 15** dengan **App Router**, menggunakan **Supabase** sebagai Backend-as-a-Service (BaaS), **TypeScript** untuk type safety, dan **React Query** untuk state management & caching.

---

## 🎯 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19
- **Styling:** TailwindCSS 4
- **Component Library:** shadcn/ui (Radix UI primitives)
- **State Management:** 
  - React Query v5 (server state)
  - Zustand (client state)
- **Form Handling:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns, Luxon, moment-timezone

### Backend
- **BaaS:** Supabase
  - Auth (authentication)
  - PostgreSQL database
  - Storage (file uploads)
  - Realtime (live updates)
- **API:** Next.js Route Handlers (App Router)
- **ORM:** Supabase Client (direct SQL queries)

### DevOps & Tooling
- **Package Manager:** pnpm
- **Linting:** ESLint 9
- **Testing:** Vitest
- **Version Control:** Git
- **CI/CD:** (TBD - Vercel, GitHub Actions)

---

## 📁 Project Structure

```
presensi/
├── public/                    # Static assets
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/                   # Next.js App Router pages & layouts
│   │   ├── layout.tsx         # Root layout (QueryProvider, theme)
│   │   ├── page.tsx           # Dashboard homepage
│   │   ├── api/               # API route handlers
│   │   │   ├── members/
│   │   │   ├── attendance/
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── attendance/        # Attendance management
│   │   ├── members/           # Members management
│   │   ├── schedule/          # Schedule management
│   │   ├── analytics/         # Analytics & reports
│   │   ├── organization/      # Organization settings
│   │   └── onboarding/        # Onboarding flow
│   ├── components/            # Reusable React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── admin-panel/       # Admin layout components
│   │   ├── form/              # Form components
│   │   ├── charts/            # Chart components
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-members.ts
│   │   ├── use-attendance.ts
│   │   ├── use-groups.ts
│   │   └── ...
│   ├── action/                # Server actions (server-side functions)
│   │   ├── members.ts
│   │   ├── attendance.ts
│   │   ├── organization.ts
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   │   ├── utils.ts           # General utilities
│   │   ├── menu-list.ts       # Navigation menu config
│   │   ├── timezone.ts        # Timezone utilities
│   │   └── data-cache.ts      # Caching utilities
│   ├── utils/                 # Utility functions
│   │   ├── supabase/
│   │   │   ├── client.ts      # Client-side Supabase client
│   │   │   ├── server.ts      # Server-side Supabase client
│   │   │   └── admin.ts       # Admin Supabase client
│   │   └── debounce.ts
│   ├── interface/             # TypeScript interfaces
│   │   └── index.ts           # All data interfaces/types
│   ├── types/                 # TypeScript types
│   │   └── image-compression.ts
│   ├── config/                # Configuration files
│   │   └── supabase-config.ts
│   ├── providers/             # React context providers
│   │   └── query-provider.tsx
│   ├── constants/             # App constants
│   └── middleware.ts          # Next.js middleware (auth check)
├── docs/                      # Documentation
│   ├── README.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
├── .env.local                 # Environment variables (local)
├── .env.example               # Environment variables example
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # TailwindCSS configuration
├── components.json            # shadcn/ui configuration
├── vitest.config.ts           # Vitest configuration
├── package.json               # Dependencies & scripts
└── README.md                  # Project overview
```

---

## 🔄 Data Flow Architecture

### 1. **Client → Server → Database**

```
┌──────────────┐
│   Browser    │
│  (React UI)  │
└──────┬───────┘
       │
       │ 1. User action (button click, form submit)
       ▼
┌──────────────────────────┐
│   React Component        │
│   - members-client.tsx   │
└──────┬───────────────────┘
       │
       │ 2. Call custom hook
       ▼
┌──────────────────────────┐
│   Custom Hook            │
│   - use-members.ts       │
│   (React Query)          │
└──────┬───────────────────┘
       │
       │ 3. Fetch API endpoint
       ▼
┌──────────────────────────┐
│   API Route Handler      │
│   - /api/members/route.ts│
└──────┬───────────────────┘
       │
       │ 4. Call server action
       ▼
┌──────────────────────────┐
│   Server Action          │
│   - action/members.ts    │
└──────┬───────────────────┘
       │
       │ 5. Query database
       ▼
┌──────────────────────────┐
│   Supabase Client        │
│   - utils/supabase/      │
└──────┬───────────────────┘
       │
       │ 6. SQL Query
       ▼
┌──────────────────────────┐
│   PostgreSQL Database    │
│   (Supabase)             │
└──────────────────────────┘
```

### 2. **Server-Side Rendering (SSR) Flow**

```
Request → Middleware → Page Component → Server Actions → Database
                ↓
          Auth Check
          Org Check
```

### 3. **Realtime Updates Flow**

```
Database Change → Supabase Realtime → WebSocket → Client → React Query Invalidation
```

---

## 🧩 Key Architecture Patterns

### 1. **Server Components vs Client Components**

#### Server Components (Default)
- Fetch data directly (no API calls needed)
- Access database via Supabase server client
- Better SEO, smaller bundle size
- Used for: Pages, layouts, static content

```typescript
// app/members/page.tsx (Server Component)
import { getAllOrganization_member } from '@/action/members'

export default async function MembersPage() {
  const { data } = await getAllOrganization_member()
  return <MembersClient initialData={data} />
}
```

#### Client Components
- Interactive UI (useState, useEffect, event handlers)
- Call API routes for data fetching
- Use React Query for caching
- Used for: Forms, tables, modals, interactive widgets

```typescript
// components/members-client.tsx
'use client'

import { useMembers } from '@/hooks/use-members'

export function MembersClient() {
  const { data, isLoading } = useMembers()
  // ...
}
```

---

### 2. **API Layer Pattern**

**3-Layer Architecture:**

```
Page Component → Custom Hook (React Query) → API Route → Server Action → Database
```

**Why this pattern?**
- **Separation of concerns**: UI logic, API logic, business logic separated
- **Caching**: React Query caches API responses
- **Type safety**: Full TypeScript typing end-to-end
- **Reusability**: Hooks can be used in multiple components

**Example:**

```typescript
// 1. Custom Hook (hooks/use-members.ts)
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      const data = await res.json()
      return data
    },
    staleTime: 3 * 60 * 1000,
  })
}

// 2. API Route (app/api/members/route.ts)
export async function GET() {
  const result = await getAllOrganization_member()
  return NextResponse.json(result)
}

// 3. Server Action (action/members.ts)
export async function getAllOrganization_member() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
  return { success: !error, data }
}
```

---

### 3. **State Management Pattern**

#### Server State (React Query)
- API data caching
- Automatic refetching
- Optimistic updates
- Background synchronization

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['members'],
  queryFn: fetchMembers,
  staleTime: 3 * 60 * 1000,
})
```

#### Client State (Zustand)
- UI state (sidebar open/close, theme)
- User preferences
- Temporary form state

```typescript
// hooks/use-sidebar.ts
import { create } from 'zustand'

interface SidebarStore {
  isOpen: boolean
  toggle: () => void
}

export const useSidebar = create<SidebarStore>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
```

---

### 4. **Authentication & Authorization Pattern**

#### Middleware Layer (middleware.ts)
- Checks Supabase session cookie
- Redirects to login if unauthenticated
- Checks organization membership
- Redirects to onboarding if no organization

```typescript
export async function middleware(req: NextRequest) {
  const user = await supabase.auth.getUser()
  
  if (!user && !isPublicPath) {
    return NextResponse.redirect('/auth/login')
  }
  
  // Check organization membership
  const member = await checkOrganizationMembership(user.id)
  if (!member) {
    return NextResponse.redirect('/onboarding')
  }
  
  return NextResponse.next()
}
```

#### Route-level Authorization
- API routes check user authentication
- Server actions scope data by organization_id
- RLS policies enforce database-level security

```typescript
// API route
const user = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Scope to user's organization
const { data: member } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single()
```

---

### 5. **Form Handling Pattern**

**React Hook Form + Zod + shadcn/ui:**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

function MemberForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  })
  
  async function onSubmit(data: FormData) {
    const result = await createMember(data)
    if (result.success) {
      toast.success('Member created!')
      queryClient.invalidateQueries(['members'])
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="name" control={form.control} />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

### 6. **Error Handling Pattern**

#### API Level
```typescript
try {
  const data = await fetchData()
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('API Error:', error)
  return NextResponse.json(
    { success: false, message: 'Failed to fetch' },
    { status: 500 }
  )
}
```

#### Component Level
```typescript
const { data, error, isLoading } = useMembers()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />

return <DataTable data={data} />
```

#### Form Level
```typescript
async function onSubmit(data: FormData) {
  try {
    await createMember(data)
    toast.success('Success!')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed')
  }
}
```

---

## 🗄️ Database Access Patterns

### 1. **Supabase Client Variants**

#### Client-side (`utils/supabase/client.ts`)
- Browser context
- Uses cookies for auth
- Public API key

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server-side (`utils/supabase/server.ts`)
- Server components & API routes
- Reads cookies from request
- Public API key

```typescript
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
        remove: (name, options) => cookieStore.delete(name),
      },
    }
  )
}
```

#### Admin (`utils/supabase/admin.ts`)
- Service role key (bypass RLS)
- Server-side only
- For admin operations

```typescript
import { createClient } from '@supabase/supabase-js'

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 2. **Query Patterns**

#### Simple Select
```typescript
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId)
  .single()
```

#### Join Queries
```typescript
const { data } = await supabase
  .from('organization_members')
  .select(`
    *,
    user:user_id (*),
    departments:department_id (*),
    positions:position_id (*)
  `)
  .eq('organization_id', orgId)
```

#### Filtering & Ordering
```typescript
const { data } = await supabase
  .from('attendance_records')
  .select('*')
  .gte('attendance_date', startDate)
  .lte('attendance_date', endDate)
  .eq('status', 'present')
  .order('attendance_date', { ascending: false })
```

#### Aggregation
```typescript
const { count } = await supabase
  .from('organization_members')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .eq('is_active', true)
```

---

## 🎨 UI/UX Architecture

### Component Structure

```
Page
├── Layout (admin-panel)
│   ├── Sidebar
│   ├── Header
│   │   └── UserNav
│   └── Content Area
│       └── Page Content
│           ├── Page Header
│           ├── Filters/Search
│           ├── Data Table
│           │   ├── Columns
│           │   ├── Row Actions
│           │   └── Pagination
│           └── Modals/Dialogs
```

### Design System (shadcn/ui)

**Primitive Components:**
- Button, Input, Select, Checkbox, Switch
- Dialog, Sheet, Popover, Tooltip
- Table, Card, Separator
- Form, Label, Error Message

**Composed Components:**
- DataTable (TanStack Table)
- FormField (React Hook Form)
- DatePicker (React Day Picker)
- Charts (Recharts)

**Theme System:**
- Light/Dark mode (next-themes)
- CSS variables for colors
- Responsive breakpoints

---

## 🔌 Integration Points

### Supabase Services

#### Auth
```typescript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

#### Storage
```typescript
// Upload file
await supabase.storage
  .from('logo')
  .upload(`organization/${filename}`, file)

// Get public URL
const { data } = supabase.storage
  .from('logo')
  .getPublicUrl(filepath)
```

#### Realtime
```typescript
const channel = supabase
  .channel('attendance-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'attendance_records' },
    (payload) => {
      queryClient.invalidateQueries(['attendance'])
    }
  )
  .subscribe()
```

---

## 🚀 Performance Optimization

### 1. **React Query Caching**
- Reduces API calls by 60-74%
- Configurable staleTime & gcTime
- Background refetching
- Optimistic updates

### 2. **Next.js Optimizations**
- App Router (faster navigation)
- Server Components (smaller bundles)
- Image optimization (`next/image`)
- Font optimization (`next/font`)

### 3. **Database Optimizations**
- Proper indexes on frequently queried columns
- RLS policies for security
- Prepared statements (via Supabase client)
- Connection pooling (Supabase handles this)

### 4. **Code Splitting**
- Dynamic imports for heavy components
- Route-based code splitting (automatic)
- Lazy loading for non-critical UI

---

## 🔐 Security Architecture

### 1. **Authentication**
- Supabase Auth (JWT tokens)
- HTTP-only cookies for session
- Automatic token refresh

### 2. **Authorization**
- Row Level Security (RLS) policies
- Organization-scoped queries
- Role-based permissions

### 3. **Data Protection**
- Environment variables for secrets
- HTTPS only (enforced by Supabase)
- Input validation (Zod schemas)
- SQL injection protection (parameterized queries)

### 4. **CSRF Protection**
- SameSite cookies
- Middleware validation
- Next.js built-in protections

---

## 📊 Monitoring & Logging

### Client-Side
- Error boundaries
- Client error logging API
- Console warnings in dev

### Server-Side
- API route error logging
- Supabase dashboard logs
- Performance monitoring (planned)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Utility functions
- React hooks
- Form validation schemas

### Integration Tests
- API routes
- Server actions
- Database queries

### E2E Tests (Planned)
- Playwright for critical user flows
- Authentication flow
- CRUD operations

---

## 🔄 Deployment Architecture

```
┌──────────────────┐
│   GitHub Repo    │
└────────┬─────────┘
         │
         │ git push
         ▼
┌──────────────────┐
│  Vercel CI/CD    │
│  (Build & Deploy)│
└────────┬─────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│  Vercel Edge │  │ Supabase │  │Supabase      │
│  (Next.js)   │  │ Database │  │Storage       │
└──────────────┘  └──────────┘  └──────────────┘
```

**Environments:**
- Production: `main` branch → Vercel production
- Staging: `develop` branch → Vercel preview
- Local: `localhost:3000`

---

## 📚 Further Reading

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

**Last Updated:** 2025-10-23  
**Version:** 1.0
