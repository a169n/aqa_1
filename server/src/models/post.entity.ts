import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { POST_STATUSES, type PostStatus } from '../constants/post-status';
import { Bookmark } from './bookmark.entity';
import { Category } from './category.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { PostTag } from './post-tag.entity';
import { Report } from './report.entity';
import { User } from './user.entity';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: POST_STATUSES,
    default: POST_STATUSES.DRAFT,
  })
  status!: PostStatus;

  @Column({ type: 'varchar', nullable: true })
  excerpt!: string | null;

  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId!: number | null;

  @Column({ name: 'author_id', type: 'integer' })
  authorId!: number;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Category, (category) => category.posts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes!: Like[];

  @OneToMany(() => PostTag, (postTag) => postTag.post)
  postTags!: PostTag[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.post)
  bookmarks!: Bookmark[];

  @OneToMany(() => Report, (report) => report.post)
  reports!: Report[];

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
