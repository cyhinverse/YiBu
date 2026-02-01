import multer from 'multer';
import cloudinary from '../configs/cloudinaryConfig.js';
import ApiError from '../helpers/ApiError.js';


// Sử dụng memory storage thay vì multer-storage-cloudinary
const storage = multer.memoryStorage();

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const allowedVideoTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const fileFilter = (req, file, cb) => {
  const isImage = allowedImageTypes.has(file.mimetype);
  const isVideo = allowedVideoTypes.has(file.mimetype);

  if (!isImage && !isVideo) {
    return cb(ApiError.unsupportedMediaType('Unsupported file type'), false);
  }
  cb(null, true);
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
    files: 5,
  },
});


/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'user_uploads',
      resource_type: options.resourceType || 'auto',
      public_id: options.publicId,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 */
export const deleteFromCloudinary = async (
  publicId,
  resourceType = 'image'
) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default upload;
