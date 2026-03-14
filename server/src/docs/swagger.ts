import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';

export const swaggerRouter = Router();

swaggerRouter.get('/docs.json', (_request, response) => {
  response.json(openApiDocument);
});

swaggerRouter.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Inkwell API Docs',
    explorer: true,
  }),
);
