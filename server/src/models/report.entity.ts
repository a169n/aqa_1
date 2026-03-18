import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { REPORT_STATUSES, type ReportStatus } from '../constants/report-status';
import { Comment } from './comment.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'reporter_id', type: 'integer' })
  reporterId!: number;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Column({ name: 'post_id', type: 'integer', nullable: true })
  postId!: number | null;

  @ManyToOne(() => Post, (post) => post.reports, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post!: Post | null;

  @Column({ name: 'comment_id', type: 'integer', nullable: true })
  commentId!: number | null;

  @ManyToOne(() => Comment, (comment) => comment.reports, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment | null;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: REPORT_STATUSES,
    default: REPORT_STATUSES.OPEN,
  })
  status!: ReportStatus;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote!: string | null;

  @Column({ name: 'resolved_by_id', type: 'integer', nullable: true })
  resolvedById!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy!: User | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
