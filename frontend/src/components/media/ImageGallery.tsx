import { useState } from 'react';
import { ZoomIn, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageLightboxDialog } from '@/components/ui/ImageLightboxDialog';
import { cn } from '@/lib/utils';
import type { MediaAsset } from '@/types';

interface ImageGalleryProps {
  images: MediaAsset[];
  className?: string;
  columns?: number;
}

export function ImageGallery({ images, className, columns = 3 }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<MediaAsset | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image: MediaAsset, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handleDownload = (image: MediaAsset) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.filename || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <>
      <div className={cn(
        'grid gap-4',
        gridCols[columns as keyof typeof gridCols] || 'grid-cols-3',
        className
      )}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted"
            onClick={() => openLightbox(image, index)}
          >
            <img
              src={image.url}
              alt={image.filename || 'Generated image'}
              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(image, index);
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs truncate">{image.filename || 'Generated image'}</p>
              <p className="text-white/70 text-xs">
                {image.width || 0}x{image.height || 0} • {Math.round((image.size || 0) / 1024)}KB
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <ImageLightboxDialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && closeLightbox()}
        images={images}
        currentIndex={currentIndex}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onDownload={handleDownload}
      />
    </>
  );
}
