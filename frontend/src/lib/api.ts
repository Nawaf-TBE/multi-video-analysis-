import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for video processing
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('🔄 API Request:', request.method?.toUpperCase(), request.url);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received');
    }
    return Promise.reject(error);
  }
);

// Types
export interface Video {
  id: number;
  url: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  video_id: number;
  title: string;
  start_time: number;
  end_time: number;
  created_at: string;
  updated_at: string;
}

export interface Frame {
  id: number;
  video_id: number;
  timestamp: number;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  citations: Array<{
    timestamp: number;
    content: string;
  }>;
  conversation_id: string;
  context_used: {
    video_info: {
      title: string;
    };
    combined_score: number;
  };
}

export interface VisualSearchResult {
  frame_id: number;
  timestamp: number;
  score: number;
  match_type: string;
  path: string;
  image_url?: string;
  image_path?: string;
}

// API Functions
export const uploadVideo = async (url: string): Promise<Video> => {
  const response = await api.post('/api/upload', { url });
  
  // The API returns { video_id, message, ... } but we need a Video object
  const data = response.data;
  return {
    id: data.video_id,
    url: url,
    title: `Video ${data.video_id}`, // Fallback title since API doesn't return it
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const getVideoSections = async (videoId: number): Promise<Section[]> => {
  const response = await api.get(`/api/sections/${videoId}`);
  return response.data;
};

export const regenerateSections = async (videoId: number): Promise<Section[]> => {
  const response = await api.post(`/api/sections/${videoId}/regenerate`);
  return response.data;
};

export const getFrames = async (videoId: number): Promise<Frame[]> => {
  const response = await api.get(`/api/frames/${videoId}`);
  return response.data;
};

export const extractFrames = async (videoId: number, interval: number = 10): Promise<any> => {
  const response = await api.post(`/api/videos/${videoId}/extract-frames`, { interval });
  return response.data; // Returns extraction result, not frames
};

export const generateEmbeddings = async (videoId: number, includeText: boolean = true, includeVisual: boolean = true) => {
  const response = await api.post(`/api/videos/${videoId}/generate-embeddings`, {
    include_text: includeText,
    include_visual: includeVisual
  });
  return response.data;
};

export const getEmbeddingsStatus = async (videoId: number): Promise<any> => {
  const response = await api.get(`/api/videos/${videoId}/embeddings-status`);
  return response.data;
};

export const chatWithVideo = async (videoId: number, message: string, conversationId?: string): Promise<ChatResponse> => {
  const response = await api.post(`/api/chat/${videoId}`, {
    message,
    conversation_id: conversationId
  });
  return response.data;
};

export const visualSearch = async (
  videoId: number, 
  query: string, 
  searchType: 'text' | 'visual' | 'hybrid' = 'hybrid',
  limit: number = 10
): Promise<{ results: VisualSearchResult[] }> => {
  const response = await api.get(`/api/visual-search/${videoId}`, {
    params: { query, search_type: searchType, limit }
  });
  return response.data;
};

export const visualSearchByTimestamp = async (
  videoId: number,
  timestamp: number,
  timeWindow: number = 30
): Promise<{ results: VisualSearchResult[] }> => {
  const response = await api.get(`/api/visual-search/${videoId}/timestamp/${timestamp}`, {
    params: { time_window: timeWindow }
  });
  return response.data;
};

export const getFrameSummary = async (videoId: number) => {
  const response = await api.get(`/api/visual-search/${videoId}/summary`);
  return response.data;
};

export default api; 