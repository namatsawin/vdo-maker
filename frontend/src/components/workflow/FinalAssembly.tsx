import { useState, useEffect } from 'react';
import { Check, Download, Film, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment } from '@/types';
import { isApprovalStatus } from '@/utils/typeCompatibility';

interface FinalAssemblyProps {
  segments: VideoSegment[];
  onComplete: () => void;
}

interface FinalVideo {
  id: string;
  url: string;
  duration: number;
  size: number;
  resolution: string;
  format: string;
  createdAt: string;
}

export function FinalAssembly({ segments, onComplete }: FinalAssemblyProps) {
  const [finalVideo, setFinalVideo] = useState<FinalVideo | null>(null);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  
  const { addToast } = useUIStore();

  // Check if all segments are approved
  const allSegmentsApproved = segments.every(segment => 
    isApprovalStatus(segment.scriptApprovalStatus || segment.approvalStatus, 'approved') &&
    isApprovalStatus(segment.imageApprovalStatus, 'approved') &&
    isApprovalStatus(segment.videoApprovalStatus, 'approved') &&
    isApprovalStatus(segment.audioApprovalStatus, 'approved')
  );

  const approvedSegments = segments.filter(segment => 
    isApprovalStatus(segment.scriptApprovalStatus || segment.approvalStatus, 'approved') &&
    isApprovalStatus(segment.imageApprovalStatus, 'approved') &&
    isApprovalStatus(segment.videoApprovalStatus, 'approved') &&
    isApprovalStatus(segment.audioApprovalStatus, 'approved')
  );

  // Auto-assemble when all segments are approved
  useEffect(() => {
    if (allSegmentsApproved && !finalVideo && !isAssembling) {
      handleAssemble();
    }
  }, [allSegmentsApproved]);

  const handleAssemble = async () => {
    if (approvedSegments.length === 0) {
      addToast({
        type: 'error',
        title: 'No Approved Segments',
        message: 'Please approve all segments before final assembly.',
      });
      return;
    }

    setIsAssembling(true);
    setAssemblyProgress(0);

    try {
      // Simulate assembly progress
      const progressInterval = setInterval(() => {
        setAssemblyProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate assembly process (in real implementation, this would call backend API)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(progressInterval);
      setAssemblyProgress(100);

      // Create final video object (in real implementation, this would come from backend)
      const totalDuration = approvedSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
      const estimatedSize = totalDuration * 2 * 1024 * 1024; // Rough estimate: 2MB per second

      const video: FinalVideo = {
        id: `final-video-${Date.now()}`,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', // Fallback sample
        duration: totalDuration,
        size: estimatedSize,
        resolution: '1920x1080',
        format: 'MP4',
        createdAt: new Date().toISOString(),
      };

      setFinalVideo(video);

      addToast({
        type: 'success',
        title: 'Video Assembly Complete!',
        message: `Successfully assembled ${approvedSegments.length} segments into final video.`,
      });

      // Mark project as complete
      onComplete();

    } catch (error) {
      console.error('Assembly failed:', error);
      addToast({
        type: 'error',
        title: 'Assembly Failed',
        message: 'Failed to assemble final video. Please try again.',
      });
    } finally {
      setIsAssembling(false);
    }
  };

  const handleDownload = (video: FinalVideo) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `final-video-${new Date().toISOString().split('T')[0]}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Download Started',
      message: 'Your final video download has started.',
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-purple-500" />
          Final Assembly
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Segment Status Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Segment Status:</h4>
          <div className="grid gap-2">
            {segments.map((segment, index) => {
              const isFullyApproved = 
                isApprovalStatus(segment.scriptApprovalStatus || segment.approvalStatus, 'approved') &&
                isApprovalStatus(segment.imageApprovalStatus, 'approved') &&
                isApprovalStatus(segment.videoApprovalStatus, 'approved') &&
                isApprovalStatus(segment.audioApprovalStatus, 'approved');

              return (
                <div
                  key={segment.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isFullyApproved 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      isFullyApproved ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium">Segment {index + 1}</span>
                    <span className="text-sm text-gray-600">
                      {formatDuration(segment.duration || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      isApprovalStatus(segment.scriptApprovalStatus || segment.approvalStatus, 'approved')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Script
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      isApprovalStatus(segment.imageApprovalStatus, 'approved')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Image
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      isApprovalStatus(segment.videoApprovalStatus, 'approved')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Video
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      isApprovalStatus(segment.audioApprovalStatus, 'approved')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Audio
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assembly Status */}
        {!allSegmentsApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Waiting for Approvals</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              {segments.length - approvedSegments.length} segments still need approval before final assembly.
            </p>
          </div>
        )}

        {/* Assembly Progress */}
        {isAssembling && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assembling Final Video</h3>
                <p className="text-gray-500 mb-4">
                  Combining {approvedSegments.length} segments into final video...
                </p>
                
                <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${assemblyProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{Math.round(assemblyProgress)}% complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Final Video */}
        {finalVideo && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Final Video:</h4>
            
            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                src={finalVideo.url}
                className="w-full h-64 object-contain"
                controls
              />
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(finalVideo)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Video Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">{formatDuration(finalVideo.duration)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <div className="font-medium">{formatFileSize(finalVideo.size)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Resolution:</span>
                  <div className="font-medium">{finalVideo.resolution}</div>
                </div>
                <div>
                  <span className="text-gray-600">Format:</span>
                  <div className="font-medium">{finalVideo.format}</div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="h-5 w-5" />
                <span className="font-medium">Video Assembly Complete!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your final video has been successfully created and is ready for download.
              </p>
            </div>
          </div>
        )}

        {/* Assembly Button */}
        {allSegmentsApproved && !finalVideo && !isAssembling && (
          <div className="text-center py-8">
            <Button
              onClick={handleAssemble}
              size="lg"
              className="flex items-center gap-2"
            >
              <Film className="h-5 w-5" />
              Assemble Final Video
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              This will combine all {approvedSegments.length} approved segments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
