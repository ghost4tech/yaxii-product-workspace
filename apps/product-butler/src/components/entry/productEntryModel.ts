import type { ProductFormData } from '@/types/product';

export type ProductEntryValues = {
  name: string;
  sku?: string;
  regularPrice?: string;
  salePrice?: string;
  categoryId: string;
  stockQuantity?: string;
  shortDescription?: string;
  longDescription?: string;
};

export const EMPTY_PRODUCT_ENTRY: ProductEntryValues = {
  name: '',
  sku: '',
  regularPrice: '',
  salePrice: '',
  categoryId: '',
  stockQuantity: '',
  shortDescription: '',
  longDescription: '',
};

export const toProductEntryValues = (data: Partial<ProductFormData>): ProductEntryValues => ({
  name: data.name || '',
  sku: data.sku || '',
  regularPrice: data.regularPrice || '',
  salePrice: data.salePrice || '',
  categoryId: data.categoryId || '',
  stockQuantity: data.stockQuantity || '',
  shortDescription: data.shortDescription || '',
  longDescription: data.longDescription || '',
});
