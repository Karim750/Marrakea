import { Request, Response, NextFunction } from 'express';
import { catalogService } from './catalog.service.js';
import { AppError } from '../../shared/errors/AppError.js';
import { setCacheHeaders, setNoCache } from '../../shared/cache/cacheHeaders.js';
import {
  ProductListQuerySchema,
  ProductDTOSchema,
  ProductDetailDTOSchema,
  GestureDTOSchema,
  TerritoryDTOSchema,
  PaginatedProductResponseSchema,
  StockResponseSchema,
} from '../../shared/dtos/index.js';
import { z } from 'zod';

/**
 * Catalog controller with runtime DTO validation.
 */

const SUPPORTED_SORTS = ['newest', 'name_asc'];

export class CatalogController {
  /**
   * GET /catalog/products
   */
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query params
      const query = ProductListQuerySchema.parse(req.query);

      // Check for unsupported sort
      if (query.sort && !SUPPORTED_SORTS.includes(query.sort)) {
        throw AppError.unsupportedSort(SUPPORTED_SORTS);
      }

      const result = await catalogService.listProducts({
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        search: query.search,
        gesture: query.gesture,
        territory: query.territory,
      });

      // Validate response
      const validated = PaginatedProductResponseSchema.parse(result);

      setCacheHeaders(res, 'products');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /catalog/products/featured
   */
  async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await catalogService.getFeaturedProducts();

      // Validate response
      const validated = z.array(ProductDTOSchema).parse(products);

      setCacheHeaders(res, 'featured');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /catalog/products/:slug
   */
  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await catalogService.getProductBySlug(slug);

      // Validate response
      const validated = ProductDetailDTOSchema.parse(product);

      setCacheHeaders(res, 'products');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /catalog/products/:productId/stock
   */
  async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const stock = await catalogService.getStock(productId);

      // Validate response
      const validated = StockResponseSchema.parse(stock);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /catalog/gestures
   */
  async listGestures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gestures = await catalogService.listGestures();

      // Validate response
      const validated = z.array(GestureDTOSchema).parse(gestures);

      setCacheHeaders(res, 'taxonomies');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /catalog/territories
   */
  async listTerritories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const territories = await catalogService.listTerritories();

      // Validate response
      const validated = z.array(TerritoryDTOSchema).parse(territories);

      setCacheHeaders(res, 'taxonomies');
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }
}

export const catalogController = new CatalogController();
