import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Optimizes a Supabase Storage URL for email delivery.
 * Transforms WebP to PNG using the Supabase Image Transformation API (if applicable)
 * to ensure compatibility with email clients like Gmail.
 */
export function getOptimizedEmailLogo(url: string | null): string {
  if (!url) return 'https://placehold.co/200x60?text=Service+Representaciones';

  // Check if it's a Supabase URL
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // If it's a standard public URL, convert to render API
    return url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?width=500&format=png&quality=90';
  } else if (url.includes('supabase.co/storage/v1/render/image/public/')) {
    // If already using render API, append format=png if not present
    if (!url.includes('format=')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=500&format=png&quality=90`;
    }
  }

  return url;
}
