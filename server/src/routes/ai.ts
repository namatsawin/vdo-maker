import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { 
  generateScript, 
  reviseScript,
  generateImage,
  selectImage,
  getSegmentImages,
  generateVideo,
  selectVideo,
  getVideoStatus,
  cancelVideoGeneration,
  generateTTS, 
  generateIdeas,
  analyzeImagePrompt,
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

// Script generation and revision
router.post('/script/generate', generateScript);
router.post('/script/revise', reviseScript);

// Video Ideas generation
router.post('/generate-ideas', generateIdeas);

// Image generation
router.post('/image/generate', generateImage);
router.get('/image/segment/:segmentId', getSegmentImages);
router.post('/image/select/:imageId', selectImage);

// Prompt analysis
router.post('/prompt/analyze', analyzeImagePrompt);

// Video generation
router.post('/video/generate', generateVideo);
router.post('/video/select/:videoId', selectVideo);
router.get('/video/status/:taskId', getVideoStatus);
router.post('/video/cancel/:taskId', cancelVideoGeneration);

// Text-to-speech
router.post('/tts/generate', generateTTS);

// Test AI connections
router.get('/test', testAIConnection);

export default router;
