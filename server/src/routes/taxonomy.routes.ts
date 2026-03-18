import { Router } from 'express';
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  listCategories,
  listTags,
  updateCategory,
  updateTag,
} from '../controllers/taxonomy.controller';
import { authenticate, requireAdmin } from '../middleware/authenticate';

export const taxonomyRouter = Router();
export const adminTaxonomyRouter = Router();

taxonomyRouter.get('/categories', listCategories);
taxonomyRouter.get('/tags', listTags);

adminTaxonomyRouter.use(authenticate, requireAdmin);
adminTaxonomyRouter.get('/categories', listCategories);
adminTaxonomyRouter.post('/categories', createCategory);
adminTaxonomyRouter.put('/categories/:id', updateCategory);
adminTaxonomyRouter.delete('/categories/:id', deleteCategory);
adminTaxonomyRouter.get('/tags', listTags);
adminTaxonomyRouter.post('/tags', createTag);
adminTaxonomyRouter.put('/tags/:id', updateTag);
adminTaxonomyRouter.delete('/tags/:id', deleteTag);
