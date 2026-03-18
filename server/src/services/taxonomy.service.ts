import { AppDataSource } from '../config/data-source';
import { Category } from '../models/category.entity';
import { Tag } from '../models/tag.entity';
import { HttpError } from '../utils/http-error';
import { serializeTag } from '../utils/serializers';

const categoryRepository = () => AppDataSource.getRepository(Category);
const tagRepository = () => AppDataSource.getRepository(Tag);

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const taxonomyService = {
  async listCategories() {
    const categories = await categoryRepository().find({
      order: {
        name: 'ASC',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  },

  async listTags() {
    const tags = await tagRepository().find({
      order: {
        name: 'ASC',
      },
    });

    return tags.map(serializeTag);
  },

  async createCategory(input: { name: string }) {
    const name = input.name?.trim();

    if (!name) {
      throw new HttpError(400, 'Category name is required.');
    }

    const slug = toSlug(name);

    if (!slug) {
      throw new HttpError(400, 'Category name must include letters or numbers.');
    }

    const existing = await categoryRepository().findOne({
      where: [{ name }, { slug }],
    });

    if (existing) {
      throw new HttpError(409, 'Category with this name already exists.');
    }

    const category = categoryRepository().create({ name, slug });
    const saved = await categoryRepository().save(category);

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  },

  async updateCategory(categoryId: number, input: { name: string }) {
    const category = await categoryRepository().findOneBy({ id: categoryId });

    if (!category) {
      throw new HttpError(404, 'Category not found.');
    }

    const name = input.name?.trim();

    if (!name) {
      throw new HttpError(400, 'Category name is required.');
    }

    const slug = toSlug(name);

    if (!slug) {
      throw new HttpError(400, 'Category name must include letters or numbers.');
    }

    const existing = await categoryRepository().findOne({
      where: [{ name }, { slug }],
    });

    if (existing && existing.id !== categoryId) {
      throw new HttpError(409, 'Category with this name already exists.');
    }

    category.name = name;
    category.slug = slug;
    const updated = await categoryRepository().save(category);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  async deleteCategory(categoryId: number) {
    const category = await categoryRepository().findOneBy({ id: categoryId });

    if (!category) {
      throw new HttpError(404, 'Category not found.');
    }

    await categoryRepository().remove(category);
  },

  async createTag(input: { name: string }) {
    const name = input.name?.trim();

    if (!name) {
      throw new HttpError(400, 'Tag name is required.');
    }

    const slug = toSlug(name);

    if (!slug) {
      throw new HttpError(400, 'Tag name must include letters or numbers.');
    }

    const existing = await tagRepository().findOne({
      where: [{ name }, { slug }],
    });

    if (existing) {
      throw new HttpError(409, 'Tag with this name already exists.');
    }

    const tag = tagRepository().create({ name, slug });
    return serializeTag(await tagRepository().save(tag));
  },

  async updateTag(tagId: number, input: { name: string }) {
    const tag = await tagRepository().findOneBy({ id: tagId });

    if (!tag) {
      throw new HttpError(404, 'Tag not found.');
    }

    const name = input.name?.trim();

    if (!name) {
      throw new HttpError(400, 'Tag name is required.');
    }

    const slug = toSlug(name);

    if (!slug) {
      throw new HttpError(400, 'Tag name must include letters or numbers.');
    }

    const existing = await tagRepository().findOne({
      where: [{ name }, { slug }],
    });

    if (existing && existing.id !== tagId) {
      throw new HttpError(409, 'Tag with this name already exists.');
    }

    tag.name = name;
    tag.slug = slug;
    return serializeTag(await tagRepository().save(tag));
  },

  async deleteTag(tagId: number) {
    const tag = await tagRepository().findOneBy({ id: tagId });

    if (!tag) {
      throw new HttpError(404, 'Tag not found.');
    }

    await tagRepository().remove(tag);
  },
};
