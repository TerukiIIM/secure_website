import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthenticated' });

    const role = user.role;
    if (!role) return res.status(403).json({ error: 'No role assigned' });

    if (!role[permission]) return res.status(403).json({ error: 'Permission denied' });

    next();
  };
}
