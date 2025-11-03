/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images before upload and display.
 * Works in conjunction with Next.js Image component and Sharp.
 */

import imageCompression from 'browser-image-compression'

import { logger } from '@/lib/logger';
/**
 * Image compression options
 */
export interface ImageCompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: string
  quality?: number
}

/**
 * Default compression options for different image types
 */
export const COMPRESSION_PRESETS = {
  profile: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    quality: 0.85,
  },
  attendance: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    quality: 0.8,
  },
  logo: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 500,
    useWebWorker: true,
    quality: 0.9,
  },
  thumbnail: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 200,
    useWebWorker: true,
    quality: 0.7,
  },
} as const

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = COMPRESSION_PRESETS.profile
): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker ?? true,
      fileType: options.fileType,
      initialQuality: options.quality || 0.8,
    })
    return compressed
  } catch (error) {
    logger.error('Image compression failed:', error)
    throw new Error('Failed to compress image')
  }
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options?: {
    maxSizeMB?: number
    allowedTypes?: string[]
  }
): { valid: boolean; error?: string } {
  const maxSize = (options?.maxSizeMB || 10) * 1024 * 1024 // Convert MB to bytes
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ]

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size: ${options?.maxSizeMB || 10}MB`,
    }
  }

  return { valid: true }
}

/**
 * Get image dimensions from File
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/**
 * Convert File to Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Create a thumbnail from image file
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 200
): Promise<File> {
  return compressImage(file, {
    maxWidthOrHeight: maxSize,
    maxSizeMB: 0.1,
    quality: 0.7,
    useWebWorker: true,
  })
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options: ImageCompressionOptions = COMPRESSION_PRESETS.profile
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)))
}

/**
 * Get optimized image URL for Next.js Image component
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number
    quality?: number
  }
): string {
  if (!url) return ''
  
  // If using Supabase Storage, add transformation params
  if (url.includes('supabase')) {
    const params = new URLSearchParams()
    if (options?.width) params.append('width', String(options.width))
    if (options?.quality) params.append('quality', String(options.quality))
    
    const separator = url.includes('?') ? '&' : '?'
    return params.toString() ? `${url}${separator}${params.toString()}` : url
  }
  
  return url
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

/**
 * Resize dimensions while maintaining aspect ratio
 */
export function resizeDimensions(
  currentWidth: number,
  currentHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / currentWidth, maxHeight / currentHeight)
  
  if (ratio >= 1) {
    return { width: currentWidth, height: currentHeight }
  }
  
  return {
    width: Math.round(currentWidth * ratio),
    height: Math.round(currentHeight * ratio),
  }
}
