import type { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { asyncHandler } from '../utils/async-handler';

export const listPosts = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.listPosts(request.user));
});

export const getPost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.getPost(Number(request.params.id), request.user));
});

export const createPost = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await blogService.createPost(request.user!, request.body));
});

export const updatePost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.updatePost(Number(request.params.id), request.user!, request.body));
});

export const deletePost = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deletePost(Number(request.params.id), request.user!);
  response.status(204).send();
});

