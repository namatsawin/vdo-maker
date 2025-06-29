import { GoogleGenAI } from '@google/genai';
import { logger } from '@/utils/logger';
import { ScriptGenerationRequest, ScriptSegment, GeminiModel } from '@/types';

class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenAI({
      apiKey: apiKey
    });
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptSegment[]> {
    try {
      const model = request.model || GeminiModel.GEMINI_1_5_FLASH;
      
      const prompt = `
Create a video script for the topic: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}

Please generate a script divided into 3-5 segments. Each segment should be 15-30 seconds long when spoken.

For each segment, provide:
1. A clear, engaging script (what will be spoken)
2. A detailed video prompt (describing what should be shown visually)

Format your response as a JSON array with this structure:
[
  {
    "order": 1,
    "script": "The spoken content for this segment...",
    "videoPrompt": "Visual description: A detailed description of what should be shown in the video..."
  }
]

Make sure the script flows naturally from one segment to the next, and the video prompts are detailed enough for AI video generation.
`;

      logger.info(`Generating script using model: ${model}`);

      const result = await this.genAI.models.generateContent({
        model: model,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      // Extract text from the new response format
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      logger.info('Gemini script generation response received');

      // Try to parse JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Gemini response');
      }

      const segments: ScriptSegment[] = JSON.parse(jsonMatch[0]);
      
      // Validate and clean up segments
      return segments.map((segment, index) => ({
        order: index + 1,
        script: segment.script || '',
        videoPrompt: segment.videoPrompt || ''
      }));

    } catch (error) {
      logger.error('Gemini script generation failed:', error);
      throw error;
    }
  }

  async generateTextToSpeech(text: string, voice: string = 'default', model?: GeminiModel): Promise<string> {
    try {
      // Note: Gemini doesn't have built-in TTS, so we'll simulate this
      // In a real implementation, you'd use Google Cloud Text-to-Speech API
      
      const selectedModel = model || GeminiModel.GEMINI_1_5_FLASH;
      logger.info(`TTS generation requested for voice: ${voice}, model: ${selectedModel}`);
      
      // For MVP, we'll return a placeholder URL
      // In production, integrate with Google Cloud Text-to-Speech
      const audioUrl = `/uploads/tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      
      // Simulate TTS processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      logger.info('TTS generation completed (simulated)');
      return audioUrl;
      
    } catch (error) {
      logger.error('TTS generation failed:', error);
      throw error;
    }
  }

  async testConnection(model?: GeminiModel): Promise<{ status: string; model: string }> {
    try {
      const selectedModel = model || GeminiModel.GEMINI_1_5_FLASH;
      
      // Test with a simple prompt
      const result = await this.genAI.models.generateContent({
        model: selectedModel,
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello, respond with "Connection successful"' }]
        }]
      });

      // Extract text from the new response format
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      logger.info(`Gemini connection test successful with model: ${selectedModel}`);
      
      return {
        status: 'connected',
        model: selectedModel
      };
      
    } catch (error) {
      logger.error('Gemini connection test failed:', error);
      return {
        status: 'error',
        model: model || GeminiModel.GEMINI_1_5_FLASH
      };
    }
  }

  getAvailableModels(): { value: GeminiModel; label: string; description: string }[] {
    return [
      {
        value: GeminiModel.GEMINI_1_5_FLASH,
        label: 'Gemini 1.5 Flash',
        description: 'Fast and efficient for most tasks'
      },
      {
        value: GeminiModel.GEMINI_1_5_FLASH_8B,
        label: 'Gemini 1.5 Flash-8B',
        description: 'Smaller, faster model for simple tasks'
      },
      {
        value: GeminiModel.GEMINI_1_5_PRO,
        label: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex tasks'
      },
      {
        value: GeminiModel.GEMINI_1_0_PRO,
        label: 'Gemini 1.0 Pro',
        description: 'Legacy model for compatibility'
      }
    ];
  }
}

export const geminiService = new GeminiService();
