import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';

const avatarDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR, 'avatars');

mkdirSync(avatarDirectory, { recursive: true });

export const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, avatarDirectory);
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname) || '.png';
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

