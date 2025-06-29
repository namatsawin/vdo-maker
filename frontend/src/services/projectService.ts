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

  // Delete project
  async deleteProject(id: string): Promise<void> {
    const response = await apiClient.delete(`/projects/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete project');
    }
  }
}

export const projectService = new ProjectService();
