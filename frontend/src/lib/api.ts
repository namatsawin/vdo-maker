// API Client for AI Video Studio Backend
import type { 
  ImageGenerationRequest,
  VideoGenerationRequest
} from '@/types/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  token: string;
}

export interface ScriptGenerationRequest {
  title: string;
  description?: string;
  model?: string;
}

export interface ScriptSegment {
  order: number;
  script: string;
  videoPrompt: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Authentication
  async register(email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.success && response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      // Call the logout endpoint if authenticated
      if (this.isAuthenticated()) {
        await this.request('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      // Even if the API call fails, we should still clear the token
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear the token regardless of API response
      this.clearToken();
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // AI Services
  async generateScript(request: ScriptGenerationRequest): Promise<ApiResponse<{ segments: ScriptSegment[]; generatedAt: string }>> {
    return this.request('/ai/script/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateImage(request: ImageGenerationRequest): Promise<ApiResponse<{
    success: boolean;
    imageUrl?: string;
    imageBase64?: string;
    imageId?: string;
    metadata?: {
      prompt: string;
      aspectRatio?: string;
      model: string;
      numberOfImages: number;
      generationTime: number;
    };
  }>> {
    return this.request('/ai/image/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateVideo(request: VideoGenerationRequest): Promise<ApiResponse<{
    success: boolean;
    taskId?: string;
    videoUrl?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    metadata?: {
      prompt: string;
      duration: number;
      aspectRatio: string;
      generationTime?: number;
      estimatedWaitTime?: number;
    };
  }>> {
    return this.request('/ai/video/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getVideoStatus(taskId: string): Promise<ApiResponse<{
    success: boolean;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    progress?: number;
    metadata?: {
      taskId: string;
      createdAt: string;
      completedAt?: string;
    };
  }>> {
    return this.request(`/ai/video/status/${taskId}`);
  }

  async generateTTS(text: string, voice?:string , model?: string): Promise<ApiResponse<{
    audioUrl: string;
    text: string;
    voice: string;
    model: string;
    generatedAt: string;
  }>> {
    return this.request('/ai/tts/generate', {
      method: 'POST',
      body: JSON.stringify({ text, voice, model }),
    });
  }

  // Image selection methods
  async getSegmentImages(segmentId: string): Promise<ApiResponse<{
    images: Array<{
      id: string;
      url: string;
      prompt: string;
      isSelected: boolean;
      metadata: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>> {
    return this.request(`/ai/image/segment/${segmentId}`);
  }

  async selectImage(imageId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request(`/ai/image/select/${imageId}`, {
      method: 'POST'
    });
  }

  async selectVideo(videoId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request(`/ai/video/select/${videoId}`, {
      method: 'POST'
    });
  }

  async getAvailableModels(): Promise<ApiResponse<{
    models: Array<{
      value: string;
      label: string;
      description: string;
    }>;
    retrievedAt: string;
  }>> {
    return this.request('/ai/models');
  }

  async testAIConnection(): Promise<ApiResponse<{
    services: {
      gemini: string;
      imagen4: string;
      klingAI: string;
    };
    testedAt: string;
  }>> {
    return this.request('/ai/test');
  }

  // File Upload
  async uploadFile(file: File): Promise<ApiResponse<{
    file: {
      id: string;
      originalName: string;
      filename: string;
      url: string;
      size: number;
      mimetype: string;
      uploadedAt: string;
    };
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/upload/single`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
    environment: string;
    database: string;
  }>> {
    return this.request('/health', { method: 'GET' });
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
