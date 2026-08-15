import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, ImagePlus, Loader2, Plus, Star, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { appendSelectedMedia } from "@/production/features/media/productImages";
import type { ProductImage } from "@/types/product";
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

interface Props {
  images: ProductImage[];
  maxImages?: number;
  onChange: (images: ProductImage[]) => void;
  onUpload: (file: File) => Promise<ProductImage>;
}

export function ImageUpload({ images, maxImages = 10, onChange, onUpload }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [windowDrag, setWindowDrag] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const hasImages = images.length > 0;
  const isFull = images.length >= maxImages;

  useEffect(() => {
    const onEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      dragDepth.current += 1;
      setWindowDrag(true);
    };
    const onLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setWindowDrag(false);
    };
    const onDrop = () => {
      dragDepth.current = 0;
      setWindowDrag(false);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files || isFull) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/"))
      .slice(0, maxImages - images.length);
    if (!accepted.length) return;
    setUploading(true);
    setUploadError("");
    let nextImages = images;
    try {
      for (const file of accepted) {
        nextImages = [...nextImages, await onUpload(file)];
        onChange(nextImages);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : __("Images could not be uploaded.", "yaxii-product-workspace");
      setUploadError(nextImages.length > images.length ? `${message} ${__("Uploaded images were kept.", "yaxii-product-workspace")}` : message);
    } finally {
      setUploading(false);
    }
  }, [images, isFull, maxImages, onChange, onUpload]);

  const openPicker = useCallback(() => {
    if (isFull) return;
    if (!window.wp?.media) {
      inputRef.current?.click();
      return;
    }
    const frame = window.wp.media({
      button: { text: __("Add images", "yaxii-product-workspace") },
      library: { type: "image" },
      multiple: true,
      title: __("Product images", "yaxii-product-workspace"),
    });
    frame.on("select", () => {
      const selected = frame.state().get("selection").toJSON();
      onChange(appendSelectedMedia(images, selected, maxImages));
    });
    frame.open();
  }, [images, isFull, maxImages, onChange]);

  const removeImage = (id: string) => onChange(images.filter((image) => image.id !== id));
  const makeMain = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (item) onChange([item, ...next]);
  };
  const reorder = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const next = [...images];
    const [dragged] = next.splice(draggedIndex, 1);
    if (!dragged) return;
    next.splice(index, 0, dragged);
    onChange(next);
    setDraggedIndex(index);
  };
  const dropSurfaceVisible = !hasImages || windowDrag || isDragging;

  return <div className="relative space-y-2.5" onDragOver={(event) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes("Files")) setIsDragging(true);
  }} onDragLeave={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) setIsDragging(false);
  }} onDrop={(event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    setWindowDrag(false);
    dragDepth.current = 0;
    void uploadFiles(event.dataTransfer.files);
  }}>
    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" disabled={isFull}
      onChange={(event) => {
        void uploadFiles(event.target.files);
        event.target.value = "";
      }} />

    {hasImages && <div className="flex items-center gap-2">
      <button type="button" onClick={openPicker} disabled={isFull || uploading}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5",
          "text-[12px] font-medium transition-colors hover:bg-muted disabled:opacity-50",
        )}><ImagePlus className="h-3.5 w-3.5" /> {__("Add images", "yaxii-product-workspace")}</button>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {/* translators: 1: current image count, 2: maximum image count. */}
        {sprintf(__("%1$s/%2$s · drag to reorder", "yaxii-product-workspace"), images.length, maxImages)}
      </span>
    </div>}

    {hasImages && <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{images.map((image, index) => (
      <div key={image.id} draggable onDragStart={() => setDraggedIndex(index)}
        onDragOver={(event) => reorder(event, index)} onDragEnd={() => setDraggedIndex(null)}
        className={cn(
          "group relative aspect-square cursor-grab overflow-hidden rounded-md border border-border bg-muted active:cursor-grabbing",
          index === 0 && "ring-1 ring-foreground/25", draggedIndex === index && "opacity-40",
        )}>
        <img src={image.preview} alt={
          /* translators: %s: image position. */
          sprintf(__("Product image %s", "yaxii-product-workspace"), index + 1)
        } className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/45">
          <GripVertical className="absolute start-1 top-1 h-3.5 w-3.5 text-white opacity-0 drop-shadow group-hover:opacity-90" />
          <button type="button" onClick={() => removeImage(image.id)}
            className="absolute end-1 top-1 grid h-5 w-5 place-items-center rounded bg-background/90 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={__("Remove image", "yaxii-product-workspace")}><X className="h-3 w-3" /></button>
          {index !== 0 && <button type="button" onClick={() => makeMain(index)}
            className="absolute bottom-1 start-1 inline-flex h-5 items-center gap-1 rounded bg-background/90 px-1.5 text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
            <Star className="h-2.5 w-2.5" /> {__("Main", "yaxii-product-workspace")}
          </button>}
        </div>
        {index === 0 && <span className="absolute bottom-1 start-1 inline-flex h-4 items-center rounded bg-foreground px-1.5 text-[9px] font-semibold uppercase tracking-wide text-background">{__("Main", "yaxii-product-workspace")}</span>}
      </div>
    ))}{!isFull && <button type="button" onClick={openPicker}
      className="grid aspect-square place-items-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground"
      aria-label={__("Add more images", "yaxii-product-workspace")}><Plus className="h-4 w-4" /></button>}</div>}

    {dropSurfaceVisible && <div onClick={openPicker} className={cn(
      "drag-zone flex cursor-pointer flex-col items-center justify-center gap-1.5 text-center",
      hasImages ? "absolute inset-0 z-20 border-foreground/40 bg-background/95 backdrop-blur-sm" : "py-6",
      (isDragging || (windowDrag && !hasImages)) && "drag-zone-active",
      (isFull || uploading) && "cursor-not-allowed opacity-50",
    )}>
      <div className={cn("rounded-full p-2 transition-colors", isDragging ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </div>
      <p className="text-[13px] font-medium">{uploading ? __("Uploading to WordPress…", "yaxii-product-workspace")
        : isDragging ? __("Drop to upload", "yaxii-product-workspace") : hasImages ? __("Drop images to add", "yaxii-product-workspace") : __("Drag & drop product images", "yaxii-product-workspace")}</p>
      {!hasImages && <p className="text-[11px] text-muted-foreground">
        {uploadError || /* translators: %s: maximum image count. */ sprintf(_n("or click to browse · up to %s image · first image becomes the thumbnail", "or click to browse · up to %s images · first image becomes the thumbnail", maxImages, "yaxii-product-workspace"), maxImages)}
      </p>}
    </div>}
    {hasImages && uploadError && <p role="alert" className="text-[11px] text-destructive">{uploadError}</p>}
  </div>;
}
