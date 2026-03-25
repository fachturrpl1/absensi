"use client";

// src/hooks/organization/settings/use-logo-upload.ts
// Mengelola kompresi, preview, dan upload logo ke Supabase Storage

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useImageCompression } from "@/hooks/use-image-compression";
import { organizationLogger } from "@/lib/logger";
import type { OrganizationData } from "@/types/organization/org-settings";

export function useLogoUpload(orgData: OrganizationData | null | undefined) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { compressImage, isCompressing, error: compressionError, validateFile } =
    useImageCompression({ preset: "standard" });

  // ----------------------------------------------------------
  // Handle file selection + compression
  // ----------------------------------------------------------
  const handleLogoChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || "Invalid file");
        return;
      }

      toast.info("Processing logo...");

      const compressionResult = await compressImage(file);
      if (!compressionResult) {
        toast.error("Failed to process image");
        return;
      }

      const compressedFile = new File([compressionResult.file], file.name, {
        type: compressionResult.file.type,
        lastModified: Date.now(),
      });

      setLogoFile(compressedFile);
      setLogoPreview(compressionResult.dataUrl || "");
      toast.success("Logo ready to upload");

      organizationLogger.debug(
        `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ` +
        `${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB ` +
        `(${compressionResult.compressionRatio}% reduction)`,
      );
    },
    [compressImage, validateFile],
  );

  // ----------------------------------------------------------
  // Upload ke Supabase Storage
  // ----------------------------------------------------------
  const uploadLogo = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Hapus logo lama jika ada
        if (orgData?.logo_url) {
          const oldFilePath = orgData.logo_url.split("/").pop();
          if (oldFilePath) {
            await supabase.storage
              .from("logo")
              .remove([`organization/${oldFilePath}`])
              .catch(() => {
                // Non-fatal: lanjut upload meski delete gagal
                organizationLogger.warn("Failed to delete old logo, continuing upload");
              });
          }
        }

        // Buat path file: organization/org_{id}_{filename}
        let fileNameToUse = file.name?.trim() || "";
        if (!fileNameToUse) {
          const ext = file.type.split("/")[1] || "jpg";
          fileNameToUse = `logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        }
        const fileName = `organization/org_${orgData?.id ?? 0}_${fileNameToUse}`;

        const { error: uploadError } = await supabase.storage
          .from("logo")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`);
          return null;
        }

        const { data: publicUrlData } = supabase.storage.from("logo").getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      } catch (error) {
        organizationLogger.error("Upload logo error:", error);
        toast.error("Failed to upload logo. Please try again.");
        return null;
      }
    },
    [orgData],
  );

  // ----------------------------------------------------------
  // Orchestrator: upload jika ada file baru, return URL final
  // ----------------------------------------------------------
  const resolveLogoUrl = useCallback(async (): Promise<{
    url: string | null | undefined;
    ok: boolean;
  }> => {
    if (!logoFile) {
      // Tidak ada file baru, pakai URL existing
      return { url: orgData?.logo_url, ok: true };
    }

    const uploaded = await uploadLogo(logoFile);
    if (!uploaded) return { url: null, ok: false };

    // Reset state setelah berhasil upload
    setLogoFile(null);
    return { url: uploaded, ok: true };
  }, [logoFile, orgData?.logo_url, uploadLogo]);

  return {
    logoFile,
    logoPreview: logoPreview ?? orgData?.logo_url ?? null,
    isCompressing,
    compressionError,
    handleLogoChange,
    resolveLogoUrl,
  };
}