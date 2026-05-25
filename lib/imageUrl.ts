const MINIO_URL_ENV =
  process.env.NEXT_PUBLIC_MINIO_URL ||
  `http://${process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_MINIO_PORT || '9000'}`;

function getMinioBaseUrl(): string {
  if (typeof window === 'undefined') return MINIO_URL_ENV;
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return MINIO_URL_ENV.replace(/localhost|127\.0\.0\.1/, hostname);
  }
  return MINIO_URL_ENV;
}

/**
 * Converts a stored image value to a full URL.
 * - Already a full URL → returned as-is
 * - Bucket path (e.g. "food-images/uuid.jpg") → prepends MinIO endpoint
 * - Falsy → empty string
 */
export function getImageUrl(image: string | null | undefined): string {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `${getMinioBaseUrl()}/${image}`;
}
