import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurarse de que el directorio uploads exista
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento en disco para soportar videos más grandes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Limite de 50MB para soportar videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y videos'), false);
    }
  }
});

// Middleware para procesar imágenes con sharp (soporta múltiples)
export const processMedia = async (req, res, next) => {
  // Maneja tanto req.file (single) como req.files (array)
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) return next();

  try {
    for (let file of files) {
      // Solo procesamos imágenes con sharp. Los videos quedan intactos.
      if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/webp') {
        const newFilename = `${uuidv4()}.webp`;
        const newFilepath = path.join(uploadDir, newFilename);

        await sharp(file.path)
          .webp({ quality: 80 })
          .toFile(newFilepath);

        // Borrar el archivo original subido por multer
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        // Actualizar los datos del archivo en el request
        file.filename = newFilename;
        file.path = newFilepath;
        file.mimetype = 'image/webp';
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Mantenemos la exportación antigua temporalmente por compatibilidad si se usaba en otra parte
export const processImage = processMedia;
