import { Request } from 'express';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Job types
export interface JobData {
  type: 'SCRIPT_GENERATION' | 'IMAGE_GENERATION' | 'VIDEO_GENERATION' | 'AUDIO_GENERATION' | 'VIDEO_ASSEMBLY';
  projectId?: string;
  segmentId?: string;
  prompt?: string;
  text?: string;
  voice?: string;
  [key: string]: any;
}

// AI Service types
export interface ScriptGenerationRequest {
  title: string;
  description?: string;
}

export interface ScriptSegment {
  order: number;
  script: string;
  videoPrompt: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  segmentId: string;
}

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  segmentId: string;
}

export interface AudioGenerationRequest {
  text: string;
  voice: string;
  segmentId: string;
}
