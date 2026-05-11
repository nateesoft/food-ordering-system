const MINIO_URL =
  process.env.NEXT_PUBLIC_MINIO_URL ||
  `http://${process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_MINIO_PORT || '9000'}`;

/**
 * Converts a stored image value to a full URL.
 * - Already a full URL → returned as-is
 * - Bucket path (e.g. "food-images/uuid.jpg") → prepends MinIO endpoint
 * - Falsy → empty string
 */
export function getImageUrl(image: string | null | undefined): string {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `${MINIO_URL}/${image}`;
}
