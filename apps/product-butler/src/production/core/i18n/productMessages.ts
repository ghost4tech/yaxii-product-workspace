import { __ } from "./wordpress";

export interface ProductOperationCopy {
  categoriesLoadFailed: string;
  chooseCategory: string;
  currentStore: string;
  localMediaUnsupported: string;
  pendingStatusUnsupported: string;
  productNotSaved: string;
  productSaved: string;
  reviewFields: string;
  savedProductsAppearHere: string;
  saleScheduleUnsupported: string;
  secureRandomUnavailable: string;
  saveOutcomePending: string;
  saveOutcomePendingHelp: string;
  serverRequestFailed: string;
  saveOutcomeUnknown: string;
  simpleOnly: string;
  stockInvalid: string;
  unavailable: string;
  variableUnsupported: string;
}

export function productOperationCopy(locale?: string): ProductOperationCopy {
  void locale;
  return {
    categoriesLoadFailed: __("Categories could not be loaded.", "yaxii-product-workspace"),
    chooseCategory: __("Select a valid category.", "yaxii-product-workspace"),
    currentStore: __("Browser draft · current WooCommerce store", "yaxii-product-workspace"),
    localMediaUnsupported: __("Choose product images from the WordPress media library before saving.", "yaxii-product-workspace"),
    pendingStatusUnsupported: __("Choose Draft or Publish in Settings.", "yaxii-product-workspace"),
    productNotSaved: __("Product was not saved", "yaxii-product-workspace"),
    productSaved: __("Product saved", "yaxii-product-workspace"),
    reviewFields: __("Review the product fields and try again.", "yaxii-product-workspace"),
    savedProductsAppearHere: __("Saved products and operations appear here.", "yaxii-product-workspace"),
    saleScheduleUnsupported: __("Clear the sale dates to save now.", "yaxii-product-workspace"),
    secureRandomUnavailable: __("Secure product identity could not be generated. Product creation was not attempted.", "yaxii-product-workspace"),
    saveOutcomePending: __("Save outcome pending", "yaxii-product-workspace"),
    saveOutcomePendingHelp: __("The form was kept. Submit again to reconcile without creating a duplicate.", "yaxii-product-workspace"),
    serverRequestFailed: __("The server request failed.", "yaxii-product-workspace"),
    saveOutcomeUnknown: __("Save outcome unknown", "yaxii-product-workspace"),
    simpleOnly: __("Simple product", "yaxii-product-workspace"),
    stockInvalid: __("Stock must be a non-negative whole number.", "yaxii-product-workspace"),
    unavailable: __("Product creation is unavailable", "yaxii-product-workspace"),
    variableUnsupported: __("Choose Simple to save now.", "yaxii-product-workspace"),
  };
}
