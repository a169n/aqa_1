import type { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { asyncHandler } from '../utils/async-handler';

export const createComment = asyncHandler(async (request: Request, response: Response) => {
  response
    .status(201)
    .json(await blogService.addComment(Number(request.params.postId), request.user!, request.body));
});

export const deleteComment = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deleteComment(Number(request.params.id), request.user!);
  response.status(204).send();
});
