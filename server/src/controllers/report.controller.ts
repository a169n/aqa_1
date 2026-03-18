import type { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { asyncHandler } from '../utils/async-handler';

export const createReport = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await reportService.createReport(request.user!, request.body));
});

export const listAdminReports = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await reportService.listReports({
      status: typeof request.query.status === 'string' ? request.query.status : undefined,
    }),
  );
});

export const updateAdminReport = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await reportService.updateReport(Number(request.params.id), request.user!, request.body),
  );
});
