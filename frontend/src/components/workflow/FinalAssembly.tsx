import { useState } from 'react';
import { FileText, Play, Volume2, Merge, Settings, Loader2, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { API_ENDPOINTS } from '@/config/api';
import { MergeAllSegmentsButton } from './MergeAllSegmentsButton';
import type { VideoSegment, MediaAsset } from '@/types';
import { ApprovalStatus } from '@/types/approvalStatus';

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

interface FinalAssemblyProps {
  segments: VideoSegment[];
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onUpdate: (segmentId: string, updates: Partial<VideoSegment>) => void;
}

export function FinalAssembly({ segments, onApprove, onReject, onUpdate }: FinalAssemblyProps) {
  const [mediaDurations, setMediaDurations] = useState<Record<string, number>>({});
  const [mergingSegments, setMergingSegments] = useState<Set<string>>(new Set());
  const [mergedVideos, setMergedVideos] = useState<Map<string, MergedVideo>>(new Map());
  const [showMergeOptions, setShowMergeOptions] = useState<Record<string, boolean>>({});
  const [mergeOptions, setMergeOptions] = useState<Record<string, MergeOptions>>({});
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});
  const [expandedVideoSections, setExpandedVideoSections] = useState<Record<string, boolean>>({});
  const [expandedAudioSections, setExpandedAudioSections] = useState<Record<string, boolean>>({});
  const [expandedScriptSections, setExpandedScriptSections] = useState<Record<string, boolean>>({});
  
  const { addToast } = useUIStore();

  // Default merge options
  const getDefaultMergeOptions = (): MergeOptions => ({
    duration: 'shortest',
    audioVolume: 1.0,
    fadeIn: 0,
    fadeOut: 0,
    videoCodec: 'copy',
    audioCodec: 'copy'
  });

  // Helper functions
  const getSelectedVideo = (segment: VideoSegment): MediaAsset | null => {
    return segment.videos.find(video => video.isSelected) || segment.videos[0] || null;
  };

  const getSelectedAudio = (segment: VideoSegment): MediaAsset | null => {
    return segment.audios.find(audio => audio.isSelected) || segment.audios[0] || null;
  };

  const handleVideoLoadedMetadata = (videoElement: HTMLVideoElement, assetId: string) => {
    const actualDuration = videoElement.duration;
    setMediaDurations(prev => ({
      ...prev,
      [assetId]: actualDuration
    }));
  };

  const handleAudioLoadedMetadata = (audioElement: HTMLAudioElement, assetId: string) => {
    const actualDuration = audioElement.duration;
    setMediaDurations(prev => ({
      ...prev,
      [assetId]: actualDuration
    }));
  };

  const getSegmentResultUrl = (segment: VideoSegment): string | null => {
    // Check if segment has a result_url from database
    if (segment.result_url) {
      return segment.result_url;
    }
    
    // Fallback to local merged video if available
    const mergedVideo = mergedVideos.get(segment.id);
    return mergedVideo?.url || null;
  };

  const hasSegmentResult = (segment: VideoSegment): boolean => {
    return !!(segment.result_url || mergedVideos.has(segment.id));
  };

  const getActualDuration = (assetId: string, fallbackDuration?: number): number => {
    return mediaDurations[assetId] || fallbackDuration || 0;
  };

  const toggleScriptSection = (segmentId: string) => {
    setExpandedScriptSections(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  const toggleVideoSection = (segmentId: string) => {
    setExpandedVideoSections(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  const toggleAudioSection = (segmentId: string) => {
    setExpandedAudioSections(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  const handleResetSegment = (segment: VideoSegment) => {
    // Remove merged video from local state
    setMergedVideos(prev => {
      const newMap = new Map(prev);
      newMap.delete(segment.id);
      return newMap;
    });

    // Update segment through proper update mechanism
    onUpdate(segment.id, {
      finalApprovalStatus: ApprovalStatus.DRAFT,
      result_url: null, // This will properly remove the result_url from the segment
    });

    // Re-expand video and audio sections for re-merging
    setExpandedVideoSections(prev => ({
      ...prev,
      [segment.id]: true
    }));
    setExpandedAudioSections(prev => ({
      ...prev,
      [segment.id]: true
    }));

    // Reset merge options if they exist
    setMergeOptions(prev => {
      const newOptions = { ...prev };
      delete newOptions[segment.id];
      return newOptions;
    });

    // Hide merge options panel
    setShowMergeOptions(prev => ({
      ...prev,
      [segment.id]: false
    }));

    addToast({
      type: 'info',
      title: 'Segment Reset',
      message: `Segment ${segment.order} has been reset. You can now re-merge the video and audio.`,
    });
  };

  const handleApproveSegment = (segment: VideoSegment) => {
    if (!hasSegmentResult(segment)) {
      addToast({
        type: 'error',
        title: 'Cannot Approve',
        message: 'Please merge video and audio before approving this segment.',
      });
      return;
    }

    onApprove(segment.id)

    toggleSegmentExpansion(segment.id)
  };

  const handleRejectSegment = (segment: VideoSegment) => {
    onReject(segment.id)
    addToast({
      type: 'error',
      title: 'Segment Rejected',
      message: `Segment ${segment.order} has been rejected. Please make changes and re-merge.`,
    });
  };

  // Calculate completion status
  const getCompletionStatus = () => {
    const totalSegments = segments.length;
    const mergedSegments = segments.filter(segment => mergedVideos.has(segment.id)).length;
    const approvedSegments = segments.filter(segment => segment.finalApprovalStatus === 'APPROVED').length;
    const rejectedSegments = segments.filter(segment => segment.finalApprovalStatus === 'REJECTED').length;
    
    return {
      total: totalSegments,
      merged: mergedSegments,
      approved: approvedSegments,
      rejected: rejectedSegments,
      pending: totalSegments - approvedSegments - rejectedSegments,
      isComplete: approvedSegments === totalSegments && totalSegments > 0
    };
  };

  const completionStatus = getCompletionStatus();

  const toggleAllSegments = () => {
    const allExpanded = segments.every(segment => expandedSegments[segment.id]);
    const newState: Record<string, boolean> = {};
    segments.forEach(segment => {
      newState[segment.id] = !allExpanded;
    });
    setExpandedSegments(newState);
  };

  const toggleSegmentExpansion = (segmentId: string) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  const toggleMergeOptions = (segmentId: string) => {
    setShowMergeOptions(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
    
    // Initialize default options if not set
    if (!mergeOptions[segmentId]) {
      setMergeOptions(prev => ({
        ...prev,
        [segmentId]: getDefaultMergeOptions()
      }));
    }
  };

  const updateMergeOption = (segmentId: string, key: keyof MergeOptions, value: any) => {
    setMergeOptions(prev => ({
      ...prev,
      [segmentId]: {
        ...prev[segmentId],
        [key]: value
      }
    }));
  };

  const handleMergeComplete = (segmentId: string, mergedVideo: MergedVideo) => {
    setMergedVideos(prev => new Map(prev).set(segmentId, mergedVideo));

    // Collapse video and audio sections after successful merge
    setExpandedVideoSections(prev => ({
      ...prev,
      [segmentId]: false
    }));
    setExpandedAudioSections(prev => ({
      ...prev,
      [segmentId]: false
    }));
  };

  const handleMergeSegment = async (segment: VideoSegment) => {
    const selectedVideo = getSelectedVideo(segment);
    const selectedAudio = getSelectedAudio(segment);
    const options = mergeOptions[segment.id] || getDefaultMergeOptions();

    if (!selectedVideo || !selectedAudio) {
      addToast({
        type: 'error',
        title: 'Missing Media',
        message: 'Both video and audio must be available to merge this segment.',
      });
      return;
    }

    setMergingSegments(prev => new Set(prev).add(segment.id));

    try {
      // Call real FFmpeg API
      const response = await fetch(API_ENDPOINTS.MERGE.VIDEO_AUDIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: selectedVideo.url,
          audioUrl: selectedAudio.url,
          segmentId: segment.id, // Include segment ID for database update
          options: options
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

      setMergedVideos(prev => new Map(prev).set(segment.id, mergedVideo));

      // Collapse video and audio sections after successful merge
      setExpandedVideoSections(prev => ({
        ...prev,
        [segment.id]: false
      }));
      setExpandedAudioSections(prev => ({
        ...prev,
        [segment.id]: false
      }));

      addToast({
        type: 'success',
        title: 'Merge Complete!',
        message: `Successfully merged video and audio for segment ${segment.order} in ${result.data.processingTime.toFixed(1)}s using ${options.duration} duration strategy.`,
      });

    } catch (error: any) {
      console.error('Merge failed:', error);
      addToast({
        type: 'error',
        title: 'Merge Failed',
        message: error.message || 'Failed to merge video and audio. Please try again.',
      });
    } finally {
      setMergingSegments(prev => {
        const newSet = new Set(prev);
        newSet.delete(segment.id);
        return newSet;
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              Final Assembly
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {completionStatus.isComplete && (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full">
                <Check className="h-4 w-4" />
                All Segments Approved
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllSegments}
              className="flex items-center gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              {segments.every(segment => expandedSegments[segment.id]) ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Merge All Segments Button */}
        <MergeAllSegmentsButton 
          segments={segments}
          onMergeComplete={handleMergeComplete}
          mergedVideos={mergedVideos}
        />

        {/* Segment Overview */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700">Segments Overview:</h4>
          {segments.map((segment, index) => {
            const selectedVideo = getSelectedVideo(segment);
            const selectedAudio = getSelectedAudio(segment);

            // Check if segment has result (either from database or local merge)
            const hasResult = hasSegmentResult(segment);

            // If segment has result_url, keep it collapsed by default
            if (expandedSegments[segment.id] === undefined) {
              setExpandedSegments(prev => ({
                ...prev,
                [segment.id]: segment.finalApprovalStatus !== 'APPROVED'
              }));
            }

            // Default expand video/audio sections if not merged yet
            if (expandedVideoSections[segment.id] === undefined) {
              setExpandedVideoSections(prev => ({
                ...prev,
                [segment.id]: !hasResult // Expand if no result (not merged)
              }));
            }
            
            if (expandedAudioSections[segment.id] === undefined) {
              setExpandedAudioSections(prev => ({
                ...prev,
                [segment.id]: !hasResult // Expand if no result (not merged)
              }));
            }

            if (expandedScriptSections[segment.id] === undefined) {
              setExpandedScriptSections(prev => ({
                ...prev,
                [segment.id]: false // Collapsed by default
              }));
            }

            // Color based on finalApprovalStatus
            const getStatusColor = () => {
              switch (segment.finalApprovalStatus) {
                case 'APPROVED':
                  return {
                    cardClass: 'border-green-200 bg-green-50',
                    dotClass: 'bg-green-500'
                  };
                case 'REJECTED':
                  return {
                    cardClass: 'border-red-200 bg-red-50',
                    dotClass: 'bg-red-500'
                  };
                case 'PROCESSING':
                  return {
                    cardClass: 'border-blue-200 bg-blue-50',
                    dotClass: 'bg-blue-500'
                  };
                case 'REGENERATING':
                  return {
                    cardClass: 'border-yellow-200 bg-yellow-50',
                    dotClass: 'bg-yellow-500'
                  };
                default: // DRAFT
                  return {
                    cardClass: 'border-gray-200',
                    dotClass: 'bg-gray-400'
                  };
              }
            };

            const statusColor = getStatusColor();

            return (
              <Card key={segment.id} className={`${statusColor.cardClass} transition-all duration-200`}>
                <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleSegmentExpansion(segment.id)}>
                  <div className="flex items-center justify-between my-auto">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColor.dotClass}`} />
                      <CardTitle className="text-base">Segment {index + 1}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status indicators in collapsed view */}
                      {!expandedSegments[segment.id] && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={`flex items-center gap-1 ${
                            segment.finalApprovalStatus === 'APPROVED' ? 'text-green-600' :
                            segment.finalApprovalStatus === 'REJECTED' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            <Check className="h-3 w-3" />
                            {segment.finalApprovalStatus === 'APPROVED' ? 'Approved' :
                              segment.finalApprovalStatus === 'REJECTED' ? 'Rejected' :
                              'Merged'}
                          </span>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSegmentExpansion(segment.id);
                        }}
                      >
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedSegments[segment.id] ? 'rotate-180' : ''
                          }`} 
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedSegments[segment.id] && (
                  <CardContent className="space-y-4">
                  {/* Script */}
                  <div className="space-y-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => toggleScriptSection(segment.id)}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="h-4 w-4" />
                        Script
                      </div>
                      <div className="flex items-center gap-2">
                        {!expandedScriptSections[segment.id] && (
                          <span className="text-xs text-gray-500">
                            {segment.script.length > 50 ? `${segment.script.substring(0, 50)}...` : segment.script}
                          </span>
                        )}
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedScriptSections[segment.id] ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {expandedScriptSections[segment.id] && (
                      <div className="pl-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {segment.script}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Video */}
                  <div className="space-y-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => toggleVideoSection(segment.id)}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Play className="h-4 w-4" />
                        Selected Video
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVideo && !expandedVideoSections[segment.id] && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(getActualDuration(selectedVideo.id, selectedVideo.duration))}
                          </span>
                        )}
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedVideoSections[segment.id] ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {expandedVideoSections[segment.id] && (
                      <div className="pl-4 space-y-2">
                        {selectedVideo ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <video
                              src={selectedVideo.url}
                              className="w-full mx-auto max-w-3xl aspect-video object-contain rounded-md mb-2"
                              controls
                              preload="metadata"
                              onLoadedMetadata={(e) => handleVideoLoadedMetadata(e.currentTarget, selectedVideo.id)}
                            />
                            <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                              <div>Duration: {formatDuration(getActualDuration(selectedVideo.id, selectedVideo.duration))}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500 text-sm">
                            No video available
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Audio */}
                  <div className="space-y-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => toggleAudioSection(segment.id)}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Volume2 className="h-4 w-4" />
                        Selected Audio
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedAudio && !expandedAudioSections[segment.id] && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(getActualDuration(selectedAudio.id, selectedAudio.duration))}
                          </span>
                        )}
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedAudioSections[segment.id] ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {expandedAudioSections[segment.id] && (
                      <div className="pl-4 space-y-2">
                        {selectedAudio ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <audio
                              src={selectedAudio.url}
                              className="w-full mb-2"
                              controls
                              preload="metadata"
                              onLoadedMetadata={(e) => handleAudioLoadedMetadata(e.currentTarget, selectedAudio.id)}
                            />
                            <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                              <div>Voice: {selectedAudio.voice || 'Default'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500 text-sm">
                            No audio available
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Merge Section */}
                  <div className="border-t pt-4">
                    {hasSegmentResult(segment) ? (
                      // Show merged result with status-based styling
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 text-sm font-medium ${
                            segment.finalApprovalStatus === 'APPROVED' ? 'text-green-700' :
                            segment.finalApprovalStatus === 'REJECTED' ? 'text-red-700' :
                            'text-blue-700'
                          }`}>
                            <Check className="h-4 w-4" />
                            Merged Video Ready
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetSegment(segment)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center gap-1 hover:cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                          </Button>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          segment.finalApprovalStatus === 'APPROVED' ? 'bg-green-50 border border-green-200' :
                          segment.finalApprovalStatus === 'REJECTED' ? 'bg-red-50 border border-red-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}>
                          <video
                            src={getSegmentResultUrl(segment) || undefined}
                            className="w-full mx-auto max-w-3xl aspect-video object-contain rounded-md mb-2"
                            controls
                            preload="metadata"
                          />
                          <div className={`text-xs grid grid-cols-3 gap-2 ${
                            segment.finalApprovalStatus === 'APPROVED' ? 'text-green-700' :
                            segment.finalApprovalStatus === 'REJECTED' ? 'text-red-700' :
                            'text-blue-700'
                          }`}>
                            <div>Duration: {formatDuration(mergedVideos.get(segment.id)?.duration || 0)}</div>
                            <div>Strategy: {mergedVideos.get(segment.id)?.options.duration}</div>
                          </div>
                          {segment.finalApprovalStatus === 'REJECTED' && (
                            <div className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2">
                              <strong>Rejected:</strong> This segment needs to be re-merged before final approval.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Show merge options and button
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Merge className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Merge Video & Audio</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => toggleMergeOptions(segment.id)}
                              className="flex items-center gap-1 hover:cursor-pointer hover:bg-gray-100"
                            >
                              <Settings className="h-3 w-3" />
                              Options
                            </Button>
                            <Button
                              onClick={() => handleMergeSegment(segment)}
                              disabled={!selectedVideo || !selectedAudio || mergingSegments.has(segment.id)}
                              size="sm"
                              className="flex items-center gap-2 hover:cursor-pointer hover:bg-gray-100"
                            >
                              {mergingSegments.has(segment.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Merging...
                                </>
                              ) : (
                                <>
                                  <Merge className="h-4 w-4" />
                                  Merge
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Merge Options Panel */}
                        {showMergeOptions[segment.id] && (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">FFmpeg Merge Options</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Duration Strategy */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Duration Strategy</label>
                                <select
                                  value={mergeOptions[segment.id]?.duration || 'shortest'}
                                  onChange={(e) => updateMergeOption(segment.id, 'duration', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="shortest">Use Shortest (default)</option>
                                  <option value="longest">Use Longest</option>
                                </select>
                              </div>

                              {/* Audio Volume */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Audio Volume: {mergeOptions[segment.id]?.audioVolume || 1.0}x
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="2"
                                  step="0.1"
                                  value={mergeOptions[segment.id]?.audioVolume || 1.0}
                                  onChange={(e) => updateMergeOption(segment.id, 'audioVolume', parseFloat(e.target.value))}
                                  className="w-full"
                                />
                              </div>

                              {/* Fade In */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Fade In: {mergeOptions[segment.id]?.fadeIn || 0}s
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="5"
                                  step="0.5"
                                  value={mergeOptions[segment.id]?.fadeIn || 0}
                                  onChange={(e) => updateMergeOption(segment.id, 'fadeIn', parseFloat(e.target.value))}
                                  className="w-full"
                                />
                              </div>

                              {/* Fade Out */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Fade Out: {mergeOptions[segment.id]?.fadeOut || 0}s
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="5"
                                  step="0.5"
                                  value={mergeOptions[segment.id]?.fadeOut || 0}
                                  onChange={(e) => updateMergeOption(segment.id, 'fadeOut', parseFloat(e.target.value))}
                                  className="w-full"
                                />
                              </div>

                              {/* Video Codec */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Video Codec</label>
                                <select
                                  value={mergeOptions[segment.id]?.videoCodec || 'copy'}
                                  onChange={(e) => updateMergeOption(segment.id, 'videoCodec', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="copy">Copy (fastest)</option>
                                  <option value="h264">H.264 (re-encode)</option>
                                  <option value="h265">H.265 (smaller size)</option>
                                </select>
                              </div>

                              {/* Audio Codec */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Audio Codec</label>
                                <select
                                  value={mergeOptions[segment.id]?.audioCodec || 'copy'}
                                  onChange={(e) => updateMergeOption(segment.id, 'audioCodec', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="copy">Copy (fastest)</option>
                                  <option value="aac">AAC (re-encode)</option>
                                  <option value="mp3">MP3 (compatible)</option>
                                </select>
                              </div>
                            </div>

                            {/* Duration Info */}
                            {selectedVideo && selectedAudio && (
                              <div className="text-xs text-gray-600 bg-white rounded p-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <div>Video: {formatDuration(getActualDuration(selectedVideo.id, selectedVideo.duration))}</div>
                                  <div>Audio: {formatDuration(getActualDuration(selectedAudio.id, selectedAudio.duration))}</div>
                                  <div className="font-medium">
                                    Result: {formatDuration(
                                      mergeOptions[segment.id]?.duration === 'longest' 
                                        ? Math.max(getActualDuration(selectedVideo.id, selectedVideo.duration), getActualDuration(selectedAudio.id, selectedAudio.duration))
                                        : mergeOptions[segment.id]?.duration === 'video'
                                        ? getActualDuration(selectedVideo.id, selectedVideo.duration)
                                        : mergeOptions[segment.id]?.duration === 'audio'
                                        ? getActualDuration(selectedAudio.id, selectedAudio.duration)
                                        : Math.min(getActualDuration(selectedVideo.id, selectedVideo.duration), getActualDuration(selectedAudio.id, selectedAudio.duration))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Final Approval:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectSegment(segment)}
                        className="text-red-600 border-red-200 hover:bg-red-50 min-w-[100px]"
                      >
                        {segment.finalApprovalStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveSegment(segment)}
                        className="bg-green-500 hover:bg-green-600 text-white min-w-[100px]"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
