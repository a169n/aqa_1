import type { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';

export const listAdminPosts = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.listPosts(request.user));
});

export const updateAdminPost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.updatePost(Number(request.params.id), request.user!, request.body));
});

export const deleteAdminPost = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deletePost(Number(request.params.id), request.user!);
  response.status(204).send();
});

export const listAdminUsers = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await userService.listUsers());
});

export const updateAdminUserRole = asyncHandler(async (request: Request, response: Response) => {
  response.json(await userService.updateRole(Number(request.params.id), request.body.role));
});

export const deleteAdminUser = asyncHandler(async (request: Request, response: Response) => {
  await userService.deleteUser(Number(request.params.id));
  response.status(204).send();
});

export const listAdminComments = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await blogService.listComments());
});

export const deleteAdminComment = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deleteComment(Number(request.params.id), request.user!);
  response.status(204).send();
});

export const listAdminLikes = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await blogService.listLikes());
});

export const deleteAdminLike = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deleteLike(Number(request.params.id));
  response.status(204).send();
});

