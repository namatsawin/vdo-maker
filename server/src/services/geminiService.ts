import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '@/utils/logger';
import { ScriptGenerationRequest, ScriptSegment, GeminiModel } from '@/types';

// JSON Schema for structured output using proper Type enum
const VIDEO_IDEAS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for the idea"
          },
          title: {
            type: Type.STRING,
            description: "Catchy, engaging video title"
          },
          description: {
            type: Type.STRING,
            description: "Detailed 2-3 sentence description of the video concept"
          },
          estimatedDuration: {
            type: Type.STRING,
            description: "Estimated video duration (e.g., '3-5 minutes', '2-3 minutes')"
          },
          targetAudience: {
            type: Type.STRING,
            description: "Target audience for the video"
          },
          difficulty: {
            type: Type.STRING,
            enum: ["Easy", "Medium", "Hard"],
            description: "Production difficulty level"
          }
        },
        required: ["id", "title", "description", "estimatedDuration", "targetAudience", "difficulty"],
        propertyOrdering: ["id", "title", "description", "estimatedDuration", "targetAudience", "difficulty"]
      }
    }
  },
  required: ["ideas"],
  propertyOrdering: ["ideas"]
};

const SCRIPT_SEGMENTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: {
            type: Type.INTEGER,
            description: "Segment order number starting from 1"
          },
          script: {
            type: Type.STRING,
            description: "The spoken content for this segment"
          },
          videoPrompt: {
            type: Type.STRING,
            description: "Detailed visual description for video generation"
          }
        },
        required: ["order", "script", "videoPrompt"],
        propertyOrdering: ["order", "script", "videoPrompt"]
      }
    }
  },
  required: ["segments"],
  propertyOrdering: ["segments"]
};

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
      const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
      
      const prompt = `
Create a video script for the topic: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}

Please generate a script divided into 3-5 segments. Each segment should be 15-30 seconds long when spoken.

For each segment, provide:
1. A clear, engaging script (what will be spoken)
2. A detailed video prompt (describing what should be shown visually)

Make sure the script flows naturally from one segment to the next, and the video prompts are detailed enough for AI video generation.
`;

      logger.info(`Generating script using model: ${model} with structured output`);

      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SCRIPT_SEGMENTS_SCHEMA
        }
      });

      // Extract structured response
      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response received from Gemini');
      }

      // Parse the structured JSON response
      const response = JSON.parse(text);
      const segments: ScriptSegment[] = response.segments.map((segment: any) => ({
        id: `segment-${segment.order}`,
        order: segment.order,
        script: segment.script,
        videoPrompt: segment.videoPrompt,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      logger.info(`Successfully generated ${segments.length} script segments with structured output`);
      return segments;
      
    } catch (error) {
      logger.error('Script generation with structured output failed:', error);
      // Fallback to original method if structured output fails
      return this.generateScriptFallback(request);
    }
  }

  private async generateScriptFallback(request: ScriptGenerationRequest): Promise<ScriptSegment[]> {
    try {
      const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
      
      const prompt = `
Create a video script for the topic: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}

Please generate a script divided into 3-5 segments. Each segment should be 15-30 seconds long when spoken.

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

      logger.info(`Using fallback method for script generation`);

      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt
      });

      const text = result.text;

      logger.info('Gemini script generation response received');

      if (!text) {
        throw new Error('No response received from Gemini fallback');
      }

      // Try to parse JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Gemini response');
      }

      const segments: ScriptSegment[] = JSON.parse(jsonMatch[0]);
      
      // Validate and clean up segments
      return segments.map((segment, index) => ({
        id: `segment-${segment.order || index + 1}`,
        order: segment.order || index + 1,
        script: segment.script || '',
        videoPrompt: segment.videoPrompt || '',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
    } catch (error) {
      logger.error('Fallback script generation failed:', error);
      throw error;
    }
  }

  async generateTextToSpeech(text: string, voice: string = 'default', model?: GeminiModel): Promise<string> {
    try {
      // Note: Gemini doesn't have built-in TTS, so we'll simulate this
      // In a real implementation, you'd use Google Cloud Text-to-Speech API
      
      const selectedModel = model || GeminiModel.GEMINI_2_5_FLASH;
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
      const selectedModel = model || GeminiModel.GEMINI_2_5_FLASH;
      
      // Test with a simple prompt
      const result = await this.genAI.models.generateContent({
        model: selectedModel,
        contents: 'Hello, respond with "Connection successful"'
      });

      // Extract text from the response
      const text = result.text || '';
      
      logger.info(`Gemini connection test successful with model: ${selectedModel}`);
      
      return {
        status: 'connected',
        model: selectedModel
      };
      
    } catch (error) {
      logger.error('Gemini connection test failed:', error);
      return {
        status: 'error',
        model: model || GeminiModel.GEMINI_2_5_FLASH
      };
    }
  }

  async generateVideoIdeas(request: { topic: string; model?: GeminiModel; count?: number }): Promise<any[]> {
    try {
      const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
      const count = request.count || 5;
      
      const prompt = `
Generate ${count} creative video ideas for the topic: "${request.topic}"

For each idea, provide:
1. A catchy, engaging title
2. A detailed description (2-3 sentences)
3. Estimated duration (e.g., "2-3 minutes", "5-7 minutes")
4. Target audience (e.g., "General audience", "Tech enthusiasts", "Students")
5. Difficulty level (Easy, Medium, or Hard)

Make the ideas diverse, creative, and suitable for video content creation. Consider different angles, formats, and approaches to the topic.

Ensure each idea is unique, creative, and actionable for video production.
`;

      logger.info(`Generating ${count} video ideas for topic: ${request.topic} using model: ${model} with structured output`);

      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: VIDEO_IDEAS_SCHEMA
        }
      });

      // Extract structured response
      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response received from Gemini');
      }

      // Parse the structured JSON response
      const response = JSON.parse(text);
      const ideas = response.ideas.map((idea: any, index: number) => ({
        id: idea.id || `idea-${Date.now()}-${index}`,
        title: idea.title,
        description: idea.description,
        estimatedDuration: idea.estimatedDuration,
        targetAudience: idea.targetAudience,
        difficulty: idea.difficulty
      }));

      logger.info(`Successfully generated ${ideas.length} video ideas with structured output`);
      return ideas;
      
    } catch (error) {
      logger.error('Video ideas generation with structured output failed:', error);
      // Fallback to original method if structured output fails
      return this.generateVideoIdeasFallback(request);
    }
  }

  private async generateVideoIdeasFallback(request: { topic: string; model?: GeminiModel; count?: number }): Promise<any[]> {
    try {
      const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
      const count = request.count || 5;
      
      const prompt = `
Generate ${count} creative video ideas for the topic: "${request.topic}"

Format your response as a JSON array with this structure:
[
  {
    "id": "unique-id-1",
    "title": "Engaging video title",
    "description": "Detailed description of the video concept and what it will cover...",
    "estimatedDuration": "3-5 minutes",
    "targetAudience": "General audience",
    "difficulty": "Medium"
  }
]
`;

      logger.info(`Using fallback method for video ideas generation`);

      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt
      });

      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response received from Gemini');
      }

      // Parse the JSON response
      let ideas;
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No valid JSON array found in response');
        }
        
        ideas = JSON.parse(jsonMatch[0]);
        
        // Validate and ensure each idea has required fields
        ideas = ideas.map((idea: any, index: number) => ({
          id: idea.id || `idea-${Date.now()}-${index}`,
          title: idea.title || `Video Idea ${index + 1}`,
          description: idea.description || 'No description provided',
          estimatedDuration: idea.estimatedDuration || '3-5 minutes',
          targetAudience: idea.targetAudience || 'General audience',
          difficulty: ['Easy', 'Medium', 'Hard'].includes(idea.difficulty) ? idea.difficulty : 'Medium'
        }));
        
      } catch (parseError) {
        logger.error('Failed to parse ideas JSON:', parseError);
        // Create structured ideas from text
        ideas = this.createFallbackIdeas(text, count, request.topic);
      }

      logger.info(`Successfully generated ${ideas.length} video ideas using fallback method`);
      return ideas;
      
    } catch (error) {
      logger.error('Fallback video ideas generation failed:', error);
      throw error;
    }
  }

  private createFallbackIdeas(text: string, count: number, topic: string): any[] {
    // Create fallback ideas if JSON parsing fails
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const ideas = [];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      ideas.push({
        id: `fallback-idea-${Date.now()}-${i}`,
        title: `${topic} - Creative Approach ${i + 1}`,
        description: lines[i] || `Explore ${topic} from a unique perspective with engaging storytelling and visual elements.`,
        estimatedDuration: '3-5 minutes',
        targetAudience: 'General audience',
        difficulty: 'Medium'
      });
    }
    
    return ideas;
  }

  getAvailableModels(): { value: GeminiModel; label: string; description: string }[] {
    return [
      // Gemini 2.5 Series (Latest & Recommended)
      {
        value: GeminiModel.GEMINI_2_5_PRO,
        label: 'Gemini 2.5 Pro',
        description: 'Most advanced model with enhanced reasoning, coding, and multimodal capabilities'
      },
      {
        value: GeminiModel.GEMINI_2_5_FLASH,
        label: 'Gemini 2.5 Flash',
        description: 'Fast and efficient with improved performance over 1.5 Flash'
      },
      {
        value: GeminiModel.GEMINI_2_5_FLASH_8B,
        label: 'Gemini 2.5 Flash-8B',
        description: 'Ultra-fast, cost-effective model for high-volume applications'
      },
      
      // Gemini 1.5 Series (Stable)
      {
        value: GeminiModel.GEMINI_1_5_PRO,
        label: 'Gemini 1.5 Pro',
        description: 'Powerful model with large context window and multimodal capabilities'
      },
      {
        value: GeminiModel.GEMINI_1_5_FLASH,
        label: 'Gemini 1.5 Flash',
        description: 'Fast and efficient for most use cases with good performance'
      },
      
      // Legacy Models
      {
        value: GeminiModel.GEMINI_1_0_PRO,
        label: 'Gemini 1.0 Pro',
        description: 'Legacy model for backward compatibility'
      }
    ];
  }
}

export const geminiService = new GeminiService();
