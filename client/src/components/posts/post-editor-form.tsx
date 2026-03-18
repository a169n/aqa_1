import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, PostStatus, Tag } from '@/types/api';

interface PostEditorFormProps {
  title: string;
  content: string;
  excerpt: string;
  status: PostStatus;
  categoryId: number | null;
  selectedTagIds: number[];
  categories: Category[];
  tags: Tag[];
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onTagToggle: (tagId: number) => void;
  onSubmit: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export const PostEditorForm = ({
  title,
  content,
  excerpt,
  status,
  categoryId,
  selectedTagIds,
  categories,
  tags,
  isSubmitting,
  mode,
  onTitleChange,
  onContentChange,
  onExcerptChange,
  onCategoryChange,
  onTagToggle,
  onSubmit,
  onPublish,
  onArchive,
  onRestore,
}: PostEditorFormProps) => (
  <Card className="surface-glow mx-auto max-w-4xl">
    <CardHeader>
      <CardTitle>{mode === 'create' ? 'Write a new story' : 'Refine your story'}</CardTitle>
      <CardDescription>
        Manage drafts, publish on your timeline, and keep archived versions accessible.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</span>
        <span className="rounded-full border px-3 py-1 text-xs font-semibold">{status}</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="A title worth opening"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(event) => onExcerptChange(event.target.value)}
          placeholder="Short summary for cards and previews"
          className="min-h-[110px]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={categoryId ? String(categoryId) : ''}
            onChange={(event) =>
              onCategoryChange(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-auto rounded-2xl border px-3 py-3">
            {tags.map((tag) => {
              const isActive = selectedTagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onTagToggle(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write the full post here..."
          className="min-h-[360px]"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Save draft' : 'Save changes'}
        </Button>
        {onPublish ? (
          <Button
            onClick={onPublish}
            variant="secondary"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Publish
          </Button>
        ) : null}
        {onArchive ? (
          <Button
            onClick={onArchive}
            variant="ghost"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Archive
          </Button>
        ) : null}
        {onRestore ? (
          <Button
            onClick={onRestore}
            variant="secondary"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Restore to draft
          </Button>
        ) : null}
      </div>
    </CardContent>
  </Card>
);
