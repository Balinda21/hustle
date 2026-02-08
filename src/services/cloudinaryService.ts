const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcglnyola';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'caravan';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/**
 * Upload image to Cloudinary (web version using File/Blob)
 */
export async function uploadImage(file: File | Blob, folder: string = 'chat/images'): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      let errorMessage = error.error?.message || 'Failed to upload image';

      if (errorMessage.includes('whitelisted') || errorMessage.includes('unsigned')) {
        errorMessage = 'Upload preset must be set to "Unsigned" mode in Cloudinary.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      secureUrl: data.secure_url || data.url,
    };
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Upload audio/voice note to Cloudinary (web version using Blob)
 */
export async function uploadAudio(file: Blob, folder: string = 'chat/audio'): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured');
  }

  const formData = new FormData();
  formData.append('file', file, `voice_${Date.now()}.webm`);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }
  formData.append('resource_type', 'video');

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL.replace('/upload', '/video/upload'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      let errorMessage = error.error?.message || 'Failed to upload audio';

      if (errorMessage.includes('whitelisted') || errorMessage.includes('unsigned')) {
        errorMessage = 'Upload preset must be set to "Unsigned" mode in Cloudinary.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      secureUrl: data.secure_url || data.url,
    };
  } catch (error: any) {
    console.error('Error uploading audio to Cloudinary:', error);
    throw new Error(error.message || 'Failed to upload audio');
  }
}
