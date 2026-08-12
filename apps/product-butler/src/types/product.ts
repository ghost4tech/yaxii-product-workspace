export interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  wpMediaId?: number; // WordPress media library ID after upload
}

export interface VariationOption {
  id: string;
  value: string;
  price: string;
  salePrice?: string;
  sku?: string;
  stockQuantity?: string;
  image?: ProductImage;
}

export interface ProductVariation {
  id: string;
  name: string;
  options: VariationOption[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  saleScheduleStart?: Date;
  saleScheduleEnd?: Date;
  categoryId: string;
  stockQuantity: string;
  shortDescription: string;
  longDescription: string;
  images: ProductImage[];
  variations: ProductVariation[];
  status: 'draft' | 'pending' | 'synced' | 'error';
  errorMessage?: string;
  createdAt: Date;
  createdBy: string;
  wooCommerceId?: number;
  isVariable?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  connected: boolean;
  lastSync?: Date;
}

export interface AppSettings {
  defaultStockStatus: 'instock' | 'outofstock' | 'onbackorder';
  defaultProductStatus: 'publish' | 'draft' | 'pending';
  defaultCatalogVisibility: 'visible' | 'catalog' | 'search' | 'hidden';
  enableManageStock: boolean;
  defaultTaxStatus: 'taxable' | 'shipping' | 'none';
  autoGenerateVariations: boolean;
}

export const defaultAppSettings: AppSettings = {
  defaultStockStatus: 'instock',
  defaultProductStatus: 'publish',
  defaultCatalogVisibility: 'visible',
  enableManageStock: false,
  defaultTaxStatus: 'taxable',
  autoGenerateVariations: true,
};

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  saleScheduleStart?: Date;
  saleScheduleEnd?: Date;
  categoryId: string;
  stockQuantity: string;
  shortDescription: string;
  longDescription: string;
  images: ProductImage[];
  variations: ProductVariation[];
  isVariable?: boolean;
}

export const emptyProductFormData: ProductFormData = {
  name: '',
  sku: '',
  regularPrice: '',
  salePrice: '',
  categoryId: '',
  stockQuantity: '',
  shortDescription: '',
  longDescription: '',
  images: [],
  variations: [],
  isVariable: false,
};
