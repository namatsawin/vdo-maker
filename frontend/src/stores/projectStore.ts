import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, VideoSegment } from '@/types';
import { mockProjects } from '@/data/mockProjects';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadMockData: () => void;
  generateMockSegments: () => VideoSegment[];
}

const mockSegmentTemplates = [
  {
    script: "Welcome to our story. In a world where technology meets creativity, we embark on a journey that will transform how we think about digital content creation.",
    videoPrompt: "A futuristic cityscape at dawn with gleaming skyscrapers and flying vehicles, establishing the high-tech world of our story."
  },
  {
    script: "Our protagonist discovers an ancient artifact that holds the key to unlocking unprecedented creative powers, changing everything they thought they knew.",
    videoPrompt: "Close-up of hands carefully examining a glowing, mysterious artifact with intricate symbols and pulsing energy."
  },
  {
    script: "As the truth unfolds, allies and enemies emerge from the shadows, each with their own agenda in this battle for creative control.",
    videoPrompt: "Dramatic silhouettes of multiple figures standing in a dimly lit room, tension visible in their postures."
  },
  {
    script: "The final confrontation approaches. With newfound abilities and trusted companions, our hero must make a choice that will determine the future.",
    videoPrompt: "Epic wide shot of the protagonist standing at the edge of a cliff, overlooking a vast landscape, wind blowing through their hair."
  },
  {
    script: "In the end, creativity triumphs over conformity, and a new era of artistic expression begins, inspiring generations to come.",
    videoPrompt: "Bright, hopeful scene showing people of all ages creating art, music, and stories together in a vibrant community space."
  }
];

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set, _get) => ({
      // State
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      // Actions
      setProjects: (projects) => set({ projects }),

      setCurrentProject: (project) => set({ currentProject: project }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates }
              : state.currentProject,
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      generateMockSegments: () => {
        const numSegments = Math.floor(Math.random() * 3) + 3; // 3-5 segments
        const segments: VideoSegment[] = [];
        
        for (let i = 0; i < numSegments; i++) {
          const template = mockSegmentTemplates[i % mockSegmentTemplates.length];
          segments.push({
            id: Math.random().toString(36).substr(2, 9),
            script: template.script,
            videoPrompt: template.videoPrompt,
            duration: Math.floor(Math.random() * 20) + 10, // 10-30 seconds
            order: i,
            approvalStatus: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        
        return segments;
      },

      loadMockData: () => {
        set({ projects: mockProjects, isLoading: false, error: null });
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
    }
  )
);
