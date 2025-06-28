import { useState } from 'react';
import { Check, X, RotateCcw, ZoomIn, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { VideoSegment, MediaAsset, ApprovalStatus } from '@/types';

interface ImageApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isRegenerating?: boolean;
}

export function ImageApproval({
  segment,
  index,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false
}: ImageApprovalProps) {
  const [selectedImage, setSelectedImage] = useState<MediaAsset | null>(null);

  // Mock images for each segment
  const mockImages: MediaAsset[] = [
    {
      id: `img-${segment.id}-1`,
      filename: `segment-${index + 1}-frame-1.svg`,
      url: '/mock-assets/images/sample-1.svg',
      type: 'image',
      size: 245760,
      width: 1920,
      height: 1080,
      createdAt: new Date().toISOString(),
    },
    {
      id: `img-${segment.id}-2`,
      filename: `segment-${index + 1}-frame-2.svg`,
      url: '/mock-assets/images/sample-2.svg',
      type: 'image',
      size: 198432,
      width: 1920,
      height: 1080,
      createdAt: new Date().toISOString(),
    },
    {
      id: `img-${segment.id}-3`,
      filename: `segment-${index + 1}-frame-3.svg`,
      url: '/mock-assets/images/sample-3.svg',
      type: 'image',
      size: 267891,
      width: 1920,
      height: 1080,
      createdAt: new Date().toISOString(),
    },
  ];

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

  return (
    <Card className={`${getStatusColor(segment.imageApprovalStatus || 'draft')} ${isRegenerating ? 'opacity-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">Segment {index + 1} - Images</CardTitle>
            {getStatusBadge(segment.imageApprovalStatus || 'draft')}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRegenerate(segment.id)}
            disabled={isRegenerating || segment.imageApprovalStatus === 'approved'}
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
          <h4 className="font-medium text-sm">Generated Images</h4>
          <div className="grid grid-cols-3 gap-4">
            {mockImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 text-white text-xs">
                  {Math.round(image.size! / 1024)}KB
                </div>
              </div>
            ))}
          </div>
        </div>

        {(segment.imageApprovalStatus === 'draft' || !segment.imageApprovalStatus) && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Images
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(segment.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject Images
            </Button>
          </div>
        )}

        {segment.imageApprovalStatus === 'rejected' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Images
            </Button>
          </div>
        )}

        {segment.imageApprovalStatus === 'approved' && (
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
          Duration: ~{segment.duration}s • 
          Resolution: 1920x1080 • 
          Generated: {new Date(segment.createdAt).toLocaleDateString()}
        </div>
      </CardContent>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              className="max-w-full max-h-full object-contain"
            />
            
            <div className="absolute bottom-4 left-4 bg-black/60 rounded px-3 py-2 text-white">
              <p className="font-medium">{selectedImage.filename}</p>
              <p className="text-sm text-white/70">
                {selectedImage.width}x{selectedImage.height} • {Math.round(selectedImage.size! / 1024)}KB
              </p>
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const link = document.createElement('a');
                link.href = selectedImage.url;
                link.download = selectedImage.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="absolute bottom-4 right-4 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
