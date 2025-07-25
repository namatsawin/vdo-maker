import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '@/utils/logger';
import { ScriptGenerationRequest, ScriptSegment, GeminiModel } from '@/types';
import * as fs from 'fs';
import * as path from 'path';
import { IdeaSystemInstructions } from '@/constants/ai/idea-system-instruction';
import { Project } from '@prisma/client';

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
      isFactBased: {
        type: Type.BOOLEAN,
        description: "Whether the story content is based on verified facts and research"
      }
    },
    required: ["title", "description", "isFactBased"],
    propertyOrdering: ["title", "description", "isFactBased"]
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
            description: "The spoken content for this segment (Thai Only)"
          },
          videoPrompt: {
            type: Type.STRING,
            description: "Detailed visual description for video generation (English Only)"
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

export enum GeminiTTSModel {
  FLASH = 'gemini-2.5-flash-preview-tts',
  PRO = 'gemini-2.5-pro-preview-tts'
}

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
    
    logger.info('Gemini AI service initialized with native TTS support');
  }

  private async saveWaveFile(
    filename: string,
    pcmData: Buffer,
    channels: number = 1,
    rate: number = 24000,
    sampleWidth: number = 2,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create WAV header manually
        const dataSize = pcmData.length;
        const fileSize = 36 + dataSize;
        const byteRate = rate * channels * sampleWidth;
        const blockAlign = channels * sampleWidth;
        const bitsPerSample = sampleWidth * 8;

        const header = Buffer.alloc(44);
        let offset = 0;

        // RIFF header
        header.write('RIFF', offset); offset += 4;
        header.writeUInt32LE(fileSize, offset); offset += 4;
        header.write('WAVE', offset); offset += 4;

        // fmt chunk
        header.write('fmt ', offset); offset += 4;
        header.writeUInt32LE(16, offset); offset += 4; // PCM chunk size
        header.writeUInt16LE(1, offset); offset += 2;  // Audio format (PCM)
        header.writeUInt16LE(channels, offset); offset += 2;
        header.writeUInt32LE(rate, offset); offset += 4;
        header.writeUInt32LE(byteRate, offset); offset += 4;
        header.writeUInt16LE(blockAlign, offset); offset += 2;
        header.writeUInt16LE(bitsPerSample, offset); offset += 2;

        // data chunk
        header.write('data', offset); offset += 4;
        header.writeUInt32LE(dataSize, offset);

        // Combine header and PCM data
        const wavFile = Buffer.concat([header, pcmData]);
        
        // Write to file
        fs.writeFileSync(filename, wavFile);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptSegment[]> {
    const { 
      title, 
      description, 
      systemInstruction, 
      model = GeminiModel.GEMINI_2_5_FLASH 
    } = request
    
    const prompt = `Topic: ${title}` + description ? `, Description: ${description}` : '';

    try {
      const result = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: SCRIPT_SEGMENTS_SCHEMA,
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

  async generateTextToSpeech(text: string, voice: string = 'Kore', model = GeminiTTSModel.FLASH): Promise<string> {
    try {
      if (text.length > 5000) {
        throw new Error('Text too long. Maximum 5000 characters allowed for TTS');
      }

      const voiceName = this.getGeminiVoiceName(voice);
      
      const prompt = `Read aloud in a warm, friendly, and clear tone: ${text}`;

      const response = await this.genAI.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioData) {
        throw new Error('No audio data received from Gemini TTS');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const filename = `gemini-tts-${timestamp}-${randomId}.wav`;
      const uploadsDir = process.env.UPLOAD_DIR || './uploads';
      const audiosDir = path.join(uploadsDir, 'audios');
      const filePath = path.join(audiosDir, filename);

      // Ensure audios directory exists
      if (!fs.existsSync(audiosDir)) {
        fs.mkdirSync(audiosDir, { recursive: true });
      }

      // Convert base64 to PCM buffer and save as proper WAV file
      const pcmBuffer = Buffer.from(audioData, 'base64');

      const speedFactor = 1.1;
      const rate = Math.round(24000 * speedFactor);
      const channels = 1;
      
      await this.saveWaveFile(filePath, pcmBuffer, channels, rate);

      // Return the full URL that frontend can access
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const audioUrl = `${backendUrl}/uploads/audios/${filename}`;
      
      logger.info(`Gemini TTS generation completed successfully: ${audioUrl}`);
      return audioUrl;
      
    } catch (error) {
      logger.error('Gemini TTS generation failed:', error);
      throw error;
    }
  }

  private getGeminiVoiceName(voice: string): string {
    const voiceMap: Record<string, string> = {
      'zephyr': 'Zephyr',
      'kore': 'Kore',
      'puck': 'Puck', 
      'charon': 'Charon',
      'fenrir': 'Fenrir',
      'leda': 'Leda',
      'orus': 'Orus',
      'aoede': 'Aoede',
      'callirrhoe': 'Callirrhoe',
      'autonoe': 'Autonoe',
      'enceladus': 'Enceladus',
      'iapetus': 'Iapetus',
      'umbriel': 'Umbriel',
      'algieba': 'Algieba',
      'despina': 'Despina',
      'erinome': 'Erinome',
      'algenib': 'Algenib',
      'rasalgethi': 'Rasalgethi',
      'laomedeia': 'Laomedeia',
      'achernar': 'Achernar',
      'alnilam': 'Alnilam',
      'schedar': 'Schedar',
      'gacrux': 'Gacrux',
      'pulcherrima': 'Pulcherrima',
      'achird': 'Achird',
      'zubenelgenubi': 'Zubenelgenubi',
      'vindemiatrix': 'Vindemiatrix',
      'sadachbia': 'Sadachbia',
      'sadaltager': 'Sadaltager',
      'sulafat': 'Sulafat',
    };

    return voiceMap[voice.toLowerCase()] || 'Kore';
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

  async generateVideoIdeas(request: { topic: string; model?: GeminiModel; count?: number }, existingTopics: string[] = []): Promise<Array<{ title: string; description: string; isFactBased: boolean }>> {
    const model = request.model || GeminiModel.GEMINI_2_5_FLASH;
    const count = request.count || 5;
    
    const content = `{
      "count": ${count},
      "request.topic": ${request.topic},
      "existingTopics": ${JSON.stringify(existingTopics)}
    }`;

    logger.info(`Generating ${count} video ideas for topic: ${request.topic} using model: ${model} with structured output`);

    try {
      const result = await this.genAI.models.generateContent({
        model: model,
        contents: content,
        config: {
          responseMimeType: "application/json",
          systemInstruction: IdeaSystemInstructions[0].value,
          responseSchema: VIDEO_IDEAS_SCHEMA
        }
      });

      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response received from Gemini');
      }

      // Parse the structured JSON response - it's already an array
      const ideas: Array<{ title: string; description: string; isFactBased: boolean }> = JSON.parse(text);

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

  getAvailableVoices(): { value: string; label: string; description: string; style: string }[] {
    return [
      // Popular/Recommended voices
      {
        value: 'kore',
        label: 'Kore (Default)',
        description: 'Firm, clear voice perfect for professional content',
        style: 'Firm'
      },
      {
        value: 'puck',
        label: 'Puck',
        description: 'Upbeat, energetic voice great for engaging content',
        style: 'Upbeat'
      },
      {
        value: 'charon',
        label: 'Charon',
        description: 'Informative, authoritative voice ideal for educational content',
        style: 'Informative'
      },
      {
        value: 'leda',
        label: 'Leda',
        description: 'Youthful, fresh voice perfect for modern content',
        style: 'Youthful'
      },
      {
        value: 'enceladus',
        label: 'Enceladus',
        description: 'Breathy, intimate voice for personal storytelling',
        style: 'Breathy'
      },
      
      // Additional character voices
      {
        value: 'fenrir',
        label: 'Fenrir',
        description: 'Excitable, dynamic voice for high-energy content',
        style: 'Excitable'
      },
      {
        value: 'aoede',
        label: 'Aoede',
        description: 'Breezy, casual voice for relaxed content',
        style: 'Breezy'
      },
      {
        value: 'autonoe',
        label: 'Autonoe',
        description: 'Bright, cheerful voice for positive content',
        style: 'Bright'
      },
      {
        value: 'iapetus',
        label: 'Iapetus',
        description: 'Clear, precise voice for technical content',
        style: 'Clear'
      },
      {
        value: 'algieba',
        label: 'Algieba',
        description: 'Smooth, polished voice for sophisticated content',
        style: 'Smooth'
      },
      {
        value: 'gacrux',
        label: 'Gacrux',
        description: 'Mature, experienced voice for authoritative content',
        style: 'Mature'
      },
      {
        value: 'achird',
        label: 'Achird',
        description: 'Friendly, approachable voice for conversational content',
        style: 'Friendly'
      }
    ];
  }

  async analyzeAndReviseContent(content: string): Promise<{
    issues: string[];
    suggestions: string[];
    revisedPrompt: string;
    confidence: number;
    explanation: string;
  }> {
    try {
      const analysisPrompt = `Please analyze and revise the following content: "${content}"`;

      const result = await this.genAI.models.generateContent({
        model: GeminiModel.GEMINI_2_5_FLASH,
        contents: analysisPrompt,
        config: {
          systemInstruction: `
            You are a content revision assistant. Your task is to detect and revise any sensitive, offensive, or inappropriate words or phrases in the provided text. 
            Replace only the sensitive terms with neutral or appropriate alternatives, without changing the overall meaning, tone, structure, or intent of the original content.
            Ensure the revised version remains natural and fluent. Do not introduce new content or ideas.
            Provide a brief list (max 3) of the main issues found, and a revised version of the original text.
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Brief list of main issues (max 3)"
              },
              revisedVersion: {
                type: Type.STRING,
                description: "Improved version"
              },
            },
            required: ["issues", "revisedVersion"]
          }
        }
      });

      const text = result.text || '';
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const analysis = JSON.parse(text);
      
      // Transform to match the expected interface
      return {
        issues: analysis.issues || [],
        suggestions: analysis.issues.map((issue: string) => `Address: ${issue}`) || [],
        revisedPrompt: analysis.revisedVersion || content,
        confidence: analysis.issues.length === 0 ? 0.9 : 0.7,
        explanation: analysis.issues.length > 0 
          ? `Found ${analysis.issues.length} issue(s). Revised content addresses these concerns.`
          : 'Content looks appropriate with minor improvements.'
      };

    } catch (error) {
      logger.error('Error analyzing content:', error);
      
      return {
        issues: ['Analysis unavailable'],
        suggestions: ['Please review manually'],
        revisedPrompt: content,
        confidence: 0.5,
        explanation: 'Service temporarily unavailable.'
      };
    }
  }

  /**
   * Revise script text to be shorter while maintaining meaning and context
   * Based on Thai system instruction for concise spoken language
   */
  async reviseScriptForShorterDuration(originalScript: string, model: GeminiModel = GeminiModel.GEMINI_2_5_FLASH): Promise<{
    revisedScript: string;
    originalLength: number;
    revisedLength: number;
    estimatedTimeSaved: number;
    confidence: number;
  }> {
    try {
      if (!originalScript || originalScript.trim().length === 0) {
        throw new Error('Original script is required');
      }

      const revisionPrompt = `กรุณาแก้ไขข้อความต่อไปนี้ให้สั้นลงและกระชับขึ้น: "${originalScript}"`;

      const result = await this.genAI.models.generateContent({
        model,
        contents: revisionPrompt,
        config: {
          systemInstruction: `คุณเป็นนักเล่าเรื่องที่สามารถแก้ไขข้อความให้เป็นภาษาพูดโดยให้กระชับขึ้นนิดหน่อยโดยยังคงความหมายไว้เหมือนเดิม
ข้อความระวัง:
- ความหมายต้องเหมือนเดิม
- ต้องยังคงเป็นภาษาพูดน่าและคงความน่าสนใจไว้
- ผลลัพธ์คือข้อความต้องสั้นลงและกระชับขึ้นโดยต้องคำนวณให้ใช้ระเวลาการพูดน้อยลง 0.5 วินาที

กรุณาตอบกลับในรูปแบบ JSON ที่มีโครงสร้างดังนี้:
{
  "revisedScript": "ข้อความที่แก้ไขแล้ว",
  "explanation": "คำอธิบายการแก้ไข",
  "timeSavedEstimate": "เวลาที่ประหยัดได้ (วินาที)"
}`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              revisedScript: {
                type: Type.STRING,
                description: "The revised, shorter script text"
              },
              explanation: {
                type: Type.STRING,
                description: "Explanation of the changes made"
              },
              timeSavedEstimate: {
                type: Type.NUMBER,
                description: "Estimated time saved in seconds"
              }
            },
            required: ["revisedScript", "explanation", "timeSavedEstimate"]
          }
        }
      });

      const text = result.text || '';
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const revision = JSON.parse(text);
      
      // Calculate metrics
      const originalLength = originalScript.length;
      const revisedLength = revision.revisedScript.length;
      const estimatedTimeSaved = Math.max(revision.timeSavedEstimate || 0.5, 0.1);
      
      // Calculate confidence based on length reduction and content preservation
      const lengthReduction = (originalLength - revisedLength) / originalLength;
      const confidence = Math.min(0.95, Math.max(0.6, 0.8 + (lengthReduction * 0.2)));

      logger.info('Script revision completed', {
        originalLength,
        revisedLength,
        lengthReduction: `${(lengthReduction * 100).toFixed(1)}%`,
        estimatedTimeSaved: `${estimatedTimeSaved}s`,
        confidence
      });

      return {
        revisedScript: revision.revisedScript,
        originalLength,
        revisedLength,
        estimatedTimeSaved,
        confidence
      };

    } catch (error) {
      logger.error('Error revising script:', error);
      throw new Error(`Script revision failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const geminiService = new GeminiService();
