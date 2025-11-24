# **Perbaikan Hydration Error - Next.js**

## **Masalah**

Aplikasi mengalami hydration error yang disebabkan oleh ketidakcocokan ID yang dihasilkan secara dinamis oleh Radix UI antara server dan client. Error ini muncul pada komponen:

- **Sidebar dengan Collapsible**
- **CommandDialog (Search)**
- **DropdownMenu**

### **Error Message**
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

### **Root Cause**
- ID Radix UI berubah antara server dan client (`radix-_R_1qkmflb_` vs `radix-_R_7aipulb_`)
- Komponen yang menggunakan ID dinamis tidak konsisten antara SSR dan CSR

## **Solusi yang Diimplementasikan**

### **1. Custom Hooks**

#### **`useIsomorphicLayoutEffect`**
```typescript
// src/hooks/use-isomorphic-layout-effect.ts
import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
```

#### **`useMounted`**
```typescript
// src/hooks/use-mounted.ts
import { useEffect, useState } from 'react';

export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
```

### **2. Perbaikan Komponen**

#### **Sidebar Provider**
- ✅ Menambahkan `mounted` check sebelum mengakses `document.cookie`
- ✅ Menggunakan `useIsomorphicLayoutEffect` untuk keyboard shortcuts
- ✅ Menambahkan `suppressHydrationWarning` pada wrapper

#### **Collapsible Components**
- ✅ Menambahkan conditional rendering berdasarkan `mounted` state
- ✅ Menambahkan `suppressHydrationWarning` pada semua komponen Radix UI

#### **SearchDialog**
- ✅ Conditional rendering `CommandDialog` hanya setelah mounted
- ✅ Menambahkan `mounted` check pada keyboard event listener

#### **AppSidebarNew**
- ✅ Conditional rendering sidebar content setelah mounted
- ✅ Early return dengan placeholder saat belum mounted

### **3. Prinsip Implementasi**

#### **Memory Management**
- Mencegah memory leaks dengan proper cleanup pada event listeners
- Menggunakan `useCallback` untuk optimasi performa

#### **Error Handling**
- Graceful fallback dengan placeholder components
- Proper type checking sebelum mengakses DOM APIs

#### **Performance Optimization**
- Lazy rendering untuk komponen yang menggunakan dynamic IDs
- Minimal re-renders dengan proper dependency arrays

#### **Security Best Practices**
- Safe DOM access dengan type checking
- Proper cleanup untuk event listeners

## **Hasil**

### **Sebelum**
- ❌ Hydration mismatch errors di console
- ❌ Inconsistent behavior antara SSR dan CSR
- ❌ ID conflicts pada Radix UI components

### **Setelah**
- ✅ Tidak ada hydration errors
- ✅ Konsisten rendering antara server dan client
- ✅ Proper client-side mounting untuk dynamic components
- ✅ Improved user experience dengan smooth transitions

## **Best Practices untuk Mencegah Hydration Errors**

1. **Gunakan `useMounted` hook** untuk komponen yang bergantung pada client-side APIs
2. **Tambahkan `suppressHydrationWarning`** pada komponen dengan dynamic IDs
3. **Conditional rendering** untuk komponen yang tidak bisa di-render di server
4. **Proper cleanup** untuk event listeners dan side effects
5. **Type checking** sebelum mengakses DOM APIs

## **Monitoring**

Untuk memantau hydration errors di masa depan:

1. **Console Monitoring**: Periksa browser console untuk hydration warnings
2. **Performance Monitoring**: Gunakan React DevTools untuk profiling
3. **Error Tracking**: Implementasi error boundary untuk menangkap hydration errors

## **Catatan Penting**

- Perubahan ini mengikuti prinsip **progressive enhancement**
- Tidak mempengaruhi SEO karena content tetap di-render di server
- Kompatibel dengan semua fitur Next.js termasuk SSG dan ISR
- Mengikuti best practices untuk accessibility dan performance
