import { create } from 'zustand';
import type { Project, VideoSegment } from '@/types';
import { ApprovalStatus } from '@/types/shared';
import { projectService } from '@/services/projectService';
import { useAIStore } from './aiStore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  // Server-based actions
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: { title: string; description?: string; story?: string }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateSegment: (projectId: string, segmentId: string, updates: any) => Promise<void>;
  
  // Local state management
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Real AI methods
  generateProjectScript: (title: string, description?: string, model?: string) => Promise<VideoSegment[]>;
  generateSegmentImage: (segmentId: string, prompt: string, aspectRatio: string, model: string, safetyFilterLevel?: string, personGeneration?: string) => Promise<string>;
  generateAllSegmentImages: (aspectRatio: string, model: string, safetyFilterLevel?: string, personGeneration?: string) => Promise<{ success: number; skipped: number; failed: number; }>;
  generateSegmentVideo: (segmentId: string, imageUrl: string, prompt: string) => Promise<{ taskId: string; videoUrl?: string }>;
  generateSegmentAudio: (segmentId: string, text: string, voice?: string, model?: string) => Promise<string>;
  selectSegmentAudio: (projectId: string, segmentId: string, audioId: string) => Promise<void>;
  selectSegmentImage: (projectId: string, segmentId: string, imageId: string) => Promise<void>;
  getSegmentImages: (segmentId: string) => Promise<Array<{
    id: string;
    url: string;
    prompt: string;
    isSelected: boolean;
    metadata: string;
    createdAt: string;
    updatedAt: string;
  }>>;
}

export const useProjectStore = create<ProjectState & ProjectActions>()((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Server-based actions
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectService.getProject(id);
      set({ currentProject: project, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectService.createProject(data);
      
      // Add to local state
      set(state => ({
        projects: [project, ...state.projects],
        currentProject: project,
        isLoading: false
      }));
      
      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectService.updateProject(id, updates);
      
      // Update local state
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteProject(id);
      
      // Remove from local state
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateSegment: async (projectId, segmentId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSegment = await projectService.updateSegment(projectId, segmentId, updates);
      
      // Update local state
      set(state => ({
        projects: state.projects.map(p => 
          p.id === projectId 
            ? { ...p, segments: p.segments.map(s => s.id === segmentId ? updatedSegment : s) }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? { 
              ...state.currentProject, 
              segments: state.currentProject.segments.map(s => s.id === segmentId ? updatedSegment : s)
            }
          : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update segment';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Local state management
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Real AI methods
  generateProjectScript: async (title: string, description?: string, model?: string) => {
    set({ isLoading: true, error: null });

    try {
      const aiStore = useAIStore.getState();
      const result = await aiStore.generateScript({ title, description, model });

      if (result && result.segments) {
        // Convert API response to VideoSegment format
        const segments: VideoSegment[] = result.segments.map((segment: any, index: number) => ({
          id: Math.random().toString(36).substr(2, 9),
          order: segment.order || index,
          script: segment.script,
          videoPrompt: segment.videoPrompt,
          status: ApprovalStatus.DRAFT,
          duration: Math.floor(Math.random() * 20) + 10, // 10-30 seconds
          
          // Media assets
          images: [],
          videos: [],
          audios: [],
          
          // Individual approval statuses
          scriptApprovalStatus: ApprovalStatus.DRAFT,
          imageApprovalStatus: ApprovalStatus.DRAFT,
          videoApprovalStatus: ApprovalStatus.DRAFT,
          audioApprovalStatus: ApprovalStatus.DRAFT,
          finalApprovalStatus: ApprovalStatus.DRAFT,
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        set({ isLoading: false });
        return segments;
      } else {
        throw new Error('Invalid script generation response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Script generation failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  generateSegmentImage: async (segmentId: string, prompt: string, aspectRatio: string, model: string, safetyFilterLevel?: string, personGeneration?: string) => {
    set({ isLoading: true, error: null });

    try {
      const aiStore = useAIStore.getState();
      const result = await aiStore.generateImage({ 
        prompt, 
        aspectRatio: aspectRatio,
        model: model,
        segmentId: segmentId,
        safetyFilterLevel,
        personGeneration
      });

      if (result && (result.imageUrl || result.imageBase64)) {
        const imageUrl = result.imageUrl || `data:image/png;base64,${result.imageBase64}`;
        
        // Update the project state with the new image
        const { currentProject } = get();
        if (currentProject) {
          const updatedSegments = currentProject.segments.map((segment: VideoSegment) => {
            if (segment.id === segmentId) {
              // Create or update the single image for this segment
              const newImage = {
                id: `img-${segmentId}`,
                url: imageUrl,
                filename: `segment-${segmentId}-image.png`,
                size: 0, // Will be updated when we have actual file size
                type: 'image' as const,
                prompt: prompt,
                aspectRatio: aspectRatio,
                metadata: {
                  model: model,
                  aspectRatio: aspectRatio
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isSelected: true
              };

              return {
                ...segment,
                images: [newImage], // Always single image per segment
                imageApprovalStatus: 'DRAFT' as const
              };
            }
            return segment;
          });

          const updatedProject = {
            ...currentProject,
            segments: updatedSegments,
            updatedAt: new Date().toISOString()
          };

          set({ 
            currentProject: updatedProject,
            isLoading: false 
          });

          // Update in storage
          const projects = JSON.parse(localStorage.getItem('vdo-maker-projects') || '[]');
          const projectIndex = projects.findIndex((p: any) => p.id === currentProject.id);
          if (projectIndex !== -1) {
            projects[projectIndex] = updatedProject;
            localStorage.setItem('vdo-maker-projects', JSON.stringify(projects));
          }
        }

        set({ isLoading: false });
        return imageUrl;
      } else {
        throw new Error('Invalid image generation response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Image generation failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  generateAllSegmentImages: async (aspectRatio, model, safetyFilterLevel, personGeneration) => {
    const { currentProject } = get();
    if (!currentProject) {
      throw new Error('No current project found');
    }

    set({ isLoading: true, error: null });

    // Filter segments that need image generation (no existing images and have video prompts)
    const segmentsToGenerate = currentProject.segments.filter(segment => 
      segment.videoPrompt && 
      segment.videoPrompt.trim() !== '' &&
      (!segment.images || segment.images.length === 0)
    );

    if (segmentsToGenerate.length === 0) {
      set({ isLoading: false });
      return { success: 0, skipped: currentProject.segments.length, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Process segments sequentially to avoid overwhelming the API
    for (const segment of segmentsToGenerate) {
      try {
        await get().generateSegmentImage(
          segment.id, 
          segment.videoPrompt!, 
          aspectRatio, 
          model, 
          safetyFilterLevel, 
          personGeneration
        );
        successCount++;
        results.push({ segmentId: segment.id, success: true });
      } catch (error: any) {
        failedCount++;
        results.push({ segmentId: segment.id, success: false, error });
        console.error(`Failed to generate image for segment (${segment.id}):`, error);
      }
    }

    const skippedCount = currentProject.segments.length - segmentsToGenerate.length;
    
    set({ isLoading: false });
    
    return {
      success: successCount,
      skipped: skippedCount,
      failed: failedCount,
      results
    };
  },

  generateSegmentVideo: async (_segmentId: string, imageUrl: string, prompt: string) => {
    set({ isLoading: true, error: null });

    try {
      const aiStore = useAIStore.getState();
      const result = await aiStore.generateVideo({ 
        imageUrl, 
        prompt,
        segmentId: _segmentId,
        duration: 5,
        aspectRatio: '16:9'
      });

      if (result && (result.taskId || result.videoUrl)) {
        set({ isLoading: false });
        return {
          taskId: result.taskId || '',
          videoUrl: result.videoUrl
        };
      } else {
        throw new Error('Invalid video generation response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  generateSegmentAudio: async (segmentId: string, _text: string, voice: string = 'default', model?: string) => {
    set({ isLoading: true, error: null });

    try {
      // Get current project to find the segment
      const state = useProjectStore.getState();
      const currentProject = state.currentProject || state.projects.find(p => 
        p.segments.some(s => s.id === segmentId)
      );

      if (!currentProject) {
        throw new Error('Project not found for segment');
      }

      // Use the new project service method
      const result = await projectService.generateSegmentAudio(
        currentProject.id, 
        segmentId, 
        voice, 
        model
      );

      // Update local state with the updated segment
      set(state => ({
        projects: state.projects.map(p => 
          p.id === currentProject.id 
            ? { ...p, segments: p.segments.map(s => s.id === segmentId ? result.segment : s) }
            : p
        ),
        currentProject: state.currentProject?.id === currentProject.id
          ? { 
              ...state.currentProject, 
              segments: state.currentProject.segments.map(s => s.id === segmentId ? result.segment : s)
            }
          : state.currentProject,
        isLoading: false
      }));

      return result.audioUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio generation failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Select audio for segment
  selectSegmentAudio: async (projectId: string, segmentId: string, audioId: string) => {
    try {
      set({ isLoading: true, error: null });

      await projectService.selectSegmentAudio(projectId, segmentId, audioId);

      // Update the local state to reflect the selection
      set((state) => ({
        projects: state.projects.map(p => 
          p.id === projectId
            ? {
                ...p,
                segments: p.segments.map(s => 
                  s.id === segmentId
                    ? {
                        ...s,
                        audios: s.audios.map(a => ({
                          ...a,
                          isSelected: a.id === audioId
                        }))
                      }
                    : s
                )
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              segments: state.currentProject.segments.map(s => 
                s.id === segmentId
                  ? {
                      ...s,
                      audios: s.audios.map(a => ({
                        ...a,
                        isSelected: a.id === audioId
                      }))
                    }
                  : s
              )
            }
          : state.currentProject,
        isLoading: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select audio';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Select image for segment
  selectSegmentImage: async (projectId: string, segmentId: string, imageId: string) => {
    try {
      set({ isLoading: true, error: null });

      await projectService.selectSegmentImage(projectId, segmentId, imageId);

      // Update the local state to reflect the selection
      set((state) => ({
        projects: state.projects.map(p => 
          p.id === projectId
            ? {
                ...p,
                segments: p.segments.map(s => 
                  s.id === segmentId
                    ? {
                        ...s,
                        images: s.images.map(img => ({
                          ...img,
                          isSelected: img.id === imageId
                        }))
                      }
                    : s
                )
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              segments: state.currentProject.segments.map(s => 
                s.id === segmentId
                  ? {
                      ...s,
                      images: s.images.map(img => ({
                        ...img,
                        isSelected: img.id === imageId
                      }))
                    }
                  : s
              )
            }
          : state.currentProject,
        isLoading: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select image';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get all images for segment
  getSegmentImages: async (segmentId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const images = await projectService.getSegmentImages(segmentId);
      
      set({ isLoading: false });
      return images;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get segment images';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
