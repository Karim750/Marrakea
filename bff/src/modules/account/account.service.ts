import { medusaClient } from '../../shared/http/medusa.client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { RegisterPayload, LoginPayload, CustomerDTO } from '../../shared/dtos/index.js';

/**
 * Account service handling Medusa customer authentication.
 */

export class AccountService {
  /**
   * Register a new customer.
   * Medusa v2: two-step process (auth identity + customer entity).
   */
  async register(payload: RegisterPayload): Promise<{ customer: CustomerDTO; token: string }> {
    try {
      const result = await medusaClient.register({
        email: payload.email,
        password: payload.password,
        first_name: payload.firstName,
        last_name: payload.lastName,
      });

      // Customer is returned directly from the two-step registration
      return {
        customer: {
          id: result.customer.id,
          email: result.customer.email,
          firstName: result.customer.first_name,
          lastName: result.customer.last_name,
        },
        token: result.token,
      };
    } catch (err) {
      console.error('[ACCOUNT] Registration error:', err);
      throw new AppError(400, 'REGISTRATION_FAILED', 'Registration failed');
    }
  }

  /**
   * Login a customer.
   */
  async login(payload: LoginPayload): Promise<{ customer: CustomerDTO; token: string }> {
    try {
      const result = await medusaClient.login(payload.email, payload.password);

      // Get customer details
      const customer = await medusaClient.getMe(result.token);

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
        },
        token: result.token,
      };
    } catch (err) {
      console.error('[ACCOUNT] Login error:', err);
      throw AppError.invalidCredentials();
    }
  }

  /**
   * Get current customer from auth token.
   */
  async getMe(authToken: string): Promise<CustomerDTO> {
    try {
      const customer = await medusaClient.getMe(authToken);

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      };
    } catch (err) {
      console.error('[ACCOUNT] Get me error:', err);
      throw AppError.unauthenticated();
    }
  }
}

export const accountService = new AccountService();
