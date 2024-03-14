import multer from 'multer';
import path from 'path';

export const tmpStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './storage/tmp');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const originalExtension = path.extname(file.originalname);
    const newFilename = `${file.fieldname}-${uniqueSuffix}${originalExtension}`;
    cb(null, newFilename);
  },
});

export default tmpStorage;
