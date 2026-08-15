import { ArrowUpRight, ListChecks, ShoppingBag, Truck } from "lucide-react";
import yaxiiDevLogo from "../../../../../assets/img/yaxiiDev-logo.svg";
import { __ } from "@/production/core/i18n/wordpress";

const products = [
  { accent: "bg-tile-purple text-tile-purple-foreground", icon: ListChecks, name: "Yaxii Smart Form" },
  { accent: "bg-tile-rose text-tile-rose-foreground", icon: ShoppingBag, name: "Yaxii COD Theme" },
  { accent: "bg-tile-blue text-tile-blue-foreground", icon: Truck, name: "Yaxii Shipping Manager" },
];

export function YaxiiEcosystem() {
  return (
    <section className="yaxii-ecosystem panel overflow-hidden border-brand/20">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-primary shadow-sm">
            <img src={yaxiiDevLogo} alt="" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="label-eyebrow text-brand">Yaxii Dev</p>
            <h2 className="truncate text-[13px] font-semibold">{__("Explore the Yaxii ecosystem", "yaxii-product-workspace")}</h2>
            <p className="text-xs text-muted-foreground">{__("Complementary tools for modern WooCommerce teams.", "yaxii-product-workspace")}</p>
          </div>
        </div>
        <a href="https://yaxii.dev/" target="_blank" rel="noreferrer"
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-brand/20 bg-card/80 px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-brand/40 hover:bg-card">
          {__("Explore all Yaxii products", "yaxii-product-workspace")} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </a>
      </div>
      <div className="grid gap-2 border-t border-brand/15 bg-card/40 p-3 sm:grid-cols-3">
        {products.map((product) => (
          <div key={product.name} className="flex items-center gap-2 rounded-md border border-border/80 bg-card/80 px-3 py-2.5 shadow-sm">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${product.accent}`}>
              <product.icon className="h-3.5 w-3.5" />
            </span>
            <p className="min-w-0 truncate text-[12px] font-semibold">{product.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
