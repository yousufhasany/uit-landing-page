import type { Request, Response } from 'express';
import { z } from 'zod';
import { authService, serializeAuthUser } from '../services/auth.service.js';
import { logActivity } from '../services/activity.service.js';
import { passwordSchema } from '../services/users.service.js';
import { unauthorized } from '../utils/http.js';
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from '../utils/tokens.js';

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });
const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

const meta = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    try {
      const { user, accessToken, refreshToken } = await authService.login(email, password, meta(req));
      setAuthCookies(res, accessToken, refreshToken);
      req.user = user;
      await logActivity(req, { action: 'LOGIN', entityType: 'auth', entityId: user.id, summary: `${user.email} signed in` });
      res.json({ user: serializeAuthUser(user) });
    } catch (error) {
      await logActivity(req, { action: 'LOGIN_FAILED', entityType: 'auth', summary: `Failed sign-in attempt for ${email}` });
      throw error;
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE], meta(req));
      setAuthCookies(res, accessToken, refreshToken);
      res.json({ user: serializeAuthUser(user) });
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    if (req.user) await logActivity(req, { action: 'LOGOUT', entityType: 'auth', entityId: req.user.id, summary: `${req.user.email} signed out` });
    clearAuthCookies(res);
    res.status(204).end();
  },

  me(req: Request, res: Response) {
    if (!req.user) throw unauthorized();
    res.json({ user: serializeAuthUser(req.user) });
  },

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    await logActivity(req, { action: 'CHANGE_PASSWORD', entityType: 'auth', entityId: req.user!.id, summary: `${req.user!.email} changed their password` });
    clearAuthCookies(res);
    res.status(204).end();
  },
};
