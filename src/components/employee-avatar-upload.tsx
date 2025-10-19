// Example implementation for employee profile photos
// File: src/components/employee-avatar-upload.tsx

'use client';

import type { CompressionResult } from "@/types/image-compression";
import { ImageCompressionUpload } from "@/components/image-compression-upload";
import { toast } from "sonner";
import { safeAvatarSrc } from "@/lib/avatar-utils";

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
      console.log("Compressed photo ready", {
        employeeId,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
      });

      toast.success("Compressed photo ready to upload");
      onPhotoUpdated?.(URL.createObjectURL(result.file));
    } catch (error) {
      console.error("EmployeeAvatarUpload failed", error);
      toast.error("Failed to process profile photo");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Employee Profile Photo</h3>
      <p className="text-sm text-muted-foreground">
        Compress a profile photo before uploading it to storage.
      </p>

      <ImageCompressionUpload onUpload={handlePhotoUpload} className="max-w-md" />

      {currentPhotoUrl && (
        <div className="flex items-center space-x-4">
          {safeAvatarSrc(currentPhotoUrl) ? (
            <img
              src={safeAvatarSrc(currentPhotoUrl) as string}
              alt="Current photo"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted" />
          )}
          <div className="text-sm">
            <p className="font-medium">Current photo</p>
            <p className="text-muted-foreground">Displayed for reference</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to estimate storage savings
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
const savings = calculateStorageSavings(500); // 500 employees
console.log(savings);
// {
//   totalEmployees: 500,
//   originalStorageGB: 1.46 GB,
//   compressedStorageGB: 0.22 GB,  
//   savedStorageGB: 1.24 GB,
//   savingsPercentage: 85
// }
*/
