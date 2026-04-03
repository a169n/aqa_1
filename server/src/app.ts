import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { env } from './config/env';
import { swaggerRouter } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { securityHeaders } from './middleware/security';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
app.use(swaggerRouter);
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
