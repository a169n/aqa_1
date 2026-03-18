import type { Request, Response } from 'express';
import { taxonomyService } from '../services/taxonomy.service';
import { asyncHandler } from '../utils/async-handler';

export const listCategories = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await taxonomyService.listCategories());
});

export const listTags = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await taxonomyService.listTags());
});

export const createCategory = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await taxonomyService.createCategory(request.body));
});

export const updateCategory = asyncHandler(async (request: Request, response: Response) => {
  response.json(await taxonomyService.updateCategory(Number(request.params.id), request.body));
});

export const deleteCategory = asyncHandler(async (request: Request, response: Response) => {
  await taxonomyService.deleteCategory(Number(request.params.id));
  response.status(204).send();
});

export const createTag = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await taxonomyService.createTag(request.body));
});

export const updateTag = asyncHandler(async (request: Request, response: Response) => {
  response.json(await taxonomyService.updateTag(Number(request.params.id), request.body));
});

export const deleteTag = asyncHandler(async (request: Request, response: Response) => {
  await taxonomyService.deleteTag(Number(request.params.id));
  response.status(204).send();
});
