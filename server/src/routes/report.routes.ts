import { Router } from 'express';
import { createReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/authenticate';

export const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.post('/', createReport);
