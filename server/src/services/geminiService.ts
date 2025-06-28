import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/utils/logger';
import { ScriptGenerationRequest, ScriptSegment } from '@/types';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptSegment[]> {
    try {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
      
      // Return fallback segments if API fails
      return this.getFallbackSegments(request);
    }
  }

  async generateTextToSpeech(text: string, voice: string = 'default'): Promise<string> {
    try {
      // Note: Gemini doesn't have built-in TTS, so we'll simulate this
      // In a real implementation, you'd use Google Cloud Text-to-Speech API
      
      logger.info(`TTS generation requested for voice: ${voice}`);
      
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

  private getFallbackSegments(request: ScriptGenerationRequest): ScriptSegment[] {
    return [
      {
        order: 1,
        script: `Welcome to our exploration of ${request.title}. This is an exciting topic that we'll dive deep into today.`,
        videoPrompt: 'Opening scene with engaging visuals related to the main topic, bright and welcoming atmosphere'
      },
      {
        order: 2,
        script: `Let's start by understanding the key concepts and why ${request.title} matters in today's world.`,
        videoPrompt: 'Educational visuals showing key concepts, diagrams or illustrations that explain the main ideas'
      },
      {
        order: 3,
        script: `Now we'll look at practical examples and real-world applications that demonstrate these principles in action.`,
        videoPrompt: 'Real-world examples, case studies, or demonstrations showing practical applications'
      },
      {
        order: 4,
        script: `To wrap up, let's summarize the key takeaways and how you can apply this knowledge moving forward.`,
        videoPrompt: 'Conclusion scene with summary graphics, call-to-action visuals, and forward-looking imagery'
      }
    ];
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello, this is a test. Please respond with "Connection successful".');
      const response = await result.response;
      const text = response.text();
      
      logger.info('Gemini connection test successful');
      return text.toLowerCase().includes('connection successful') || text.length > 0;
    } catch (error) {
      logger.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
