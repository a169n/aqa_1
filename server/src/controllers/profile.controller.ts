import type { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';

export const getProfile = asyncHandler(async (request: Request, response: Response) => {
  response.json(await userService.getProfile(request.user!.id));
});

export const updateProfile = asyncHandler(async (request: Request, response: Response) => {
  response.json(await userService.updateProfile(request.user!, request.body));
});

export const uploadAvatar = asyncHandler(async (request: Request, response: Response) => {
  if (!request.file) {
    throw new HttpError(400, 'Avatar image is required.');
  }

  const avatarUrl = `/uploads/avatars/${request.file.filename}`;
  response.json(await userService.updateAvatar(request.user!, avatarUrl));
});
