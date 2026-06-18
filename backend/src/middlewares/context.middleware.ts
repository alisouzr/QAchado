import type { Request, Response, NextFunction } from 'express';
import { authLocalStorage } from '../lib/auth-context.js';

export const injectAuthContext = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.id) {
    // Isola o ID do usuário para ser lido pela extensão do Prisma nesta requisição
    authLocalStorage.run({ userId: req.user.id }, () => {
      next();
    });
  } else {
    next();
  }
};