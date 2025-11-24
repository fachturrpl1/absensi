# Troubleshooting Guide

## Error: ENOENT - _buildManifest.js.tmp.* not found

### Gejala
```
⨯ [Error: ENOENT: no such file or directory, open 'D:\...\.next\static\development\_buildManifest.js.tmp.xxxxx']
```

### Penyebab
Error ini biasanya terjadi karena:
1. **Cache Next.js yang corrupt** - File temporary dihapus sebelum Next.js selesai menggunakannya
2. **Race condition** - Multiple proses mencoba mengakses file yang sama
3. **File system issue** - Masalah dengan Windows file system atau antivirus
4. **Interrupted build** - Build process terhenti di tengah jalan

### Solusi

#### 1. Clean Build (Recommended)
```bash
# Windows
npm run clean:win
npm run dev

# Linux/Mac
npm run clean
npm run dev
```

Atau manual:
```bash
# Hapus folder .next
rm -rf .next
# atau di Windows
rmdir /s /q .next

# Restart dev server
npm run dev
```

#### 2. Clean Build dengan Rebuild
```bash
# Windows
npm run clean:build

# Linux/Mac
npm run clean && npm run build
```

#### 3. Kill All Node Processes (Jika ada multiple instances)
```bash
# Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Linux/Mac
pkill -f node
```

#### 4. Clear Node Modules Cache
```bash
# Hapus node_modules/.cache
rm -rf node_modules/.cache
# atau di Windows
rmdir /s /q node_modules\.cache
```

### Pencegahan
1. **Jangan menghentikan dev server dengan paksa** - Gunakan `Ctrl+C` dengan benar
2. **Tunggu build selesai** - Jangan restart server saat masih building
3. **Gunakan satu instance** - Jangan jalankan multiple dev server di port yang sama
4. **Exclude dari antivirus** - Tambahkan folder `.next` ke exclusion list antivirus

## Error: Port Already in Use

### Gejala
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Solusi
```bash
# Windows - Cari process yang menggunakan port 3000
netstat -ano | findstr :3000

# Kill process (ganti PID dengan process ID yang ditemukan)
taskkill /PID <PID> /F

# Atau gunakan port lain
npm run dev -- --port 3001
```

## Error: TypeScript/ESLint Errors

### Solusi
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint

# Auto-fix ESLint errors
npm run lint:fix

# Check semua (TypeScript + ESLint + Build)
npm run check
```

## Error: Build Failed

### Solusi
1. **Clean build**
   ```bash
   npm run clean:win  # Windows
   npm run clean      # Linux/Mac
   npm run build
   ```

2. **Check dependencies**
   ```bash
   npm install
   ```

3. **Check environment variables**
   - Pastikan file `.env` ada dan lengkap
   - Check `.env.example` untuk reference

4. **Check TypeScript errors**
   ```bash
   npm run type-check
   ```

## Tips Umum

1. **Selalu clean build sebelum push** jika ada masalah
2. **Gunakan pre-push hook** untuk check otomatis sebelum push
3. **Check logs** dengan detail untuk melihat error yang spesifik
4. **Update dependencies** secara berkala
5. **Backup** sebelum melakukan perubahan besar

