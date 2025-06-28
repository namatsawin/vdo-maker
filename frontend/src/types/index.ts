// Re-export shared types
export * from './shared';

// Import shared types for use in this file
import type { ProjectStatus, VideoSegment, WorkflowStage } from './shared';

// Additional frontend-specific types
export interface LegacyProject {
  id: string;
  name: string; // Maps to title in shared types
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  segments: VideoSegment[];
  currentStage: WorkflowStage;
}

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
