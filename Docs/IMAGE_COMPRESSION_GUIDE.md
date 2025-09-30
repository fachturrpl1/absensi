# Image Compression System

A comprehensive image compression system for your Next.js application with both client-side and server-side compression capabilities.

## Features

- **Client-side compression** using `browser-image-compression`
- **Server-side compression** using `sharp`
- **Multiple compression presets** (avatar, thumbnail, standard, high-quality, document)
- **Real-time progress tracking**
- **Automatic format optimization** (WebP, AVIF support)
- **Image validation and error handling**
- **React hooks for easy integration**
- **Reusable UI components**
- **API routes for server-side processing**

## Installation

The required dependencies are already installed:

```bash
npm install sharp browser-image-compression @types/sharp @radix-ui/react-progress
```

## File Structure

```
src/
├── types/
│   └── image-compression.ts          # TypeScript interfaces and presets
├── lib/
│   └── image-compression.ts          # Server-side compression utilities
├── hooks/
│   └── use-image-compression.ts      # React hooks for client-side compression
├── components/
│   ├── image-compression-upload.tsx  # Main upload component
│   ├── photo-upload-dialog.tsx       # Updated photo upload dialog
│   └── change-foto.tsx              # Updated logo change component
├── app/api/
│   ├── image-compression/
│   │   └── route.ts                 # API for compression with presets
│   └── optimize-image/
│       └── route.ts                 # API for web optimization
```

## Compression Presets

| Preset | Description | Max Size | Max Dimensions | Format | Quality |
|--------|-------------|----------|----------------|--------|---------|
| `avatar` | Small circular profile pictures | 0.5MB | 400x400 | WebP | 85% |
| `thumbnail` | Small preview images | 0.3MB | 300x300 | WebP | 75% |
| `standard` | Regular images for general use | 1MB | 1920x1080 | WebP | 85% |
| `highQuality` | High quality with minimal compression | 2MB | 2560x1440 | WebP | 95% |
| `document` | Text documents and screenshots | 1.5MB | 1920x1080 | PNG | 90% |

## Usage Examples

### 1. Basic Image Upload with Compression

```tsx
import { ImageCompressionUpload } from '@/components/image-compression-upload';
import { CompressionResult } from '@/types/image-compression';

function MyComponent() {
  const handleUpload = (result: CompressionResult) => {
    console.log('Compressed image:', {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      file: result.file
    });
  };

  return (
    <ImageCompressionUpload
      onUpload={handleUpload}
      preset="standard"
      showPreview={true}
      showStats={true}
    />
  );
}
```

### 2. Avatar Upload

```tsx
import { AvatarImageUpload } from '@/components/image-compression-upload';

function AvatarUpload() {
  return (
    <AvatarImageUpload
      onUpload={(result) => {
        // Handle avatar upload
        uploadAvatar(result.file);
      }}
      className="max-w-md"
    />
  );
}
```

### 3. Using the Compression Hook

```tsx
import { useImageCompression } from '@/hooks/use-image-compression';

function CustomUpload() {
  const {
    compressImage,
    isCompressing,
    progress,
    error
  } = useImageCompression({
    preset: 'thumbnail',
    onSuccess: (result) => {
      console.log('Compression completed:', result);
    }
  });

  const handleFileSelect = async (file: File) => {
    const result = await compressImage(file);
    if (result) {
      // Use compressed file
      await uploadFile(result.file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
      {isCompressing && (
        <div>Compressing... {progress.percentage}%</div>
      )}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### 4. Server-side API Usage

```tsx
// Compress with preset
const compressWithPreset = async (file: File, preset: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('preset', preset);

  const response = await fetch('/api/image-compression', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Optimize for web
const optimizeForWeb = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('maxWidth', '1920');
  formData.append('maxHeight', '1080');
  formData.append('quality', '85');
  formData.append('format', 'webp');

  const response = await fetch('/api/optimize-image', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

### 5. Server-side Compression in API Routes

```tsx
import { imageCompressor } from '@/lib/image-compression';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Compress with preset
  const result = await imageCompressor.compressWithPreset(buffer, 'standard');
  
  // Or create multiple variants
  const variants = await imageCompressor.createVariants(buffer, ['thumbnail', 'standard']);
  
  return NextResponse.json({ result, variants });
}
```

## Advanced Features

### Multiple File Upload

```tsx
<ImageCompressionUpload
  maxFiles={5}
  onUpload={(result) => {
    // Handle each compressed file
  }}
/>
```

### Custom Compression Options

```tsx
const { compressImage } = useImageCompression({
  customOptions: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1500,
    initialQuality: 0.9,
    useWebWorker: true,
    preserveExif: false
  }
});
```

### Progress Tracking

```tsx
const { compressImage, progress } = useImageCompression({
  onProgress: (percentage) => {
    console.log(`Compression progress: ${percentage}%`);
  }
});
```

### Abort Compression

```tsx
const { compressImage, abortCompression, isCompressing } = useImageCompression();

// Abort if needed
if (isCompressing) {
  abortCompression();
}
```

## API Endpoints

### POST `/api/image-compression`

Compress images using predefined presets.

**Parameters:**
- `file` (File): Image file to compress
- `preset` (string): Compression preset name
- `variants` (string, optional): Comma-separated list of variants to create

**Response:**
```json
{
  "success": true,
  "data": "base64-encoded-image",
  "info": { "width": 800, "height": 600, "format": "webp" },
  "originalSize": 2048576,
  "compressedSize": 204857,
  "compressionRatio": 90,
  "mimeType": "image/webp"
}
```

### POST `/api/optimize-image`

Optimize images for web delivery with custom parameters.

**Parameters:**
- `file` (File): Image file to optimize
- `maxWidth` (number): Maximum width
- `maxHeight` (number): Maximum height
- `quality` (number): Compression quality (1-100)
- `format` (string): Output format ('auto', 'jpeg', 'webp', 'avif')

### GET `/api/image-compression?preset=<name>`

Get information about compression presets.

## Performance Tips

1. **Use WebP format** for better compression ratios
2. **Enable web workers** for non-blocking compression
3. **Choose appropriate presets** for your use case
4. **Consider server-side compression** for large files
5. **Use progressive JPEG** for faster loading

## Error Handling

```tsx
const { compressImage, error } = useImageCompression({
  onError: (error) => {
    console.error('Compression failed:', error.message);
    toast.error(`Compression failed: ${error.message}`);
  }
});
```

## Browser Support

- **WebP**: Chrome 23+, Firefox 65+, Safari 14+
- **AVIF**: Chrome 85+, Firefox 93+
- **Web Workers**: All modern browsers
- **File API**: All modern browsers

## Troubleshooting

### Common Issues

1. **"Sharp not found" error**: Make sure Sharp is installed correctly
2. **Memory issues**: Use server-side compression for large files
3. **Slow compression**: Enable web workers and consider lower quality settings
4. **Format not supported**: Check browser compatibility for advanced formats

### Debug Mode

Enable debug logging:

```tsx
const { compressImage } = useImageCompression({
  onProgress: (progress) => console.log('Progress:', progress),
  onError: (error) => console.error('Error:', error),
  onSuccess: (result) => console.log('Success:', result)
});
```

## License

This image compression system is part of your Next.js application.
