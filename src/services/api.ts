/**
 * Axios API Client Configuration
 * Communicates with FastAPI / SQLite backend running on port 8001 via Vite proxy.
 */

import axios from 'axios';
import { HealthResponse, SystemInfoResponse, Product, Category, Order, OrderStatus, User } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const TOKEN_KEY = 'shopcart-session-token';

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  /** Ask the backend shopping helper. Recommendations are selected from SQLite. */
  async chatAssistant(message: string): Promise<{ reply: string; mode: 'ai' | 'rules'; products: Product[] }> {
    const response = await apiClient.post<{ reply: string; mode: 'ai' | 'rules'; products: Product[] }>('/assistant/chat', { message });
    return response.data;
  },
  /**
   * Health check endpoint probe
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/health');
      return response.data;
    } catch (err: unknown) {
      return {
        status: 'degraded',
        app_name: 'ShopCart Online Shopping System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          database_type: 'sqlite',
          url: 'cartcraft.db',
          error: err instanceof Error ? err.message : 'Backend unreachable or starting',
        },
      };
    }
  },

  /**
   * System info & roadmap endpoint probe
   */
  async getSystemInfo(): Promise<SystemInfoResponse | null> {
    try {
      const response = await apiClient.get<SystemInfoResponse>('/info');
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch products with optional search, category, and sort parameters
   */
  async getProducts(params?: { category?: string; q?: string; sort?: string }): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((p: any) => ({
          ...p,
          is_featured: Boolean(p.is_featured),
          is_popular: Boolean(p.is_popular),
          is_recommended: Boolean(p.is_recommended),
        }));
      }
      return INITIAL_PRODUCTS;
    } catch (err) {
      console.warn('Backend /products failed, falling back to local dataset:', err);
      return INITIAL_PRODUCTS;
    }
  },

  /**
   * Fetch categories from backend
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>('/categories');
      return response.data;
    } catch {
      return [];
    }
  },

  /**
   * Fetch order history for user
   */
  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<Order[]>('/orders');
      return response.data;
    } catch (err) {
      console.warn('Failed to load orders from backend:', err);
      return [];
    }
  },

  /**
   * Create an order via atomic SQLite transaction
   */
  async createOrder(orderPayload: {
    user_name: string;
    user_email: string;
    delivery_address: string;
      phone: string;
    payment_method: string;
    items: { product_id: number; quantity: number }[];
  }): Promise<{ message: string; order: Order }> {
    const response = await apiClient.post<{ message: string; order: Order }>('/orders', orderPayload);
    return response.data;
  },

  /**
   * Update order status (Admin)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await apiClient.put(`/orders/${orderId}/status`, { status });
  },

  /**
   * Update product stock (Admin)
   */
  async updateProductStock(productId: number, stock_quantity: number): Promise<void> {
    await apiClient.put(`/products/${productId}`, { stock_quantity });
  },

  /**
   * Update product price in INR (Admin)
   */
  async updateProductPrice(productId: number, price: number): Promise<void> {
    await apiClient.put(`/products/${productId}`, { price });
  },

  async updateUserStatus(userId: number, is_active: boolean): Promise<void> {
    await apiClient.put(`/users/${userId}/status`, { is_active });
  },

  /**
   * Fetch saved wishlist product IDs from SQLite
   */
  async getWishlist(): Promise<number[]> {
    try {
      const response = await apiClient.get<number[]>('/wishlist');
      return response.data;
    } catch {
      return [];
    }
  },

  async getCart(): Promise<{ product_id: number; quantity: number }[]> {
    try {
      const response = await apiClient.get<{ product_id: number; quantity: number }[]>('/cart');
      return response.data;
    } catch {
      return [];
    }
  },

  async removeFromWishlist(productId: number): Promise<void> {
    await apiClient.delete('/wishlist', { params: { product_id: productId } });
  },

  async clearWishlist(): Promise<void> {
    await apiClient.delete('/wishlist');
  },

  /**
   * Toggle wishlist item in SQLite
   */
  async toggleWishlist(productId: number): Promise<boolean> {
    try {
      const response = await apiClient.post<{ is_saved: boolean }>('/wishlist', {
        product_id: productId,
      });
      return response.data.is_saved;
    } catch {
      return false;
    }
  },

  /**
   * Synchronize cart item quantity with SQLite
   */
  async syncCartItem(productId: number, quantity: number): Promise<void> {
    try {
      await apiClient.post('/cart', {
        product_id: productId,
        quantity,
      });
    } catch (err) {
      console.warn('Cart sync notice:', err);
    }
  },

  /**
   * User login
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });
    sessionStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  /**
   * User registration
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<{ user: User }> {
    const response = await apiClient.post<{ user: User }>('/auth/register', userData);
    return response.data;
  },

  /**
   * Fetch registered users (Admin)
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response.data;
    } catch {
      return [];
    }
  },
};
