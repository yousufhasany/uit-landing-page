import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { cloudinaryEnabled, env } from '../config/env.js';
import { badRequest } from '../utils/http.js';

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../storage/uploads');
export const LOCAL_VARIANT_WIDTHS = [480, 960, 1600] as const;

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

const ALLOWED: Record<string, { kind: MediaKind; ext: string }> = {
  'image/jpeg': { kind: 'IMAGE', ext: 'jpg' },
  'image/png': { kind: 'IMAGE', ext: 'png' },
  'image/webp': { kind: 'IMAGE', ext: 'webp' },
  'image/gif': { kind: 'IMAGE', ext: 'gif' },
  'image/avif': { kind: 'IMAGE', ext: 'avif' },
  'video/mp4': { kind: 'VIDEO', ext: 'mp4' },
  'video/webm': { kind: 'VIDEO', ext: 'webm' },
  'application/pdf': { kind: 'DOCUMENT', ext: 'pdf' },
};
export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED);

export interface StoredFile {
  provider: 'CLOUDINARY' | 'LOCAL';
  publicId: string;
  url: string;
  secureUrl: string;
  mimeType: string;
  type: MediaKind;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
}

/** Validates declared type, size and the file's actual content signature. */
export async function inspectFile(buffer: Buffer, declaredMime: string) {
  const rule = ALLOWED[declaredMime];
  if (!rule) throw badRequest(`Unsupported file type: ${declaredMime}. Allowed: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, PDF`);
  const limitMb = rule.kind === 'VIDEO' ? env.MAX_VIDEO_MB : env.MAX_IMAGE_MB;
  if (buffer.length > limitMb * 1024 * 1024) throw badRequest(`File exceeds the ${limitMb} MB limit`);

  if (rule.kind === 'IMAGE') {
    try {
      const meta = await sharp(buffer).metadata();
      const width = meta.autoOrient?.width ?? meta.width ?? null;
      const height = meta.autoOrient?.height ?? meta.height ?? null;
      return { ...rule, width, height };
    } catch {
      throw badRequest('The file is not a valid image');
    }
  }
  const head = buffer.subarray(0, 12);
  const ok =
    (declaredMime === 'application/pdf' && head.subarray(0, 4).toString() === '%PDF') ||
    (declaredMime === 'video/mp4' && head.subarray(4, 8).toString() === 'ftyp') ||
    (declaredMime === 'video/webm' && head.readUInt32BE(0) === 0x1a45dfa3);
  if (!ok) throw badRequest('File content does not match its declared type');
  return { ...rule, width: null, height: null };
}

async function uploadLocal(buffer: Buffer, mimeType: string, info: Awaited<ReturnType<typeof inspectFile>>): Promise<StoredFile> {
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const id = crypto.randomUUID();
  const publicId = `${dir}/${id}.${info.ext}`;
  await fs.mkdir(path.join(UPLOAD_DIR, dir), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, publicId), buffer);

  if (info.kind === 'IMAGE' && mimeType !== 'image/gif') {
    for (const width of LOCAL_VARIANT_WIDTHS) {
      await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(UPLOAD_DIR, `${dir}/${id}-w${width}.webp`));
    }
  }
  const url = `/uploads/${publicId}`;
  return { provider: 'LOCAL', publicId, url, secureUrl: url, mimeType, type: info.kind, fileSize: buffer.length, width: info.width, height: info.height, duration: null };
}

function uploadCloudinary(buffer: Buffer, mimeType: string, info: Awaited<ReturnType<typeof inspectFile>>): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.CLOUDINARY_FOLDER, resource_type: info.kind === 'VIDEO' ? 'video' : 'image', overwrite: false },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({
          provider: 'CLOUDINARY',
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          mimeType,
          type: info.kind,
          fileSize: result.bytes ?? buffer.length,
          width: result.width ?? info.width,
          height: result.height ?? info.height,
          duration: typeof result.duration === 'number' ? result.duration : null,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function storeFile(buffer: Buffer, mimeType: string): Promise<StoredFile> {
  const info = await inspectFile(buffer, mimeType);
  return cloudinaryEnabled ? uploadCloudinary(buffer, mimeType, info) : uploadLocal(buffer, mimeType, info);
}

export async function removeFile(provider: 'CLOUDINARY' | 'LOCAL', publicId: string, type: MediaKind) {
  try {
    if (provider === 'CLOUDINARY') {
      if (!cloudinaryEnabled) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: type === 'VIDEO' ? 'video' : 'image' });
      return;
    }
    const base = publicId.replace(/\.[a-z0-9]+$/i, '');
    await fs.rm(path.join(UPLOAD_DIR, publicId), { force: true });
    for (const width of LOCAL_VARIANT_WIDTHS) await fs.rm(path.join(UPLOAD_DIR, `${base}-w${width}.webp`), { force: true });
  } catch (error) {
    console.error('Failed to remove stored file', publicId, error);
  }
}
