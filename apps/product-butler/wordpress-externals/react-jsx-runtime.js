const ReactJSXRuntime = globalThis.ReactJSXRuntime;

if (!ReactJSXRuntime) throw new Error("WordPress React JSX runtime is unavailable.");

export const { Fragment, jsx, jsxs } = ReactJSXRuntime;
