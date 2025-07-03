import { Router } from 'express';
import { upload, handleUploadError } from '@/middleware/upload';
import { authenticateToken } from '@/middleware/auth';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  deleteFile, 
  getFileInfo,
  getUploadStats,
  listFilesByCategory
} from '@/controllers/uploadController';

const router = Router();

// All upload routes require authentication
router.use(authenticateToken);

// Single file upload
router.post('/single', upload.single('file'), handleUploadError, uploadFile);

// Multiple files upload
router.post('/multiple', upload.array('files', 10), handleUploadError, uploadMultipleFiles);

// Get file info
router.get('/info/:filename', getFileInfo);

// Delete file
router.delete('/:filename', deleteFile);

// Get upload statistics and organization info
router.get('/stats', getUploadStats);

// List files by category
router.get('/category/:category', listFilesByCategory);

export default router;
