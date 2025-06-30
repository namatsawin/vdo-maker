import { GoogleGenAI, PersonGeneration, SafetyFilterLevel } from '@google/genai';
import { logger } from '@/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export enum GeminiImageModel {
  Imagen3 = 'imagen-3.0-generate-002',
  Imagen4 = 'imagen-4.0-generate-preview-06-06',
  Image4Ultra = 'imagen-4.0-ultra-generate-preview-06-06'
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  personGeneration?: PersonGeneration
  safetyFilterLevel?: SafetyFilterLevel
  numberOfImages?: number;
  model?: GeminiImageModel
}

export interface ImageGenerationResponse {
  success: boolean;
  images?: Array<{
    imageBase64: string;
    imageUrl?: string;
  }>;
  imageBase64?: string; // For backward compatibility
  imageUrl?: string; // For backward compatibility
  error?: string;
  metadata?: {
    prompt: string;
    aspectRatio?: string;
    model: string;
    numberOfImages: number;
    generationTime: number;
  };
}

class Imagen4Service {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for image generation');
    }

    this.ai = new GoogleGenAI({
      apiKey: this.apiKey
    });
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const startTime = Date.now();
    const model = request.model ?? GeminiImageModel.Imagen3
    
    try {

      console.log('request:', request)
      const response = await this.ai.models.generateImages({
        model: model,
        prompt: request.prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: request.aspectRatio,
          personGeneration: request.personGeneration,
          safetyFilterLevel: request.safetyFilterLevel
        },
      });

      const generationTime = Date.now() - startTime;

      if (response.generatedImages && response.generatedImages.length > 0) {
        const images = response.generatedImages
          .filter(generatedImage => generatedImage.image?.imageBytes)
          .map((generatedImage) => ({
            imageBase64: generatedImage.image!.imageBytes as string
          }));

        logger.info(`✅ ${images.length} image(s) generated successfully with ${model} in ${generationTime}ms`);
        
        return {
          success: true,
          images,
          // For backward compatibility, return first image
          imageBase64: images[0]?.imageBase64,
          metadata: {
            prompt: request.prompt,
            aspectRatio: request.aspectRatio,
            model: model,
            numberOfImages: images.length,
            generationTime
          }
        };
      } else {
        throw new Error('No images generated in response');
      }

    } catch (error) {
      logger.error(`❌ ${model} image generation error:`, error);
      throw error
    }
  }

  async generateImagesAndSave(request: ImageGenerationRequest, outputDir?: string): Promise<ImageGenerationResponse & { filePaths?: string[] }> {
    const result = await this.generateImage(request);
    
    if (result.success && result.images) {
      try {
        const baseDir = outputDir || './generated-images';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(baseDir)) {
          fs.mkdirSync(baseDir, { recursive: true });
        }
        
        const filePaths: string[] = [];
        
        // Save each generated image
        result.images.forEach((image, index) => {
          const fileName = `imagen-${Date.now()}-${index + 1}.png`;
          const filePath = path.join(baseDir, fileName);
          
          // Convert base64 to buffer and save
          const buffer = Buffer.from(image.imageBase64, 'base64');
          fs.writeFileSync(filePath, buffer);
          
          filePaths.push(filePath);
          logger.info(`💾 Image ${index + 1} saved as ${filePath}`);
        });
        
        return {
          ...result,
          filePaths,
          imageUrl: filePaths[0] // For backward compatibility
        };
      } catch (saveError) {
        logger.error('Failed to save images:', saveError);
        return {
          ...result,
          error: `Images generated but failed to save: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
        };
      }
    }
    
    return result;
  }

  async validateImagePrompt(prompt: string): Promise<{ valid: boolean; reason?: string }> {
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, reason: 'Prompt cannot be empty' };
    }

    if (prompt.length > 2000) {
      return { valid: false, reason: 'Prompt too long (max 2000 characters)' };
    }

    // Basic content filtering
    const bannedWords = ['violence', 'explicit', 'harmful', 'illegal', 'nsfw'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const word of bannedWords) {
      if (lowerPrompt.includes(word)) {
        return { valid: false, reason: `Prompt contains inappropriate content: ${word}` };
      }
    }

    return { valid: true };
  }

  async getGenerationStatus(): Promise<{ 
    available: boolean; 
    configured: boolean; 
    models: Array<{
      id: string;
      name: string;
      description: string;
      maxImages: number;
    }>;
  }> {
    return {
      available: !!this.apiKey,
      configured: !!this.apiKey,
      models: [
        {
          id: 'imagen-3.0-generate-002',
          name: 'Imagen 3.0',
          description: 'Google\'s specialized image generation model',
          maxImages: 4
        },
        {
          id: 'imagen-4.0-generate-preview-06-06',
          name: 'Imagen 4.0 Preview',
          description: 'Latest Imagen model with enhanced quality (recommended)',
          maxImages: 4
        },
        {
          id: 'imagen-4.0-ultra-generate-preview-06-06',
          name: 'Imagen 4.0 Ultra Preview',
          description: 'Ultra-high quality Imagen model (1 image only)',
          maxImages: 1
        }
      ]
    };
  }

  // Test method to verify the service is working
  async testImageGeneration(): Promise<void> {
    try {
      const testPrompt = "A simple red circle on a white background";
      logger.info('🧪 Testing image generation with Imagen...');
      
      const result = await this.generateImagesAndSave({
        prompt: testPrompt,
        numberOfImages: 2
      }, './test-images');
      
      if (result.success) {
        logger.info('✅ Image generation test successful!');
        logger.info(`📁 Test images saved to: ${result.filePaths?.join(', ')}`);
      } else {
        logger.error('❌ Image generation test failed:', result.error);
      }
    } catch (error) {
      logger.error('❌ Image generation test error:', error);
    }
  }
}

export const imagen4Service = new Imagen4Service();
export default imagen4Service;
