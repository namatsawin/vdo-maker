// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  segments: VideoSegment[];
  currentStage: WorkflowStage;
}

export interface VideoSegment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  duration: number;
  approvalStatus: ApprovalStatus;
  imageApprovalStatus?: ApprovalStatus;
  videoApprovalStatus?: ApprovalStatus;
  audioApprovalStatus?: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

// Legacy Segment interface for backward compatibility
export interface Segment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
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

export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  duration?: number; // for video/audio
  width?: number; // for images/video
  height?: number; // for images/video
  createdAt: string;
}

// Enums
export const ProjectStatus = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const WorkflowStage = {
  SCRIPT_GENERATION: 'script_generation',
  IMAGE_GENERATION: 'image_generation',
  VIDEO_GENERATION: 'video_generation',
  AUDIO_GENERATION: 'audio_generation',
  FINAL_ASSEMBLY: 'final_assembly',
  COMPLETED: 'completed',
} as const;

export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage];

export const ApprovalStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REGENERATING: 'regenerating',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// UI Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Form Types
export interface ProjectCreationForm {
  name: string;
  description: string;
  storyInput: string;
}

export interface SegmentEditForm {
  script: string;
  videoPrompt: string;
}
