import { Router } from 'express';
import { accountController } from './account.controller.js';

const router = Router();

// POST /account/register
router.post('/register', (req, res, next) => accountController.register(req, res, next));

// POST /account/login
router.post('/login', (req, res, next) => accountController.login(req, res, next));

// GET /account/me
router.get('/me', (req, res, next) => accountController.getMe(req, res, next));

// POST /account/logout
router.post('/logout', (req, res, next) => accountController.logout(req, res, next));

export const accountRoutes = router;
