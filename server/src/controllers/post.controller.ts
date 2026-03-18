import type { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { asyncHandler } from '../utils/async-handler';

export const listPosts = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await blogService.listPosts(request.user, {
      status: typeof request.query.status === 'string' ? request.query.status : undefined,
      categoryId:
        typeof request.query.categoryId === 'string' ? request.query.categoryId : undefined,
      tag: typeof request.query.tag === 'string' ? request.query.tag : undefined,
      search: typeof request.query.search === 'string' ? request.query.search : undefined,
      authorId: typeof request.query.authorId === 'string' ? request.query.authorId : undefined,
    }),
  );
});

export const getPost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.getPost(Number(request.params.id), request.user));
});

export const createPost = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await blogService.createPost(request.user!, request.body));
});

export const updatePost = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await blogService.updatePost(Number(request.params.id), request.user!, request.body),
  );
});

export const deletePost = asyncHandler(async (request: Request, response: Response) => {
  await blogService.deletePost(Number(request.params.id), request.user!);
  response.status(204).send();
});

export const publishPost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.publishPost(Number(request.params.id), request.user!));
});

export const archivePost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.archivePost(Number(request.params.id), request.user!));
});

export const restorePost = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.restorePost(Number(request.params.id), request.user!));
});

export const listWorkspacePosts = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await blogService.listWorkspacePosts(request.user!, {
      status: typeof request.query.status === 'string' ? request.query.status : undefined,
    }),
  );
});

export const listBookmarks = asyncHandler(async (request: Request, response: Response) => {
  response.json(await blogService.listBookmarks(request.user!));
});

export const addBookmark = asyncHandler(async (request: Request, response: Response) => {
  response
    .status(201)
    .json(await blogService.addBookmark(Number(request.params.id), request.user!));
});

export const removeBookmark = asyncHandler(async (request: Request, response: Response) => {
  await blogService.removeBookmark(Number(request.params.id), request.user!);
  response.status(204).send();
});
