import { useState, useEffect, useMemo } from 'react';
import { Check, X, RotateCcw, Download, Loader2, Video, BrushCleaning, Wand2, Clock, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { PromptAdvisor } from './PromptAdvisor';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useAIStore } from '@/stores/aiStore';
import type { VideoSegment, MediaAsset, ApprovalStatus as IApprovalStatus, MediaStatus } from '@/types';
import { convertToLegacyApprovalStatus, isApprovalStatus } from '@/utils/typeCompatibility';
import { cn } from '@/lib/utils';

interface VideoApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
}

// Duration options supported by the model
const DURATION_OPTIONS = [
  { value: 5, label: '5 seconds', description: 'Short, focused clip' },
  { value: 10, label: '10 seconds', description: 'Extended scene' },
] as const;

// Mode options for video generation
const MODE_OPTIONS = [
  { value: 'std', label: 'Standard', description: 'Balanced quality and speed' },
  { value: 'pro', label: 'Professional', description: 'Higher quality, longer processing' },
] as const;

// Default negative prompt
const DEFAULT_NEGATIVE_PROMPT = 'blurry, low quality, pixelated, noisy, grainy, compression artifacts, distorted, deformed, bad anatomy, poorly drawn, disfigured, malformed, extra limbs, fused limbs, mutated, missing body parts, watermarks, text, signature, logo, cropped, out of frame, unnatural proportions, ugly, bad composition';

export function VideoApproval({
  segment,
  index,
  onApprove,
  onReject
}: VideoApprovalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState(segment.videoPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [selectedMode, setSelectedMode] = useState<string>('std');
  const [showPromptAdvisor, setShowPromptAdvisor] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { generateSegmentVideo, selectSegmentVideo, currentProject, loadProject } = useProjectStore();
  const { addToast } = useUIStore();

  // Helper function to safely parse video metadata
  const parseVideoMetadata = (video: MediaAsset) => {
    try {
      if (!video.metadata) {
        return {};
      }
      
      if (typeof video.metadata === 'string') {
        return JSON.parse(video.metadata);
      } else if (typeof video.metadata === 'object' && video.metadata !== null) {
        return video.metadata;
      } else {
        return {};
      }
    } catch (error) {
      return {};
    }
  };

  // Get the selected image from the segment
  const selectedImage = segment.images?.find(img => img.isSelected) || segment.images?.[0] || null;
  const imageUrl = selectedImage?.url;

  const availableVideos = useMemo(() => {
    if (!segment.videos.length) return []

    return segment.videos.sort((a, b) => {
      const x = new Date(a.createdAt).getTime()
      const y = new Date(b.createdAt).getTime()
      return y - x
    })
  }, [segment.videos])
  
  const selectedVideo = availableVideos.find(video => video.isSelected);
  const hasVideo = availableVideos.length

  const currentStatus = segment.videoApprovalStatus;
  const isApproved = isApprovalStatus(currentStatus, 'approved');

  // Auto-collapse when approved
  useEffect(() => {
    if (isApproved) setIsCollapsed(true)
  }, [isApproved])

  const approve = (segmentId: string) => {
    onApprove(segmentId)
    setIsCollapsed(true)
  }

  const reject = (segmentId: string) => {
    onReject(segmentId)
  }

  // Create collapsed summary content
  const getCollapsedSummary = () => {
    if (!hasVideo) {
      return (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Video className="h-4 w-4" />
          <span>No video generated yet</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <video
            src={selectedVideo?.url}
            className="w-16 h-10 object-cover rounded border"
            muted
            poster={selectedImage?.url}
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {selectedVideo?.duration || selectedDuration}s • {selectedMode.toUpperCase()}
            </div>
            <div className="text-gray-500 text-xs">
              {availableVideos.length > 1 ? `${availableVideos.length} versions` : '1 version'}
            </div>
          </div>
        </div>
        {isApproved && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: IApprovalStatus) => {
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Draft</span>;
    }
  };

  // Initialize video prompt from segment
  useEffect(() => {
    if (segment.videoPrompt && !videoPrompt) {
      setVideoPrompt(segment.videoPrompt);
    }
  }, [segment.videoPrompt]);

  // Poll for pending video status
  useEffect(() => {
    if (!selectedVideo) return;

    // Safely get taskId and status from metadata using helper function
    const metadata = parseVideoMetadata(selectedVideo);
    const taskId = metadata.taskId;
    const currentStatus = getVideoStatus(selectedVideo);

    const isPending = (value: MediaStatus) => {
      return value === 'pending' || value === 'processing' || value === 'staged'
    }
    
    if (!taskId) return;
    
    if (!isPending(currentStatus)) return;

    const pollInterval = setInterval(async () => {
      try {
        const { checkVideoStatus } = useAIStore.getState();
        const statusData = await checkVideoStatus(taskId);
        
        if (isPending(statusData.status)) return;

        if (currentProject) {
          await loadProject(currentProject.id)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    }, 12000); // Poll every 12 seconds

    // Cleanup interval on unmount or when video is completed
    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedVideo?.id, currentProject]);

  const generateVideo = async () => {
    if (!imageUrl) {
      addToast({
        type: 'error',
        title: 'No Image Selected',
        message: 'Please select an image first before generating video.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await generateSegmentVideo(
        segment.id, 
        imageUrl, 
        videoPrompt, 
        selectedDuration,
        negativePrompt,
        selectedMode
      );
      
      addToast({
        type: 'info',
        title: 'Video Generation Started',
        message: `Your ${selectedDuration}-second video is being processed. This may take several minutes.`,
      });

      if (currentProject) {
        await loadProject(currentProject.id)
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      addToast({
        type: 'error',
        title: 'Video Generation Failed',
        message: 'Failed to generate video. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!imageUrl) {
      addToast({
        type: 'error',
        title: 'No Image Selected',
        message: 'Please select an image first before generating video.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await generateSegmentVideo(
        segment.id, 
        imageUrl, 
        videoPrompt, 
        selectedDuration,
        negativePrompt,
        selectedMode
      );

      addToast({
        type: 'info',
        title: 'Video Regeneration Started',
        message: `Your new ${selectedDuration}-second video is being processed.`,
      });

      if (currentProject) {
        await loadProject(currentProject.id)
      }
    } catch (error) {
      console.error('Video regeneration failed:', error);
      addToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Failed to regenerate video. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVideoSelect = async (videoId: string) => {
    if (!currentProject) return;
    
    try {
      await selectSegmentVideo(currentProject.id, segment.id, videoId);
      addToast({
        type: 'success',
        title: 'Video Selected',
        message: 'Video selection updated successfully.',
      });
    } catch (error) {
      console.error('Failed to select video:', error);
      addToast({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select video. Please try again.',
      });
    }
  };

  const handleDownload = (video: MediaAsset) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `segment-${index + 1}-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVideoStatus = (video: MediaAsset) => {
    return video.status
  };

  const isVideoPending = (video: MediaAsset) => {
    const status = getVideoStatus(video);
    return status === 'pending' || status === 'processing' || status === 'staged';
  };

  return (
    <Card className={`w-full ${isApproved ? 'border-green-200 bg-green-50' : ''}`}>
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
        className='px-4'
        trigger={
          <CollapsibleTrigger>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Segment {index + 1} - Video Generation
                  {isApproved && <Lock className="h-4 w-4 text-green-600" />}
                </CardTitle>
                {getStatusBadge(segment.videoApprovalStatus || 'DRAFT')}
              </div>
              {isCollapsed && (
                <div className="mt-3">
                  {getCollapsedSummary()}
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>
        }
      >
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
        {/* Approval Lock Notice */}
        {isApproved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              This segment is approved and cannot be edited
            </span>
          </div>
        )}
        {/* Video Generation Controls */}
        <div className="space-y-4">
          {/* Video Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">Video Prompt:</Label>
              {!isApproved && (
                 <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromptAdvisor(true)}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                  disabled={!videoPrompt.length}
                >
                  <BrushCleaning className="h-4 w-4" />
                  Sanitize Prompt
                </Button>
              )}
              {isApproved && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="h-3 w-3" />
                  Settings Locked
                </div>
              )}
            </div>
            <Textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              className={`min-h-[100px] resize-none ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}
              disabled={isGenerating || isApproved}
              readOnly={isApproved}
            />
          </div>

          {/* Generation Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Video Duration:
              </Label>
              <Select
                value={selectedDuration.toString()}
                onValueChange={(value) => setSelectedDuration(parseInt(value))}
                disabled={isApproved}
              >
                <SelectTrigger className={`w-full ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">- {option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-500" />
                Generation Mode:
              </Label>
              <Select
                value={selectedMode}
                onValueChange={setSelectedMode}
                disabled={isApproved}
              >
                <SelectTrigger className={`w-full ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">- {option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Negative Prompt */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Negative Prompt:</Label>
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Describe what you don't want in the video..."
              className={`resize-none text-sm ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}
              rows={3}
              disabled={isGenerating || isApproved}
              readOnly={isApproved}
            />
          </div>

          {/* First Frame Image Button */}
          {selectedImage && (
            <Button
              size="sm"
              onClick={() => setShowImagePreview(true)}
              className="ml-auto flex items-center gap-2 cursor-pointer hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Image Reference
            </Button>          
          )}
        </div>

        {/* Selected Video Display */}
        {selectedVideo && (
          <div className="space-y-4">
            {/* Pending/Processing Status */}
            {isVideoPending(selectedVideo) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900">
                    {getVideoStatus(selectedVideo) === 'pending' ? 'Video Generation Queued' : 'Generating Video...'}
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  Your {selectedVideo.duration || selectedDuration}-second video is being processed. 
                  This may take several minutes. Status will update automatically.
                </div>
                {(() => {
                  // Safely get taskId from metadata using helper function
                  const metadata = parseVideoMetadata(selectedVideo);
                  const taskId = metadata.taskId;
                  
                  return taskId ? (
                    <div className="text-xs text-blue-600 mt-2">
                      Task ID: {taskId}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Completed Video */}
            {!isVideoPending(selectedVideo) && selectedVideo.url && (
              <div className="border rounded-lg p-4">
                <div className="relative mb-3 border-b pb-6">
                  <video
                    src={selectedVideo.url}
                    className="w-full mx-auto max-w-3xl aspect-video object-contain rounded-md bg-gray-100"
                    controls
                    poster={selectedImage?.url} // Use first frame as poster
                  />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {selectedVideo.duration || selectedDuration}s • {selectedMode.toUpperCase()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedVideo)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Generated:</strong> {new Date(selectedVideo.createdAt).toLocaleString()}</p>
                  {selectedVideo.prompt && (
                    <p><strong>Prompt:</strong> {selectedVideo.prompt.substring(0, 150)}...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cn('space-y-4', { hidden: !hasVideo })}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Select Video ({availableVideos.length} available)</h4>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Choose Video:</Label>
            <Select
              value={selectedVideo?.id || ''}
              onValueChange={handleVideoSelect}
              disabled={isApproved}
            >
              <SelectTrigger className={`w-full ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}>
                <SelectValue placeholder="Select a video" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {availableVideos.map((video) => (
                  <SelectItem key={video.id} value={video.id} disabled={video.status === 'failed'}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Video</span>
                      <span className="text-xs text-gray-500">
                        ({video.duration}s • {new Date(video.createdAt).toLocaleString()})
                      </span>
                      <span className={cn('text-xs text-blue-600', { hidden: !isVideoPending(video) })}>(Processing...)</span>
                      <span className={cn('text-xs text-red-600', { hidden: video.status !== 'failed' })}>(Failed)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* No Videos State */}
        {availableVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Video className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Video</h3>
            <p className="text-gray-500 mb-4">
              Use the selected image as the first frame and generate a video
            </p>
            <Button 
              onClick={generateVideo} 
              variant="ghost"
              className={`flex items-center gap-2 mx-auto cursor-pointer hover:bg-gray-50 ${isApproved ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!videoPrompt.trim() || !selectedImage || isGenerating || isApproved}
            >
              {isGenerating ? 
                <>Loading...<Loader2 className="h-6 w-6 animate-spin" /></> : 
                <>Click here to generate</>
              }
            </Button>
            {!videoPrompt.trim() && (
              <p className="text-xs text-gray-400 mt-2">Please enter a video prompt first</p>
            )}
            {!selectedImage && (
              <p className="text-xs text-gray-400 mt-2">Please select an image first</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {selectedVideo && !isVideoPending(selectedVideo) && !isApproved && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating || isApproved}
              variant="outline"
              className={`flex items-center gap-2 ${isApproved ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Regenerate ({selectedDuration}s)
            </Button>

            <div className="flex items-center gap-3 ml-auto">
              <Button
                variant="outline"
                onClick={() => reject(segment.id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => approve(segment.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                disabled={selectedVideo.status !== 'completed'}
              >
                <Check className="h-4 w-4" />
                Approve Video
              </Button>
            </div>
          </div>
        )}

        {/* Approved State */}
        {isApproved && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Video Approved</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              This video has been approved and will be used in the final assembly.
            </p>
          </div>
        )}
      </CardContent>
      </CollapsibleContent>
      </Collapsible>

      <PromptAdvisor
        currentPrompt={videoPrompt}
        onPromptUpdate={setVideoPrompt}
        isOpen={showPromptAdvisor}
        onClose={() => setShowPromptAdvisor(false)}
      />

      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <img 
                src={selectedImage.url} 
                alt={`Segment ${index + 1} selected image`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Segment {index + 1}:</strong> This approved image will be used as the first frame 
                  for your {selectedDuration}-second video generation.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                 Click outside to close
                </p>
              </div>
            </div>
          </div>
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setShowImagePreview(false)}
          />
        </div>
      )}
    </Card>
  );
}
