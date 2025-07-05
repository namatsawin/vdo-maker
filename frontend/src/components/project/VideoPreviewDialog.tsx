import { useState } from 'react';
import { Play, Download, ExternalLink } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import type { Project } from '@/types';

interface VideoPreviewDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPreviewDialog({ project, isOpen, onClose }: VideoPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!project.final_video_url) {
    return null;
  }

  // Create a MediaAsset-like object for the VideoPlayer component
  const videoAsset = {
    id: `final-video-${project.id}`,
    url: project.final_video_url,
    status: 'completed' as const,
    type: 'video' as const,
    filename: `${project.title || project.name || 'project'}-final.mp4`,
    createdAt: project.updatedAt,
    updatedAt: project.updatedAt,
  };

  const handleDownload = () => {
    setIsLoading(true);
    try {
      const link = document.createElement('a');
      link.href = project.final_video_url!;
      link.download = videoAsset.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (project.final_video_url) {
      window.open(project.final_video_url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Final Video Preview
          </DialogTitle>
          <DialogDescription>
            {project.title || project.name} • {project.segments.length} segments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer 
              video={videoAsset}
              className="w-full h-full"
              showControls={true}
              autoPlay={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Created: {new Date(project.updatedAt).toLocaleDateString()} at{' '}
              {new Date(project.updatedAt).toLocaleTimeString()}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isLoading ? 'Downloading...' : 'Download'}
              </Button>
              
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
