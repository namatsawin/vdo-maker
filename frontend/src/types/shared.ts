// Shared types between frontend and backend

// Enums
export const ProjectStatus = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const WorkflowStage = {
  SCRIPT_GENERATION: 'SCRIPT_GENERATION',
  IMAGE_GENERATION: 'IMAGE_GENERATION',
  VIDEO_GENERATION: 'VIDEO_GENERATION',
  FINAL_ASSEMBLY: 'FINAL_ASSEMBLY',
  COMPLETED: 'COMPLETED',
} as const;

export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage];

export const ApprovalStatus = {
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REGENERATING: 'REGENERATING',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// System Instruction types
export interface SystemInstruction {
  id: string;
  name: string;
  description?: string;
  instruction: string;
  category: string;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemInstructionCategory {
  name: string;
  count: number;
  label: string;
}

// Segment Generation types
export interface SegmentGenerationRequest {
  model?: string;
  systemInstructionId?: string;
  customInstruction?: string;
}

export const MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
} as const;

export type MediaStatus = 'completed' | 'processing' | 'pending' | 'failed' | 'staged'

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

// Core interfaces
export interface MediaAsset {
  id: string;
  url: string;
  status: MediaStatus;
  type?: 'image' | 'video' | 'audio'; // For frontend compatibility
  size?: number; // For frontend compatibility
  width?: number; // For images/video
  height?: number; // For images/video
  prompt?: string;
  filename?: string; // For display purposes
  metadata?: Record<string, any>;
  duration?: number; // for video/audio in seconds
  isSelected?: boolean; // For video/audio selection (multiple files per segment)
  voice?: string; // For audio files - voice type used
  text?: string; // For audio files - text that was converted to speech
  createdAt: string;
  updatedAt: string;
}

export interface VideoSegment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  status: ApprovalStatus;
  duration?: number; // For frontend compatibility
  result_url?: string | null; // URL to the final merged video result
  
  // Media assets
  images: MediaAsset[];
  videos: MediaAsset[];
  audios: MediaAsset[];
  
  // Individual approval statuses
  scriptApprovalStatus: ApprovalStatus;
  imageApprovalStatus: ApprovalStatus;
  videoApprovalStatus: ApprovalStatus;
  audioApprovalStatus: ApprovalStatus;
  finalApprovalStatus: ApprovalStatus;
  
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  name?: string; // For frontend compatibility (maps to title)
  description?: string;
  status: ProjectStatus;
  currentStage: WorkflowStage;
  segments: VideoSegment[];
  final_video_url?: string | null; // URL to the final concatenated video
  createdAt: string;
  updatedAt: string;
  
  // User relation
  userId: string;
}

// API Request/Response types
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

export interface CreateProjectRequest {
  title: string;
  description?: string;
  story?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  currentStage?: WorkflowStage;
}

export interface UpdateSegmentRequest {
  script?: string;
  videoPrompt?: string;
  scriptApprovalStatus?: ApprovalStatus;
  imageApprovalStatus?: ApprovalStatus;
  videoApprovalStatus?: ApprovalStatus;
  audioApprovalStatus?: ApprovalStatus;
  finalApprovalStatus?: ApprovalStatus;
  result_url?: string | null;
}

// AI Service types
export const GeminiModel = {
  // Gemini 2.5 Series (Latest)
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash', 
  GEMINI_2_5_FLASH_8B: 'gemini-2.5-flash-8b',
  
  // Gemini 1.5 Series (Stable)
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
  
  // Legacy Models
  GEMINI_1_0_PRO: 'gemini-1.0-pro',
} as const;

export type GeminiModel = (typeof GeminiModel)[keyof typeof GeminiModel];

export interface ScriptGenerationRequest {
  title: string;
  description?: string;
  model?: GeminiModel;
}

export interface ScriptSegment {
  order: number;
  script: string;
  videoPrompt: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  segmentId: string;
  aspectRatio?: string;
  model?: string;
  safetyFilterLevel?: string;
  personGeneration?: string;
}

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  segmentId: string;
  duration: number;
  negativePrompt: string;
  mode: string;
}

export interface AudioGenerationRequest {
  text: string;
  voice: string;
  segmentId: string;
  model?: GeminiModel;
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

// Legacy support - for backward compatibility
export interface Segment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  status: ApprovalStatus;
  duration?: number;
  
  // Media assets
  images: MediaAsset[];
  videos: MediaAsset[];
  audios: MediaAsset[];
  
  // Individual approval statuses
  scriptApprovalStatus: ApprovalStatus;
  imageApprovalStatus: ApprovalStatus;
  videoApprovalStatus: ApprovalStatus;
  audioApprovalStatus: ApprovalStatus;
  finalApprovalStatus: ApprovalStatus;
  
  createdAt: string;
  updatedAt: string;
  
  // Legacy fields
  image?: MediaAsset;
  video?: MediaAsset;
  audio?: MediaAsset;
  finalVideo?: MediaAsset;
  approvalStatus: {
    script: ApprovalStatus;
    image: ApprovalStatus;
    video: ApprovalStatus;
    audio: ApprovalStatus;
    final: ApprovalStatus;
  };
}
