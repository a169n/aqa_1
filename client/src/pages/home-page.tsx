import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookHeart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PostCard } from '@/components/posts/post-card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';
import { postsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export const HomePage = () => {
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const { isAuthenticated } = useAuth();
  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: postsApi.list,
  });

  if (postsQuery.isLoading) {
    return <LoadingState label="Loading the latest stories..." />;
  }

  if (postsQuery.isError) {
    return <ErrorState message={getErrorMessage(postsQuery.error)} />;
  }

  const allPosts = postsQuery.data ?? [];
  const posts = allPosts.filter((post) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <Card className="surface-glow page-reveal overflow-hidden bg-hero">
        <CardContent className="grid gap-8 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div className="space-y-6">
            <Badge variant="accent" className="w-fit">
              Publishing Hub
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl leading-[0.95] sm:text-6xl">
                Build a rhythm around writing, not around managing tabs.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Inkwell gives writers a clean editorial space, reader feedback through comments and
                likes, and a built-in admin console for moderation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={isAuthenticated ? '/posts/new' : '/register'} className={buttonVariants()}>
                {isAuthenticated ? 'Write your next post' : 'Create an account'}
              </Link>
              <Link
                to={isAuthenticated ? '/profile' : '/login'}
                className={cn(buttonVariants({ variant: 'secondary' }), 'gap-2')}
              >
                {isAuthenticated ? 'Open your profile' : 'Login'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Card className="float-card border-border/60 bg-card/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Posts</p>
              <p className="mt-3 font-display text-5xl">{allPosts.length}</p>
            </Card>
            <Card className="float-card border-border/60 bg-card/70 p-5">
              <div className="flex items-center gap-3">
                <BookHeart className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Community
                  </p>
                  <p className="mt-2 text-sm leading-7 text-foreground/80">
                    Responsive feed, profile tools, and moderation workflows are all available from
                    one workspace.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="page-reveal [animation-delay:100ms]">
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl">Latest posts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Search across titles, content, and authors without leaving the feed.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stories or authors"
              className="pl-11"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {posts.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center">
            <p className="text-lg font-semibold">No posts matched your search.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different keyword or publish a fresh article.
            </p>
            <Button variant="secondary" className="mt-5" onClick={() => setSearchValue('')}>
              Reset search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
