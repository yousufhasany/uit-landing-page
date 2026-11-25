import { env } from '../config/env.js';
import { LOCAL_VARIANT_WIDTHS } from '../lib/storage.js';

interface MediaLike {
  id: string;
  provider: 'CLOUDINARY' | 'LOCAL';
  publicId: string;
  secureUrl: string;
  mimeType: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  width: number | null;
  height: number | null;
  altText: string;
  caption?: string | null;
}

export interface MediaDTO {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  url: string;
  thumbUrl: string;
  srcSet?: string;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  mimeType: string;
}

const backend = () => env.BACKEND_URL.replace(/\/$/, '');

function absolute(url: string) {
  return url.startsWith('/') ? `${backend()}${url}` : url;
}

function cloudinaryTransform(url: string, transform: string) {
  return url.replace('/upload/', `/upload/${transform}/`);
}

/** Public shape for media, including responsive sources for images. */
export function toMediaDTO(asset: MediaLike | null | undefined): MediaDTO | null {
  if (!asset) return null;
  const url = absolute(asset.secureUrl);
  const base: MediaDTO = {
    id: asset.id,
    type: asset.type,
    url,
    thumbUrl: url,
    width: asset.width,
    height: asset.height,
    alt: asset.altText ?? '',
    caption: asset.caption ?? null,
    mimeType: asset.mimeType,
  };
  if (asset.type !== 'IMAGE' || asset.mimeType === 'image/gif') return base;

  if (asset.provider === 'CLOUDINARY') {
    const widths = [480, 960, 1600, 2400];
    return {
      ...base,
      url: cloudinaryTransform(url, 'f_auto,q_auto'),
      thumbUrl: cloudinaryTransform(url, 'f_auto,q_auto,c_fill,w_480,h_360'),
      srcSet: widths.map((w) => `${cloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${w}`)} ${w}w`).join(', '),
    };
  }
  const stem = absolute(`/uploads/${asset.publicId.replace(/\.[a-z0-9]+$/i, '')}`);
  const available = LOCAL_VARIANT_WIDTHS.filter((w, i) => i === 0 || !asset.width || asset.width > LOCAL_VARIANT_WIDTHS[i - 1]);
  return {
    ...base,
    thumbUrl: `${stem}-w480.webp`,
    srcSet: [...available.map((w) => `${stem}-w${w}.webp ${Math.min(w, asset.width ?? w)}w`)].join(', '),
  };
}
