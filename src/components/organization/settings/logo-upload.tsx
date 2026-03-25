"use client";

// src/components/organization/settings/LogoUploader.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon } from "@/components/icons/lucide-exports";

interface LogoUploaderProps {
  logoPreview: string | null;
  orgName?: string;
  isCompressing: boolean;
  compressionError: string | null | undefined;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LogoUploader({
  logoPreview,
  orgName,
  isCompressing,
  compressionError,
  onChange,
}: LogoUploaderProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Organization Logo</Label>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt={`${orgName || "Organization"} logo preview`}
              className="block w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <Input
            id="logo-upload-input"
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => document.getElementById("logo-upload-input")?.click()}
            disabled={isCompressing}
            className="text-sm"
          >
            {isCompressing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {logoPreview ? "Change" : "Upload"}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (max 5MB)</p>
          {compressionError && (
            <p className="text-xs text-destructive">{compressionError}</p>
          )}
        </div>
      </div>
    </div>
  );
}