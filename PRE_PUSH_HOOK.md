# Pre-Push Hook

Pre-push hook ini akan otomatis mengecek kode sebelum push ke repository untuk mencegah error saat deploy.

## Apa yang dicek?

1. **TypeScript Check** (`tsc --noEmit`)
   - Mengecek semua error TypeScript tanpa menghasilkan file output
   
2. **ESLint Check** (`npm run lint`)
   - Mengecek semua error dan warning ESLint
   
3. **Build Check** (`npm run build`)
   - Mengecek apakah project bisa di-build dengan sukses

## Cara Kerja

Setiap kali Anda menjalankan `git push`, hook ini akan otomatis:
1. Menjalankan semua check di atas
2. Jika ada error, push akan dibatalkan dan menampilkan pesan error
3. Jika semua check passed, push akan dilanjutkan

## Script yang Tersedia

- `npm run type-check` - Cek TypeScript errors saja
- `npm run lint` - Cek ESLint errors saja
- `npm run lint:fix` - Auto-fix ESLint errors yang bisa diperbaiki
- `npm run check` - Jalankan semua check (type-check + lint + build)
- `npm run pre-push` - Alias untuk `npm run check`

## Cara Manual Test

Sebelum push, Anda bisa manual test dengan:

```bash
npm run check
```

atau

```bash
npm run pre-push
```

## Skip Hook (Tidak Disarankan)

Jika Anda benar-benar perlu skip hook (misalnya untuk hotfix), gunakan:

```bash
git push --no-verify
```

⚠️ **Peringatan**: Jangan gunakan `--no-verify` kecuali benar-benar diperlukan, karena bisa menyebabkan error di production!

## Troubleshooting

### Hook tidak jalan di Windows

Jika hook tidak jalan di Windows PowerShell, pastikan Git Bash terinstall dan digunakan untuk git commands.

Atau jalankan manual:
```bash
npm run check
```

### Build terlalu lama

Jika build terlalu lama dan Anda yakin tidak ada error, bisa skip dengan `--no-verify`, tapi pastikan sudah test manual dulu.

