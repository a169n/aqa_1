import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

const avatarDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR, 'avatars');
const AVATAR_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const ALLOWED_AVATAR_MIME_TYPES = new Set(Object.keys(AVATAR_MIME_TO_EXTENSION));

mkdirSync(avatarDirectory, { recursive: true });

export const avatarUpload = multer({
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      callback(new HttpError(415, 'Avatar image must be a PNG, JPEG, GIF, or WebP file.'));
      return;
    }

    callback(null, true);
  },
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, avatarDirectory);
    },
    filename: (_request, file, callback) => {
      const extension = AVATAR_MIME_TO_EXTENSION[file.mimetype] ?? '.png';
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
