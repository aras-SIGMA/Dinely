/**
 * ============================================================================
 * DINELY - Client Image Compressor (FS-09 / Milestone 5)
 * ============================================================================
 * Bertanggung jawab mengompresi foto menu dan logo usaha kuliner di sisi browser
 * sebelum diunggah ke Cloudinary.
 *
 * Batasan Sistem:
 * - Format target: WebP (image/webp) dengan fallback JPEG jika browser tidak mendukung
 * - Dimensi maksimum: 800px (panjang atau lebar, mempertahankan rasio aspek)
 * - Ukuran file maksimum: 300 KB (307.200 bytes)
 * ============================================================================
 */

export const DEFAULT_MAX_DIMENSION = 800;
export const DEFAULT_MAX_BYTES = 300 * 1024; // 300 KB
export const DEFAULT_INITIAL_QUALITY = 0.85;
export const DEFAULT_MIN_QUALITY = 0.5;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif'
];

export interface CompressOptions {
  maxDimension?: number;
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
}

export interface CompressResult {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Format ukuran byte ke string terbaca (B, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validasi awal file gambar sebelum dilakukan kompresi.
 */
export function validateImage(
  file: File,
  options?: {
    maxOriginalBytes?: number;
    allowedTypes?: string[];
  }
): ImageValidationResult {
  const allowed = options?.allowedTypes ?? ALLOWED_IMAGE_MIME_TYPES;
  const maxBytes = options?.maxOriginalBytes ?? 10 * 1024 * 1024; // default max 10MB input

  if (!file) {
    return { valid: false, error: 'File tidak ditemukan.' };
  }

  // Periksa tipe MIME atau ekstensi jika MIME tidak terdeteksi
  const isMimeAllowed = allowed.includes(file.type.toLowerCase());
  const hasImageExtension = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);

  if (!isMimeAllowed && !hasImageExtension) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.'
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar (${formatFileSize(file.size)}). Maksimal file awal adalah ${formatFileSize(maxBytes)}.`
    };
  }

  return { valid: true };
}

/**
 * Menghitung dimensi baru dengan mempertahankan aspect ratio.
 */
export function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    const newWidth = maxDimension;
    const newHeight = Math.round((height * maxDimension) / width);
    return { width: newWidth, height: newHeight };
  }

  const newHeight = maxDimension;
  const newWidth = Math.round((width * maxDimension) / height);
  return { width: newWidth, height: newHeight };
}

/**
 * Mengganti ekstensi file menjadi .webp
 */
export function getWebpFilename(originalName: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${base || 'image'}.webp`;
}

/**
 * Memuat gambar dari File atau Blob ke HTMLImageElement.
 */
function loadImageElement(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat data gambar. File kemungkinan rusak atau tidak didukung.'));
    };

    img.src = url;
  });
}

/**
 * Mengonversi canvas ke Blob dengan mime type dan quality yang ditentukan.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengekspor canvas menjadi blob gambar.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Memeriksa apakah browser mendukung encoding canvas ke image/webp.
 */
let webpSupportedCache: boolean | null = null;
export function isWebpExportSupported(): boolean {
  if (typeof document === 'undefined') return true;
  if (webpSupportedCache !== null) return webpSupportedCache;

  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const dataUrl = testCanvas.toDataURL('image/webp');
    webpSupportedCache = dataUrl.startsWith('data:image/webp');
  } catch {
    webpSupportedCache = false;
  }

  return webpSupportedCache;
}

/**
 * Mengompresi file gambar di sisi client:
 * 1. Resize proporsional max 800px
 * 2. Konversi format ke WebP
 * 3. Iteratif optimasi kualitas & resolusi agar ukuran file <= 300KB
 */
export async function compressImage(
  input: File | Blob,
  options?: CompressOptions
): Promise<CompressResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image compressor hanya dapat dijalankan pada browser environment.');
  }

  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const initialQuality = options?.initialQuality ?? DEFAULT_INITIAL_QUALITY;
  const minQuality = options?.minQuality ?? DEFAULT_MIN_QUALITY;

  const originalSize = input.size;
  const originalName = input instanceof File ? input.name : 'image.webp';

  // 1. Load image
  const img = await loadImageElement(input);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (!origWidth || !origHeight) {
    throw new Error('Dimensi gambar tidak valid atau tidak terbaca.');
  }

  // 2. Hitung dimensi awal (max 800px)
  let { width: targetWidth, height: targetHeight } = calculateDimensions(
    origWidth,
    origHeight,
    maxDimension
  );

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Tidak dapat menginisialisasi 2D Canvas context.');
  }

  const targetMime = isWebpExportSupported() ? 'image/webp' : 'image/jpeg';
  const outExtension = targetMime === 'image/webp' ? '.webp' : '.jpg';
  const finalFilename = originalName.replace(/\.[^/.]+$/, '') + outExtension;

  // 3. Iterasi kompresi bertingkat untuk mencapai ukuran <= maxBytes
  const rawQualitySteps = [initialQuality, 0.75, 0.65, minQuality];
  const qualitySteps = Array.from(new Set(rawQualitySteps))
    .filter((q) => q <= initialQuality && q >= minQuality)
    .sort((a, b) => b - a);

  let finalBlob: Blob | null = null;
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;

  // Percobaan 1: Step down kualitas pada dimensi targetWidth x targetHeight
  for (let scaleAttempt = 0; scaleAttempt < 3; scaleAttempt++) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Bersihkan dan render gambar ke canvas
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, targetMime, quality);
      finalBlob = blob;
      finalWidth = targetWidth;
      finalHeight = targetHeight;

      if (blob.size <= maxBytes) {
        break;
      }
    }

    if (finalBlob && finalBlob.size <= maxBytes) {
      break;
    }

    // Jika masih di atas maxBytes dengan kualitas minimal, perkecil dimensi sebesar 20%
    targetWidth = Math.round(targetWidth * 0.8);
    targetHeight = Math.round(targetHeight * 0.8);

    if (targetWidth < 200 || targetHeight < 200) {
      break; // Jangan perkecil di bawah 200px
    }
  }

  if (!finalBlob) {
    throw new Error('Gagal menghasilkan file gambar terkompresi.');
  }

  const compressedFile = new File([finalBlob], finalFilename, {
    type: targetMime,
    lastModified: Date.now()
  });

  const compressionRatio = Number((finalBlob.size / originalSize).toFixed(3));

  return {
    file: compressedFile,
    blob: finalBlob,
    width: finalWidth,
    height: finalHeight,
    originalSize,
    compressedSize: finalBlob.size,
    compressionRatio,
    format: targetMime
  };
}
