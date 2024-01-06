import { Response } from "express";

export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number, res: Response) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 400, res);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 404, res);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 401, res);
  }
}
