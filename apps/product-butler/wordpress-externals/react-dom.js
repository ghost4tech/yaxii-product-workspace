const ReactDOM = globalThis.ReactDOM;

if (!ReactDOM) throw new Error("WordPress ReactDOM is unavailable.");

export const {
  createPortal,
  createRoot,
  findDOMNode,
  flushSync,
  hydrate,
  hydrateRoot,
  render,
  unmountComponentAtNode,
  unstable_batchedUpdates,
  version,
} = ReactDOM;

export default ReactDOM;
