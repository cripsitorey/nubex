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

// Configurar almacenamiento temporal en memoria para multer
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Middleware para procesar la imagen con sharp
export const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Procesar la imagen desde el buffer de multer a webp
    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toFile(filepath);

    // Asignar los nuevos datos a req.file para usarlos en el controlador
    req.file.filename = filename;
    req.file.path = filepath;
    req.file.mimetype = 'image/webp';
    req.file.destination = uploadDir;
    
    next();
  } catch (error) {
    next(error);
  }
};
