import { MediaStatus } from '@/types';
import { convertImageUrlToBase64 } from '@/utils/image-util';
import { logger } from '@/utils/logger';
import { randomUUID } from 'crypto';

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: number;
  mode?: string
}

export interface VideoGenerationResponse {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input?: {
    prompt: string;
    duration: number;
    mode: string;
    negative_prompt?: string;
  };
}

export interface VideoStatusResponse {
  success: boolean;
  status: MediaStatus;
  videoUrl?: string;
  progress?: number;
  error?: string;
  metadata?: Record<string, any>
}

export interface ImageUploadRequest {
  fileName: string;
  fileData: string; // base64 encoded data
}

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

class KlingAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PIAPI_API_KEY || '';
    this.baseUrl = process.env.PIAPI_BASE_URL || 'https://api.piapi.ai';
    
    if (!this.apiKey) {
      logger.warn('⚠️ PiAPI/Kling AI credentials not configured. Using fallback mode.');
    }
  }

  async uploadImage(request: ImageUploadRequest): Promise<ImageUploadResponse> {
    try {
      const payload = {
        file_name: request.fileName,
        file_data: request.fileData
      };

      const response = await fetch('https://upload.theapi.app/api/ephemeral_resource', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
      }

      const { data } = await response.json() as any;
      
      return {
        success: true,
        url: data.url
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      // Check if we're in development mode and should use mock responses


      const imageBase64 = await convertImageUrlToBase64(request.imageUrl)

      const imageResponse = await this.uploadImage({ fileName: `${randomUUID()}-${Date.now()}.jpeg`, fileData: imageBase64 })

      if (!imageResponse.url) {
        throw Error('Failed upload image')
      }

      const payload = {
        model: 'kling',
        task_type: 'video_generation', // image to video
        input: {
          version: "2.1",
          image_url: imageResponse.url,
          prompt: request.prompt,
          duration: request.duration,
          mode: request.mode,
          negative_prompt: request.negativePrompt
        }
      };

      const response = await fetch(`${this.baseUrl}/api/v1/task`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw Error(`Kling AI API error: ${response.status} - ${errorText}`)
      }

      const { data = {} } = await response.json() as any;

      const taskId = data.task_id
      const status = data.status

      return {
        success: true,
        taskId,
        status,
        input: data.input,
      }
    } catch (error) {
      logger.error('❌ Kling AI service error:', error);
      throw error
    }
  }

  async getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    try {
      logger.info(`📊 Checking video generation status: ${taskId}`);

      if (!this.apiKey) {
        throw Error('API Key is missing')
      }

      const response = await fetch(`${this.baseUrl}/api/v1/task/${taskId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw Error(`Kling AI status check error: ${response.status} - ${errorText}`)
      }

      const { data } = await response.json() as any;

      const url = data.output?.works?.[0]?.video.resource_without_watermark ?? data.output?.works?.[0]?.video.resource ?? ''
      
      return {
        success: true,
        status: this.mapStatus(data.status),
        videoUrl: url,
        progress: data.progress || 0,
        error: data.error.raw_message,
        metadata: {
          taskId,
          createdAt: data.created_at,
          completedAt: data.completed_at,
          error: data.error,
        }
      };

    } catch (error) {
      logger.error('❌ Kling AI status check error:', error);
      throw error
    }
  }

  private mapStatus(apiStatus: string): MediaStatus {
    switch (apiStatus?.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'pending';
      case 'processing':
      case 'running':
        return 'processing';
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  }

  async validateVideoRequest(request: VideoGenerationRequest): Promise<{ valid: boolean; reason?: string }> {
    // Basic request validation
    if (!request.prompt || request.prompt.trim().length === 0) {
      return { valid: false, reason: 'Prompt cannot be empty' };
    }

    if (!request.imageUrl) {
      return { valid: false, reason: 'Either imageUrl or imageBase64 is required' };
    }

    if (request.duration && (request.duration < 1 || request.duration > 10)) {
      return { valid: false, reason: 'Duration must be between 1 and 10 seconds' };
    }

    return { valid: true };
  }

  async getGenerationStatus(): Promise<{ available: boolean; configured: boolean }> {
    return {
      available: true, // Service is always available (fallback mode)
      configured: !!this.apiKey
    };
  }

  async cancelVideoGeneration(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return { success: true, message: 'Fallback task cancelled' };
      }

      const response = await fetch(`${this.baseUrl}/api/v1/task/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        }
      });

      if (response.ok) {
        logger.info(`✅ Video generation cancelled: ${taskId}`);
        return { success: true, message: 'Task cancelled successfully' };
      } else {
        logger.error(`❌ Failed to cancel task: ${taskId}`);
        return { success: false, message: 'Failed to cancel task' };
      }

    } catch (error) {
      logger.error('❌ Cancel task error:', error);
      return { success: false, message: 'Error cancelling task' };
    }
  }
}

export const klingAIService = new KlingAIService();
export default klingAIService;
