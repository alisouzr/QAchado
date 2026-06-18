import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { JWT_CONFIG } from '../config/jwt.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Busca usuário incluindo a role
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Valida o hash da senha armazenada com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Criação de Audit Log para tentativas falhas (Segurança/Compliance)
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          target: 'User',
          targetId: user.id,
          details: `Tentativa falha de login para o email: ${email}`,
        }
      });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Geração do Token JWT com Payload adequado para o RBAC
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn }
    );

    // Criação de Audit Log de sucesso
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        target: 'User',
        targetId: user.id,
      }
    });

    // Retorna o token e dados básicos de perfil (nunca retorne a senha)
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor durante a autenticação.' });
  }
};