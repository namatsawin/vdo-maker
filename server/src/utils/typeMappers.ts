import { Project as PrismaProject, Segment as PrismaSegment, Image, Video, Audio } from '@prisma/client';
import { Project, VideoSegment, MediaAsset, ProjectStatus, WorkflowStage, ApprovalStatus } from '../types/shared';

// Type for Prisma project with relations
type PrismaProjectWithRelations = PrismaProject & {
  segments: (PrismaSegment & {
    images: Image[];
    videos: Video[];
    audios: Audio[];
  })[];
};

// Type for Prisma segment with relations
type PrismaSegmentWithRelations = PrismaSegment & {
  images: Image[];
  videos: Video[];
  audios: Audio[];
};

// Helper function to extract filename from URL
const extractFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'unknown';
  } catch {
    return 'unknown';
  }
};

// Helper function to infer media type from URL
const inferMediaTypeFromUrl = (url: string): 'image' | 'video' | 'audio' => {
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
    return 'video';
  }
  
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '')) {
    return 'audio';
  }
  
  return 'image'; // Default fallback
};

// Convert Prisma Image to MediaAsset
const mapImageAsset = (image: Image): MediaAsset => {
  const metadata = image.metadata ? JSON.parse(image.metadata) : {};
  
  return {
    id: image.id,
    url: image.url,
    filename: extractFilenameFromUrl(image.url),
    type: 'image',
    size: metadata.size || 0,
    width: metadata.width,
    height: metadata.height,
    prompt: image.prompt,
    metadata,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString(),
  };
};

// Convert Prisma Video to MediaAsset
const mapVideoAsset = (video: Video): MediaAsset => {
  const metadata = video.metadata ? JSON.parse(video.metadata) : {};
  
  return {
    id: video.id,
    url: video.url,
    filename: extractFilenameFromUrl(video.url),
    type: 'video',
    size: metadata.size || 0,
    width: metadata.width,
    height: metadata.height,
    prompt: video.prompt,
    metadata,
    duration: video.duration || undefined,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
};

// Convert Prisma Audio to MediaAsset
const mapAudioAsset = (audio: Audio): MediaAsset => {
  const metadata = audio.metadata ? JSON.parse(audio.metadata) : {};
  
  return {
    id: audio.id,
    url: audio.url,
    filename: extractFilenameFromUrl(audio.url),
    type: 'audio',
    size: metadata.size || 0,
    prompt: audio.text, // Audio uses 'text' field as prompt
    metadata,
    duration: audio.duration || undefined,
    isSelected: audio.isSelected || false, // New field for audio selection
    voice: audio.voice, // Voice type used for generation
    text: audio.text, // Text that was converted to speech
    createdAt: audio.createdAt.toISOString(),
    updatedAt: audio.updatedAt.toISOString(),
  };
};

// Helper function to calculate segment duration
const calculateSegmentDuration = (segment: PrismaSegmentWithRelations): number => {
  // Try to get duration from video assets first
  const videoDuration = segment.videos.reduce((max, video) => 
    Math.max(max, video.duration || 0), 0);
  
  if (videoDuration > 0) {
    return videoDuration;
  }
  
  // Try to get duration from audio assets
  const audioDuration = segment.audios.reduce((max, audio) => 
    Math.max(max, audio.duration || 0), 0);
  
  if (audioDuration > 0) {
    return audioDuration;
  }
  
  // Default duration based on script length (rough estimate)
  const wordsPerMinute = 150;
  const words = segment.script.split(' ').length;
  return Math.max(5, Math.ceil((words / wordsPerMinute) * 60)); // At least 5 seconds
};

// Convert Prisma Segment to VideoSegment
export const mapVideoSegment = (segment: PrismaSegmentWithRelations): VideoSegment => {
  const duration = calculateSegmentDuration(segment);
  const scriptApprovalStatus = segment.scriptApprovalStatus as ApprovalStatus;
  
  return {
    id: segment.id,
    order: segment.order,
    script: segment.script,
    videoPrompt: segment.videoPrompt,
    status: segment.status as ApprovalStatus,
    duration,
    
    // Map media assets
    images: segment.images.map(mapImageAsset),
    videos: segment.videos.map(mapVideoAsset),
    audios: segment.audios.map(mapAudioAsset),
    
    // Individual approval statuses
    scriptApprovalStatus: segment.scriptApprovalStatus as ApprovalStatus,
    imageApprovalStatus: segment.imageApprovalStatus as ApprovalStatus,
    videoApprovalStatus: segment.videoApprovalStatus as ApprovalStatus,
    audioApprovalStatus: segment.audioApprovalStatus as ApprovalStatus,
    finalApprovalStatus: segment.finalApprovalStatus as ApprovalStatus,
    
    createdAt: segment.createdAt.toISOString(),
    updatedAt: segment.updatedAt.toISOString(),
  };
};

// Convert Prisma Project to Project
export const mapProject = (project: PrismaProjectWithRelations): Project => {
  return {
    id: project.id,
    title: project.title,
    name: project.title, // For frontend compatibility
    description: project.description || undefined,
    status: project.status as ProjectStatus,
    currentStage: project.currentStage as WorkflowStage,
    segments: project.segments.map(mapVideoSegment),
    userId: project.userId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
};

// Helper function to determine current stage based on segment statuses
export const calculateCurrentStage = (segments: PrismaSegmentWithRelations[]): WorkflowStage => {
  if (segments.length === 0) {
    return 'SCRIPT_GENERATION';
  }

  // Check if all segments have approved scripts
  const allScriptsApproved = segments.every(s => s.scriptApprovalStatus === 'APPROVED');
  if (!allScriptsApproved) {
    return 'SCRIPT_GENERATION';
  }

  // Check if all segments have approved images
  const allImagesApproved = segments.every(s => s.imageApprovalStatus === 'APPROVED');
  if (!allImagesApproved) {
    return 'IMAGE_GENERATION';
  }

  // Check if all segments have approved videos
  const allVideosApproved = segments.every(s => s.videoApprovalStatus === 'APPROVED');
  if (!allVideosApproved) {
    return 'VIDEO_GENERATION';
  }

  // Check if all segments are finally approved
  const allFinalApproved = segments.every(s => s.finalApprovalStatus === 'APPROVED');
  if (!allFinalApproved) {
    return 'FINAL_ASSEMBLY';
  }

  return 'COMPLETED';
};

// Helper function to determine project status based on segments
export const calculateProjectStatus = (segments: PrismaSegmentWithRelations[]): ProjectStatus => {
  if (segments.length === 0) {
    return 'DRAFT';
  }

  // Check if all segments are completed
  const allCompleted = segments.every(s => s.finalApprovalStatus === 'APPROVED');
  if (allCompleted) {
    return 'COMPLETED';
  }

  // Default to draft for all other cases
  return 'DRAFT';
};
