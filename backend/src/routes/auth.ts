import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'replace-me';

export async function login(req: Request, res: Response) {
  const { userId, role } = req.body;
  const token = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({ ok: true });
}
