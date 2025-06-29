import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '@/utils/logger';
import { ScriptGenerationRequest, ScriptSegment, GeminiModel } from '@/types';

// JSON Schema for video ideas aligned with ProjectCreationForm
const VIDEO_IDEAS_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Video title that will be used as project name"
      },
      description: {
        type: Type.STRING,
        description: "Brief description of the video project"
      },
      story: {
        type: Type.STRING,
        description: "Detailed story content and narrative for the video"
      },
      isFactBased: {
        type: Type.BOOLEAN,
        description: "Whether the story content is based on verified facts and research"
      }
    },
    required: ["title", "description", "story", "isFactBased"],
    propertyOrdering: ["title", "description", "story", "isFactBased"]
  }
};

// JSON Schema for script segments
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

    try {
      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SCRIPT_SEGMENTS_SCHEMA
        }
      });

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
      logger.error('Script generation failed:', error);
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

  async generateVideoIdeas(request: { topic: string; model?: GeminiModel; count?: number }): Promise<Array<{ title: string; description: string; story: string; isFactBased: boolean }>> {
    const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
    const count = request.count || 5;
    
    const prompt = `
Generate ${count} creative video ideas for the topic: "${request.topic}"

For each idea, provide:
1. A catchy, engaging title (will be used as project name)
2. A brief description (1-2 sentences describing the video concept)
3. A detailed story (comprehensive narrative content for the video, including key points, structure, and what the video will cover)
4. Fact verification (determine if the story content is based on verifiable facts and research)

IMPORTANT: Make each idea VERY SPECIFIC and focused on particular subjects, phenomena, or cases rather than broad topics.

Examples of specific ideas:
- Instead of "mysterious ships" → "เรือแม่รี่เซเลซ: ปริศนาเรือผีที่หายไปในมหาสมุทร"
- Instead of "simulation theory" → "เราอยู่ในโลกจำลองจริงไหม: ทฤษฎีที่นักวิทยาศาสตร์เชื่อ"
- Instead of "strange sounds" → "เสียง Taos Hum: เสียงลึกลับที่ไม่มีใครอธิบายได้"
- Instead of "ancient mysteries" → "พีระมิดใต้น้ำโยนากุนิ: สิ่งก่อสร้างโบราณใต้ทะเลญี่ปุ่น"
- Instead of "space phenomena" → "สัญญาณ WOW!: ข้อความจากต่างดาวที่หายไปตลอดกาล"

Focus on:
- Specific historical events, people, or places
- Particular scientific phenomena or discoveries
- Individual mysteries, cases, or incidents
- Named locations, objects, or concepts
- Unique cultural or natural phenomena

Make the ideas diverse, creative, and suitable for video content creation. Consider different angles, formats, and approaches to the topic.

The story should be detailed enough to serve as the foundation for script generation, including:
- Main narrative arc with specific details
- Key points to cover with concrete examples
- Visual elements to include
- Target audience considerations
- Tone and style suggestions

For fact verification (isFactBased):
- Set to true if the story is based on documented facts, scientific research, historical events, or verifiable information
- Set to false if the story is fictional, speculative, opinion-based, or creative interpretation
- Consider the nature of the content: documentaries, educational content, news analysis = likely fact-based
- Creative stories, fictional narratives, artistic interpretations = likely not fact-based

Ensure each idea is unique, creative, specific, and actionable for video production.
`;

    logger.info(`Generating ${count} video ideas for topic: ${request.topic} using model: ${model} with structured output`);

    try {
      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: VIDEO_IDEAS_SCHEMA
        }
      });

      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response received from Gemini');
      }

      // Parse the structured JSON response - it's already an array
      const ideas: Array<{ title: string; description: string; story: string; isFactBased: boolean }> = JSON.parse(text);

      logger.info(`Successfully generated ${ideas.length} video ideas with structured output`);
      return ideas;
      
    } catch (error) {
      logger.error('Video ideas generation failed:', error);
      throw error;
    }
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
