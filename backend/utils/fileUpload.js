import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
  }
};

// Configure multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

/**
 * Uploads a file to the server
 * @param {Object} file - The file object from multer
 * @param {String} subfolder - Optional subfolder within uploads directory
 * @returns {Promise<String>} - Path to the uploaded file
 */
const uploadFile = async (file, subfolder = '') => {
  try {
    const uploadPath = path.join(__dirname, '../../uploads', subfolder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadPath, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    return filePath;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Deletes a file from the server
 * @param {String} filePath - Path to the file to delete
 * @returns {Promise<Boolean>} - True if deletion was successful
 */
const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('File not found:', filePath);
      return true; // Considered successful if file doesn't exist
    }
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Gets the public URL for a file
 * @param {String} filePath - Server path to the file
 * @returns {String} - Public accessible URL
 */
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const relativePath = path.relative(path.join(__dirname, '../../uploads'), filePath);
  return `/uploads/${relativePath.split(path.sep).join('/')}`;
};

export { upload, uploadFile, deleteFile, getFileUrl };