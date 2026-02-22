import { Request, Response, NextFunction } from 'express';
import { blogService } from './blog.service.js';
import { setCacheHeaders } from '../../shared/cache/cacheHeaders.js';
import {
  ArticleListQuerySchema,
  PaginatedArticleResponseSchema,
  ArticleDetailDTOSchema,
} from '../../shared/dtos/index.js';

/**
 * Blog controller with runtime DTO validation.
 */

export class BlogController {
  /**
   * GET /blog/articles
   */
  async listArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query params
      const query = ArticleListQuerySchema.parse(req.query);

      const result = await blogService.listArticles({
        page: query.page,
        limit: query.limit,
        category: query.category,
      });

      // Validate response
      const validated = PaginatedArticleResponseSchema.parse(result);

      setCacheHeaders(res, 'articles');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /blog/articles/:slug
   */
  async getArticleBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const article = await blogService.getArticleBySlug(slug);

      // Validate response
      const validated = ArticleDetailDTOSchema.parse(article);

      setCacheHeaders(res, 'articles');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }
}

export const blogController = new BlogController();
