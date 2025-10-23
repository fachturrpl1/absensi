# 🛠️ Development Guide

## Getting Started

### Prerequisites

**Required:**
- **Node.js** >= 18.x (LTS recommended)
- **pnpm** >= 8.x (package manager)
- **Git**

**Optional:**
- **VSCode** (recommended IDE)
- **Supabase CLI** (for local development)

---

## 🚀 Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/presensi.git
cd presensi
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create `.env.local` file di root project:

```bash
cp .env.example .env.local
```

**Required environment variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (Server-side only, DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**How to get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` and `anon public` key

### 4. Database Setup

**Option A: Use existing Supabase project**
- Credentials sudah ada di `.env.local`
- Database schema sudah ada
- Skip ke step 5

**Option B: Create new Supabase project**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to existing project
supabase link --project-ref your-project-ref

# Pull remote schema (if exists)
supabase db pull

# Or push local migrations
supabase db push
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) di browser.

### 6. Access in Network (Optional)

Untuk akses dari device lain di network yang sama:

```bash
pnpm dev:network
```

Server akan running di `http://0.0.0.0:3000` dan accessible via IP address.

---

## 📂 Project Structure Explained

### `/src/app` - Next.js App Router
```
app/
├── layout.tsx              # Root layout (providers, fonts, theme)
├── page.tsx                # Homepage (dashboard)
├── api/                    # API route handlers
│   ├── members/route.ts    # GET /api/members
│   └── ...
├── auth/                   # Authentication pages
│   ├── login/
│   └── signup/
├── (feature-name)/         # Feature pages
│   ├── page.tsx            # Main page
│   ├── [id]/page.tsx       # Dynamic route
│   └── add/page.tsx        # Add new item
└── ...
```

**Routing:**
- `app/members/page.tsx` → `/members`
- `app/members/[id]/page.tsx` → `/members/:id`
- `app/api/members/route.ts` → `/api/members`

### `/src/components` - React Components
```
components/
├── ui/                     # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── admin-panel/            # Layout components
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   └── user-nav.tsx
├── form/                   # Form components
│   ├── members-form.tsx
│   └── attendance-form.tsx
└── (feature-name)/         # Feature-specific components
    └── component.tsx
```

### `/src/action` - Server Actions
```
action/
├── members.ts              # Member CRUD operations
├── attendance.ts           # Attendance operations
├── organization.ts         # Organization operations
└── ...
```

**Purpose:** Server-side functions yang berinteraksi langsung dengan database.

### `/src/hooks` - Custom React Hooks
```
hooks/
├── use-members.ts          # Fetch members (React Query)
├── use-groups.ts           # Fetch groups
├── use-mobile.ts           # Check mobile viewport
└── ...
```

### `/src/lib` - Utility Libraries
```
lib/
├── utils.ts                # General utilities (cn, formatters)
├── menu-list.ts            # Navigation menu configuration
├── timezone.ts             # Timezone utilities
└── data-cache.ts           # Caching utilities
```

### `/src/interface` - TypeScript Interfaces
```
interface/
└── index.ts                # All data interfaces
```

---

## 💻 Development Workflow

### 1. **Create New Feature**

#### Step 1: Define Interface
```typescript
// src/interface/index.ts
export interface INewFeature {
  id: string
  name: string
  description?: string
  created_at: string
}
```

#### Step 2: Create Server Action
```typescript
// src/action/new-feature.ts
"use server"
import { createClient } from "@/utils/supabase/server"

export async function getAllFeatures() {
  const supabase = await createClient()
  
  // Get user's organization
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  
  // Fetch data scoped to organization
  const { data, error } = await supabase
    .from('new_features')
    .select('*')
    .eq('organization_id', member.organization_id)
  
  if (error) {
    return { success: false, message: error.message, data: [] }
  }
  
  return { success: true, data }
}

export async function createFeature(payload: Partial<INewFeature>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('new_features')
    .insert([payload])
    .select()
    .single()
  
  if (error) {
    return { success: false, message: error.message }
  }
  
  return { success: true, data }
}
```

#### Step 3: Create API Route
```typescript
// src/app/api/features/route.ts
import { NextResponse } from 'next/server'
import { getAllFeatures } from '@/action/new-feature'

export async function GET() {
  try {
    const response = await getAllFeatures()
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}
```

#### Step 4: Create Custom Hook
```typescript
// src/hooks/use-features.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { INewFeature } from '@/interface'

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const res = await fetch('/api/features')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data as INewFeature[]
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useCreateFeature() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<INewFeature>) => {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })
}
```

#### Step 5: Create Page Component
```typescript
// src/app/features/page.tsx
import { FeaturesClient } from './features-client'

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold">Features</h1>
      <FeaturesClient />
    </div>
  )
}
```

#### Step 6: Create Client Component
```typescript
// src/app/features/features-client.tsx
'use client'

import { useFeatures } from '@/hooks/use-features'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'

export function FeaturesClient() {
  const { data, isLoading, error } = useFeatures()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <Button>Add Feature</Button>
      <DataTable data={data} columns={columns} />
    </div>
  )
}
```

---

### 2. **Adding New UI Component**

Use shadcn/ui CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
```

Components akan ditambahkan ke `src/components/ui/`.

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

<Button variant="outline">Click me</Button>
```

---

### 3. **Database Migrations**

**Create new migration:**
```bash
supabase migration new add_new_table
```

**Edit migration file:**
```sql
-- supabase/migrations/20250123_add_new_table.sql
CREATE TABLE new_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_new_features_org ON new_features(organization_id);
```

**Apply migration:**
```bash
supabase db push
```

---

## 🎨 Coding Standards

### TypeScript Guidelines

#### 1. **Always define types/interfaces**
```typescript
// ❌ Bad
function getUser(id) {
  return fetch(`/api/users/${id}`)
}

// ✅ Good
async function getUser(id: string): Promise<IUser> {
  const res = await fetch(`/api/users/${id}`)
  const data = await res.json()
  return data as IUser
}
```

#### 2. **Use type inference when obvious**
```typescript
// ✅ Good - type inferred
const count = 10
const name = "John"

// ✅ Also good - explicit when needed
const user: IUser | null = null
```

#### 3. **Avoid `any`, use `unknown` instead**
```typescript
// ❌ Bad
function process(data: any) {
  return data.value
}

// ✅ Good
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value
  }
  throw new Error('Invalid data')
}
```

---

### React Best Practices

#### 1. **Use Server Components by default**
```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <div>{data.name}</div>
}

// Only use Client Component when needed
'use client'
export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

#### 2. **Extract reusable logic to hooks**
```typescript
// ❌ Bad - logic in component
function Component() {
  const [data, setData] = useState([])
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  return <div>{data.length}</div>
}

// ✅ Good - logic in hook
function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then(r => r.json())
  })
}

function Component() {
  const { data } = useData()
  return <div>{data?.length}</div>
}
```

#### 3. **Keep components small and focused**
```typescript
// ❌ Bad - one big component
function MembersPage() {
  // 500 lines of code...
}

// ✅ Good - split into smaller components
function MembersPage() {
  return (
    <div>
      <MembersHeader />
      <MembersFilters />
      <MembersTable />
    </div>
  )
}
```

---

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `members-form.tsx` |
| Components | PascalCase | `MembersForm` |
| Hooks | camelCase with `use` prefix | `useMembers` |
| Functions | camelCase | `getAllMembers` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Interfaces | PascalCase with `I` prefix | `IOrganization` |
| Types | PascalCase | `UserRole` |

---

### File Organization

#### Component Files
```typescript
// members-form.tsx

// 1. Imports
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface MembersFormProps {
  onSubmit: (data: FormData) => void
}

// 3. Constants
const DEFAULT_VALUES = {
  name: '',
  email: '',
}

// 4. Helper functions
function validateEmail(email: string) {
  // ...
}

// 5. Main component
export function MembersForm({ onSubmit }: MembersFormProps) {
  // ...
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

#### Unit Test Example
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDate } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge classnames', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })
    
    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar')).toBe('foo')
    })
  })
  
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-23')
      expect(formatDate(date)).toBe('23 Jan 2025')
    })
  })
})
```

#### Hook Test Example
```typescript
// src/hooks/use-members.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMembers } from './use-members'

describe('useMembers', () => {
  it('should fetch members', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    
    const { result } = renderHook(() => useMembers(), { wrapper })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

---

## 🔍 Debugging

### Debug Tools

#### 1. **React DevTools**
- Install browser extension
- Inspect component props/state
- Profile performance

#### 2. **React Query DevTools**
```typescript
// src/app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  )
}
```

#### 3. **Supabase Logs**
- Go to Supabase Dashboard → Logs
- See API requests, errors, performance

#### 4. **Next.js Debug Mode**
```bash
NODE_OPTIONS='--inspect' pnpm dev
```

Then open `chrome://inspect` in Chrome.

---

### Common Issues & Solutions

#### Issue: "No QueryClient set"
**Solution:** Ensure `QueryProvider` is in `app/layout.tsx`

#### Issue: "Supabase cookie error"
**Solution:** Clear browser cookies and restart dev server

#### Issue: "Module not found"
**Solution:** 
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### Issue: "TypeScript errors"
**Solution:**
```bash
# Restart TypeScript server in VSCode
# CMD+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
pnpm build
```

---

## 📦 Package Management

### Adding Dependencies

```bash
# Production dependency
pnpm add package-name

# Dev dependency
pnpm add -D package-name
```

### Updating Dependencies

```bash
# Update all
pnpm update

# Update specific package
pnpm update package-name

# Check outdated
pnpm outdated
```

### Removing Dependencies

```bash
pnpm remove package-name
```

---

## 🎯 Git Workflow

### Branch Strategy

```
main           # Production
  └── develop  # Development
       ├── feature/members-crud
       ├── feature/attendance-tracking
       └── fix/login-bug
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add member invitation feature
fix: resolve attendance date timezone issue
docs: update API documentation
refactor: simplify member query logic
test: add unit tests for useMembers hook
chore: update dependencies
```

### Pull Request Process

1. Create feature branch from `develop`
2. Commit changes with clear messages
3. Push to remote
4. Create PR to `develop`
5. Request review
6. Merge after approval

---

## 📚 Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Learning Resources
- [Next.js Tutorial](https://nextjs.org/learn)
- [React Query Tutorial](https://tkdodo.eu/blog/practical-react-query)
- [Supabase Tutorial](https://supabase.com/docs/guides/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 💡 Tips & Tricks

### 1. **Use TypeScript Strict Mode**
Enable in `tsconfig.json` untuk catch errors early.

### 2. **Install VSCode Extensions**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

### 3. **Use Keyboard Shortcuts**
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+B` - Toggle Sidebar
- `Ctrl+``  - Toggle Terminal
- `F12` - Go to Definition
- `Alt+F12` - Peek Definition

### 4. **Keep Console Clean**
Remove `console.log` before committing.

### 5. **Write Comments for Complex Logic**
```typescript
// Calculate late minutes based on scheduled start time
// Handles timezone conversion and DST
const lateMinutes = calculateLateMinutes(checkIn, scheduledStart, timezone)
```

---

**Last Updated:** 2025-10-23  
**Version:** 1.0
