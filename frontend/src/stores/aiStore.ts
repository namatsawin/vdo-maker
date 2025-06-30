import { create } from 'zustand';
import { apiClient, type ScriptGenerationRequest } from '@/lib/api';
import type { ImageGenerationRequest, VideoGenerationRequest } from '@/types/shared';

interface AIState {
  isGenerating: boolean;
  error: string | null;
  lastGeneration: {
    type: 'script' | 'image' | 'video' | 'audio';
    timestamp: string;
    data?: any;
  } | null;
}

interface AIActions {
  generateScript: (request: ScriptGenerationRequest) => Promise<any>;
  generateImage: (request: ImageGenerationRequest) => Promise<any>;
  generateVideo: (request: VideoGenerationRequest) => Promise<any>;
  generateAudio: (text: string, voice?: string, model?: string) => Promise<any>;
  analyzeAndReviseContent: (content: string) => Promise<{
    issues: string[];
    suggestions: string[];
    revisedPrompt: string;
    confidence: number;
    explanation: string;
  }>;
  checkVideoStatus: (taskId: string) => Promise<any>;
  testConnection: () => Promise<any>;
  getAvailableModels: () => Promise<any>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAIStore = create<AIState & AIActions>()((set) => ({
  // State
  isGenerating: false,
  error: null,
  lastGeneration: null,

  // Actions
  generateScript: async (request: ScriptGenerationRequest) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await apiClient.generateScript(request);

      if (response.success && response.data) {
        set({
          isGenerating: false,
          lastGeneration: {
            type: 'script',
            timestamp: new Date().toISOString(),
            data: response.data,
          },
        });
        return response.data;
      } else {
        set({
          error: response.error?.message || 'Script generation failed',
          isGenerating: false,
        });
        throw new Error(response.error?.message || 'Script generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Script generation failed';
      set({
        error: errorMessage,
        isGenerating: false,
      });
      throw error;
    }
  },

  generateImage: async (request: ImageGenerationRequest) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await apiClient.generateImage(request);

      if (response.success && response.data) {
        set({
          isGenerating: false,
          lastGeneration: {
            type: 'image',
            timestamp: new Date().toISOString(),
            data: response.data,
          },
        });
        return response.data;
      } else {
        set({
          error: response.error?.message || 'Image generation failed',
          isGenerating: false,
        });
        throw new Error(response.error?.message || 'Image generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Image generation failed';
      set({
        error: errorMessage,
        isGenerating: false,
      });
      throw error;
    }
  },

  generateVideo: async (request: VideoGenerationRequest) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await apiClient.generateVideo(request);

      if (response.success && response.data) {
        set({
          isGenerating: false,
          lastGeneration: {
            type: 'video',
            timestamp: new Date().toISOString(),
            data: response.data,
          },
        });
        return response.data;
      } else {
        set({
          error: response.error?.message || 'Video generation failed',
          isGenerating: false,
        });
        throw new Error(response.error?.message || 'Video generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
      set({
        error: errorMessage,
        isGenerating: false,
      });
      throw error;
    }
  },

  generateAudio: async (text: string, voice: string = 'default', model?: string) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await apiClient.generateTTS(text, voice, model);

      if (response.success && response.data) {
        set({
          isGenerating: false,
          lastGeneration: {
            type: 'audio',
            timestamp: new Date().toISOString(),
            data: response.data,
          },
        });
        return response.data;
      } else {
        set({
          error: response.error?.message || 'Audio generation failed',
          isGenerating: false,
        });
        throw new Error(response.error?.message || 'Audio generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio generation failed';
      set({
        error: errorMessage,
        isGenerating: false,
      });
      throw error;
    }
  },

  analyzeAndReviseContent: async (content: string) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await apiClient.analyzeAndReviseContent(content);

      if (response.success && response.data) {
        set({
          isGenerating: false,
          lastGeneration: {
            type: 'image',
            timestamp: new Date().toISOString(),
            data: response.data,
          },
        });

        return response.data;
      } else {
        set({
          error: response.error?.message || 'Content analysis failed',
          isGenerating: false,
        });
        throw new Error(response.error?.message || 'Content analysis failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Content analysis failed';
      set({
        error: errorMessage,
        isGenerating: false,
      });
      throw error;
    }
  },

  checkVideoStatus: async (taskId: string) => {
    try {
      const response = await apiClient.getVideoStatus(taskId);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to check video status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check video status';
      set({ error: errorMessage });
      throw error;
    }
  },

  testConnection: async () => {
    try {
      const response = await apiClient.testAIConnection();

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Connection test failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      set({ error: errorMessage });
      throw error;
    }
  },

  getAvailableModels: async () => {
    try {
      const response = await apiClient.getAvailableModels();

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch models');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models';
      set({ error: errorMessage });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),
}));
