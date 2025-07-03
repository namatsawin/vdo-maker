# Organized Upload System

## Overview

The VDO Maker server now uses an organized upload system that automatically categorizes files into specific folders based on their file extensions. This provides better file management, easier maintenance, and clearer organization of generated assets.

## Directory Structure

```
uploads/
├── images/          # PNG, JPG, JPEG, GIF, WEBP files
├── videos/          # MP4, MOV, AVI, MKV files  
├── audios/          # MP3, WAV, FLAC, OGG files
├── others/          # Any other file types
└── merged/          # Final assembled videos (existing)
```

## File Categorization

Files are automatically categorized based on their extensions:

### Images (`uploads/images/`)
- `.png` - Portable Network Graphics
- `.jpg`, `.jpeg` - JPEG images
- `.gif` - Graphics Interchange Format
- `.webp` - WebP images

### Videos (`uploads/videos/`)
- `.mp4` - MPEG-4 video
- `.mov` - QuickTime video
- `.avi` - Audio Video Interleave
- `.mkv` - Matroska video

### Audios (`uploads/audios/`)
- `.mp3` - MPEG Audio Layer 3
- `.wav` - Waveform Audio File
- `.flac` - Free Lossless Audio Codec
- `.ogg` - Ogg Vorbis

### Others (`uploads/others/`)
- Any file type not matching the above categories

## API Changes

### Upload Responses

All upload endpoints now return additional `category` information:

```json
{
  "success": true,
  "data": {
    "file": {
      "id": "filename.png",
      "originalName": "original.png",
      "filename": "filename.png",
      "url": "/uploads/images/filename.png",
      "category": "images",
      "size": 1024,
      "mimetype": "image/png",
      "uploadedAt": "2025-07-03T03:00:00.000Z"
    }
  }
}
```

### New Endpoints

#### Get Upload Statistics
```http
GET /api/v1/upload/stats
```

Returns comprehensive statistics about uploaded files:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalFiles": 208,
      "totalSize": 157286400,
      "formattedTotalSize": "150.0 MB",
      "categories": {
        "images": {
          "fileCount": 139,
          "totalSize": 120000000,
          "formattedSize": "114.4 MB"
        },
        "videos": {
          "fileCount": 1,
          "totalSize": 74561,
          "formattedSize": "72.8 KB"
        },
        "audios": {
          "fileCount": 68,
          "totalSize": 37211839,
          "formattedSize": "35.5 MB"
        },
        "others": {
          "fileCount": 0,
          "totalSize": 0,
          "formattedSize": "0 Bytes"
        },
        "merged": {
          "fileCount": 81,
          "totalSize": 0,
          "formattedSize": "0 Bytes"
        }
      }
    }
  }
}
```

#### List Files by Category
```http
GET /api/v1/upload/category/{category}?limit=50&offset=0
```

Valid categories: `images`, `videos`, `audios`, `others`, `merged`, `root`

Returns paginated list of files in a specific category:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "image_example_1234567890.png",
        "url": "/uploads/images/image_example_1234567890.png",
        "category": "images",
        "size": 1048576,
        "formattedSize": "1.0 MB",
        "createdAt": "2025-07-03T03:00:00.000Z",
        "modifiedAt": "2025-07-03T03:00:00.000Z",
        "extension": ".png",
        "type": "image"
      }
    ],
    "pagination": {
      "total": 139,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Enhanced File Operations

#### File Info with Category Support
```http
GET /api/v1/upload/info/{filename}?category=images
```

If category is not provided, the system will search all categories to locate the file.

#### File Deletion with Category Support
```http
DELETE /api/v1/upload/{filename}?category=images
```

If category is not provided, the system will search all categories to locate and delete the file.

## AI Service Integration

### Image Generation
- **Imagen4 Service**: Saves generated images to `uploads/images/`
- **AI Controller**: Saves processed images to `uploads/images/`
- **URL Format**: `/uploads/images/image_{segmentId}_{timestamp}.png`

### Audio Generation
- **Gemini TTS Service**: Saves generated audio to `uploads/audios/`
- **URL Format**: `/uploads/audios/gemini-tts-{timestamp}-{randomId}.wav`

### Video Processing
- **FFmpeg Service**: Continues to use `uploads/merged/` for final videos
- **URL Format**: `/uploads/merged/{filename}.mp4`

## Migration

### Automatic Migration

A migration script has been provided to organize existing files:

```bash
# Run the migration script
cd server
node migrate-uploads.js
```

The script will:
1. Create organized directory structure
2. Move files from root uploads to appropriate categories
3. Provide detailed migration report
4. Skip files that already exist in target locations

### Migration Results

```
🎉 Migration completed!
✅ Migrated: 208 files
⏭️  Skipped: 0 files
❌ Errors: 0 files

📊 Files have been organized into:
  📁 images: 139 files
  📁 videos: 1 files
  📁 audios: 68 files
  📁 others: 0 files
```

## Backward Compatibility

### Legacy File Support

The system maintains backward compatibility:

- **File Access**: Legacy files in root uploads directory remain accessible
- **File Operations**: Delete and info operations search all locations
- **URL Patterns**: Both old and new URL patterns are supported

### Gradual Migration

- New uploads automatically use organized structure
- Existing files can be migrated using the migration script
- No breaking changes to existing functionality

## Benefits

### Organization
- **Clear Structure**: Files organized by type for easy navigation
- **Scalability**: Better performance with large numbers of files
- **Maintenance**: Easier backup and cleanup operations

### Development
- **Debugging**: Easier to locate specific file types during development
- **Monitoring**: Better insights into storage usage by file type
- **Analytics**: Detailed statistics about file distribution

### Operations
- **Storage Management**: Easier to implement type-specific storage policies
- **Backup Strategies**: Category-specific backup and retention policies
- **Performance**: Reduced directory scanning for file operations

## Configuration

### Environment Variables

No new environment variables are required. The system uses existing configuration:

```bash
UPLOAD_DIR=./uploads          # Base upload directory
MAX_FILE_SIZE=50MB           # Maximum file size
ALLOWED_FILE_TYPES=mp4,mov,avi,mp3,wav,png,jpg,jpeg  # Allowed extensions
```

### Directory Creation

The server automatically creates the organized directory structure on startup:

```typescript
// Created automatically on server start
uploads/
├── images/
├── videos/
├── audios/
├── others/
└── merged/
```

## Error Handling

### File Not Found

When a file is not found, the system searches all categories:

1. Check specified category (if provided)
2. Search all organized categories
3. Check root uploads directory (legacy)
4. Return 404 if not found anywhere

### Upload Errors

Upload errors include category information for better debugging:

```json
{
  "success": false,
  "error": {
    "message": "File type .xyz not allowed",
    "category": "others",
    "allowedTypes": ["mp4", "mov", "avi", "mp3", "wav", "png", "jpg", "jpeg"]
  }
}
```

## Testing

### Manual Testing

```bash
# Test file access
curl -I "http://localhost:3001/uploads/images/example.png"
curl -I "http://localhost:3001/uploads/audios/example.wav"
curl -I "http://localhost:3001/uploads/videos/example.mp4"

# Test API endpoints (requires authentication)
curl "http://localhost:3001/api/v1/upload/stats" -H "Authorization: Bearer {token}"
curl "http://localhost:3001/api/v1/upload/category/images" -H "Authorization: Bearer {token}"
```

### Integration Testing

The organized upload system integrates seamlessly with:

- **Frontend**: No changes required, URLs automatically updated
- **AI Services**: Automatically use organized structure
- **Database**: File URLs stored with correct category paths
- **Docker**: Works in both development and production containers

## Future Enhancements

### Planned Features

1. **Storage Quotas**: Per-category storage limits
2. **Cleanup Policies**: Automatic deletion of old files by category
3. **CDN Integration**: Category-specific CDN configurations
4. **Compression**: Category-specific compression settings
5. **Metadata**: Enhanced file metadata and tagging

### Monitoring

Future monitoring capabilities:
- Category-specific storage metrics
- Upload patterns by file type
- Performance metrics per category
- Storage growth trends

---

**Status**: ✅ Implemented and Tested  
**Migration**: ✅ Available  
**Backward Compatibility**: ✅ Maintained  
**Documentation**: ✅ Complete
