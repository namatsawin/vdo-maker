// Shared types between frontend and backend

// Enums
export const ProjectStatus = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const WorkflowStage = {
  SCRIPT_GENERATION: 'SCRIPT_GENERATION',
  IMAGE_GENERATION: 'IMAGE_GENERATION',
  VIDEO_GENERATION: 'VIDEO_GENERATION',
  AUDIO_GENERATION: 'AUDIO_GENERATION',
  FINAL_ASSEMBLY: 'FINAL_ASSEMBLY',
  COMPLETED: 'COMPLETED',
} as const;

export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage];

export const ApprovalStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REGENERATING: 'REGENERATING',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

// Core interfaces
export interface MediaAsset {
  id: string;
  url: string;
  prompt?: string;
  status: ApprovalStatus;
  metadata?: Record<string, any>;
  duration?: number; // for video/audio in seconds
  createdAt: string;
  updatedAt: string;
}

export interface VideoSegment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  status: ApprovalStatus;
  
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
  description?: string;
  status: ProjectStatus;
  currentStage: WorkflowStage;
  segments: VideoSegment[];
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
export interface Segment extends VideoSegment {
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
  duration?: number;
}
