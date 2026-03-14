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
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { User } from './user.entity';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'author_id', type: 'integer' })
  authorId!: number;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes!: Like[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
