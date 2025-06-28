import { useState } from 'react';
import { Check, X, RotateCcw, Play, Pause, Download, Maximize, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { VideoSegment, MediaAsset, ApprovalStatus } from '@/types';

interface VideoApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isRegenerating?: boolean;
}

export function VideoApproval({
  segment,
  index,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false
}: VideoApprovalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Mock video for each segment
  const mockVideo: MediaAsset = {
    id: `video-${segment.id}`,
    filename: `segment-${index + 1}-video.mp4`,
    url: '/mock-assets/videos/sample-video.mp4',
    type: 'video',
    size: 5242880, // 5MB
    duration: segment.duration,
    width: 1920,
    height: 1080,
    createdAt: new Date().toISOString(),
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Generated</span>;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, this would control actual video playback
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = mockVideo.url;
    link.download = mockVideo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={`${getStatusColor(segment.videoApprovalStatus || 'draft')} ${isRegenerating ? 'opacity-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">Segment {index + 1} - Video</CardTitle>
            {getStatusBadge(segment.videoApprovalStatus || 'draft')}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRegenerate(segment.id)}
            disabled={isRegenerating || segment.videoApprovalStatus === 'approved'}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Script</h4>
          <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
            {segment.script}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Video Prompt</h4>
          <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
            {segment.videoPrompt}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Generated Video</h4>
          
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative">
              {/* Video Content Placeholder */}
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-xl font-medium">Video Segment {index + 1}</p>
                <p className="text-sm opacity-80">Duration: {segment.duration}s</p>
                <p className="text-xs opacity-60 mt-2">1920x1080 • {Math.round(mockVideo.size / 1024 / 1024)}MB</p>
              </div>

              {/* Play/Pause Overlay */}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
              >
                <div className="bg-white/90 rounded-full p-4 group-hover:bg-white transition-colors">
                  {isPlaying ? (
                    <Pause className="h-8 w-8 text-black" />
                  ) : (
                    <Play className="h-8 w-8 text-black ml-1" />
                  )}
                </div>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 rounded p-2 text-white transition-colors"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>

            {/* Video Controls */}
            <div className="bg-black/90 text-white p-4 space-y-3">
              {/* Progress Bar */}
              <div className="flex items-center space-x-3">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <div className="flex-1 bg-white/20 rounded-full h-2 relative">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(currentTime / segment.duration) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={segment.duration}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(Number(e.target.value))}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-sm">{formatTime(segment.duration)}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm">Quality: HD (1080p)</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Resolution</div>
            <div className="text-muted-foreground">1920x1080</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">File Size</div>
            <div className="text-muted-foreground">{Math.round(mockVideo.size / 1024 / 1024)}MB</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Format</div>
            <div className="text-muted-foreground">MP4</div>
          </div>
        </div>

        {/* Approval Actions */}
        {(segment.videoApprovalStatus === 'draft' || !segment.videoApprovalStatus) && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Video
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(segment.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject Video
            </Button>
          </div>
        )}

        {segment.videoApprovalStatus === 'rejected' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Video
            </Button>
          </div>
        )}

        {segment.videoApprovalStatus === 'approved' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(segment.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Revoke Approval
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Duration: {segment.duration}s • 
          Generated: {new Date(segment.createdAt).toLocaleDateString()} • 
          Codec: H.264
        </div>
      </CardContent>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 rounded p-2 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="w-full max-w-6xl aspect-video bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-8xl mb-6">🎬</div>
                <p className="text-3xl font-medium">Video Segment {index + 1}</p>
                <p className="text-lg opacity-80 mt-2">Fullscreen Preview</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
