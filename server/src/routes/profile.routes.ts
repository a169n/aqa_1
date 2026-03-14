import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/profile.controller';
import { authenticate } from '../middleware/authenticate';
import { avatarUpload } from '../middleware/upload';

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get('/profile', getProfile);
profileRouter.put('/profile', updateProfile);
profileRouter.post('/profile/avatar', avatarUpload.single('avatar'), uploadAvatar);
