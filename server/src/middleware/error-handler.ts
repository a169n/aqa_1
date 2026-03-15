import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/http-error';

export const notFoundHandler = (_request: Request, _response: Response, next: NextFunction) => {
  next(new HttpError(404, 'Route not found.'));
};

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  void _next;

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ message: 'Avatar image must be 5MB or smaller.' });
      return;
    }

    response.status(400).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: 'Internal server error.' });
};
