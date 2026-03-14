import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

