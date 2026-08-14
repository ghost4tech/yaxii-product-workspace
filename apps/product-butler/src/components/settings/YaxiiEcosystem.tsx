import { ArrowUpRight, Boxes } from "lucide-react";

const products = ["Yaxii Smart Form", "Yaxii COD Theme", "Yaxii Shipping Manager"];

export function YaxiiEcosystem() {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground">
              <Boxes className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold">Explore the Yaxii ecosystem</h2>
              <p className="text-xs text-muted-foreground">Complementary tools for modern WooCommerce teams.</p>
            </div>
          </div>
        </div>
        <a href="https://yaxii.dev/" target="_blank" rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground hover:underline">
          Explore all Yaxii products <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid border-t border-border bg-muted/20 sm:grid-cols-3 sm:divide-x sm:divide-border">
        {products.map((product) => (
          <div key={product} className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:px-5">
            <p className="text-[12px] font-semibold">{product}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
