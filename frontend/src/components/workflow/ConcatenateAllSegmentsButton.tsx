import { useState } from 'react';
import { Film, Loader2, Settings, Play, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { API_ENDPOINTS } from '@/config/api';
import { type VideoSegment, type Project, ApprovalStatus } from '@/types';

interface ConcatenateOptions {
  videoCodec: 'copy' | 'h264' | 'h265';
  audioCodec: 'copy' | 'aac' | 'mp3';
  resolution?: string;
  frameRate?: number;
  addTransitions?: boolean;
  transitionDuration?: number;
}

interface ConcatenateAllSegmentsButtonProps {
  project: Project;
  segments: VideoSegment[];
}

export function ConcatenateAllSegmentsButton({ 
  project,
  segments 
}: ConcatenateAllSegmentsButtonProps) {
  const [isConcatenating, setIsConcatenating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [concatenateOptions, setConcatenateOptions] = useState<ConcatenateOptions>({
    videoCodec: 'copy',
    audioCodec: 'copy',
    resolution: undefined,
    frameRate: undefined,
    addTransitions: false,
    transitionDuration: 0.5
  });
  const [concatenationProgress, setConcatenationProgress] = useState<{
    stage: string;
    message: string;
  }>({ stage: '', message: '' });
  
  const { addToast } = useUIStore();
  const { updateProject } = useProjectStore();

  // Helper functions
  const getSegmentResultUrl = (segment: VideoSegment): string | null => {
    return segment.result_url || null;
  };

  const hasSegmentResult = (segment: VideoSegment): boolean => {
    return !!segment.result_url;
  };

  // Calculate segments status
  const segmentsWithResults = segments.filter(segment => hasSegmentResult(segment));
  const segmentsMissingResults = segments.filter(segment => !hasSegmentResult(segment));
  const allSegmentsApproved = segments.every(segment => segment.finalApprovalStatus === ApprovalStatus.APPROVED);
  const canConcatenate = segmentsWithResults.length === segments.length && allSegmentsApproved && segments.length > 0;

  const updateConcatenateOption = (key: keyof ConcatenateOptions, value: string | number | boolean | undefined) => {
    setConcatenateOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleConcatenateAll = async () => {
    if (!canConcatenate) {
      addToast({
        type: 'warning',
        title: 'Cannot Concatenate',
        message: 'All segments must be merged and approved before concatenation.',
      });
      return;
    }

    setIsConcatenating(true);
    setConcatenationProgress({ stage: 'Preparing', message: 'Preparing video concatenation...' });

    try {
      // Get all segment URLs in order
      const segmentUrls = segments
        .sort((a, b) => a.order - b.order)
        .map(segment => getSegmentResultUrl(segment))
        .filter((url): url is string => url !== null);

      if (segmentUrls.length !== segments.length) {
        throw new Error('Some segments are missing result URLs');
      }

      setConcatenationProgress({ stage: 'Processing', message: 'Concatenating video segments...' });

      const response = await fetch(API_ENDPOINTS.MERGE.CONCATENATE_SEGMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          segmentUrls: segmentUrls,
          options: concatenateOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Concatenation request failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Concatenation failed');
      }

      setConcatenationProgress({ stage: 'Finalizing', message: 'Finalizing project...' });

      // Update project in local state
      updateProject(project.id, {
        final_video_url: result.data.concatenatedVideoUrl,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      });

      addToast({
        type: 'success',
        title: 'Concatenation Complete!',
        message: `Successfully created final video from ${result.data.segmentCount} segments in ${result.data.processingTime.toFixed(1)}s. Duration: ${formatDuration(result.data.duration)}, Size: ${formatFileSize(result.data.size)}`,
      });

    } catch (error: any) {
      console.error('Concatenation failed:', error);
      addToast({
        type: 'error',
        title: 'Concatenation Failed',
        message: error.message || 'Failed to concatenate video segments. Please try again.',
      });
    } finally {
      setIsConcatenating(false);
      setConcatenationProgress({ stage: '', message: '' });
    }
  };

  // If project already has final video, show preview instead
  if (project.final_video_url) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Final Video Ready
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Project completed successfully! Your final video is ready.
              </span>
            </div>
            
            <video
              src={project.final_video_url}
              className="w-full mx-auto max-w-4xl aspect-video bg-black object-contain rounded-md mb-4"
              controls
              preload="metadata"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-green-700">
                <div>Final video created from {segments.length} segments</div>
                <div>Status: {project.status}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = project.final_video_url!;
                    link.download = `${project.title || project.name || 'video'}_final.mp4`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reset final video to allow re-concatenation
                    updateProject(project.id, {
                      final_video_url: null,
                      status: 'DRAFT',
                      updatedAt: new Date().toISOString(),
                    });
                    
                    addToast({
                      type: 'info',
                      title: 'Final Video Reset',
                      message: 'You can now re-concatenate the segments with different settings.',
                    });
                  }}
                  className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Film className="h-3 w-3" />
                  Re-create
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-purple-500" />
          Create Final Video
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium text-green-900">{segmentsWithResults.length}</div>
              <div className="text-green-600">Ready Segments</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Play className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium text-blue-900">{segments.length}</div>
              <div className="text-blue-600">Total Segments</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-900">{segmentsMissingResults.length}</div>
              <div className="text-yellow-600">Missing Results</div>
            </div>
          </div>
        </div>

        {/* Missing Requirements Details */}
        {segmentsMissingResults.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Missing Requirements:</span>
            </div>
            <div className="text-xs text-yellow-700 space-y-1">
              {segmentsMissingResults.map(segment => (
                <div key={segment.id}>
                  Segment {segment.order}: {!hasSegmentResult(segment) ? 'Not merged' : 'Not approved'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not all approved warning */}
        {segmentsWithResults.length === segments.length && !allSegmentsApproved && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Approval Required:</span>
            </div>
            <div className="text-xs text-orange-700">
              All segments must be approved before creating the final video.
            </div>
          </div>
        )}

        {/* Concatenation Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Concatenation Settings</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              {showSettings ? 'Hide' : 'Show'} Options
            </Button>
          </div>

          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">FFmpeg Concatenation Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Video Codec */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Video Codec</Label>
                  <Select
                    value={concatenateOptions.videoCodec}
                    onValueChange={(value: 'copy' | 'h264' | 'h265') => 
                      updateConcatenateOption('videoCodec', value)
                    }
                  >
                    <SelectTrigger className="text-xs" disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="copy">Copy (fastest, recommended)</SelectItem>
                      {/* <SelectItem value="h264">H.264 (re-encode)</SelectItem> */}
                      {/* <SelectItem value="h265">H.265 (smaller size)</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audio Codec */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Audio Codec</Label>
                  <Select
                    value={concatenateOptions.audioCodec}
                    onValueChange={(value: 'copy' | 'aac' | 'mp3') => 
                      updateConcatenateOption('audioCodec', value)
                    }
                  >
                    <SelectTrigger className="text-xs" disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="copy">Copy (fastest, recommended)</SelectItem>
                      <SelectItem value="aac">AAC (re-encode)</SelectItem>
                      <SelectItem value="mp3">MP3 (compatible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Resolution (Optional)</Label>
                  <Select
                    value={concatenateOptions.resolution || 'auto'}
                    onValueChange={(value) => 
                      updateConcatenateOption('resolution', value === 'auto' ? undefined : value)
                    }
                  >
                    <SelectTrigger className="text-xs" disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="auto">Auto (keep original)</SelectItem>
                      <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                      <SelectItem value="1280x720">720p (1280x720)</SelectItem>
                      <SelectItem value="854x480">480p (854x480)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Frame Rate */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Frame Rate (Optional)</Label>
                  <Select
                    value={concatenateOptions.frameRate?.toString() || 'auto'}
                    onValueChange={(value) => 
                      updateConcatenateOption('frameRate', value === 'auto' ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger className="text-xs" disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="auto">Auto (keep original)</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="25">25 FPS</SelectItem>
                      <SelectItem value="24">24 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-white rounded p-2">
                <strong>Tip:</strong> Use "Copy" codecs for fastest processing when all segments have the same format. 
                Use re-encoding only if you need to standardize different formats or change quality.
              </div>
            </div>
          )}
        </div>

        {/* Progress Display */}
        {isConcatenating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {concatenationProgress.stage}
              </span>
            </div>
            <div className="text-xs text-blue-600 mb-2">
              {concatenationProgress.message}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {canConcatenate ? (
              `Ready to create final video from ${segments.length} segments`
            ) : (
              `${segmentsMissingResults.length} segments need to be merged and approved`
            )}
          </div>

          <Button
            onClick={handleConcatenateAll}
            disabled={!canConcatenate || isConcatenating}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
          >
            {isConcatenating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Final Video...
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Create Final Video ({segments.length} segments)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
