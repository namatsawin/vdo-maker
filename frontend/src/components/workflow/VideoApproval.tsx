import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Download, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment, ApprovalStatus } from '@/types';
import { convertToLegacyApprovalStatus } from '@/utils/typeCompatibility';

interface VideoApprovalProps {
  segment: VideoSegment;
  index: number;
  imageUrl?: string;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
}

interface GeneratedVideo {
  id: string;
  url: string;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  duration: number;
  generatedAt: string;
}

export function VideoApproval({
  segment,
  index,
  imageUrl,
  onApprove,
  onReject,
}: VideoApprovalProps) {
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { generateSegmentVideo } = useProjectStore();
  const { addToast } = useUIStore();

  // Generate video when component mounts and imageUrl is available
  useEffect(() => {
    if (!generatedVideo && imageUrl && segment.videoPrompt) {
      generateInitialVideo();
    }
  }, [imageUrl, segment.videoPrompt]);

  const generateInitialVideo = async () => {
    if (!imageUrl) {
      addToast({
        type: 'error',
        title: 'Image Required',
        message: 'Please approve an image first before generating video.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSegmentVideo(segment.id, imageUrl, segment.videoPrompt);
      
      const video: GeneratedVideo = {
        id: `video-${segment.id}`,
        url: result.videoUrl || '',
        taskId: result.taskId,
        status: result.videoUrl ? 'completed' : 'processing',
        prompt: segment.videoPrompt,
        duration: segment.duration || 0,
        generatedAt: new Date().toISOString(),
      };

      setGeneratedVideo(video);

      if (video.status === 'completed') {
        addToast({
          type: 'success',
          title: 'Video Generated',
          message: 'Video generated successfully!',
        });
      } else {
        addToast({
          type: 'info',
          title: 'Video Processing',
          message: 'Video is being processed. This may take a few minutes.',
        });
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
        title: 'Image Required',
        message: 'Please approve an image first before regenerating video.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await generateSegmentVideo(segment.id, imageUrl, segment.videoPrompt);
      
      const newVideo: GeneratedVideo = {
        id: `video-${segment.id}-${Date.now()}`,
        url: result.videoUrl || '',
        taskId: result.taskId,
        status: result.videoUrl ? 'completed' : 'processing',
        prompt: segment.videoPrompt,
        duration: segment.duration || 0,
        generatedAt: new Date().toISOString(),
      };

      setGeneratedVideo(newVideo);

      addToast({
        type: 'success',
        title: 'Video Regenerated',
        message: 'New video generated successfully!',
      });
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

  const handleDownload = (video: GeneratedVideo) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `segment-${index + 1}-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ApprovalStatus) => {
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Segment {index + 1} - Video Generation
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(segment.videoApprovalStatus || 'draft')}`}>
            {(segment.videoApprovalStatus || 'draft').toUpperCase()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Script and Prompt */}
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">Script:</h4>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{segment.script}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">Video Prompt:</h4>
            <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">{segment.videoPrompt}</p>
          </div>
        </div>

        {/* Image Reference */}
        {imageUrl && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Source Image:</h4>
            <img
              src={imageUrl}
              alt="Source image for video"
              className="w-full max-w-md h-32 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* No Image Warning */}
        {!imageUrl && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Video className="h-5 w-5" />
              <span className="font-medium">Image Required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please approve an image in the previous step before generating video.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Generating video with AI...</p>
              <p className="text-xs text-gray-400 mt-1">This may take several minutes</p>
            </div>
          </div>
        )}

        {/* Generated Video */}
        {!isGenerating && generatedVideo && generatedVideo.status === 'completed' && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Generated Video:</h4>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                src={generatedVideo.url}
                className="w-full h-64 object-contain"
                controls
              />
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(generatedVideo)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Prompt:</strong> {generatedVideo.prompt}</p>
              <p><strong>Duration:</strong> {generatedVideo.duration}s</p>
              <p><strong>Generated:</strong> {new Date(generatedVideo.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {!isGenerating && generatedVideo && generatedVideo.status === 'processing' && (
          <div className="text-center py-12">
            <div className="text-blue-500 mb-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Video Processing</h3>
            <p className="text-gray-500 mb-4">
              Your video is being processed. This usually takes 2-5 minutes.
            </p>
            <p className="text-xs text-gray-400">Task ID: {generatedVideo.taskId}</p>
          </div>
        )}

        {/* No Video State */}
        {!isGenerating && !generatedVideo && imageUrl && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Video className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No video generated yet</h3>
            <p className="text-gray-500 mb-4">Click "Generate Video" to create an AI-generated video</p>
            <Button onClick={generateInitialVideo} className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Generate Video
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {generatedVideo && generatedVideo.status === 'completed' && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Regenerate
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onReject(segment.id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove(segment.id)}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve Video
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
