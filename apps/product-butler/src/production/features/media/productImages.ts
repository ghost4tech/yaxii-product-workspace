import type { ProductImage } from "@/types/product";

export function appendSelectedMedia(
  images: ProductImage[],
  attachments: WordPressMediaAttachment[],
  maxImages: number,
): ProductImage[] {
  const mediaIds = new Set(images.flatMap((image) => image.wpMediaId === undefined ? [] : [image.wpMediaId]));
  const additions: ProductImage[] = [];

  for (const attachment of attachments) {
    if (mediaIds.has(attachment.id) || images.length + additions.length >= maxImages) continue;
    mediaIds.add(attachment.id);
    additions.push({
      id: `wp-${attachment.id}`,
      preview: attachment.url,
      wpMediaId: attachment.id,
    });
  }

  return [...images, ...additions];
}
