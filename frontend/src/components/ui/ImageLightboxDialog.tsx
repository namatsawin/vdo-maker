import { useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import {
  Dialog,
  DialogContent,
} from './dialog';
import type { MediaAsset } from '@/types';

interface ImageLightboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: MediaAsset[];
  currentIndex: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownload?: (image: MediaAsset) => void;
}

export function ImageLightboxDialog({
  open,
  onOpenChange,
  images,
  currentIndex,
  onPrevious,
  onNext,
  onDownload
}: ImageLightboxDialogProps) {
  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (hasMultipleImages && onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasMultipleImages && onNext) {
            e.preventDefault();
            onNext();
          }
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, hasMultipleImages, onPrevious, onNext]);

  if (!currentImage) return null;

  const handleDownload = () => {
    if (onDownload && currentImage) {
      onDownload(currentImage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black border-gray-800"
        showCloseButton={false}
      >
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[90vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 h-8 w-8 p-0"
            title="Close"
          >
            ×
          </Button>
          
          {/* Navigation buttons */}
          {hasMultipleImages && onPrevious && onNext && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
                title="Previous image (←)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
                title="Next image (→)"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Image */}
          <div className="p-4">
            <img
              src={currentImage.url}
              alt={currentImage.filename || 'Generated image'}
              className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
              draggable={false}
            />
          </div>
          
          {/* Image info */}
          <div className="absolute bottom-4 left-4 bg-black/60 rounded px-3 py-2 text-white backdrop-blur-sm">
            <p className="font-medium">{currentImage.filename || 'Generated image'}</p>
            <p className="text-sm text-white/70">
              {currentImage.width || 0}×{currentImage.height || 0} • {Math.round((currentImage.size || 0) / 1024)}KB
            </p>
            {hasMultipleImages && (
              <p className="text-xs text-white/50">
                {currentIndex + 1} of {images.length}
              </p>
            )}
          </div>
          
          {/* Download button */}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="absolute bottom-4 right-4 text-white hover:bg-white/20"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation hint */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white/70 text-xs text-center">
            Use ← → keys or click arrows to navigate
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
