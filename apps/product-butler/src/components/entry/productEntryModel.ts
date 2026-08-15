import type { ProductFormData } from '@/types/product';

export type ProductEntryValues = {
  additionalCategoryIds: number[];
  backorders: 'no' | 'notify' | 'yes';
  catalogVisibility: 'visible' | 'catalog' | 'search' | 'hidden';
  height: string;
  length: string;
  manageStock: boolean;
  name: string;
  productStatus: 'publish' | 'draft' | 'pending';
  shippingClassId: number;
  sku: string;
  slug: string;
  regularPrice: string;
  salePrice: string;
  categoryId: string;
  stockQuantity: string;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  soldIndividually: boolean;
  tagIds: number[];
  taxClass: string;
  taxStatus: 'taxable' | 'shipping' | 'none';
  weight: string;
  width: string;
  shortDescription: string;
  longDescription: string;
};

export const EMPTY_PRODUCT_ENTRY: ProductEntryValues = {
  additionalCategoryIds: [],
  backorders: 'no',
  catalogVisibility: 'visible',
  height: '',
  length: '',
  manageStock: false,
  name: '',
  productStatus: 'publish',
  shippingClassId: 0,
  sku: '',
  slug: '',
  regularPrice: '',
  salePrice: '',
  categoryId: '',
  stockQuantity: '',
  stockStatus: 'instock',
  soldIndividually: false,
  tagIds: [],
  taxClass: '',
  taxStatus: 'taxable',
  weight: '',
  width: '',
  shortDescription: '',
  longDescription: '',
};

export const toProductEntryValues = (data: Partial<ProductFormData>): ProductEntryValues => ({
  additionalCategoryIds: data.additionalCategoryIds ?? [],
  backorders: data.backorders ?? 'no',
  catalogVisibility: data.catalogVisibility ?? 'visible',
  height: data.height ?? '',
  length: data.length ?? '',
  manageStock: data.manageStock ?? false,
  name: data.name || '',
  productStatus: data.productStatus ?? 'publish',
  shippingClassId: data.shippingClassId ?? 0,
  sku: data.sku || '',
  slug: data.slug ?? '',
  regularPrice: data.regularPrice || '',
  salePrice: data.salePrice || '',
  categoryId: data.categoryId || '',
  stockQuantity: data.stockQuantity || '',
  stockStatus: data.stockStatus ?? 'instock',
  soldIndividually: data.soldIndividually ?? false,
  tagIds: data.tagIds ?? [],
  taxClass: data.taxClass ?? '',
  taxStatus: data.taxStatus ?? 'taxable',
  weight: data.weight ?? '',
  width: data.width ?? '',
  shortDescription: data.shortDescription || '',
  longDescription: data.longDescription || '',
});
