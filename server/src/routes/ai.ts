import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { 
  generateScript, 
  generateImage,
  generateVideo,
  getVideoStatus,
  cancelVideoGeneration,
  generateTTS, 
  testAIConnection 
} from '@/controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Script generation
router.post('/script/generate', generateScript);

// Image generation
router.post('/image/generate', generateImage);

// Video generation
router.post('/video/generate', generateVideo);
router.get('/video/status/:taskId', getVideoStatus);
router.post('/video/cancel/:taskId', cancelVideoGeneration);

// Text-to-speech
router.post('/tts/generate', generateTTS);

// Test AI connections
router.get('/test', testAIConnection);

export default router;
