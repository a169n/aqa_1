import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity({ name: 'likes' })
@Index(['postId', 'userId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'post_id', type: 'integer' })
  postId!: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
