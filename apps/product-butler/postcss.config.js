import autoprefixer from "autoprefixer";
import prefixSelector from "postcss-prefix-selector";
import tailwindcss from "tailwindcss";

const root = "#yaxii-product-workspace";

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    prefixSelector({
      prefix: root,
      transform(prefix, selector, prefixedSelector) {
        if (selector.startsWith(root)) {
          return selector;
        }
        return prefixedSelector;
      },
    }),
  ],
};
