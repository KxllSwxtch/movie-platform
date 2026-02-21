'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, ApiError, endpoints } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

// ============ Types ============

// Product types
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  price: number;
  bonusPrice: number | null;
  allowsPartialBonus: boolean;
  stockQuantity: number;
  images: string[];
  status: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  createdAt: string;
}

export interface AdminProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedProducts {
  items: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  totalProducts: number;
  activeCount: number;
  draftCount: number;
  outOfStockCount: number;
  discontinuedCount: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId?: string;
  price: number;
  bonusPrice?: number;
  allowsPartialBonus?: boolean;
  stockQuantity: number;
  images?: string[];
  status?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

// Category types
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  children?: ProductCategory[];
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parentId?: string;
  order?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

// Order types
export interface AdminOrder {
  id: string;
  userId: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  bonusAmountUsed: number;
  shippingAddress: Record<string, unknown> | null;
  trackingNumber: string | null;
  items: AdminOrderItem[];
  createdAt: string;
}

export interface AdminOrderItem {
  orderId: string;
  productId: string;
  product: { id: string; name: string; slug: string; images?: string[] };
  quantity: number;
  priceAtPurchase: number;
  bonusUsed: number;
}

export interface AdminOrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedOrders {
  items: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalRevenue: number;
}

// ============ Product Queries ============

/**
 * Hook to fetch admin products list
 */
export function useAdminProducts(params?: AdminProductQueryParams) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.products(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const response = await api.get<PaginatedProducts>(endpoints.adminStore.products, {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch admin product detail
 */
export function useAdminProductDetail(id: string | undefined) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.product(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Product ID required');
      const response = await api.get<AdminProduct>(endpoints.adminStore.product(id));
      return response.data;
    },
    enabled: !!id && isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch admin product stats
 */
export function useAdminProductStats() {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.productStats(),
    queryFn: async () => {
      const response = await api.get<ProductStats>(endpoints.adminStore.productStats);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============ Category Queries ============

/**
 * Hook to fetch admin product categories
 */
export function useAdminCategories() {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.categories(),
    queryFn: async () => {
      const response = await api.get<ProductCategory[]>(endpoints.adminStore.categories);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============ Order Queries ============

/**
 * Hook to fetch admin orders list
 */
export function useAdminOrders(params?: AdminOrderQueryParams) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.orders(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const response = await api.get<PaginatedOrders>(endpoints.adminStore.orders, {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch admin order detail
 */
export function useAdminOrderDetail(id: string | undefined) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.order(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Order ID required');
      const response = await api.get<AdminOrder>(endpoints.adminStore.order(id));
      return response.data;
    },
    enabled: !!id && isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch admin order stats
 */
export function useAdminOrderStats() {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return useQuery({
    queryKey: queryKeys.adminStore.orderStats(),
    queryFn: async () => {
      const response = await api.get<OrderStats>(endpoints.adminStore.orderStats);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============ Product Mutations ============

/**
 * Hook to create a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await api.post<AdminProduct>(endpoints.adminStore.products, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.products() });
      toast.success('Товар создан');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось создать товар');
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateProductInput) => {
      const response = await api.patch<AdminProduct>(
        endpoints.adminStore.product(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.products() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.product(data.id) });
      toast.success('Товар обновлён');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось обновить товар');
    },
  });
}

/**
 * Hook to delete (discontinue) a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(
        endpoints.adminStore.product(id)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.products() });
      toast.success('Товар снят с продажи');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось удалить товар');
    },
  });
}

// ============ Category Mutations ============

/**
 * Hook to create a category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await api.post<ProductCategory>(endpoints.adminStore.categories, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.categories() });
      toast.success('Категория создана');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось создать категорию');
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryInput) => {
      const response = await api.patch<ProductCategory>(
        endpoints.adminStore.category(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.categories() });
      toast.success('Категория обновлена');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось обновить категорию');
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(
        endpoints.adminStore.category(id)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.categories() });
      toast.success('Категория удалена');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось удалить категорию');
    },
  });
}

// ============ Order Mutations ============

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch<AdminOrder>(
        endpoints.adminStore.orderStatus(id),
        { status }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.order(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStore.orderStats() });
      toast.success('Статус заказа обновлён');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось обновить статус заказа');
    },
  });
}
