/**
 * Core Type Definitions for ShopCart Online Shopping System
 */

export interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'degraded';
  database_type: 'postgresql' | 'sqlite';
  url: string;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  app_name: string;
  version: string;
  timestamp: string;
  database: DatabaseStatus;
}

export interface SystemInfoResponse {
  project_name: string;
  version: string;
  phase: string;
  modules_ready: string[];
  upcoming_phases: string[];
  endpoints: Record<string, string>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  item_count: number;
  icon: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  brand: string;
  stock_quantity: number;
  image_url: string;
  average_rating: number;
  review_count: number;
  is_featured?: boolean;
  is_popular?: boolean;
  is_recommended?: boolean;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: string;
  user_name: string;
  user_email: string;
  total_amount: number;
  status: OrderStatus;
  items: OrderItem[];
  delivery_address: string;
  payment_method: string;
  created_at: string;
}
