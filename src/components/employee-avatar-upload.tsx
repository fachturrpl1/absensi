// Contoh implementasi untuk foto profil karyawan
// File: src/components/employee-avatar-upload.tsx

'use client';

import { AvatarImageUpload } from '@/components/image-compression-upload';
import { uploadEmployeePhoto } from '@/action/employees';
import { toast } from 'sonner';

interface EmployeeAvatarUploadProps {
  employeeId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated?: (photoUrl: string) => void;
}

export function EmployeeAvatarUpload({ 
  employeeId, 
  currentPhotoUrl, 
  onPhotoUpdated 
}: EmployeeAvatarUploadProps) {
  const handlePhotoUpload = async (result: CompressionResult) => {
    try {
      // File sudah dikompres otomatis!
      console.log('Original size:', result.originalSize); // Misal: 2.5 MB
      console.log('Compressed size:', result.compressedSize); // Misal: 250 KB
      console.log('Saved:', result.compressionRatio + '%'); // Misal: 90% saved
      
      // Upload ke storage (Supabase/CloudFlare/dll)
      const photoUrl = await uploadEmployeePhoto(employeeId, result.file);
      
      // Update database dengan URL foto baru
      await updateEmployeeProfile(employeeId, { avatar_url: photoUrl });
      
      toast.success(`Foto profil berhasil diupload! Hemat ${result.compressionRatio}% storage`);
      onPhotoUpdated?.(photoUrl);
      
    } catch (error) {
      toast.error('Gagal upload foto profil');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Foto Profil Karyawan</h3>
      <p className="text-sm text-muted-foreground">
        Upload foto profil (otomatis dikompres untuk menghemat storage)
      </p>
      
      <AvatarImageUpload
        onUpload={handlePhotoUpload}
        className="max-w-md"
      />
      
      {currentPhotoUrl && (
        <div className="flex items-center space-x-4">
          <img 
            src={currentPhotoUrl} 
            alt="Current photo" 
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="text-sm">
            <p className="font-medium">Foto saat ini</p>
            <p className="text-muted-foreground">Sudah terkompresi</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Fungsi helper untuk menghitung penghematan storage
export function calculateStorageSavings(employees: number, avgCompressionRatio: number = 85) {
  const originalSizePerPhoto = 3; // MB
  const totalOriginalSize = employees * originalSizePerPhoto;
  const savedSize = totalOriginalSize * (avgCompressionRatio / 100);
  const finalSize = totalOriginalSize - savedSize;
  
  return {
    totalEmployees: employees,
    originalStorageGB: totalOriginalSize / 1024,
    compressedStorageGB: finalSize / 1024,
    savedStorageGB: savedSize / 1024,
    savingsPercentage: avgCompressionRatio
  };
}

/* 
Contoh penggunaan:
const savings = calculateStorageSavings(500); // 500 karyawan
console.log(savings);
// {
//   totalEmployees: 500,
//   originalStorageGB: 1.46 GB,
//   compressedStorageGB: 0.22 GB,  
//   savedStorageGB: 1.24 GB,
//   savingsPercentage: 85
// }
*/
