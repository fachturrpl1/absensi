Rencana Migrasi Bertahap (Tanpa Ubah Tampilan)
Saya sudah memulai migrasi tahap-1 di 
src/app/attendance/list/page.tsx
:

Mengubah menjadi client component.
Menambahkan wrapper 
AttendanceListInternal
 yang sementara tetap me-render 
ModernAttendanceList
, sehingga tampilan 100% sama.
Tahap Berikutnya (diimplementasikan sedikit demi sedikit)
[Tahap-2] Siapkan clone komponen di page
Buat komponen ModernAttendanceListCloned di 
page.tsx
 dengan signature sama seperti 
ModernAttendanceList
 namun untuk sementara return <ModernAttendanceList /> agar UI tetap sama.
Tujuan: wadah untuk memindahkan kode secara aman.
[Tahap-3] Pindahkan helper & tipe terlebih dulu
Salin tipe 
AttendanceListItem
, 
GetAttendanceResult
 (pakai dari @/action/attendance) dan helper kecil seperti initialsFromName(), toLocalYMD(), toLocalHM(), buildDateTime(). Tidak mengubah JSX.
[Tahap-4] Pindah state & effects bertahap
Pindahkan state pagination, search, filter, date range, dsb ke clone.
Di tahap ini render masih didelegasikan ke komponen lama agar UI tidak berubah.
[Tahap-5] Pindah fetch logic
Pindahkan fetchData() dan integrasi 
getAllAttendance()
 ke clone.
Validasi parity: data yang ditampilkan sama persis.
[Tahap-6] Pindah UI section per section
Pindahkan JSX per blok (toolbar, tabel/list/grid, modals edit/delete, pagination).
Setelah satu blok dipindah dan diverifikasi identik, blok tersebut tidak lagi didelegasikan ke komponen lama.
[Tahap-7] Realtime subscription & cache
Pindahkan channel Supabase, debounce, localStorage cache.
Uji ulang: tidak ada perubahan tampilan atau perilaku.
[Tahap-8] Finalisasi & cleanup
Setelah 1:1 parity, ganti 
AttendanceListInternal
 untuk merender clone sepenuhnya.
Hapus 
ModernAttendanceList
 untuk menghindari duplikasi kode.
Recommended Actions
[Lanjut Tahap-2 & 3] Saya siap memindahkan skeleton komponen dan helper kecil sekarang. Konfirmasi jika ingin saya lanjutkan patch berikutnya.
Status
Tahap-1 selesai. UI tetap sama.
Menunggu konfirmasi untuk lanjut ke Tahap-2 dan Tahap-3 (pindah kode 