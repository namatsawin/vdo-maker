import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '@/middleware/errorHandler';

// Helper function to determine file category based on extension
const getFileCategory = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.ogg'];
  
  if (imageExts.includes(ext)) return 'images';
  if (videoExts.includes(ext)) return 'videos';
  if (audioExts.includes(ext)) return 'audios';
  return 'others';
};

// Helper function to ensure directory exists
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = getFileCategory(file.originalname);
    const uploadDir = path.join(__dirname, '../../uploads', category);
    
    // Ensure the category directory exists
    ensureDirectoryExists(uploadDir);
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'mp4,mov,avi,mp3,wav,png,jpg,jpeg')
    .split(',')
    .map(type => type.trim());
  
  const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
});

// Error handler for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(createError('File too large. Maximum size is 50MB', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(createError('Too many files', 400));
    }
    return next(createError(`Upload error: ${error.message}`, 400));
  }
  
  if (error.message.includes('File type')) {
    return next(createError(error.message, 400));
  }
  
  next(error);
};

export { upload, getFileCategory };
