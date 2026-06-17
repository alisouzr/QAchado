import dotenv from 'dotenv';
dotenv.config();

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod',
  expiresIn: '8h',
};