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

  // Return the original URL as the user has uploaded a correct PNG.
  // We avoid using the render API to prevent broken links.
  return url;
}
