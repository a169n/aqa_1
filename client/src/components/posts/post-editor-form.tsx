import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PostEditorFormProps {
  title: string;
  content: string;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
}

export const PostEditorForm = ({
  title,
  content,
  isSubmitting,
  mode,
  onTitleChange,
  onContentChange,
  onSubmit,
}: PostEditorFormProps) => (
  <Card className="surface-glow mx-auto max-w-4xl">
    <CardHeader>
      <CardTitle>{mode === 'create' ? 'Write a new story' : 'Refine your story'}</CardTitle>
      <CardDescription>
        Draft long-form blog posts, update them later, and keep everything in your profile.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
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
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write the full post here..."
          className="min-h-[360px]"
        />
      </div>
      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving...' : mode === 'create' ? 'Publish post' : 'Save changes'}
      </Button>
    </CardContent>
  </Card>
);
