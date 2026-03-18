import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminNav } from '@/components/common/admin-nav';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export const AdminTaxonomyPage = () => {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminApi.categories,
  });
  const tagsQuery = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: adminApi.tags,
  });

  const createCategoryMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: async () => {
      setNewCategory('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: number; name: string }) =>
      adminApi.updateCategory(categoryId, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: adminApi.createTag,
    onSuccess: async () => {
      setNewTag('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: adminApi.deleteTag,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: number; name: string }) =>
      adminApi.updateTag(tagId, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  if (categoriesQuery.isLoading || tagsQuery.isLoading) {
    return <LoadingState label="Loading taxonomy..." />;
  }

  if (categoriesQuery.isError || tagsQuery.isError) {
    return <ErrorState message={getErrorMessage(categoriesQuery.error ?? tagsQuery.error)} />;
  }

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="surface-glow">
        <CardContent className="space-y-4">
          <Badge variant="accent" className="w-fit">
            Admin Taxonomy
          </Badge>
          <h1 className="text-4xl">Manage categories and tags</h1>
          <AdminNav />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="New category"
              />
              <Button
                disabled={createCategoryMutation.isPending || !newCategory.trim()}
                onClick={() => createCategoryMutation.mutate({ name: newCategory })}
              >
                Add
              </Button>
            </div>
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-2xl border p-3"
              >
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updateCategoryMutation.isPending}
                    onClick={() => {
                      const nextName = window.prompt('Rename category', category.name)?.trim();

                      if (nextName) {
                        updateCategoryMutation.mutate({ categoryId: category.id, name: nextName });
                      }
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteCategoryMutation.isPending}
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                placeholder="New tag"
              />
              <Button
                disabled={createTagMutation.isPending || !newTag.trim()}
                onClick={() => createTagMutation.mutate({ name: newTag })}
              >
                Add
              </Button>
            </div>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between rounded-2xl border p-3"
              >
                <div>
                  <p className="font-semibold">{tag.name}</p>
                  <p className="text-xs text-muted-foreground">{tag.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updateTagMutation.isPending}
                    onClick={() => {
                      const nextName = window.prompt('Rename tag', tag.name)?.trim();

                      if (nextName) {
                        updateTagMutation.mutate({ tagId: tag.id, name: nextName });
                      }
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteTagMutation.isPending}
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
