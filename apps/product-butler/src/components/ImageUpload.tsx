import React, { useCallback, useState } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductImage } from '@/types/product';
import { Button } from '@/components/ui/button';
import { generateSecureUuidV4 } from '@/production/core/security/secureUuid';

interface ImageUploadProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files)
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, remainingSlots);

      const newImages: ProductImage[] = filesToProcess.map((file) => ({
        id: generateSecureUuidV4(),
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
      }));

      onChange([...images, ...newImages]);
    },
    [images, onChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      e.target.value = '';
    },
    [processFiles]
  );

  const openMediaLibrary = useCallback(() => {
    if (!window.wp?.media) {
      document.getElementById('image-upload-input')?.click();
      return;
    }

    const frame = window.wp.media({
      library: { type: 'image' },
      multiple: true,
    });
    frame.on('select', () => {
      const remainingSlots = maxImages - images.length;
      const selected = frame.state().get('selection').toJSON().slice(0, remainingSlots);
      const mediaImages: ProductImage[] = selected.map((attachment) => ({
        id: `wp-${attachment.id}`,
        preview: attachment.url,
        wpMediaId: attachment.id,
      }));
      onChange([...images, ...mediaImages]);
    });
    frame.open();
  }, [images, maxImages, onChange]);

  const removeImage = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      onChange(images.filter((img) => img.id !== id));
    },
    [images, onChange]
  );

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    if (!draggedImage) return;
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'drag-zone p-6 text-center cursor-pointer',
          isDragging && 'drag-zone-active',
          images.length >= maxImages && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => {
          if (images.length < maxImages) {
            openMediaLibrary();
          }
        }}
      >
        <input
          id="image-upload-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={images.length >= maxImages}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'p-3 rounded-full transition-colors',
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop images here' : 'Drag & drop images'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse ({images.length}/{maxImages})
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                'relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted',
                'cursor-grab active:cursor-grabbing',
                draggedIndex === index && 'opacity-50'
              )}
            >
              <img
                src={image.preview}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors">
                <div className="absolute top-2 start-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-primary-foreground drop-shadow-md" />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 end-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* First image badge */}
              {index === 0 && (
                <div className="absolute bottom-2 start-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded font-medium">
                  Main
                </div>
              )}

              {/* Upload progress */}
              {image.uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    <span className="text-sm mt-2 text-muted-foreground">
                      {image.progress}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
