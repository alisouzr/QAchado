import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Garante que a pasta de uploads local exista em runtime
const uploadFolder = path.resolve('uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

export const MULTER_CONFIG = {
  directory: uploadFolder,
  
  // Armazenamento local (facilmente substituível por S3 Storage no futuro)
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, uploadFolder);
    },
    filename: (req, file, callback) => {
      const fileHash = crypto.randomBytes(10).toString('hex');
      // Remove espaços para evitar quebras em URLs do navegador
      const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
      const filename = `${fileHash}-${sanitizedOriginalName}`;
      
      callback(null, filename);
    }
  }),
  
  // Restrições de segurança do upload
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite estrito de 5 Megabytes
  },
  
  // Filtro defensivo de extensões/MIME Types
  fileFilter: (req: any, file: any, callback: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Tipo de arquivo inválido. Apenas imagens (JPEG, PNG, WEBP) e PDFs são permitidos.'));
    }
  }
};

export const upload = multer(MULTER_CONFIG);