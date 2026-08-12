import { createPortal } from "react-dom";

interface ToastRegionProps {
  message: string;
  portalRoot: HTMLElement;
}

export function ToastRegion({ message, portalRoot }: ToastRegionProps) {
  if (!message) {
    return null;
  }

  return createPortal(
    <div className="ypw-toast" role="status">
      {message}
    </div>,
    portalRoot,
  );
}
