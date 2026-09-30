"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/**
 * POST /api/auth/login
 * Authenticates user, sets JWT in httpOnly cookie.
 */
router.post('/login', (0, validate_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await auth_service_1.authService.login(email, password);
        // Set JWT in httpOnly cookie — JS cannot read it (XSS protection)
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/',
        });
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
router.post('/logout', (_req, res) => {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
});
/**
 * GET /api/auth/me
 * Returns current user's profile + team memberships.
 * Requires authentication.
 */
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const profile = await auth_service_1.authService.getProfile(user.id);
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map