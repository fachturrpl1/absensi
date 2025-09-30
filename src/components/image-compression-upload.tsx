'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Download, Archive as Compress, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImageCompression } from '@/hooks/use-image-compression';
import { COMPRESSION_PRESETS, formatFileSize, CompressionResult } from '@/types/image-compression';
import { cn } from '@/lib/utils';

interface ImageCompressionUploadProps {
  onUpload?: (result: CompressionResult) => void;
  onError?: (error: string) => void;
  preset?: string;
  allowPresetChange?: boolean;
  maxFiles?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showStats?: boolean;
  autoCompress?: boolean;
}

interface CompressedImagePreview {
  id: string;
  result: CompressionResult;
  preview: string;
}

export function ImageCompressionUpload({
  onUpload,
  onError,
  preset = 'standard',
  allowPresetChange = true,
  maxFiles = 1,
  accept = 'image/*',
  className,
  disabled = false,
  showPreview = true,
  showStats = true,
  autoCompress = true
}: ImageCompressionUploadProps) {
  const [selectedPreset, setSelectedPreset] = useState(preset);
  const [previews, setPreviews] = useState<CompressedImagePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    compressImage,
    isCompressing,
    progress,
    error,
    abortCompression,
    validateFile
  } = useImageCompression({
    preset: selectedPreset,
    onError: (err) => onError?.(err.message),
    onSuccess: (result) => {
      onUpload?.(result);
      
      if (showPreview) {
        const preview: CompressedImagePreview = {
          id: Date.now().toString(),
          result,
          preview: result.dataUrl || ''
        };
        setPreviews(prev => {
          const newPreviews = [...prev, preview];
          return maxFiles === 1 ? [preview] : newPreviews.slice(-maxFiles);
        });
      }
    }
  });

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return;
    
    const filesToProcess = files.slice(0, maxFiles);
    
    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        onError?.(validation.error || 'Invalid file');
        continue;
      }
      
      if (autoCompress) {
        await compressImage(file);
      } else {
        // Just show preview without compression
        const preview: CompressedImagePreview = {
          id: Date.now().toString(),
          result: {
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
            file,
            dataUrl: URL.createObjectURL(file)
          },
          preview: URL.createObjectURL(file)
        };
        setPreviews(prev => {
          const newPreviews = [...prev, preview];
          return maxFiles === 1 ? [preview] : newPreviews.slice(-maxFiles);
        });
      }
    }
  }, [disabled, maxFiles, validateFile, autoCompress, compressImage, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const removePreview = useCallback((id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
  }, []);

  const downloadCompressed = useCallback((preview: CompressedImagePreview) => {
    const link = document.createElement('a');
    link.href = preview.preview;
    link.download = `compressed_${preview.result.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const compressManually = useCallback(async (preview: CompressedImagePreview) => {
    if (preview.result.compressionRatio === 0) {
      await compressImage(preview.result.file);
    }
  }, [compressImage]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Selector */}
      {allowPresetChange && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Compression Preset:</label>
          <Select value={selectedPreset} onValueChange={setSelectedPreset} disabled={disabled || isCompressing}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMPRESSION_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span>{preset.name}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Upload Area */}
      <Card className={cn(
        'relative transition-colors duration-200',
        isDragOver && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        <CardContent className="p-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary/5'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={maxFiles > 1}
              accept={accept}
              className="hidden"
              onChange={handleFileInputChange}
              disabled={disabled}
            />
            
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragOver ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {maxFiles === 1 ? 'Single image' : `Up to ${maxFiles} images`} • PNG, JPG, WebP up to 20MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isCompressing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compressing...</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">{progress.percentage}%</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={abortCompression}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Previews */}
      {showPreview && previews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Compressed Images</h3>
          <div className="grid gap-4">
            {previews.map((preview) => (
              <Card key={preview.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={preview.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {preview.result.file.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {preview.result.compressionRatio > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Compress className="h-3 w-3 mr-1" />
                              {preview.result.compressionRatio}% saved
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {showStats && (
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Original:</span> {formatFileSize(preview.result.originalSize)}
                          </div>
                          <div>
                            <span className="font-medium">Compressed:</span> {formatFileSize(preview.result.compressedSize)}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {preview.result.compressionRatio === 0 && autoCompress === false && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => compressManually(preview)}
                            disabled={isCompressing}
                          >
                            {isCompressing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Compress className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCompressed(preview)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePreview(preview.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified version for quick uploads
export function SimpleImageUpload({
  onUpload,
  className,
  ...props
}: Omit<ImageCompressionUploadProps, 'showPreview' | 'showStats' | 'allowPresetChange'>) {
  return (
    <ImageCompressionUpload
      {...props}
      onUpload={onUpload}
      className={className}
      showPreview={false}
      showStats={false}
      allowPresetChange={false}
    />
  );
}

// Avatar-specific upload component
export function AvatarImageUpload({
  onUpload,
  className,
  ...props
}: Omit<ImageCompressionUploadProps, 'preset' | 'maxFiles' | 'allowPresetChange'>) {
  return (
    <ImageCompressionUpload
      {...props}
      onUpload={onUpload}
      className={className}
      preset="avatar"
      maxFiles={1}
      allowPresetChange={false}
    />
  );
}
