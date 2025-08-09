/**
 * Centralized error handling utilities
 */

import { ApiError } from '../types';

export class AppError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
};

export const createErrorMessage = (error: ApiError): string => {
  if (error.status) {
    return `${error.message} (${error.status})`;
  }
  return error.message;
};

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type is not supported.',
  LOGIN_FAILED: 'Invalid email or password.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
} as const;
