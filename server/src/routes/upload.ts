import { Router } from 'express';
import { upload, handleUploadError } from '@/middleware/upload';
import { authenticateToken } from '@/middleware/auth';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  deleteFile, 
  getFileInfo 
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

export default router;
