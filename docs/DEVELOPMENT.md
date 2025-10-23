# Development Guide

## Setup Awal

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- Akun Supabase

### Installation

```bash
# Clone repo
git clone https://github.com/your-org/presensi.git
cd presensi

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Environment Variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Cara dapat credentials:**
1. Supabase Dashboard → Project Settings → API
2. Copy `Project URL` dan `anon public` key

---

## Scripts

```bash
pnpm dev              # Development server
pnpm dev:network      # Dev server dengan network access (0.0.0.0)
pnpm build            # Build production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests
```

---

## Membuat Feature Baru

### Step 1: Define Interface

```typescript
// src/interface/index.ts
export interface INewFeature {
  id: string
  name: string
  organization_id: string
  created_at: string
}
```

---

### Step 2: Server Action

```typescript
// src/action/new-feature.ts
"use server"
import { createClient } from "@/utils/supabase/server"

export async function getAllFeatures() {
  const supabase = await createClient()
  
  // Get user's org
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  
  // Fetch data
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('organization_id', member.organization_id)
  
  return { success: !error, data }
}

export async function createFeature(payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('features')
    .insert([payload])
    .select()
    .single()
  
  return { success: !error, data }
}
```

---

### Step 3: API Route

```typescript
// src/app/api/features/route.ts
import { NextResponse } from 'next/server'
import { getAllFeatures } from '@/action/new-feature'

export async function GET() {
  try {
    const result = await getAllFeatures()
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed' },
      { status: 500 }
    )
  }
}
```

---

### Step 4: Custom Hook

```typescript
// src/hooks/use-features.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const res = await fetch('/api/features')
      const json = await res.json()
      return json.data
    },
    staleTime: 3 * 60 * 1000,
  })
}

export function useCreateFeature() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
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

---

### Step 5: Page Component

```typescript
// src/app/features/features-client.tsx
'use client'

import { useFeatures, useCreateFeature } from '@/hooks/use-features'
import { Button } from '@/components/ui/button'

export function FeaturesClient() {
  const { data, isLoading, error } = useFeatures()
  const createMutation = useCreateFeature()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <Button onClick={() => createMutation.mutate({ name: 'New' })}>
        Add Feature
      </Button>
      <ul>
        {data?.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  )
}
```

---

## Menambah UI Component

Gunakan shadcn CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button'

<Button variant="outline">Click</Button>
```

---

## Database Migration

### Create Migration
```bash
supabase migration new add_features_table
```

### Edit Migration File
```sql
-- supabase/migrations/20250123_add_features_table.sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_features_org ON features(organization_id);

-- RLS Policy
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org features" ON features
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### Apply Migration
```bash
supabase db push
```

---

## Coding Standards

### TypeScript
```typescript
// ✅ Good
async function getUser(id: string): Promise<IUser> {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

// ❌ Bad - no types
function getUser(id) {
  return fetch(`/api/users/${id}`)
}
```

### React
```typescript
// ✅ Good - small, focused components
function UserCard({ user }: { user: IUser }) {
  return <div>{user.name}</div>
}

// ✅ Good - extract logic to hooks
function useUsers() {
  return useQuery(['users'], fetchUsers)
}
```

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Hooks: `useCamelCase`
- Constants: `UPPER_SNAKE_CASE`

---

## Testing

### Run Tests
```bash
pnpm test           # Run all
pnpm test:watch     # Watch mode
```

### Example Test
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-01-23')
    expect(formatDate(date)).toBe('23 Jan 2025')
  })
})
```

---

## Debugging

### React DevTools
Install browser extension untuk inspect components.

### React Query DevTools
```typescript
// app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryProvider>
  {children}
  <ReactQueryDevtools />
</QueryProvider>
```

### Supabase Logs
Dashboard → Logs → Lihat API requests & errors

---

## Git Workflow

### Commit Messages
```
feat: add member invitation feature
fix: resolve timezone issue
docs: update API documentation
refactor: simplify query logic
test: add tests for useMembers
```

### Branch Strategy
```
main → production
develop → development
feature/* → new features
fix/* → bug fixes
```

---

## Troubleshooting

### "No QueryClient set"
Pastikan `QueryProvider` ada di `app/layout.tsx`

### Supabase Cookie Error
Clear browser cookies, restart dev server

### Module Not Found
```bash
rm -rf .next node_modules
pnpm install
```

### TypeScript Errors
Restart TS server: CMD+Shift+P → "TypeScript: Restart TS Server"

---

## Tips

1. **Use TypeScript strict mode** - Catch errors early
2. **Install VSCode extensions:**
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
3. **Keep console clean** - Remove console.log sebelum commit
4. **Write comments** untuk complex logic
5. **Test locally** sebelum push

---

**Last Updated:** 2025-10-23
