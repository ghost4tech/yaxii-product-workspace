import { Product, Category, WooCommerceConfig, ProductImage, AppSettings, defaultAppSettings } from '@/types/product';

// WooCommerce REST API service
// Note: The store must have CORS enabled for this to work from the browser.

interface WooCommerceError {
  code: string;
  message: string;
  data?: {
    status: number;
  };
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
}

interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

interface WooCommerceMedia {
  id: number;
  source_url: string;
}

const buildAuthHeader = (consumerKey: string, consumerSecret: string): string => {
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  return `Basic ${credentials}`;
};

const buildApiUrl = (storeUrl: string, endpoint: string): string => {
  const baseUrl = storeUrl.replace(/\/$/, '');
  return `${baseUrl}/wp-json/wc/v3/${endpoint}`;
};

const buildWpApiUrl = (storeUrl: string, endpoint: string): string => {
  const baseUrl = storeUrl.replace(/\/$/, '');
  return `${baseUrl}/wp-json/wp/v2/${endpoint}`;
};

export const testConnection = async (
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; error?: string; storeName?: string }> => {
  try {
    const response = await fetch(buildApiUrl(storeUrl, 'system_status'), {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(consumerKey, consumerSecret),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: WooCommerceError = await response.json().catch(() => ({
        code: 'unknown',
        message: `HTTP ${response.status}`,
      }));

      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API credentials. Please check your Consumer Key and Secret.',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'WooCommerce REST API not found. Please ensure WooCommerce is installed and permalinks are enabled.',
        };
      }

      return {
        success: false,
        error: errorData.message || `Connection failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      storeName: data.environment?.site_title || 'WooCommerce Store',
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'CORS_BLOCKED',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
};

export const fetchCategories = async (
  config: WooCommerceConfig
): Promise<{ categories: Category[]; error?: string }> => {
  try {
    const allCategories: WooCommerceCategory[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        buildApiUrl(config.storeUrl, `products/categories?per_page=100&page=${page}`),
        {
          method: 'GET',
          headers: {
            'Authorization': buildAuthHeader(config.consumerKey, config.consumerSecret),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data: WooCommerceCategory[] = await response.json();
      allCategories.push(...data);

      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
      hasMore = page < totalPages;
      page++;
    }

    return {
      categories: allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent,
        count: cat.count,
      })),
    };
  } catch (error) {
    return {
      categories: [],
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    };
  }
};

// Helper function to convert File to base64 in chunks (avoids call stack issues)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data from data URL
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Upload image to WordPress media library
export const uploadImageToWordPress = async (
  config: WooCommerceConfig,
  image: ProductImage
): Promise<{ success: boolean; mediaId?: number; sourceUrl?: string; error?: string }> => {
  try {
    if (!image.file) {
      return { success: false, error: 'No file to upload' };
    }

    const formData = new FormData();
    formData.append('file', image.file, image.file.name);

    const response = await fetch(buildWpApiUrl(config.storeUrl, 'media'), {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(config.consumerKey, config.consumerSecret),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
    }

    const media: WooCommerceMedia = await response.json();
    return {
      success: true,
      mediaId: media.id,
      sourceUrl: media.source_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
};

// Generate all variation combinations from attributes
const generateVariationCombinations = (
  variations: Product['variations']
): Array<{ attributes: Array<{ name: string; option: string }>; optionData: any }> => {
  if (variations.length === 0) return [];

  const combinations: Array<{ attributes: Array<{ name: string; option: string }>; optionData: any }> = [];

  const generateCombos = (
    index: number,
    current: Array<{ name: string; option: string; optionData: any }>
  ) => {
    if (index === variations.length) {
      // Find the option data from the last variation (for price, sku, image)
      // For multi-attribute products, we use the first variation's option data
      const optionData = current[0]?.optionData || {};
      combinations.push({
        attributes: current.map(({ name, option }) => ({ name, option })),
        optionData,
      });
      return;
    }

    const variation = variations[index];
    for (const option of variation.options) {
      generateCombos(index + 1, [
        ...current,
        { name: variation.name, option: option.value, optionData: option },
      ]);
    }
  };

  generateCombos(0, []);
  return combinations;
};

export const createProduct = async (
  config: WooCommerceConfig,
  product: Product,
  settings: AppSettings = defaultAppSettings,
  onImageProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; wooCommerceId?: number; error?: string }> => {
  try {
    const hasVariations = product.variations && product.variations.length > 0 && 
      product.variations.some(v => v.options.length > 0);
    const productType = hasVariations ? 'variable' : 'simple';

    // Upload images to WordPress media library first
    const uploadedImages: Array<{ id: number; src: string; position: number }> = [];
    
    if (product.images && product.images.length > 0) {
      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];
        onImageProgress?.(i + 1, product.images.length);
        
        if (img.file) {
          const uploadResult = await uploadImageToWordPress(config, img);
          if (uploadResult.success && uploadResult.mediaId) {
            uploadedImages.push({
              id: uploadResult.mediaId,
              src: uploadResult.sourceUrl || '',
              position: i,
            });
          }
        } else if (img.wpMediaId) {
          // Already uploaded
          uploadedImages.push({
            id: img.wpMediaId,
            src: img.preview,
            position: i,
          });
        }
      }
    }

    // Build the product payload
    const payload: Record<string, unknown> = {
      name: product.name,
      type: productType,
      description: product.longDescription || '',
      short_description: product.shortDescription || '',
      sku: product.sku || '',
      categories: product.categoryId ? [{ id: parseInt(product.categoryId, 10) }] : [],
      status: settings.defaultProductStatus,
      catalog_visibility: settings.defaultCatalogVisibility,
      tax_status: settings.defaultTaxStatus,
    };

    // Add images if uploaded
    if (uploadedImages.length > 0) {
      payload.images = uploadedImages.map(img => ({ id: img.id }));
    }

    // For simple products, set price and stock
    if (!hasVariations) {
      payload.regular_price = product.regularPrice;
      payload.sale_price = product.salePrice || undefined;
      payload.manage_stock = settings.enableManageStock || !!product.stockQuantity;
      payload.stock_quantity = product.stockQuantity ? parseInt(product.stockQuantity, 10) : null;
      payload.stock_status = settings.defaultStockStatus;
      
      // Sale schedule
      if (product.saleScheduleStart) {
        payload.date_on_sale_from = product.saleScheduleStart.toISOString();
      }
      if (product.saleScheduleEnd) {
        payload.date_on_sale_to = product.saleScheduleEnd.toISOString();
      }
    }

    // For variable products, set attributes
    if (hasVariations) {
      payload.attributes = product.variations
        .filter(v => v.name && v.options.length > 0)
        .map((variation, index) => ({
          id: 0,
          name: variation.name,
          position: index,
          visible: true,
          variation: true,
          options: variation.options.map(opt => opt.value),
        }));
    }

    // Create the product
    const response = await fetch(buildApiUrl(config.storeUrl, 'products'), {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(config.consumerKey, config.consumerSecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: WooCommerceError = await response.json().catch(() => ({
        code: 'unknown',
        message: `HTTP ${response.status}`,
      }));
      return {
        success: false,
        error: errorData.message || `Failed to create product: ${response.status}`,
      };
    }

    const createdProduct: WooCommerceProduct = await response.json();
    const productId = createdProduct.id;

    // For variable products, create variations
    if (hasVariations && settings.autoGenerateVariations) {
      const variationResult = await createProductVariationsFromOptions(
        config,
        productId,
        product.variations,
        settings
      );
      
      if (!variationResult.success) {
        return {
          success: true,
          wooCommerceId: productId,
          error: `Product created but variations failed: ${variationResult.error}`,
        };
      }
    }

    return {
      success: true,
      wooCommerceId: productId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
    };
  }
};

// Create variations from the product variation options
export const createProductVariationsFromOptions = async (
  config: WooCommerceConfig,
  productId: number,
  variations: Product['variations'],
  settings: AppSettings = defaultAppSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    const combinations = generateVariationCombinations(variations);

    for (const combo of combinations) {
      const { attributes, optionData } = combo;

      // Upload variation image if exists
      let imageId: number | undefined;
      if (optionData.image?.file) {
        const uploadResult = await uploadImageToWordPress(config, optionData.image);
        if (uploadResult.success) {
          imageId = uploadResult.mediaId;
        }
      } else if (optionData.image?.wpMediaId) {
        imageId = optionData.image.wpMediaId;
      }

      const variationPayload: Record<string, unknown> = {
        regular_price: optionData.price || '',
        sale_price: optionData.salePrice || undefined,
        sku: optionData.sku || '',
        manage_stock: settings.enableManageStock || !!optionData.stockQuantity,
        stock_quantity: optionData.stockQuantity ? parseInt(optionData.stockQuantity, 10) : null,
        stock_status: settings.defaultStockStatus,
        attributes: attributes.map(attr => ({
          name: attr.name,
          option: attr.option,
        })),
      };

      if (imageId) {
        variationPayload.image = { id: imageId };
      }

      const response = await fetch(
        buildApiUrl(config.storeUrl, `products/${productId}/variations`),
        {
          method: 'POST',
          headers: {
            'Authorization': buildAuthHeader(config.consumerKey, config.consumerSecret),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variationPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Variation creation failed:', errorData);
        // Continue with other variations even if one fails
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variations',
    };
  }
};

// Legacy function for backwards compatibility
export const createProductVariations = async (
  config: WooCommerceConfig,
  productId: number,
  variations: Array<{
    attributes: Array<{ name: string; option: string }>;
    regular_price: string;
    sku?: string;
  }>
): Promise<{ success: boolean; error?: string }> => {
  try {
    for (const variation of variations) {
      const response = await fetch(
        buildApiUrl(config.storeUrl, `products/${productId}/variations`),
        {
          method: 'POST',
          headers: {
            'Authorization': buildAuthHeader(config.consumerKey, config.consumerSecret),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variation),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create variation: ${response.status}`);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variations',
    };
  }
};
