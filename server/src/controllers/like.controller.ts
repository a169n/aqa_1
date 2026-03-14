import type { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { asyncHandler } from '../utils/async-handler';

export const likePost = asyncHandler(async (request: Request, response: Response) => {
  response
    .status(201)
    .json(await blogService.likePost(Number(request.params.postId), request.user!));
});

export const unlikePost = asyncHandler(async (request: Request, response: Response) => {
  await blogService.unlikePost(Number(request.params.postId), request.user!);
  response.status(204).send();
});
