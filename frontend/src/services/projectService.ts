import { apiClient } from '@/lib/api';
import type { Project, VideoSegment, CreateProjectRequest, UpdateProjectRequest, UpdateSegmentRequest } from '@/types';

class ProjectService {
  // Get all projects for authenticated user
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get('/projects');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch projects');
    }
    return response.data.projects;
  }

  // Get single project by ID
  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch project');
    }
    return response.data.project;
  }

  // Create new project
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post('/projects', data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create project');
    }
    return response.data.project;
  }

  // Update project
  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update project');
    }
    return response.data.project;
  }

  // Update segment
  async updateSegment(projectId: string, segmentId: string, data: UpdateSegmentRequest): Promise<VideoSegment> {
    const response = await apiClient.put(`/projects/${projectId}/segments/${segmentId}`, data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update segment');
    }
    return response.data.segment;
  }

  // Generate audio for segment
  async generateSegmentAudio(projectId: string, segmentId: string, voice?: string, model?: string): Promise<{ segment: VideoSegment; audioUrl: string }> {
    const response = await apiClient.post(`/projects/${projectId}/segments/${segmentId}/audio`, {
      voice: voice || 'default',
      model: model || 'gemini-2.5-flash'
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to generate audio');
    }
    return {
      segment: response.data.segment,
      audioUrl: response.data.audioUrl
    };
  }

  // Delete project
  async deleteProject(id: string): Promise<void> {
    const response = await apiClient.delete(`/projects/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete project');
    }
  }

  // Select audio for segment
  async selectSegmentAudio(projectId: string, segmentId: string, audioId: string): Promise<void> {
    const response = await apiClient.put(`/projects/${projectId}/segments/${segmentId}/audio/${audioId}/select`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to select audio');
    }
  }

  // Select image for segment
  async selectSegmentImage(_projectId: string, _segmentId: string, imageId: string): Promise<void> {
    const response = await apiClient.selectImage(imageId);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to select image');
    }
  }

  // Select video for segment
  async selectSegmentVideo(_projectId: string, _segmentId: string, videoId: string): Promise<void> {
    const response = await apiClient.selectVideo(videoId);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to select video');
    }
  }

  // Get all images for segment
  async getSegmentImages(segmentId: string): Promise<Array<{
    id: string;
    url: string;
    prompt: string;
    isSelected: boolean;
    metadata: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const response = await apiClient.getSegmentImages(segmentId);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get segment images');
    }
    return response.data.images;
  }
}

export const projectService = new ProjectService();
