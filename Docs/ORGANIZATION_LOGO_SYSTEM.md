# Organization Logo Upload System

## Overview
The organization logo upload system provides automatic compression, validation, and cleanup functionality for organization logos in the Presensi application.

## Features

### ✅ Fixed Issues
- **Error Fix**: Fixed `filename is undefined` error in `getOrganizationLogoPath()`
- **File Size Limit**: Reduced maximum upload size to 5MB for all compression presets
- **Auto Cleanup**: Automatic deletion of old logos when uploading new ones
- **Enhanced Validation**: Better error handling and file validation

### 🔧 Technical Implementation

#### File Size Limits
All image compression presets now have a maximum size limit of 5MB:
- Avatar: 5MB (was 5MB)
- Standard: 5MB (was 10MB)
- Document: 5MB (was 15MB) 
- High Quality: 5MB (was 20MB)

#### Upload Process
1. **File Validation**: Validates file type, size, and extension
2. **Image Compression**: Automatically compresses images using browser-image-compression
3. **Old Logo Cleanup**: Deletes previous logo from Supabase storage (if exists)
4. **Upload New Logo**: Uploads the compressed image to `logo` bucket
5. **Database Update**: Updates organization record with new logo URL

#### File Path Structure
```
logo/
└── organization/
    └── org-{orgId}-{timestamp}.{extension}
```

Example: `org-123-1704891234567.jpg`

### 🛠️ Functions

#### `getOrganizationLogoPath(orgId: number, filename: string): string`
Generates a unique file path for organization logos.

**Parameters:**
- `orgId`: Organization ID
- `filename`: Original filename with extension

**Returns:** File path string

**Throws:** Error if filename is invalid or missing extension

#### `deleteOrganizationLogo(logoUrl: string): Promise<boolean>`
Deletes an organization logo from Supabase storage.

**Parameters:**
- `logoUrl`: Full public URL of the logo

**Returns:** Boolean indicating success/failure

**Features:**
- Extracts file path from public URL
- Handles URL parsing errors gracefully
- Provides detailed logging

#### `uploadLogo(file: File): Promise<string | null>`
Enhanced upload function with automatic cleanup.

**Process:**
1. Generates safe filename
2. Deletes old logo (if exists)
3. Uploads new file with upsert option
4. Returns public URL

### 📝 Usage Example

```typescript
// In organization settings page
const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // Validate and compress
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const compressionResult = await compressImage(file);
    if (compressionResult) {
      setLogoFile(compressionResult.file);
      setLogoPreview(compressionResult.dataUrl);
      toast.success('Logo ready to upload');
    }
  } catch (error) {
    toast.error('Failed to process image');
  }
};
```

### 🔒 Security & Validation

#### File Type Validation
Supported formats:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/bmp`
- `image/gif`

#### Extension Validation
Allowed extensions:
- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.bmp`
- `.gif`

#### Size Limits
- Maximum file size: 5MB
- Automatic compression applied
- Progress feedback during upload

### 🚨 Error Handling

#### Common Errors
1. **Filename Undefined**: Fixed by adding null checks and error handling
2. **Invalid Extension**: Validated before processing
3. **Upload Failures**: Graceful error handling with user feedback
4. **Storage Permissions**: Proper error messages for access issues

#### Error Messages
- `Invalid filename provided`: File name is null or invalid
- `File must have a valid extension`: Missing file extension
- `Upload failed: {error}`: Supabase upload error
- `Invalid file name. Please choose another file.`: Path generation failed

### 📊 Compression Settings

#### Standard Preset (used for logos)
- **Max Size**: 1MB after compression
- **Max Dimensions**: 1920x1080px
- **Quality**: 85%
- **Format**: WebP (when possible)
- **Web Worker**: Enabled for better performance

### 🔄 Automatic Cleanup

The system automatically:
1. Detects existing logos before upload
2. Extracts file path from public URL
3. Removes old files from storage
4. Continues upload even if deletion fails
5. Logs all operations for debugging

### 💡 Best Practices

1. **File Naming**: Use descriptive, lowercase names
2. **Image Quality**: Upload high-quality images (system will optimize)
3. **Dimensions**: Recommended minimum 400x400px for logos
4. **Format**: PNG for logos with transparency, JPG for photos
5. **Testing**: Always test uploads in development environment

### 🐛 Debugging

#### Console Logs
The system provides detailed console logging:
- File compression progress
- Upload status
- Deletion attempts
- Error details

#### Common Issues
1. **Storage Bucket Access**: Verify `logo` bucket exists and has proper policies
2. **File Permissions**: Check Supabase storage policies for authenticated users
3. **URL Format**: Ensure logo URLs match expected format for deletion

### 📋 Checklist for Setup
- [ ] Supabase `logo` bucket exists
- [ ] `organization` folder in bucket is accessible
- [ ] Storage policies allow authenticated uploads
- [ ] RLS policies are properly configured
- [ ] File size limits are appropriate for your use case