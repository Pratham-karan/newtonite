import { User } from '../common/types';
/**
 * Authentication service — handles login/token generation.
 * Passwords are verified with bcrypt. Tokens are JWTs.
 */
export declare const authService: {
    login(email: string, password: string): Promise<{
        user: Omit<User, "password_hash">;
        token: string;
    }>;
    getProfile(userId: string): Promise<any>;
};
