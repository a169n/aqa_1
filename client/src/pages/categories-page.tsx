import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PostCard } from '@/components/posts/post-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { postsApi, taxonomyApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export const CategoriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = Number(searchParams.get('categoryId') ?? 0) || undefined;

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: taxonomyApi.categories,
  });

  const postsQuery = useQuery({
    queryKey: ['posts', 'categories', selectedCategoryId],
    queryFn: () =>
      postsApi.list({
        categoryId: selectedCategoryId,
      }),
  });

  if (categoriesQuery.isLoading || postsQuery.isLoading) {
    return <LoadingState label="Loading categories..." />;
  }

  if (categoriesQuery.isError || postsQuery.isError) {
    return <ErrorState message={getErrorMessage(categoriesQuery.error ?? postsQuery.error)} />;
  }

  const categories = categoriesQuery.data ?? [];
  const posts = postsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="surface-glow">
        <CardContent className="space-y-3">
          <Badge variant="accent" className="w-fit">
            Categories
          </Badge>
          <h1 className="text-4xl">Explore by editorial category</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border px-3 py-1.5 text-sm"
              onClick={() => setSearchParams({})}
            >
              all
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="rounded-full border px-3 py-1.5 text-sm"
                onClick={() => setSearchParams({ categoryId: String(category.id) })}
              >
                {category.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
