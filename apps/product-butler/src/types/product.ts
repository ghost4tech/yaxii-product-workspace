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
  canReconcile?: boolean;
  canRetry?: boolean;
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
  currencySymbol?: string;
  wooCommerceId?: number;
  isVariable?: boolean;
  variationFailures?: string[];
}

export interface Category {
  ancestors?: Category[];
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  hasChildren?: boolean;
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
  saleScheduleStart?: Date;
  saleScheduleEnd?: Date;
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
  images: ProductImage[];
  variations: ProductVariation[];
  variableAttributes: import("@/production/domain/variableProducts").VariableAttribute[];
  variationCombinations: import("@/production/domain/variableProducts").VariationCombination[];
  isVariable?: boolean;
}

export const emptyProductFormData: ProductFormData = {
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
  images: [],
  variations: [],
  variableAttributes: [],
  variationCombinations: [],
  isVariable: false,
};
