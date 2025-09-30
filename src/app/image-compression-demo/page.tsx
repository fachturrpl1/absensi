'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ImageCompressionUpload, 
  AvatarImageUpload, 
  SimpleImageUpload 
} from '@/components/image-compression-upload';
import { 
  useImageCompression, 
  useAvatarCompression, 
  useThumbnailCompression 
} from '@/hooks/use-image-compression';
import { 
  CompressionResult, 
  COMPRESSION_PRESETS, 
  formatFileSize 
} from '@/types/image-compression';
import { 
  Image as ImageIcon, 
  Upload, 
  Settings, 
  BarChart3, 
  Zap, 
  Shield 
} from 'lucide-react';

export default function ImageCompressionDemo() {
  const [results, setResults] = useState<CompressionResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiResult, setApiResult] = useState<{
    success: boolean;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    info?: { format?: string };
  } | null>(null);

  const { compressImage, isCompressing, progress, error } = useImageCompression({
    preset: 'standard',
    onSuccess: (result) => {
      setResults(prev => [...prev, result]);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await compressImage(file);
    }
  };

  const testApiCompression = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('preset', 'standard');

    try {
      const response = await fetch('/api/image-compression', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      setApiResult(result);
    } catch (error) {
      console.error('API compression failed:', error);
    }
  };

  const clearResults = () => {
    setResults([]);
    setApiResult(null);
    setSelectedFile(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Image Compression System</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A comprehensive image compression solution with client-side and server-side processing,
          multiple presets, and real-time optimization.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <Zap className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Fast Compression</p>
              <p className="text-sm text-muted-foreground">Web Workers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <Settings className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Multiple Presets</p>
              <p className="text-sm text-muted-foreground">5 Built-in</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Progress Tracking</p>
              <p className="text-sm text-muted-foreground">Real-time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <Shield className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium">Validation</p>
              <p className="text-sm text-muted-foreground">Built-in</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload Demo</TabsTrigger>
          <TabsTrigger value="avatar">Avatar Upload</TabsTrigger>
          <TabsTrigger value="api">API Testing</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Upload Demo */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Image Upload</CardTitle>
              <CardDescription>
                Upload images with automatic compression using the standard preset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCompressionUpload
                onUpload={(result) => {
                  setResults(prev => [...prev, result]);
                }}
                preset="standard"
                showPreview={true}
                showStats={true}
                maxFiles={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simple Upload (No Preview)</CardTitle>
              <CardDescription>
                Minimal upload interface without preview or statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleImageUpload
                onUpload={(result) => {
                  console.log('Simple upload result:', result);
                }}
                preset="thumbnail"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avatar Upload */}
        <TabsContent value="avatar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avatar Upload</CardTitle>
              <CardDescription>
                Optimized for profile pictures with square cropping and small file sizes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarImageUpload
                onUpload={(result) => {
                  console.log('Avatar upload result:', result);
                  setResults(prev => [...prev, result]);
                }}
                className="max-w-md mx-auto"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Testing */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
              <CardDescription>
                Test server-side compression using the API endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                {selectedFile && (
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                    <Button onClick={testApiCompression} size="sm">
                      Test API Compression
                    </Button>
                  </div>
                )}
              </div>

              {apiResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">API Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Original Size:</strong> {formatFileSize(apiResult.originalSize)}</p>
                        <p><strong>Compressed Size:</strong> {formatFileSize(apiResult.compressedSize)}</p>
                      </div>
                      <div>
                        <p><strong>Compression Ratio:</strong> {apiResult.compressionRatio}%</p>
                        <p><strong>Format:</strong> {apiResult.info?.format}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compression Presets</CardTitle>
              <CardDescription>
                Available presets with their configurations and use cases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(COMPRESSION_PRESETS).map(([key, preset]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{preset.name}</h3>
                            <Badge variant="outline">{key}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p><strong>Max Size:</strong> {preset.client.maxSizeMB}MB</p>
                          <p><strong>Max Dimensions:</strong> {preset.client.maxWidthOrHeight}px</p>
                          <p><strong>Initial Quality:</strong> {(preset.client.initialQuality || 1) * 100}%</p>
                        </div>
                        <div>
                          <p><strong>Server Format:</strong> {preset.server.format}</p>
                          <p><strong>Server Quality:</strong> {preset.server.quality}%</p>
                          <p><strong>Fit Mode:</strong> {preset.server.fit}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compression Results</CardTitle>
                  <CardDescription>
                    Results from all compression operations performed in this session.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={clearResults} size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No compression results yet. Upload some images to see results here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {result.dataUrl && (
                              <img
                                src={result.dataUrl}
                                alt="Compressed"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{result.file.name}</h4>
                              <Badge variant="secondary">
                                {result.compressionRatio}% saved
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div>
                                <p><strong>Original:</strong> {formatFileSize(result.originalSize)}</p>
                              </div>
                              <div>
                                <p><strong>Compressed:</strong> {formatFileSize(result.compressedSize)}</p>
                              </div>
                              <div>
                                <p><strong>Type:</strong> {result.file.type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
