/**
 * Operational error carrying an HTTP status. Thrown by services/controllers
 * and translated to a JSON response by the error middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(403, message);
  }
  static notFound(message = "Not found") {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}
