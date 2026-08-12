import type { WorkspaceAvailability } from "../../domain/workspace";
import { supportedLanguage, type SupportedLanguage } from "./locale";

type UnavailableKind = Exclude<WorkspaceAvailability["kind"], "ready">;

interface AvailabilityCopy {
  title: string;
  messages: Record<UnavailableKind, string>;
}

const copy: Record<SupportedLanguage, AvailabilityCopy> = {
  ar: {
    title: "مساحة العمل غير متاحة",
    messages: {
      "frontend-unavailable": "ملفات واجهة مساحة العمل غير متاحة. أعد بناء واجهة الإضافة.",
      "host-unavailable": "إعدادات مضيف ووردبريس غير متاحة.",
      "woocommerce-unavailable": "يجب تثبيت ووكومرس وتفعيله قبل استخدام مساحة العمل.",
    },
  },
  en: {
    title: "Workspace unavailable",
    messages: {
      "frontend-unavailable": "The Product Workspace assets are unavailable. Rebuild the plugin frontend.",
      "host-unavailable": "The WordPress host configuration is unavailable.",
      "woocommerce-unavailable": "WooCommerce must be installed and active before this workspace can be used.",
    },
  },
  fr: {
    title: "Espace de travail indisponible",
    messages: {
      "frontend-unavailable": "Les fichiers de l’espace de travail sont indisponibles. Recompilez l’interface de l’extension.",
      "host-unavailable": "La configuration de l’hôte WordPress est indisponible.",
      "woocommerce-unavailable": "WooCommerce doit être installé et activé avant d’utiliser cet espace de travail.",
    },
  },
};

export function availabilityCopy(kind: UnavailableKind, locale: string): { title: string; message: string } {
  const localized = copy[supportedLanguage(locale)];
  return { title: localized.title, message: localized.messages[kind] };
}
