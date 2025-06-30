import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { 
  generateScript, 
  generateImage,
  selectImage,
  getSegmentImages,
  generateVideo,
  getVideoStatus,
  cancelVideoGeneration,
  generateTTS, 
  generateIdeas,
  testAIConnection,
  getAvailableModels,
  getAvailableVoices
} from '@/controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Model information
router.get('/models', getAvailableModels);
router.get('/voices', getAvailableVoices);

// Script generation
router.post('/script/generate', generateScript);

// Video Ideas generation
router.post('/generate-ideas', generateIdeas);

// Image generation
router.post('/image/generate', generateImage);
router.get('/image/segment/:segmentId', getSegmentImages);
router.post('/image/select/:imageId', selectImage);

// Video generation
router.post('/video/generate', generateVideo);
router.get('/video/status/:taskId', getVideoStatus);
router.post('/video/cancel/:taskId', cancelVideoGeneration);

// Text-to-speech
router.post('/tts/generate', generateTTS);

// Test AI connections
router.get('/test', testAIConnection);

export default router;
