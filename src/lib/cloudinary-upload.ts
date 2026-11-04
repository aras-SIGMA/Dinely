/**
 * ============================================================================
 * RESTOLINK - Client Cloudinary Uploader (FS-10 / Milestone 5)
 * ============================================================================
 * Mengunggah gambar menu dan logo resto langsung ke Cloudinary API
 * dengan alur signature berbatas waktu dari serverless backend.
 *
 * Alur Kerja:
 * 1. Kompresi gambar client-side ke format WebP (via src/lib/image-compressor.ts)
 * 2. Request signature otentikasi ke endpoint /api/cloudinary/sign-upload
 * 3. Direct multipart upload ke Cloudinary API (https://api.cloudinary.com/v1_1/<cloudName>/image/upload)
 * 4. Mengembalikan URL aman (secure_url) dan metadata ringkasan penghematan kompresi
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import { compressImage, type CompressOptions, type CompressResult } from '@/lib/image-compressor';

export type UploadCategory = 'menu' | 'logo';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface CloudinaryRawResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at?: string;
  error?: {
    message: string;
  };
}

export interface CompressionSummary {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedBytes: number;
  savedPercent: number;
}

export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  compression?: CompressionSummary;
}

export interface UploadImageOptions {
  type?: UploadCategory;
  folder?: string;
  skipCompression?: boolean;
  compressOptions?: CompressOptions;
  onProgress?: (percent: number) => void;
}

/**
 * Meminta signature upload terotentikasi ke endpoint serverless backend.
 */
export async function requestUploadSignature(options?: {
  type?: UploadCategory;
  folder?: string;
}): Promise<CloudinarySignature> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Sesi autentikasi telah berakhir. Harap login terlebih dahulu.');
  }

  const token = sessionData.session.access_token;
  const res = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      type: options?.type ?? 'menu',
      folder: options?.folder
    })
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      payload.error || `Gagal mendapatkan signature upload Cloudinary (${res.status}).`
    );
  }

  // Dukung format payload langsung maupun nested { data: ... }
  const sigData =
    payload && typeof payload === 'object' && 'data' in payload && payload.data
      ? payload.data
      : payload;

  if (!sigData?.signature || !sigData?.timestamp || !sigData?.apiKey || !sigData?.cloudName) {
    throw new Error('Format response signature Cloudinary dari server tidak lengkap.');
  }

  return {
    signature: sigData.signature,
    timestamp: sigData.timestamp,
    apiKey: sigData.apiKey,
    cloudName: sigData.cloudName,
    folder: sigData.folder || 'restolink'
  };
}

/**
 * Mengunggah file ke Cloudinary API via multipart/form-data.
 * Mendukung progress tracking via XMLHttpRequest di lingkungan browser.
 */
export function uploadDirectToCloudinary(
  file: Blob | File,
  signature: CloudinarySignature,
  onProgress?: (percent: number) => void
): Promise<CloudinaryRawResponse> {
  return new Promise((resolve, reject) => {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`;
    const formData = new FormData();

    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    if (signature.folder) {
      formData.append('folder', signature.folder);
    }

    // Jika XMLHttpRequest tersedia di browser, gunakan untuk upload progress tracking
    if (typeof XMLHttpRequest !== 'undefined') {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText) as CloudinaryRawResponse;
          if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
            resolve(response);
          } else {
            const errorMsg = response.error?.message || `Upload gagal dengan status ${xhr.status}.`;
            reject(new Error(`Cloudinary Error: ${errorMsg}`));
          }
        } catch {
          reject(new Error('Gagal memproses respon dari Cloudinary API.'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Koneksi terputus saat mengunggah gambar ke Cloudinary.'));
      };

      xhr.send(formData);
      return;
    }

    // Fallback menggunakan fetch standard
    fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })
      .then(async (res) => {
        const json = (await res.json()) as CloudinaryRawResponse;
        if (!res.ok || !json.secure_url) {
          throw new Error(json.error?.message || `Upload gagal (${res.status}).`);
        }
        resolve(json);
      })
      .catch((err) => reject(err));
  });
}

/**
 * Alur lengkap upload gambar resto:
 * 1. Kompresi gambar client-side (WebP max 800px / 300KB)
 * 2. Ambil signature backend
 * 3. Unggah langsung ke Cloudinary
 * 4. Kembalikan URL publik beserta ringkasan penghematan kompresi
 */
export async function uploadImage(
  input: File | Blob,
  options?: UploadImageOptions
): Promise<UploadImageResult> {
  let fileToUpload: File | Blob = input;
  let compressionMeta: CompressionSummary | undefined;
  let detectedWidth = 0;
  let detectedHeight = 0;

  // 1. Kompresi otomatis (kecuali skipCompression diaktifkan)
  if (!options?.skipCompression) {
    const compResult: CompressResult = await compressImage(input, options?.compressOptions);
    fileToUpload = compResult.file;
    detectedWidth = compResult.width;
    detectedHeight = compResult.height;

    const savedBytes = Math.max(0, compResult.originalSize - compResult.compressedSize);
    const savedPercent =
      compResult.originalSize > 0
        ? Math.round((savedBytes / compResult.originalSize) * 100)
        : 0;

    compressionMeta = {
      originalSize: compResult.originalSize,
      compressedSize: compResult.compressedSize,
      compressionRatio: compResult.compressionRatio,
      savedBytes,
      savedPercent
    };
  }

  // 2. Minta signature upload ke serverless API
  const signature = await requestUploadSignature({
    type: options?.type ?? 'menu',
    folder: options?.folder
  });

  // 3. Upload langsung ke Cloudinary
  const uploadRes = await uploadDirectToCloudinary(
    fileToUpload,
    signature,
    options?.onProgress
  );

  return {
    url: uploadRes.secure_url,
    publicId: uploadRes.public_id,
    width: uploadRes.width || detectedWidth,
    height: uploadRes.height || detectedHeight,
    format: uploadRes.format || 'webp',
    bytes: uploadRes.bytes,
    compression: compressionMeta
  };
}
