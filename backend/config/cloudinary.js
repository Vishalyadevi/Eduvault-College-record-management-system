import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Prefer CLOUDINARY_URL (single connection string). Falls back to individual env vars if needed.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('[Cloudinary] No Cloudinary configuration found. Set CLOUDINARY_URL or CLOUDINARY_* env vars.');
}

export default cloudinary;
