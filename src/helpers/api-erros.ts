import { Response } from "express";

export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number, res: Response) {
    super(message);
    this.statusCode = statusCode;
    res.status(this.statusCode).send(this.message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 400, res);
    res.status(400).send(this.message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 404, res);
    res.status(404).send(this.message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, res: Response) {
    super(message, 401, res);
    res.status(401).send(this.message);
  }
}