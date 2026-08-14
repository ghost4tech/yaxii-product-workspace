import { supportedLanguage, type SupportedLanguage } from "./locale";

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

const english: ProductOperationCopy = {
  categoriesLoadFailed: "Categories could not be loaded.",
  chooseCategory: "Select a valid category.",
  currentStore: "Browser draft · current WooCommerce store",
  localMediaUnsupported: "Choose product images from the WordPress media library before saving.",
  pendingStatusUnsupported: "Pending review is not part of Phase 2. Choose Draft or Publish in Settings.",
  productNotSaved: "Product was not saved",
  productSaved: "Product saved",
  reviewFields: "Review the product fields and try again.",
  savedProductsAppearHere: "Saved products and operations appear here.",
  saleScheduleUnsupported: "Sale scheduling arrives in Phase 3. Clear the dates to save now.",
  secureRandomUnavailable: "Secure product identity could not be generated. Product creation was not attempted.",
  saveOutcomePending: "Save outcome pending",
  saveOutcomePendingHelp: "The form was kept. Submit again to reconcile without creating a duplicate.",
  serverRequestFailed: "The server request failed.",
  saveOutcomeUnknown: "Save outcome unknown",
  simpleOnly: "Simple products only in Phase 2",
  stockInvalid: "Stock must be a non-negative whole number.",
  unavailable: "Product creation is unavailable",
  variableUnsupported: "Variable products arrive in Phase 3. Choose Simple to save now.",
};

const copies: Record<SupportedLanguage, ProductOperationCopy> = {
  ar: english,
  en: english,
  fr: english,
};

export function productOperationCopy(locale: string): ProductOperationCopy {
  return copies[supportedLanguage(locale)];
}
