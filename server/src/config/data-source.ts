import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { Post } from '../models/post.entity';
import { RefreshToken } from '../models/refresh-token.entity';
import { User } from '../models/user.entity';
import { InitialSchema1700000000000 } from '../migrations/1700000000000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: false,
  logging: false,
  entities: [User, Post, Comment, Like, RefreshToken],
  migrations: [InitialSchema1700000000000],
});
