import { Router } from 'express';
import { blogController } from './blog.controller.js';

const router = Router();

// GET /blog/articles
router.get('/articles', (req, res, next) => blogController.listArticles(req, res, next));

// GET /blog/articles/:slug
router.get('/articles/:slug', (req, res, next) => blogController.getArticleBySlug(req, res, next));

export const blogRoutes = router;
