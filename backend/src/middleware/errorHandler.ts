import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils";
import { env } from "../config/env";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  // Mongoose duplicate key error
  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    res.status(409).json({ message: "A record with these details already exists." });
    return;
  }

  console.error("[unhandled error]", err);
  res.status(500).json({
    message: "Something went wrong on the server.",
    ...(env.isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}
