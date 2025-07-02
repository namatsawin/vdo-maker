// API Configuration
// In Docker, the frontend runs in browser (outside container) so it needs to access backend via localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}`,
  MERGE: {
    VIDEO_AUDIO: `${API_BASE_URL}/api/${API_VERSION}/merge/video-audio`,
    CONCATENATE_SEGMENTS: `${API_BASE_URL}/api/${API_VERSION}/merge/concatenate-segments`,
  },
  MEDIA: {
    MERGED: `${API_BASE_URL}/api/media/merged`,
  }
};

export { API_BASE_URL, API_VERSION };
