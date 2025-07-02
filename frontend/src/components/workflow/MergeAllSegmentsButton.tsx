import { useState } from 'react';
import { Merge, Loader2, AlertCircle, CheckCircle, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useUIStore } from '@/stores/uiStore';
import { API_ENDPOINTS } from '@/config/api';
import type { VideoSegment, MediaAsset } from '@/types';

interface MergeOptions {
  duration: 'shortest' | 'longest' | 'video' | 'audio';
  audioVolume: number; // 0.0 to 2.0
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  videoCodec: 'copy' | 'h264' | 'h265';
  audioCodec: 'copy' | 'aac' | 'mp3';
}

interface MergedVideo {
  segmentId: string;
  url: string;
  duration: number;
  size: number;
  createdAt: string;
  options: MergeOptions;
}

interface MergeAllSegmentsButtonProps {
  segments: VideoSegment[];
  onMergeComplete: (segmentId: string, mergedVideo: MergedVideo) => void;
  mergedVideos: Map<string, MergedVideo>;
}

export function MergeAllSegmentsButton({ 
  segments, 
  onMergeComplete, 
  mergedVideos 
}: MergeAllSegmentsButtonProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    duration: 'shortest',
    audioVolume: 1.0,
    fadeIn: 0,
    fadeOut: 0,
    videoCodec: 'copy',
    audioCodec: 'copy'
  });
  const [mergingProgress, setMergingProgress] = useState<{
    current: number;
    total: number;
    currentSegment: string;
  }>({ current: 0, total: 0, currentSegment: '' });
  
  const { addToast } = useUIStore();

  // Helper functions
  const getSelectedVideo = (segment: VideoSegment): MediaAsset | null => {
    return segment.videos.find(video => video.isSelected) || segment.videos[0] || null;
  };

  const getSelectedAudio = (segment: VideoSegment): MediaAsset | null => {
    return segment.audios.find(audio => audio.isSelected) || segment.audios[0] || null;
  };

  const hasSegmentResult = (segment: VideoSegment): boolean => {
    return !!(segment.result_url || mergedVideos.has(segment.id));
  };

  // Calculate segments that need merging
  const segmentsNeedingMerge = segments.filter(segment => {
    // Skip if already merged
    if (hasSegmentResult(segment)) return false;
    
    // Check if both video and audio are available
    const selectedVideo = getSelectedVideo(segment);
    const selectedAudio = getSelectedAudio(segment);
    
    return selectedVideo && selectedAudio;
  });

  const segmentsAlreadyMerged = segments.filter(segment => hasSegmentResult(segment));

  const segmentsMissingMedia = segments.filter(segment => {
    if (hasSegmentResult(segment)) return false;
    
    const selectedVideo = getSelectedVideo(segment);
    const selectedAudio = getSelectedAudio(segment);
    
    return !selectedVideo || !selectedAudio;
  });

  const canMerge = segmentsNeedingMerge.length > 0;

  const updateMergeOption = (key: keyof MergeOptions, value: string | number) => {
    setMergeOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMergeAll = async () => {
    if (!canMerge) {
      addToast({
        type: 'warning',
        title: 'Nothing to Merge',
        message: 'All segments are either already merged or missing required video/audio.',
      });
      return;
    }

    setIsMerging(true);
    setMergingProgress({ current: 0, total: segmentsNeedingMerge.length, currentSegment: '' });
    
    let successCount = 0;
    let failureCount = 0;
    const failures: string[] = [];

    try {
      // Process segments sequentially to avoid overwhelming the server
      for (let i = 0; i < segmentsNeedingMerge.length; i++) {
        const segment = segmentsNeedingMerge[i];
        const selectedVideo = getSelectedVideo(segment);
        const selectedAudio = getSelectedAudio(segment);

        if (!selectedVideo || !selectedAudio) {
          failureCount++;
          failures.push(`Segment ${segment.order}: Missing media`);
          continue;
        }

        setMergingProgress({ 
          current: i + 1, 
          total: segmentsNeedingMerge.length, 
          currentSegment: `Segment ${segment.order}` 
        });

        try {
          const response = await fetch(API_ENDPOINTS.MERGE.VIDEO_AUDIO, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoUrl: selectedVideo.url,
              audioUrl: selectedAudio.url,
              segmentId: segment.id,
              options: mergeOptions
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Merge request failed');
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Merge failed');
          }

          const mergedVideo: MergedVideo = {
            segmentId: segment.id,
            url: result.data.mergedVideoUrl,
            duration: result.data.duration,
            size: result.data.size,
            createdAt: new Date().toISOString(),
            options: result.data.options
          };

          onMergeComplete(segment.id, mergedVideo);
          successCount++;

        } catch (error: unknown) {
          console.error(`Merge failed for segment ${segment.order}:`, error);
          failureCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failures.push(`Segment ${segment.order}: ${errorMessage}`);
        }
      }

      // Show completion summary
      if (successCount > 0 && failureCount === 0) {
        addToast({
          type: 'success',
          title: 'Batch Merge Complete!',
          message: `Successfully merged ${successCount} segments using ${mergeOptions.duration} duration strategy.`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        addToast({
          type: 'warning',
          title: 'Batch Merge Partially Complete',
          message: `${successCount} segments merged successfully, ${failureCount} failed. Check individual segments for details.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Batch Merge Failed',
          message: `All ${failureCount} segments failed to merge. Please check your media files and try again.`,
        });
      }

      // Log failures for debugging
      if (failures.length > 0) {
        console.error('Merge failures:', failures);
      }

    } catch (error: unknown) {
      console.error('Batch merge operation failed:', error);
      addToast({
        type: 'error',
        title: 'Batch Merge Failed',
        message: 'Failed to complete batch merge operation. Please try again.',
      });
    } finally {
      setIsMerging(false);
      setMergingProgress({ current: 0, total: 0, currentSegment: '' });
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Merge className="h-5 w-5 text-purple-500" />
          Batch Video & Audio Merge
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Play className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium text-blue-900">{segmentsNeedingMerge.length}</div>
              <div className="text-blue-600">Ready to Merge</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium text-green-900">{segmentsAlreadyMerged.length}</div>
              <div className="text-green-600">Already Merged</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-900">{segmentsMissingMedia.length}</div>
              <div className="text-yellow-600">Missing Media</div>
            </div>
          </div>
        </div>

        {/* Missing Requirements Details */}
        {segmentsMissingMedia.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Missing Requirements:</span>
            </div>
            <div className="text-xs text-yellow-700 space-y-1">
              {segmentsMissingMedia.map(segment => {
                const selectedVideo = getSelectedVideo(segment);
                const selectedAudio = getSelectedAudio(segment);
                const missing = [];
                if (!selectedVideo) missing.push('video');
                if (!selectedAudio) missing.push('audio');
                
                return (
                  <div key={segment.id}>
                    Segment {segment.order}: Missing {missing.join(' and ')}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Merge Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Merge Settings</Label>
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
              <h4 className="text-sm font-medium text-gray-700">FFmpeg Merge Options (Applied to All Segments)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration Strategy */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Duration Strategy</Label>
                  <Select
                    value={mergeOptions.duration}
                    onValueChange={(value: 'shortest' | 'longest' | 'video' | 'audio') => 
                      updateMergeOption('duration', value)
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="shortest">Use Shortest (default)</SelectItem>
                      <SelectItem value="longest">Use Longest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Audio Volume */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Audio Volume: {mergeOptions.audioVolume}x
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={mergeOptions.audioVolume}
                    onChange={(e) => updateMergeOption('audioVolume', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Fade In */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Fade In: {mergeOptions.fadeIn}s
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={mergeOptions.fadeIn}
                    onChange={(e) => updateMergeOption('fadeIn', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Fade Out */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Fade Out: {mergeOptions.fadeOut}s
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={mergeOptions.fadeOut}
                    onChange={(e) => updateMergeOption('fadeOut', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Video Codec */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Video Codec</Label>
                  <Select
                    value={mergeOptions.videoCodec}
                    onValueChange={(value: 'copy' | 'h264' | 'h265') => 
                      updateMergeOption('videoCodec', value)
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="copy">Copy (fastest)</SelectItem>
                      <SelectItem value="h264">H.264 (re-encode)</SelectItem>
                      <SelectItem value="h265">H.265 (smaller size)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Audio Codec */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Audio Codec</Label>
                  <Select
                    value={mergeOptions.audioCodec}
                    onValueChange={(value: 'copy' | 'aac' | 'mp3') => 
                      updateMergeOption('audioCodec', value)
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="copy">Copy (fastest)</SelectItem>
                      <SelectItem value="aac">AAC (re-encode)</SelectItem>
                      <SelectItem value="mp3">MP3 (compatible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Display */}
        {isMerging && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Merging {mergingProgress.currentSegment}...
              </span>
            </div>
            <div className="text-xs text-blue-600 mb-2">
              Progress: {mergingProgress.current} of {mergingProgress.total} segments
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${mergingProgress.total > 0 ? (mergingProgress.current / mergingProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {canMerge ? (
              `${segmentsNeedingMerge.length} segments ready for batch merge`
            ) : (
              'No segments available for merging'
            )}
          </div>

          <Button
            onClick={handleMergeAll}
            disabled={!canMerge || isMerging}
            className="flex items-center gap-2"
            size="lg"
          >
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Merging ({segmentsNeedingMerge.length}) Segments...
              </>
            ) : (
              <>
                <Merge className="h-4 w-4" />
                Merge All Segments ({segmentsNeedingMerge.length})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
