import { isAxiosError } from 'axios';

export const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
};
