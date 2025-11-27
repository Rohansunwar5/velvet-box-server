import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import path from 'path';
import { InternalServerError } from '../errors/internal-server.error';
import config from '../config';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true
});

const sanitizeFilename = (filename: string): string => {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Remove special characters and limit length to 50 chars
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  return `${sanitized}${ext}`;
};

// ✅ WORKING METHOD - Uses Cloudinary's SDK to generate the URL properly
export const uploadDocumentToCloudinary = (file: Express.Multer.File) => {
  return new Promise((resolve, reject) => {
    const originalName = file.originalname;
    const sanitizedName = sanitizeFilename(originalName);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'velvet-box/documents',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(new InternalServerError('Cloudinary upload failed'));
        }

        // ✅ USE CLOUDINARY SDK TO GENERATE THE DOWNLOAD URL
        // This is the CORRECT way - let Cloudinary build the URL
        const downloadUrl = cloudinary.url(result.public_id, {
          resource_type: 'raw',
          flags: 'attachment',
          attachment: sanitizedName,
        });

        resolve({
          url: downloadUrl,
          publicId: result.public_id,
          filename: sanitizedName,
          originalFilename: originalName,
          size: file.size,
          mimeType: file.mimetype
        });
      }
    );

    const s = new Readable();
    s.push(file.buffer);
    s.push(null);
    s.pipe(uploadStream);
  });
};

export const uploadImageToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'velvet-box/images',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(new InternalServerError('Failed to upload image to Cloudinary'));
        if (result) resolve(result.secure_url);
      }
    );

    const s = new Readable();
    s.push(file.buffer);
    s.push(null);
    s.pipe(uploadStream);
  });
};

export const uploadAudioToCloudinary = (
  file: Express.Multer.File,
  options?: { folder?: string; maxDuration?: number }
): Promise<{
  url: string;
  duration: number;
  format: string;
  filename: string;
  size: number;
  mimeType: string;
}> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'velvet-box/voice-recordings',
        resource_type: 'video',
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {
        if (error) {
          return reject(new InternalServerError('Failed to upload audio to Cloudinary'));
        }
        if (result) {
          resolve({
            url: result.secure_url,
            duration: result.duration || 0,
            format: result.format || 'unknown',
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          });
        }
      }
    );

    const s = new Readable();
    s.push(file.buffer);
    s.push(null);
    s.pipe(uploadStream);
  });
};

export const uploadVideoToCloudinary = (
  file: Express.Multer.File,
  options?: {
    folder?: string;
    maxDuration?: number;
    quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best';
  }
): Promise<{
  url: string;
  duration: number;
  format: string;
  filename: string;
  size: number;
  mimeType: string;
}> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'velvet-box/video-recordings',
        resource_type: 'video',
        use_filename: true,
        unique_filename: false,
        quality: options?.quality || 'auto'
      },
      (error, result) => {
        if (error) {
          return reject(new InternalServerError('Failed to upload video to Cloudinary'));
        }
        if (result) {
          resolve({
            url: result.secure_url,
            duration: result.duration || 0,
            format: result.format || 'unknown',
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          });
        }
      }
    );

    const s = new Readable();
    s.push(file.buffer);
    s.push(null);
    s.pipe(uploadStream);
  });
};

export const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'velvet-box',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(new InternalServerError('Failed to upload file to Cloudinary'));
        }
        if (result) {
          resolve(result.secure_url);
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (
  url: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }

    const pathAfterUpload = urlParts.slice(uploadIndex + 1);

    // Skip flags like fl_attachment
    let startIndex = 0;
    if (pathAfterUpload[0].startsWith('fl_')) {
      startIndex = 1;
    } else if (pathAfterUpload[0].startsWith('v') && !isNaN(Number(pathAfterUpload[0].slice(1)))) {
      startIndex = 1;
    }

    const filePath = pathAfterUpload.slice(startIndex).join('/');
    const publicId = filePath.substring(0, filePath.lastIndexOf('.')) || filePath;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
  } catch (error) {
    throw new InternalServerError('Failed to delete file from Cloudinary');
  }
};

export const getPublicIdFromUrl = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }

    const pathAfterUpload = urlParts.slice(uploadIndex + 1);

    // Skip flags like fl_attachment
    let startIndex = 0;
    if (pathAfterUpload[0].startsWith('fl_')) {
      startIndex = 1;
    } else if (pathAfterUpload[0].startsWith('v') && !isNaN(Number(pathAfterUpload[0].slice(1)))) {
      startIndex = 1;
    }

    const filePath = pathAfterUpload.slice(startIndex).join('/');
    const publicId = filePath.substring(0, filePath.lastIndexOf('.')) || filePath;

    return publicId;
  } catch (error) {
    throw new Error('Failed to extract public_id from URL');
  }
};

export const deleteManyFromCloudinary = async (
  urls: string[],
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    const deletePromises = urls.map(url => deleteFromCloudinary(url, resourceType));
    await Promise.all(deletePromises);
  } catch (error) {
    throw new InternalServerError('Failed to delete files from Cloudinary');
  }
};