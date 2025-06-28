import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { 
  generateScript, 
  generateTTS, 
  testAIConnection 
} from '@/controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Script generation
router.post('/script/generate', generateScript);

// Text-to-speech
router.post('/tts/generate', generateTTS);

// Test AI connections
router.get('/test', testAIConnection);

export default router;
