import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'replace-me';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ message: 'Unauthenticated' });

  try {
    req.user = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
}
