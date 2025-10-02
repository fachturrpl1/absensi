# Logo Upload Test Guide

## Testing the Fixed Logo Upload System

### 🧪 Test Cases

#### 1. **Basic Logo Upload Test**
- Go to `/organization/settings` page
- Click "Upload Logo" button
- Select any image file (JPG, PNG, etc.)
- Check browser console for debug logs
- Verify upload completes successfully

#### 2. **File Name Preservation Test**
- Upload a file with a specific name (e.g., `company-logo.png`)
- Check console logs to verify filename is preserved through compression
- Verify the final file path contains proper extension

#### 3. **File Size Test**
- Try uploading a file larger than 5MB
- Should show error message about file size
- Try with file under 5MB - should work

#### 4. **Replace Existing Logo Test**
- Upload a logo first
- Upload a different logo
- Verify old logo gets deleted from storage
- Check console logs for deletion confirmation

#### 5. **Error Handling Test**
- Try uploading non-image files
- Try uploading files without extensions
- Verify proper error messages appear

### 🔍 Debug Information to Watch For

#### Console Logs Should Show:
```
🔍 Original file details: { name: "logo.png", type: "image/png", size: 123456 }
🔍 Compressed file details: { name: "logo.png", type: "image/png", size: 67890 }
Original filename preserved: logo.png
Uploading file: { name: "logo.png", type: "image/png", size: 67890 }
Generated logo path for org: 123 filename: logo.png
Deleting old logo before uploading new one...
✅ Old logo deleted successfully: organization/org-123-1704891234.png
```

#### Error Messages Should Be Clear:
- `File size too large. Maximum size: 5MB`
- `Unsupported file format. Supported formats: ...`
- `Invalid file extension. Allowed extensions: ...`

### 🐛 Troubleshooting

#### If "Invalid filename provided" still occurs:
1. Check browser console for file details
2. Verify compressed file has `name` property
3. Confirm fallback filename generation works

#### If old logos aren't deleted:
1. Check console for deletion attempts
2. Verify Supabase storage permissions
3. Check logo URL format matches expected pattern

#### If compression fails:
1. Check file format is supported
2. Verify file size under limits
3. Check browser Web Worker support

### ✅ Expected Results

After successful upload:
- Logo appears in preview area
- Organization data updates with new logo URL
- Old logo files are cleaned up from storage
- File size is optimized through compression
- Error handling provides clear feedback

### 🔧 Advanced Testing

#### Storage Verification:
1. Go to Supabase Dashboard
2. Navigate to Storage → logo bucket
3. Check organization folder
4. Verify old files are removed after upload

#### Network Tab Verification:
1. Open browser DevTools
2. Go to Network tab
3. Upload logo
4. Verify POST request to Supabase storage
5. Check response status codes

### 📋 Test Checklist

- [ ] Logo upload works with various file formats
- [ ] File size limit (5MB) is enforced
- [ ] Old logos are automatically deleted
- [ ] Filename is preserved through compression
- [ ] Error messages are user-friendly
- [ ] Image compression reduces file size
- [ ] Preview shows uploaded image
- [ ] Database updates with new logo URL
- [ ] Storage cleanup removes orphaned files
- [ ] Console logs provide debugging information

### 🚀 Performance Notes

- Image compression reduces bandwidth usage
- Automatic cleanup prevents storage bloat  
- Web Workers prevent UI blocking during compression
- File validation prevents invalid uploads
- Fallback filename handles edge cases