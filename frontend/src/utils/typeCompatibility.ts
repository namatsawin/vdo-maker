import type { Project, VideoSegment, ApprovalStatus } from '@/types';

// Legacy approval status values
export const LEGACY_APPROVAL_STATUS = {
  approved: 'APPROVED' as ApprovalStatus,
  rejected: 'REJECTED' as ApprovalStatus,
  draft: 'DRAFT' as ApprovalStatus,
  regenerating: 'REGENERATING' as ApprovalStatus,
};

// Convert legacy approval status to new enum
export const convertLegacyApprovalStatus = (status: string): ApprovalStatus => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'APPROVED' as ApprovalStatus;
    case 'rejected':
      return 'REJECTED' as ApprovalStatus;
    case 'regenerating':
      return 'REGENERATING' as ApprovalStatus;
    case 'draft':
    default:
      return 'DRAFT' as ApprovalStatus;
  }
};

// Convert new enum to legacy approval status
export const convertToLegacyApprovalStatus = (status: ApprovalStatus): string => {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'REGENERATING':
      return 'regenerating';
    case 'DRAFT':
    default:
      return 'draft';
  }
};

// Check if approval status matches legacy string
export const isApprovalStatus = (status: ApprovalStatus | undefined, legacyStatus: string): boolean => {
  if (!status) return false;
  return convertToLegacyApprovalStatus(status) === legacyStatus;
};

// Enhance project with compatibility fields
export const enhanceProjectForCompatibility = (project: Project): Project => {
  return {
    ...project,
    name: project.title, // Map title to name for backward compatibility
    segments: project.segments.map(enhanceSegmentForCompatibility),
  };
};

// Enhance segment with compatibility fields
export const enhanceSegmentForCompatibility = (segment: VideoSegment): VideoSegment => {
  // Calculate duration from media assets if not provided
  const duration = segment.duration || calculateSegmentDuration(segment);
  
  return {
    ...segment,
    duration,
    // Ensure all media assets have required fields
    images: segment.images.map(enhanceMediaAssetForCompatibility),
    videos: segment.videos.map(enhanceMediaAssetForCompatibility),
    audios: segment.audios.map(enhanceMediaAssetForCompatibility),
  };
};

// Enhance media asset with compatibility fields
export const enhanceMediaAssetForCompatibility = (asset: any) => {
  return {
    ...asset,
    filename: asset.filename || extractFilenameFromUrl(asset.url) || 'unknown',
    type: asset.type || inferMediaTypeFromUrl(asset.url),
    size: asset.size || 0,
    width: asset.width || (asset.metadata?.width),
    height: asset.height || (asset.metadata?.height),
  };
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

// Helper function to calculate segment duration
const calculateSegmentDuration = (segment: VideoSegment): number => {
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

// Check if all segments in a project are approved for a specific stage
export const areAllSegmentsApprovedForStage = (
  segments: VideoSegment[], 
  stage: 'script' | 'image' | 'video' | 'audio' | 'final'
): boolean => {
  return segments.every(segment => {
    switch (stage) {
      case 'script':
        return segment.scriptApprovalStatus === 'APPROVED';
      case 'image':
        return segment.imageApprovalStatus === 'APPROVED';
      case 'video':
        return segment.videoApprovalStatus === 'APPROVED';
      case 'audio':
        return segment.audioApprovalStatus === 'APPROVED';
      case 'final':
        return segment.finalApprovalStatus === 'APPROVED';
      default:
        return false;
    }
  });
};

// Get the overall approval status for a segment
export const getSegmentOverallStatus = (segment: VideoSegment): ApprovalStatus => {
  // If any stage is rejected, the overall status is rejected
  if ([
    segment.scriptApprovalStatus,
    segment.imageApprovalStatus,
    segment.videoApprovalStatus,
    segment.audioApprovalStatus,
    segment.finalApprovalStatus
  ].includes('REJECTED' as ApprovalStatus)) {
    return 'REJECTED' as ApprovalStatus;
  }
  
  // If all stages are approved, the overall status is approved
  if ([
    segment.scriptApprovalStatus,
    segment.imageApprovalStatus,
    segment.videoApprovalStatus,
    segment.audioApprovalStatus,
    segment.finalApprovalStatus
  ].every(status => status === 'APPROVED')) {
    return 'APPROVED' as ApprovalStatus;
  }
  
  // If any stage is in progress, the overall status is regenerating
  if ([
    segment.scriptApprovalStatus,
    segment.imageApprovalStatus,
    segment.videoApprovalStatus,
    segment.audioApprovalStatus,
    segment.finalApprovalStatus
  ].some(status => ['REGENERATING'].includes(status as string))) {
    return 'REGENERATING' as ApprovalStatus;
  }
  
  // Default to draft
  return 'DRAFT' as ApprovalStatus;
};
