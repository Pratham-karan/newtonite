import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../common/errors';
import { JwtPayload, User } from '../common/types';
import db from '../db';

/**
 * Authentication service — handles login/token generation.
 * Passwords are verified with bcrypt. Tokens are JWTs.
 */
export const authService = {
  async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const user = await db('users').where({ email }).first();
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    // Return user without password hash
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getProfile(userId: string): Promise<any> {
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'email', 'name', 'role', 'created_at')
      .first();

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Fetch team memberships with team names
    const teams = await db('team_memberships')
      .join('teams', 'teams.id', 'team_memberships.team_id')
      .where('team_memberships.user_id', userId)
      .select('teams.id', 'teams.name');

    return { ...user, teams };
  },
};
