import { Download, ZoomIn } from 'lucide-react';
import { Button } from './Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageAlt: string;
  title?: string;
  onDownload?: () => void;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  imageAlt,
  title = "Image Preview",
  onDownload
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black border-gray-800"
        showCloseButton={false}
      >
        {/* Custom header with controls */}
        <div className="flex items-center justify-between p-4 bg-black/50 border-b border-gray-700">
          <DialogHeader className="flex-row items-center gap-2 space-y-0">
            <ZoomIn className="h-5 w-5 text-white" />
            <DialogTitle className="text-white text-sm font-medium">
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Close"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center p-4 bg-black min-h-[50vh] max-h-[80vh]">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
