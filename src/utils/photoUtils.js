import { canManagePhotos } from '../features/auth/permissions.js';

export const STORAGE_BUCKET = 'bukti-transaksi';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTOS_PER_ITEM = 10;
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const FALLBACK_PHOTO_STORAGE_KEY = 'perlap_foto_bukti_fallback_v1';

function sanitizeSegment(str) {
  return (
    String(str || 'umum')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'umum'
  );
}

function sanitizeFileName(name) {
  const raw = String(name || 'bukti.jpg').trim();
  const parts = raw.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg';
  const base = sanitizeSegment(parts.join('.')) || 'bukti';
  return `${base}.${ext || 'jpg'}`;
}

export function normalizePhotoItem(raw, index = 0) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return {
      id: `photo-legacy-${index + 1}`,
      name: `Bukti Foto ${index + 1}`,
      url: trimmed,
      storagePath: null,
      caption: '',
      uploadedAt: '',
      uploadedBy: 'admin',
    };
  }

  if (typeof raw === 'object' && typeof raw.url === 'string' && raw.url.trim()) {
    return {
      id: String(raw.id || `photo-${index + 1}-${Date.now()}`),
      name: String(raw.name || `Bukti Foto ${index + 1}`).trim(),
      url: raw.url.trim(),
      storagePath: raw.storagePath ? String(raw.storagePath) : null,
      caption: String(raw.caption || '').trim(),
      uploadedAt: String(raw.uploadedAt || ''),
      uploadedBy: String(raw.uploadedBy || 'admin'),
    };
  }

  return null;
}

export function normalizePhotoList(raw) {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '-') return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = [trimmed];
      }
    } else {
      parsed = [trimmed];
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed
    .map((item, idx) => normalizePhotoItem(item, idx))
    .filter(Boolean);
}

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'File foto tidak ditemukan.' };
  }

  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  const hasImageExt = /\.(jpe?g|png|webp|gif)$/i.test(name);

  if (!ALLOWED_IMAGE_TYPES.includes(type) && !(type.startsWith('image/') && hasImageExt)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan file gambar (JPG, PNG, WEBP, atau GIF).',
    };
  }

  const size = Number(file.size) || 0;
  if (size <= 0) {
    return { valid: false, error: 'Ukuran file foto tidak valid (0 byte).' };
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file terlalu besar. Maksimal 10 MB per foto.',
    };
  }

  return { valid: true };
}

export async function compressImageFile(
  file,
  { maxWidth = 1280, maxHeight = 1280, quality = 0.82 } = {}
) {
  if (file?.dataUrl && typeof file.dataUrl === 'string') {
    return {
      blob: file,
      dataUrl: file.dataUrl,
      mimeType: file.type || 'image/jpeg',
    };
  }

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof FileReader === 'undefined' ||
    typeof Image === 'undefined'
  ) {
    // Fallback untuk environment pengujian Node.js
    let dataUrl = 'data:image/jpeg;base64,dGVzdC1pbWFnZQ==';
    if (typeof file?.arrayBuffer === 'function') {
      const ab = await file.arrayBuffer();
      const b64 = Buffer.from(ab).toString('base64');
      dataUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`;
    }
    return {
      blob: file,
      dataUrl,
      mimeType: file?.type || 'image/jpeg',
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') {
        reject(new Error('Gagal memproses data gambar.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Jika gagal decode di canvas, gunakan dataUrl asli
        resolve({
          blob: file,
          dataUrl: rawDataUrl,
          mimeType: file.type || 'image/jpeg',
        });
      };
      img.onload = () => {
        try {
          let width = img.width || 800;
          let height = img.height || 600;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              blob: file,
              dataUrl: rawDataUrl,
              mimeType: file.type || 'image/jpeg',
            });
            return;
          }

          // Latar putih untuk gambar transparan jika dikonversi ke JPEG
          const targetMime =
            file.type === 'image/png' || file.type === 'image/webp'
              ? file.type
              : 'image/jpeg';

          if (targetMime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(targetMime, quality);

          canvas.toBlob(
            (blob) => {
              resolve({
                blob: blob || file,
                dataUrl: compressedDataUrl,
                mimeType: targetMime,
              });
            },
            targetMime,
            quality
          );
        } catch {
          resolve({
            blob: file,
            dataUrl: rawDataUrl,
            mimeType: file.type || 'image/jpeg',
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPhotoFile(
  file,
  {
    itemId = 'draft',
    divisi = 'Perlengkapan',
    profile,
    supabaseClient = null,
    caption = '',
  } = {}
) {
  if (!canManagePhotos(profile)) {
    throw new Error(
      'Akses ditolak: Hanya Admin Utama (Divisi Perlengkapan) yang dapat mengunggah foto bukti transaksi.'
    );
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const compressed = await compressImageFile(file);
  const safeDivisi = sanitizeSegment(divisi);
  const safeItem = sanitizeSegment(String(itemId || 'item'));
  const safeName = sanitizeFileName(file.name);
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const storagePath = `${safeDivisi}/${safeItem}/${uniqueSuffix}-${safeName}`;

  let finalUrl = compressed.dataUrl;
  let finalStoragePath = null;

  if (supabaseClient?.storage) {
    try {
      const bucket = supabaseClient.storage.from(STORAGE_BUCKET);
      const { error: uploadError } = await bucket.upload(
        storagePath,
        compressed.blob,
        {
          contentType: compressed.mimeType,
          upsert: false,
        }
      );

      if (!uploadError) {
        const { data: pubData } = bucket.getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          finalUrl = pubData.publicUrl;
          finalStoragePath = storagePath;
        }
      }
    } catch {
      // Fallback secara aman ke compressed Data URL jika bucket belum tersedia
    }
  }

  return {
    id: `photo-${uniqueSuffix}`,
    name: String(file.name || 'struk-pembelian.jpg').trim(),
    url: finalUrl,
    storagePath: finalStoragePath,
    caption: String(caption || '').trim(),
    uploadedAt: new Date().toISOString(),
    uploadedBy: profile.username || 'admin',
  };
}

export async function removePhotoFromStorage(
  photo,
  { profile, supabaseClient = null } = {}
) {
  if (!canManagePhotos(profile)) {
    throw new Error(
      'Akses ditolak: Hanya Admin Utama (Divisi Perlengkapan) yang dapat menghapus foto bukti transaksi.'
    );
  }

  if (photo?.storagePath && supabaseClient?.storage) {
    try {
      await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .remove([photo.storagePath]);
    } catch {
      // Abaikan kegagalan hapus file di storage agar update record tetap berjalan
    }
  }
  return true;
}

export function getFallbackPhotosForItem(itemId) {
  if (!itemId || typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(FALLBACK_PHOTO_STORAGE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw);
    return normalizePhotoList(map?.[String(itemId)]);
  } catch {
    return [];
  }
}

export function saveFallbackPhotosForItem(itemId, photos = []) {
  if (!itemId || typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const raw = window.localStorage.getItem(FALLBACK_PHOTO_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const normalized = normalizePhotoList(photos);
    if (normalized.length > 0) {
      map[String(itemId)] = normalized;
    } else {
      delete map[String(itemId)];
    }
    window.localStorage.setItem(FALLBACK_PHOTO_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Abaikan jika kuota localStorage penuh atau dibatasi
  }
}

export function removeFallbackPhotosForItem(itemId) {
  saveFallbackPhotosForItem(itemId, []);
}

export function formatPhotoDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}
